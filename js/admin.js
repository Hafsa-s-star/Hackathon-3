// =========================================================
// ADMIN DASHBOARD JAVASCRIPT - STUDENTHUB
// Full administrative control, live moderation & Supabase integration
// =========================================================

// Initialize Supabase Client
const { createClient } = supabase;

const supabaseClient = createClient(
    "https://uiwmuwqarhngnhppqfqo.supabase.co",
    "sb_publishable_lXI3MvI6rVyWQKQ4P5r2ZA_zP8Ix1D7"
);

// Global State
let currentAdmin = null;
let allUsers = [];
let allPosts = [];
let allEvents = [];
let allAnnouncements = [];
let blockedUserIds = new Set();
let rejectedEventIds = new Set();

// Persistence fallbacks
function getLocalBlockedUsers() {
    try {
        const stored = localStorage.getItem("studenthub_blocked_users");
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
        return new Set();
    }
}

function saveLocalBlockedUsers(set) {
    try {
        localStorage.setItem("studenthub_blocked_users", JSON.stringify(Array.from(set)));
    } catch (e) {}
}

function getLocalRejectedEvents() {
    try {
        const stored = localStorage.getItem("studenthub_rejected_events");
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
        return new Set();
    }
}

function saveLocalRejectedEvents(set) {
    try {
        localStorage.setItem("studenthub_rejected_events", JSON.stringify(Array.from(set)));
    } catch (e) {}
}

blockedUserIds = getLocalBlockedUsers();
rejectedEventIds = getLocalRejectedEvents();

// =========================================================
// 1. ADMIN AUTHENTICATION & ACCESS GUARD
// =========================================================

async function verifyAdminAccess() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();

        if (error || !user) {
            window.location.href = "index.html";
            return false;
        }

        const userEmail = (user.email || "").toLowerCase().trim();
        const userRole = user.user_metadata?.role;

        // Check if user is the designated admin
        const isAdmin = userEmail === "pakistan.hafsa@gmail.com" || userRole === "admin";

        if (!isAdmin) {
            await Swal.fire({
                icon: "error",
                title: "Access Denied",
                text: "You do not have administrative privileges to access this area.",
                confirmButtonColor: "#5b3bb5"
            });
            window.location.href = "dashboard.html";
            return false;
        }

        currentAdmin = user;

        // Display welcome message
        const welcomeEl = document.getElementById("adminWelcomeText");
        const adminName = user.user_metadata?.display_name || userEmail.split("@")[0];
        if (welcomeEl) {
            welcomeEl.textContent = `Logged in as ${adminName} (${userEmail}). Complete administrative control.`;
        }

        return true;
    } catch (err) {
        console.error("Admin verification error:", err);
        window.location.href = "index.html";
        return false;
    }
}

// =========================================================
// 2. TAB NAVIGATION & GSAP SWITCHER
// =========================================================

function setupTabNavigation() {
    const tabButtons = document.querySelectorAll(".admin-tab-btn");
    const statCards = document.querySelectorAll(".admin-stat-card");

    function switchTab(tabId) {
        // Update sidebar button states
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Update panel visibility
        const panels = document.querySelectorAll(".admin-tab-panel");
        panels.forEach(panel => {
            if (panel.id === `tab-${tabId}`) {
                panel.classList.add("active");
                if (window.StudentHubAnim && typeof window.StudentHubAnim.animateTabSwitch === "function") {
                    window.StudentHubAnim.animateTabSwitch(panel);
                }
            } else {
                panel.classList.remove("active");
            }
        });
    }

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const tabId = btn.dataset.tab;
            if (tabId) switchTab(tabId);
        });
    });

    // Stat cards also switch to corresponding tab
    statCards.forEach(card => {
        card.addEventListener("click", () => {
            const targetTab = card.dataset.targetTab;
            if (targetTab) switchTab(targetTab);
        });
    });
}

// =========================================================
// 3. STATS & DATA AGGREGATION
// =========================================================

async function loadDashboardStats() {
    // 1. Fetch Posts Count & Data
    try {
        const { data: posts, error } = await supabaseClient
            .from("my-posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && posts) {
            allPosts = posts;
        }
    } catch (e) {
        console.warn("Could not query my-posts:", e);
    }

    // 2. Fetch Events Count & Data
    try {
        const { data: events, error } = await supabaseClient
            .from("events")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && events) {
            allEvents = events.map(ev => {
                if (rejectedEventIds.has(ev.id)) {
                    return { ...ev, status: "rejected" };
                }
                return ev;
            });
        }
    } catch (e) {
        console.warn("Could not query events:", e);
    }

    // 3. Fetch Users (From Profiles + Authors of posts/events)
    try {
        let usersMap = new Map();

        // Check if profiles table exists
        const { data: profiles, error: profErr } = await supabaseClient
            .from("profiles")
            .select("*");

        if (!profErr && profiles) {
            profiles.forEach(p => {
                if (p.id) {
                    usersMap.set(p.id, {
                        id: p.id,
                        name: p.name || p.full_name || p.username || "Student",
                        email: p.email || "student@studenthub.edu",
                        role: p.role || (p.email === "pakistan.hafsa@gmail.com" ? "admin" : "user"),
                        profile_picture: p.profile_picture || p.avatar_url || "",
                        created_at: p.created_at || new Date().toISOString(),
                        is_blocked: blockedUserIds.has(p.id)
                    });
                }
            });
        }

        // Add users found in posts
        allPosts.forEach(post => {
            if (post.user_id && !usersMap.has(post.user_id)) {
                usersMap.set(post.user_id, {
                    id: post.user_id,
                    name: post.name || "Student",
                    email: post.email || "student@studenthub.edu",
                    role: post.email === "pakistan.hafsa@gmail.com" ? "admin" : (post.role || "user"),
                    profile_picture: post.profile_picture || "",
                    created_at: post.created_at || new Date().toISOString(),
                    is_blocked: blockedUserIds.has(post.user_id)
                });
            }
        });

        // Add users found in events
        allEvents.forEach(ev => {
            if (ev.user_id && !usersMap.has(ev.user_id)) {
                usersMap.set(ev.user_id, {
                    id: ev.user_id,
                    name: ev.creator_name || "Student",
                    email: ev.creator_email || "student@studenthub.edu",
                    role: ev.creator_email === "pakistan.hafsa@gmail.com" ? "admin" : "user",
                    profile_picture: ev.creator_profile_picture || "",
                    created_at: ev.created_at || new Date().toISOString(),
                    is_blocked: blockedUserIds.has(ev.user_id)
                });
            }
        });

        // Ensure current admin user is always listed
        if (currentAdmin && !usersMap.has(currentAdmin.id)) {
            usersMap.set(currentAdmin.id, {
                id: currentAdmin.id,
                name: currentAdmin.user_metadata?.display_name || "Admin Hafsa",
                email: currentAdmin.email,
                role: "admin",
                profile_picture: currentAdmin.user_metadata?.profile_picture || "",
                created_at: currentAdmin.created_at || new Date().toISOString(),
                is_blocked: false
            });
        }

        allUsers = Array.from(usersMap.values());
    } catch (e) {
        console.warn("User aggregation error:", e);
    }

    // 4. Fetch Announcements
    try {
        const { data: ann, error: annErr } = await supabaseClient
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false });

        if (!annErr && ann) {
            allAnnouncements = ann;
        } else {
            // Check localStorage backup
            const localAnn = localStorage.getItem("studenthub_announcements");
            allAnnouncements = localAnn ? JSON.parse(localAnn) : [];
        }
    } catch (e) {
        const localAnn = localStorage.getItem("studenthub_announcements");
        allAnnouncements = localAnn ? JSON.parse(localAnn) : [];
    }

    // Update Counter Badges in Sidebar
    document.getElementById("usersTabCount").textContent = allUsers.length;
    document.getElementById("postsTabCount").textContent = allPosts.length;
    document.getElementById("eventsTabCount").textContent = allEvents.length;
    document.getElementById("announcementsTabCount").textContent = allAnnouncements.length;

    // Update Overview Stats Numbers
    document.getElementById("statTotalUsers").textContent = allUsers.length;
    document.getElementById("statTotalPosts").textContent = allPosts.length;
    document.getElementById("statTotalEvents").textContent = allEvents.length;
    const statAnn = document.getElementById("statTotalAnnouncements");
    if (statAnn) statAnn.textContent = allAnnouncements.length;

    // Trigger GSAP counter animation
    if (window.StudentHubAnim && typeof window.StudentHubAnim.animateStatCounters === "function") {
        window.StudentHubAnim.animateStatCounters(".admin-stat-number");
    }

    // Render Data into Tabs
    renderUsersTable();
    renderPostsGrid();
    renderEventsTable();
    renderAnnouncementsList();
}

// =========================================================
// 4. USER MANAGEMENT (VIEW, SEARCH, BLOCK/UNBLOCK)
// =========================================================

function renderUsersTable() {
    const tbody = document.getElementById("userTableBody");
    const searchVal = (document.getElementById("userSearchInput")?.value || "").toLowerCase();
    const filterRole = document.getElementById("userRoleFilter")?.value || "all";

    if (!tbody) return;

    let filtered = allUsers.filter(u => {
        const matchSearch = (u.name || "").toLowerCase().includes(searchVal) ||
                            (u.email || "").toLowerCase().includes(searchVal);
        
        let matchRole = true;
        if (filterRole === "user") matchRole = u.role !== "admin";
        else if (filterRole === "admin") matchRole = u.role === "admin";
        else if (filterRole === "blocked") matchRole = u.is_blocked;

        return matchSearch && matchRole;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                    No users matching criteria found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(u => {
        const initial = (u.name || "U").charAt(0).toUpperCase();
        const isBlocked = u.is_blocked || blockedUserIds.has(u.id);
        const isAdmin = u.role === "admin" || u.email === "pakistan.hafsa@gmail.com";

        return `
            <tr>
                <td>
                    <div class="admin-user-cell">
                        <div class="admin-user-avatar">
                            ${u.profile_picture ? `<img src="${u.profile_picture}" alt="${u.name}">` : initial}
                        </div>
                        <div class="admin-user-info-text">
                            <span class="admin-user-name">${escapeHtml(u.name)}</span>
                            <span class="admin-user-email">ID: ${u.id ? u.id.substring(0, 8) + "..." : "N/A"}</span>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(u.email)}</td>
                <td>
                    <span class="admin-status-badge ${isAdmin ? "admin" : "active"}">
                        ${isAdmin ? '<i class="bi bi-shield-fill-check me-1"></i> Admin' : 'Student'}
                    </span>
                </td>
                <td>
                    <span class="admin-status-badge ${isBlocked ? "blocked" : "active"}">
                        ${isBlocked ? '<i class="bi bi-slash-circle me-1"></i> Blocked' : '<i class="bi bi-check-circle me-1"></i> Active'}
                    </span>
                </td>
                <td>
                    <div class="admin-action-btn-group">
                        ${!isAdmin ? `
                            <button type="button" class="admin-btn-sm ${isBlocked ? "admin-btn-unblock" : "admin-btn-block"}" 
                                onclick="toggleBlockUser('${u.id}', '${escapeHtml(u.name)}', ${isBlocked})">
                                <i class="bi bi-${isBlocked ? "unlock-fill" : "lock-fill"}"></i>
                                ${isBlocked ? "Unblock" : "Block"}
                            </button>
                        ` : `<span class="text-muted small">Protected Admin</span>`}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Block / Unblock User Function
window.toggleBlockUser = async function (userId, userName, currentBlockedState) {
    const actionText = currentBlockedState ? "unblock" : "block";
    const confirmResult = await Swal.fire({
        icon: currentBlockedState ? "question" : "warning",
        title: `${currentBlockedState ? "Unblock" : "Block"} User?`,
        text: `Are you sure you want to ${actionText} ${userName}?`,
        showCancelButton: true,
        confirmButtonText: `Yes, ${actionText}`,
        cancelButtonText: "Cancel",
        confirmButtonColor: currentBlockedState ? "#15803d" : "#b91c1c"
    });

    if (!confirmResult.isConfirmed) return;

    if (currentBlockedState) {
        blockedUserIds.delete(userId);
    } else {
        blockedUserIds.add(userId);
    }
    saveLocalBlockedUsers(blockedUserIds);

    // Update in-memory user objects
    allUsers.forEach(u => {
        if (u.id === userId) u.is_blocked = !currentBlockedState;
    });

    // Attempt to update database if profiles table exists
    try {
        await supabaseClient
            .from("profiles")
            .update({ is_blocked: !currentBlockedState })
            .eq("id", userId);
    } catch (e) {}

    // Create system notification for that user
    try {
        await supabaseClient.from("notifications").insert({
            recipient_id: userId,
            sender_id: currentAdmin.id,
            type: "admin",
            message: currentBlockedState 
                ? "Your account has been unblocked by an administrator." 
                : "Your account has been restricted by an administrator."
        });
    } catch (e) {}

    Swal.fire({
        icon: "success",
        title: `User ${currentBlockedState ? "Unblocked" : "Blocked"}`,
        text: `${userName} has been successfully ${currentBlockedState ? "unblocked" : "blocked"}.`,
        timer: 2000,
        showConfirmButton: false
    });

    renderUsersTable();
};

// =========================================================
// 5. POST MANAGEMENT (VIEW, MODERATE, DELETE INAPPROPRIATE)
// =========================================================

function renderPostsGrid() {
    const container = document.getElementById("adminPostsContainer");
    const searchVal = (document.getElementById("postSearchInput")?.value || "").toLowerCase();

    if (!container) return;

    let filtered = allPosts.filter(p => {
        return (p.title || "").toLowerCase().includes(searchVal) ||
               (p.description || "").toLowerCase().includes(searchVal) ||
               (p.name || "").toLowerCase().includes(searchVal);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="admin-empty-state" style="grid-column: 1 / -1;">
                <i class="bi bi-file-earmark-x"></i>
                <p>No community posts found.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(post => {
        const initial = (post.name || "U").charAt(0).toUpperCase();
        return `
            <div class="admin-post-card" data-id="${post.id}">
                <div class="admin-post-author">
                    <div class="admin-user-avatar" style="width: 32px; height: 32px; font-size: 12px;">
                        ${post.profile_picture ? `<img src="${post.profile_picture}" alt="${post.name}">` : initial}
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 13.5px;">${escapeHtml(post.name || "Student")}</div>
                        <div style="font-size: 11px; color: #8c859d;">${post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}</div>
                    </div>
                </div>

                ${post.background ? `<img src="${post.background}" class="admin-post-image" alt="${escapeHtml(post.title || "Post")}" onerror="this.style.display='none'">` : ""}

                <h3 class="admin-post-title">${escapeHtml(post.title || "Untitled Post")}</h3>
                <p class="admin-post-desc">${escapeHtml(post.description || "")}</p>

                <div class="admin-post-footer">
                    <span class="text-muted small">
                        <i class="bi bi-heart-fill text-danger me-1"></i> ${post.likes_count || 0}
                    </span>
                    <button type="button" class="admin-btn-sm admin-btn-danger" onclick="deleteInappropriatePost('${post.id}', '${escapeHtml(post.title || "this post")}')">
                        <i class="bi bi-trash3-fill"></i> Delete Post
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// Delete Post Action
window.deleteInappropriatePost = async function (postId, postTitle) {
    const confirmResult = await Swal.fire({
        icon: "warning",
        title: "Delete Inappropriate Post?",
        text: `Are you sure you want to permanently remove "${postTitle}" from StudentHub? This cannot be undone.`,
        showCancelButton: true,
        confirmButtonText: "Yes, Delete Post",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#b91c1c"
    });

    if (!confirmResult.isConfirmed) return;

    try {
        const { error } = await supabaseClient
            .from("my-posts")
            .delete()
            .eq("id", postId);

        if (error) throw error;

        // Remove from local list
        allPosts = allPosts.filter(p => p.id != postId);
        document.getElementById("postsTabCount").textContent = allPosts.length;
        document.getElementById("statTotalPosts").textContent = allPosts.length;

        Swal.fire({
            icon: "success",
            title: "Post Deleted",
            text: "The post was successfully removed from the community feed.",
            timer: 2000,
            showConfirmButton: false
        });

        renderPostsGrid();
    } catch (err) {
        console.error("Post delete error:", err);
        Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: err.message
        });
    }
};

// =========================================================
// 6. EVENT MANAGEMENT (VIEW, APPROVE, REJECT, DELETE)
// =========================================================

function renderEventsTable() {
    const tbody = document.getElementById("eventTableBody");
    const searchVal = (document.getElementById("eventSearchInput")?.value || "").toLowerCase();
    const filterStatus = document.getElementById("eventStatusFilter")?.value || "all";

    if (!tbody) return;

    let filtered = allEvents.filter(ev => {
        const matchSearch = (ev.title || "").toLowerCase().includes(searchVal) ||
                            (ev.creator_name || "").toLowerCase().includes(searchVal) ||
                            (ev.location || "").toLowerCase().includes(searchVal);
        
        let matchStatus = true;
        const status = ev.status || (rejectedEventIds.has(ev.id) ? "rejected" : "pending");
        if (filterStatus !== "all") {
            matchStatus = status === filterStatus;
        }

        return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    No events matching criteria found.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(ev => {
        const status = ev.status || (rejectedEventIds.has(ev.id) ? "rejected" : "approved");
        return `
            <tr>
                <td>
                    <div style="font-weight: 600; color: #29233d;">${escapeHtml(ev.title || "Untitled Event")}</div>
                    <div style="font-size: 11.5px; color: #746d82; max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${escapeHtml(ev.description || "")}
                    </div>
                </td>
                <td>
                    <div>${escapeHtml(ev.creator_name || "Student")}</div>
                    <small class="text-muted">${escapeHtml(ev.creator_email || "")}</small>
                </td>
                <td>
                    <div><i class="bi bi-calendar3 me-1 text-primary"></i> ${ev.event_date || "TBD"}</div>
                    <small class="text-muted"><i class="bi bi-clock me-1"></i> ${ev.event_time || ""}</small>
                </td>
                <td>
                    <span><i class="bi bi-geo-alt me-1 text-danger"></i> ${escapeHtml(ev.location || "Online")}</span>
                </td>
                <td>
                    <span class="admin-status-badge ${status}">
                        ${status}
                    </span>
                </td>
                <td>
                    <div class="admin-action-btn-group">
                        ${status !== "approved" ? `
                            <button type="button" class="admin-btn-sm admin-btn-approve" onclick="updateEventStatus('${ev.id}', 'approved')">
                                <i class="bi bi-check-lg"></i> Approve
                            </button>
                        ` : ""}
                        ${status !== "rejected" ? `
                            <button type="button" class="admin-btn-sm admin-btn-reject" onclick="updateEventStatus('${ev.id}', 'rejected')">
                                <i class="bi bi-x-lg"></i> Reject
                            </button>
                        ` : ""}
                        <button type="button" class="admin-btn-sm admin-btn-danger" onclick="deleteAdminEvent('${ev.id}', '${escapeHtml(ev.title || "event")}')">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Update Event Status (Approve / Reject)
window.updateEventStatus = async function (eventId, newStatus) {
    try {
        if (newStatus === "rejected") {
            rejectedEventIds.add(eventId);
            saveLocalRejectedEvents(rejectedEventIds);
        } else {
            rejectedEventIds.delete(eventId);
            saveLocalRejectedEvents(rejectedEventIds);
        }

        const { error } = await supabaseClient
            .from("events")
            .update({ status: newStatus })
            .eq("id", eventId);

        if (error) {
            console.warn("Event status update:", error.message);
        }

        allEvents.forEach(ev => {
            if (ev.id == eventId) ev.status = newStatus;
        });

        // Notify Creator
        const targetEvent = allEvents.find(ev => ev.id == eventId);
        if (targetEvent && targetEvent.user_id) {
            try {
                await supabaseClient.from("notifications").insert({
                    recipient_id: targetEvent.user_id,
                    sender_id: currentAdmin.id,
                    type: "event",
                    message: newStatus === "rejected"
                        ? `Your event "${targetEvent.title}" has been rejected by the administrator and removed from public view.`
                        : `Your event "${targetEvent.title}" has been approved by the administrator and is now live.`
                });
            } catch (e) {}
        }

        Swal.fire({
            icon: "success",
            title: `Event ${newStatus === "approved" ? "Approved" : "Rejected"}`,
            text: newStatus === "rejected" ? "The event has been rejected and will not appear on student pages." : "Event is now approved.",
            timer: 2000,
            showConfirmButton: false
        });

        renderEventsTable();
    } catch (err) {
        console.error("Event update error:", err);
    }
};

// Delete Event Action
window.deleteAdminEvent = async function (eventId, eventTitle) {
    const confirmResult = await Swal.fire({
        icon: "warning",
        title: "Delete Event?",
        text: `Are you sure you want to permanently remove "${eventTitle}"?`,
        showCancelButton: true,
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel",
        confirmButtonColor: "#b91c1c"
    });

    if (!confirmResult.isConfirmed) return;

    try {
        const { error } = await supabaseClient
            .from("events")
            .delete()
            .eq("id", eventId);

        if (error) throw error;

        allEvents = allEvents.filter(ev => ev.id != eventId);
        rejectedEventIds.delete(eventId);
        saveLocalRejectedEvents(rejectedEventIds);
        
        document.getElementById("eventsTabCount").textContent = allEvents.length;
        document.getElementById("statTotalEvents").textContent = allEvents.length;

        Swal.fire({
            icon: "success",
            title: "Event Deleted",
            timer: 1800,
            showConfirmButton: false
        });

        renderEventsTable();
    } catch (err) {
        console.error("Event delete error:", err);
        Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: err.message
        });
    }
};

// =========================================================
// 7. ANNOUNCEMENTS CREATION & SYNC TO STUDENT DASHBOARD
// =========================================================

function setupAnnouncementsForm() {
    const form = document.getElementById("createAnnouncementForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const title = document.getElementById("announcementTitle").value.trim();
        const priority = document.getElementById("announcementPriority").value;
        const message = document.getElementById("announcementMessage").value.trim();

        if (!title || !message) {
            Swal.fire({
                icon: "warning",
                title: "Missing Fields",
                text: "Please enter both title and announcement details."
            });
            return;
        }

        const newAnnouncement = {
            id: "ann-" + Date.now(),
            title: title,
            message: message,
            priority: priority,
            admin_email: currentAdmin.email,
            admin_name: currentAdmin.user_metadata?.display_name || "Admin Hafsa",
            created_at: new Date().toISOString()
        };

        try {
            // Save to Supabase announcements table
            const { data, error } = await supabaseClient
                .from("announcements")
                .insert([newAnnouncement])
                .select();

            if (error) {
                console.warn("Database table 'announcements' notice:", error.message);
            }

            // Always update local backup cache so student dashboard can display it immediately
            allAnnouncements.unshift(newAnnouncement);
            localStorage.setItem("studenthub_announcements", JSON.stringify(allAnnouncements));

            // Broadcast notification to active users
            allUsers.forEach(async (u) => {
                if (u.id) {
                    try {
                        await supabaseClient.from("notifications").insert({
                            recipient_id: u.id,
                            sender_id: currentAdmin.id,
                            type: "announcement",
                            message: `📢 [${priority.toUpperCase()}] ${title}: ${message.substring(0, 60)}...`
                        });
                    } catch (e) {}
                }
            });

            form.reset();
            document.getElementById("announcementsTabCount").textContent = allAnnouncements.length;
            const statAnn = document.getElementById("statTotalAnnouncements");
            if (statAnn) statAnn.textContent = allAnnouncements.length;

            await Swal.fire({
                icon: "success",
                title: "Announcement Published!",
                text: "The announcement has been broadcast and is now visible on the Student Dashboard.",
                confirmButtonColor: "#5b3bb5"
            });

            renderAnnouncementsList();
        } catch (err) {
            console.error("Announcement creation error:", err);
            Swal.fire({
                icon: "error",
                title: "Publishing Failed",
                text: err.message
            });
        }
    });
}

function renderAnnouncementsList() {
    const container = document.getElementById("announcementsListContainer");
    if (!container) return;

    if (allAnnouncements.length === 0) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <i class="bi bi-megaphone"></i>
                <p>No announcements published yet. Create one above!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = allAnnouncements.map(ann => {
        const priority = ann.priority || "normal";
        return `
            <div class="announcement-card-item" data-id="${ann.id}">
                <div>
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="announcement-meta-badge ${priority}">
                            <i class="bi bi-bell-fill"></i> ${priority}
                        </span>
                        <span class="text-muted small">
                            ${ann.created_at ? new Date(ann.created_at).toLocaleString() : "Recently"}
                        </span>
                    </div>
                    <h4 style="font-size: 16px; font-weight: 700; color: #29233d; margin-bottom: 6px;">
                        ${escapeHtml(ann.title)}
                    </h4>
                    <p style="font-size: 13.5px; color: #554e68; line-height: 1.45; margin: 0;">
                        ${escapeHtml(ann.message)}
                    </p>
                </div>
                <div>
                    <button type="button" class="admin-btn-sm admin-btn-danger" onclick="deleteAnnouncement('${ann.id}')">
                        <i class="bi bi-trash3"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

window.deleteAnnouncement = async function (annId) {
    const confirmResult = await Swal.fire({
        icon: "warning",
        title: "Delete Announcement?",
        text: "This will remove the announcement from the student dashboard.",
        showCancelButton: true,
        confirmButtonText: "Delete",
        confirmButtonColor: "#b91c1c"
    });

    if (!confirmResult.isConfirmed) return;

    try {
        await supabaseClient
            .from("announcements")
            .delete()
            .eq("id", annId);
    } catch (e) {}

    allAnnouncements = allAnnouncements.filter(a => a.id != annId);
    localStorage.setItem("studenthub_announcements", JSON.stringify(allAnnouncements));
    document.getElementById("announcementsTabCount").textContent = allAnnouncements.length;
    const statAnn = document.getElementById("statTotalAnnouncements");
    if (statAnn) statAnn.textContent = allAnnouncements.length;

    Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1500,
        showConfirmButton: false
    });

    renderAnnouncementsList();
};

// =========================================================
// 8. EVENT LISTENERS & SEARCH FILTERS
// =========================================================

function setupSearchAndFilters() {
    // User search & role filter
    document.getElementById("userSearchInput")?.addEventListener("input", renderUsersTable);
    document.getElementById("userRoleFilter")?.addEventListener("change", renderUsersTable);

    // Post search
    document.getElementById("postSearchInput")?.addEventListener("input", renderPostsGrid);

    // Event search & status filter
    document.getElementById("eventSearchInput")?.addEventListener("input", renderEventsTable);
    document.getElementById("eventStatusFilter")?.addEventListener("change", renderEventsTable);

    // Refresh all stats button
    document.getElementById("refreshAllStatsBtn")?.addEventListener("click", async () => {
        Swal.fire({
            title: "Refreshing data...",
            didOpen: () => { Swal.showLoading(); }
        });
        await loadDashboardStats();
        Swal.close();
    });

    // Admin Logout
    document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
        const res = await Swal.fire({
            title: "Logout from Admin Portal?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Logout",
            confirmButtonColor: "#e63946"
        });
        if (res.isConfirmed) {
            await supabaseClient.auth.signOut();
            window.location.href = "index.html";
        }
    });
}

// Utility: Escape HTML
function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =========================================================
// 9. INITIALIZATION
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
    const isAuthorized = await verifyAdminAccess();
    if (!isAuthorized) return;

    setupTabNavigation();
    setupAnnouncementsForm();
    setupSearchAndFilters();
    await loadDashboardStats();
});
