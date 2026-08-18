// =========================================================
// UNIVERSAL NOTIFICATION SYSTEM - STUDENTHUB
// Runs seamlessly on every page navbar
// =========================================================

(function () {
    // Shared Supabase client instance
    let notifSupabase = null;
    let notifUser = null;
    let notifChannel = null;
    let notifList = [];

    // Ensure Supabase client is available
    function getSupabaseClient() {
        if (window.supabaseClient) {
            return window.supabaseClient;
        }
        if (window.supabase && typeof window.supabase.createClient === "function") {
            window.supabaseClient = window.supabase.createClient(
                "https://uiwmuwqarhngnhppqfqo.supabase.co",
                "sb_publishable_lXI3MvI6rVyWQKQ4P5r2ZA_zP8Ix1D7"
            );
            return window.supabaseClient;
        }
        return null;
    }

    // Helper: Escape HTML strings to prevent XSS
    function safeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Helper: Friendly Relative Time
    function timeAgo(dateString) {
        if (!dateString) return "just now";
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }

    // Helper: Get Icon Class & Box Style by Notification Type
    function getNotificationIconMeta(type) {
        switch (type) {
            case "like":
                return { icon: "bi bi-heart-fill", class: "like" };
            case "comment":
                return { icon: "bi bi-chat-dots-fill", class: "comment" };
            case "event_join":
            case "event":
                return { icon: "bi bi-calendar-check-fill", class: "event" };
            case "announcement":
                return { icon: "bi bi-megaphone-fill", class: "announcement" };
            case "report":
                return { icon: "bi bi-flag-fill", class: "report" };
            case "admin":
                return { icon: "bi bi-shield-fill-check", class: "admin" };
            default:
                return { icon: "bi bi-bell-fill", class: "default" };
        }
    }

    // Check if user is admin
    function isUserAdmin(user) {
        if (!user) return false;
        const email = (user.email || "").toLowerCase();
        const role = user.user_metadata?.role;
        return email === "pakistan.hafsa@gmail.com" || role === "admin";
    }

    // Inject Admin Link in Navbar if User is Admin
    function injectAdminNavBadge(user) {
        if (!isUserAdmin(user)) return;

        // Check if admin link already exists
        if (document.querySelector(".nav-admin-link")) return;

        const navLinks = document.querySelector(".nav-links");
        if (navLinks) {
            const adminLink = document.createElement("a");
            adminLink.href = "admin.html";
            adminLink.className = "nav-admin-link";
            adminLink.innerHTML = `<i class="bi bi-shield-lock-fill"></i> Admin Panel`;
            
            // Check if current page is admin.html
            if (window.location.pathname.endsWith("admin.html")) {
                adminLink.classList.add("active");
            }
            
            navLinks.appendChild(adminLink);
        }
    }

    // Setup Notification DOM & Listeners
    function setupNotificationUI() {
        const btn = document.getElementById("notificationBtn") || document.getElementById("notificationButton");
        const badge = document.getElementById("notificationBadge");
        const dropdown = document.getElementById("notificationDropdown");
        const list = document.getElementById("notificationList");
        const markAllBtn = document.getElementById("markAllReadBtn") || document.getElementById("markAllNotificationsRead");

        if (!btn || !dropdown) return;

        // Toggle dropdown on button click
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains("show");
            
            // Close other dropdowns like profile dropdown if open
            const profileDropdown = document.getElementById("profileDropdown");
            if (profileDropdown) profileDropdown.classList.remove("show");

            if (!isOpen) {
                dropdown.classList.add("show");
                if (window.StudentHubAnim && typeof window.StudentHubAnim.animateDropdown === "function") {
                    window.StudentHubAnim.animateDropdown(dropdown);
                }
            } else {
                dropdown.classList.remove("show");
            }
        });

        // Prevent click inside dropdown from closing it
        dropdown.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (dropdown && dropdown.classList.contains("show")) {
                dropdown.classList.remove("show");
            }
        });

        // Close dropdown on Escape key
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && dropdown && dropdown.classList.contains("show")) {
                dropdown.classList.remove("show");
            }
        });

        // Mark all as read button
        if (markAllBtn) {
            markAllBtn.addEventListener("click", async function (e) {
                e.preventDefault();
                await markAllAsRead();
            });
        }
    }

    // Render Notifications into Dropdown List
    function renderNotifications() {
        const badge = document.getElementById("notificationBadge");
        const list = document.getElementById("notificationList");
        const countText = document.getElementById("notificationCountText");

        if (!list) return;

        list.innerHTML = "";

        const unreadCount = notifList.filter(n => !n.is_read).length;

        // Update Badge
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
                badge.classList.remove("hidden");
                badge.classList.add("active");
                badge.style.display = "flex";

                // Trigger GSAP badge bounce
                if (window.StudentHubAnim && typeof window.StudentHubAnim.animateBadgePop === "function") {
                    window.StudentHubAnim.animateBadgePop(badge);
                }
            } else {
                badge.textContent = "0";
                badge.classList.add("hidden");
                badge.classList.remove("active");
                badge.style.display = "none";
            }
        }

        // Update header count text if element exists
        if (countText) {
            countText.textContent = unreadCount === 1 
                ? "1 new notification" 
                : unreadCount > 1 
                    ? `${unreadCount} new notifications` 
                    : "No new notifications";
        }

        // Empty state
        if (!notifList || notifList.length === 0) {
            list.innerHTML = `
                <div class="notification-empty">
                    <i class="bi bi-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        // Render each notification
        notifList.forEach(item => {
            const el = document.createElement("div");
            el.className = `notification-item ${item.is_read ? "" : "unread"}`;
            el.dataset.id = item.id;

            const meta = getNotificationIconMeta(item.type);

            el.innerHTML = `
                <div class="notification-icon-box ${meta.class}">
                    <i class="${meta.icon}"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-message">${safeHtml(item.message || "New notification")}</p>
                    <span class="notification-time">${timeAgo(item.created_at)}</span>
                </div>
                ${!item.is_read ? '<div class="notification-unread-dot"></div>' : ""}
            `;

            // Click handling
            el.addEventListener("click", async () => {
                if (!item.is_read) {
                    await markSingleAsRead(item.id);
                }

                // If notification has a target link or post_id
                if (item.post_id) {
                    if (window.location.pathname.endsWith("community.html")) {
                        const targetPost = document.querySelector(`.post-card[data-id="${item.post_id}"]`);
                        if (targetPost) {
                            targetPost.scrollIntoView({ behavior: "smooth", block: "center" });
                            targetPost.style.boxShadow = "0 0 0 2px #5b3bb5";
                            setTimeout(() => { targetPost.style.boxShadow = ""; }, 2000);
                        }
                    } else {
                        window.location.href = `community.html#post-${item.post_id}`;
                    }
                } else if (item.event_id) {
                    if (!window.location.pathname.endsWith("event.html")) {
                        window.location.href = "event.html";
                    }
                } else if (item.type === "announcement") {
                    if (!window.location.pathname.endsWith("dashboard.html")) {
                        window.location.href = "dashboard.html";
                    }
                }
            });

            list.appendChild(el);
        });
    }

    // Load Notifications from Supabase
    async function loadNotifications() {
        if (!notifSupabase || !notifUser) return;

        try {
            const { data, error } = await notifSupabase
                .from("notifications")
                .select("*")
                .eq("recipient_id", notifUser.id)
                .order("created_at", { ascending: false })
                .limit(50);

            if (error) {
                console.warn("Notifications table query:", error.message);
                return;
            }

            notifList = data || [];
            renderNotifications();
        } catch (err) {
            console.error("Error loading notifications:", err);
        }
    }

    // Mark Single Notification as Read
    async function markSingleAsRead(id) {
        if (!notifSupabase || !notifUser || !id) return;

        // Optimistic UI update
        const notif = notifList.find(n => n.id === id);
        if (notif) notif.is_read = true;
        renderNotifications();

        try {
            await notifSupabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id)
                .eq("recipient_id", notifUser.id);
        } catch (err) {
            console.error("Error marking notification read:", err);
        }
    }

    // Mark All Notifications as Read
    async function markAllAsRead() {
        if (!notifSupabase || !notifUser) return;

        // Optimistic UI update
        notifList.forEach(n => { n.is_read = true; });
        renderNotifications();

        try {
            await notifSupabase
                .from("notifications")
                .update({ is_read: true })
                .eq("recipient_id", notifUser.id)
                .eq("is_read", false);
        } catch (err) {
            console.error("Error marking all read:", err);
        }
    }

    // Subscribe to Realtime Postgres Changes on Notifications
    function subscribeToRealtimeNotifications() {
        if (!notifSupabase || !notifUser) return;

        if (notifChannel) {
            try {
                notifSupabase.removeChannel(notifChannel);
            } catch (e) {}
        }

        try {
            notifChannel = notifSupabase
                .channel(`universal-notifications-${notifUser.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `recipient_id=eq.${notifUser.id}`
                    },
                    async (payload) => {
                        console.log("New notification received:", payload);
                        // Trigger bell jiggle GSAP animation
                        if (window.StudentHubAnim && typeof window.StudentHubAnim.animateBellJiggle === "function") {
                            const btn = document.getElementById("notificationBtn") || document.getElementById("notificationButton");
                            window.StudentHubAnim.animateBellJiggle(btn);
                        }
                        await loadNotifications();
                    }
                )
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "notifications",
                        filter: `recipient_id=eq.${notifUser.id}`
                    },
                    async () => {
                        await loadNotifications();
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn("Realtime subscription not available:", err);
        }
    }

    // Main Init Function
    async function initUniversalNotifications() {
        notifSupabase = getSupabaseClient();
        if (!notifSupabase) {
            console.warn("Supabase client not yet initialized.");
            return;
        }

        setupNotificationUI();

        try {
            const { data: { user }, error } = await notifSupabase.auth.getUser();
            if (error || !user) {
                // Not logged in or on public login page
                return;
            }

            notifUser = user;
            injectAdminNavBadge(user);
            await loadNotifications();
            subscribeToRealtimeNotifications();
        } catch (e) {
            console.error("Error in notification initialization:", e);
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initUniversalNotifications);
    } else {
        initUniversalNotifications();
    }

    // Expose global methods
    window.UniversalNotifications = {
        reload: loadNotifications,
        markAllAsRead: markAllAsRead,
        isUserAdmin: isUserAdmin
    };
})();
