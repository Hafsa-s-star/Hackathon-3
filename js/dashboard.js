// =========================================================
// STUDENT DASHBOARD JAVASCRIPT
// Handles user profile, live statistics, announcements & events
// =========================================================

const { createClient } = supabase;

const supabaseClient = createClient(
    "https://uiwmuwqarhngnhppqfqo.supabase.co",
    "sb_publishable_lXI3MvI6rVyWQKQ4P5r2ZA_zP8Ix1D7"
);

// DOM Elements
const userNameElement = document.getElementById("userName");
const navUserNameElement = document.getElementById("navUserName");
const profileInitial = document.getElementById("profileInitial");
const largeProfileInitial = document.getElementById("largeProfileInitial");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const profilePhotoImg = document.getElementById("profilePhotoImg");
const largeProfilePhotoImg = document.getElementById("largeProfilePhotoImg");
const largeProfilePicture = document.getElementById("largeProfilePicture");
const logoutBtn = document.getElementById("logoutBtn");

// Profile Dropdown
const profileButton = document.getElementById("profileButton");
const profileDropdown = document.getElementById("profileDropdown");
const editProfileBtn = document.getElementById("editProfileBtn");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const dropdownUserName = document.getElementById("dropdownUserName");
const dropdownUserEmail = document.getElementById("dropdownUserEmail");
const dropdownProfileInitial = document.getElementById("dropdownProfileInitial");
const dropdownProfileImg = document.getElementById("dropdownProfileImg");

// Current User
let currentUser = null;

// =========================================================
// LOAD USER & AUTHENTICATION
// =========================================================

async function loadUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();

        if (error || !user) {
            window.location.href = "index.html";
            return;
        }

        currentUser = user;

        // User Display Name
        const name =
            user.user_metadata?.display_name ||
            user.user_metadata?.first_name ||
            user.email?.split("@")[0] ||
            "Student";

        if (userNameElement) userNameElement.textContent = name;
        if (navUserNameElement) navUserNameElement.textContent = name;
        if (dropdownUserName) dropdownUserName.textContent = name;
        if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || "";

        // Profile Initials
        const initial = name.charAt(0).toUpperCase();
        if (profileInitial) profileInitial.textContent = initial;
        if (largeProfileInitial) largeProfileInitial.textContent = initial;
        if (dropdownProfileInitial) dropdownProfileInitial.textContent = initial;

        // Profile Image
        const profileImage = user.user_metadata?.profile_picture;
        if (profileImage) {
            showProfilePicture(profileImage + "?t=" + Date.now());
        }

        // Fetch live dashboard metrics & announcements
        await loadDashboardData();

    } catch (err) {
        console.error("User loading error:", err);
        window.location.href = "index.html";
    }
}

// =========================================================
// SHOW PROFILE PICTURE
// =========================================================

function showProfilePicture(imageUrl) {
    if (profilePhotoImg) {
        profilePhotoImg.src = imageUrl;
        profilePhotoImg.style.display = "block";
    }
    if (largeProfilePhotoImg) {
        largeProfilePhotoImg.src = imageUrl;
        largeProfilePhotoImg.style.display = "block";
    }
    if (dropdownProfileImg) {
        dropdownProfileImg.src = imageUrl;
        dropdownProfileImg.style.display = "block";
    }
    if (profileInitial) profileInitial.style.display = "none";
    if (largeProfileInitial) largeProfileInitial.style.display = "none";
    if (dropdownProfileInitial) dropdownProfileInitial.style.display = "none";
}

// =========================================================
// DASHBOARD STATS, ANNOUNCEMENTS & EVENTS
// =========================================================

async function loadDashboardData() {
    // 1. Fetch Posts Count
    try {
        const { data: posts, count, error } = await supabaseClient
            .from("my-posts")
            .select("id", { count: "exact" });
        const postCount = !error && (count !== null ? count : (posts ? posts.length : 0)) || 0;
        const countEl = document.getElementById("dashPostsCount");
        if (countEl) countEl.textContent = postCount;
    } catch (e) {}

    // 2. Fetch Events Count & Upcoming Events
    try {
        const { data: events, error } = await supabaseClient
            .from("events")
            .select("*")
            .order("created_at", { ascending: false });

        let rejectedEventIds = new Set();
        try {
            const stored = localStorage.getItem("studenthub_rejected_events");
            if (stored) rejectedEventIds = new Set(JSON.parse(stored));
        } catch (e) {}

        const validEvents = (events || []).filter(
            ev => ev.status !== "rejected" && !rejectedEventIds.has(ev.id)
        );

        const eventsContainer = document.getElementById("dashEventsContainer");
        const countEl = document.getElementById("dashEventsCount");

        if (countEl) countEl.textContent = validEvents.length;

        if (eventsContainer) {
            const displayEvents = validEvents.slice(0, 3);
            if (displayEvents.length === 0) {
                eventsContainer.innerHTML = `
                    <p style="color: #746d82; margin: 0;">No upcoming events scheduled at this moment.</p>
                `;
            } else {
                eventsContainer.innerHTML = displayEvents.map(ev => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f2eff8;">
                        <div>
                            <h4 style="font-size: 14.5px; font-weight: 700; color: #29233d; margin-bottom: 3px;">
                                ${escapeHtml(ev.title || "Campus Event")}
                            </h4>
                            <div style="font-size: 12.5px; color: #746d82;">
                                <span><i class="bi bi-calendar3 me-1"></i> ${ev.event_date || "Upcoming"}</span>
                                <span class="ms-3"><i class="bi bi-geo-alt me-1"></i> ${escapeHtml(ev.location || "Campus")}</span>
                            </div>
                        </div>
                        <a href="event.html" style="font-size: 12.5px; color: #5b3bb5; font-weight: 600; text-decoration: none;">Details →</a>
                    </div>
                `).join("");
            }
        }
    } catch (e) {}

    // 3. Fetch Polls Count
    try {
        const { data: polls, count, error } = await supabaseClient
            .from("polls")
            .select("id", { count: "exact" });
        const pollCount = !error && (count !== null ? count : (polls ? polls.length : 0)) || 0;
        const countEl = document.getElementById("dashPollsCount");
        if (countEl) countEl.textContent = pollCount;
    } catch (e) {}

    // 4. Fetch Announcements (Published by Admin)
    try {
        let announcements = [];
        const { data, error } = await supabaseClient
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);

        if (!error && data && data.length > 0) {
            announcements = data;
        } else {
            // LocalStorage backup fallback
            const localData = localStorage.getItem("studenthub_announcements");
            announcements = localData ? JSON.parse(localData) : [];
        }

        const countEl = document.getElementById("dashAnnouncementsCount");
        if (countEl) countEl.textContent = announcements.length;

        const annContainer = document.getElementById("dashAnnouncementsContainer");
        if (annContainer) {
            if (announcements.length === 0) {
                annContainer.innerHTML = `
                    <p style="color: #746d82; margin: 0;">No new announcements available yet.</p>
                `;
            } else {
                annContainer.innerHTML = announcements.map(ann => {
                    const priority = ann.priority || "normal";
                    let badgeBg = "#f0ebff";
                    let badgeColor = "#5b3bb5";
                    if (priority === "urgent") { badgeBg = "#fee2e2"; badgeColor = "#b91c1c"; }
                    else if (priority === "important") { badgeBg = "#fef3c7"; badgeColor = "#b45309"; }

                    return `
                        <div style="background: #faf8ff; border: 1px solid #eeeaf5; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                                <span style="font-size: 11px; font-weight: 700; background: ${badgeBg}; color: ${badgeColor}; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">
                                    ${priority}
                                </span>
                                <span style="font-size: 11.5px; color: #8c859d;">
                                    ${ann.created_at ? new Date(ann.created_at).toLocaleDateString() : "Recent"}
                                </span>
                            </div>
                            <h4 style="font-size: 14.5px; font-weight: 700; color: #29233d; margin-bottom: 4px;">
                                ${escapeHtml(ann.title)}
                            </h4>
                            <p style="font-size: 13px; color: #554e68; line-height: 1.4; margin: 0;">
                                ${escapeHtml(ann.message)}
                            </p>
                        </div>
                    `;
                }).join("");
            }
        }
    } catch (e) {}

    // Trigger GSAP stat counter animation
    if (window.StudentHubAnim && typeof window.StudentHubAnim.animateStatCounters === "function") {
        window.StudentHubAnim.animateStatCounters(".dashboard-card h2");
    }
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
// PROFILE DROPDOWN TOGGLE & ACTIONS
// =========================================================

if (profileButton) {
    profileButton.addEventListener("click", function (e) {
        e.stopPropagation();
        if (profileDropdown) {
            profileDropdown.classList.toggle("show");
            if (profileDropdown.classList.contains("show") && window.StudentHubAnim) {
                window.StudentHubAnim.animateDropdown(profileDropdown);
            }
        }
    });
}

document.addEventListener("click", function () {
    if (profileDropdown) profileDropdown.classList.remove("show");
});

if (profileDropdown) {
    profileDropdown.addEventListener("click", function (e) {
        e.stopPropagation();
    });
}

// Open File Selector
function openProfilePhotoSelector() {
    if (profilePhotoInput) profilePhotoInput.click();
}

if (changePhotoBtn) {
    changePhotoBtn.addEventListener("click", openProfilePhotoSelector);
}

// Profile Photo Upload Handler
if (profilePhotoInput) {
    profilePhotoInput.addEventListener("change", async function () {
        const file = profilePhotoInput.files[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            Swal.fire({
                icon: "error",
                title: "Invalid Image",
                text: "Please select a JPG, PNG or WEBP image."
            });
            profilePhotoInput.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({
                icon: "error",
                title: "Image Too Large",
                text: "Please select an image smaller than 5MB."
            });
            profilePhotoInput.value = "";
            return;
        }

        try {
            Swal.fire({
                title: "Uploading...",
                text: "Updating your profile picture.",
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            const filePath = `profiles/${currentUser.id}/avatar_${Date.now()}`;
            const { error: uploadError } = await supabaseClient
                .storage
                .from("avatars")
                .upload(filePath, file, { cacheControl: "3600", upsert: true, contentType: file.type });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabaseClient
                .storage
                .from("avatars")
                .getPublicUrl(filePath);

            const imageUrl = publicUrlData.publicUrl;

            const { error: updateError } = await supabaseClient.auth.updateUser({
                data: { profile_picture: imageUrl }
            });

            if (updateError) throw updateError;

            showProfilePicture(imageUrl + "?t=" + Date.now());

            Swal.fire({
                icon: "success",
                title: "Profile Picture Updated!",
                timer: 1800,
                showConfirmButton: false
            });

            profilePhotoInput.value = "";
        } catch (error) {
            console.error("Profile Upload Error:", error);
            Swal.fire({
                icon: "error",
                title: "Upload Failed",
                text: error.message
            });
        }
    });
}

// Edit Profile Name
if (editProfileBtn) {
    editProfileBtn.addEventListener("click", async function () {
        const currentName = currentUser?.user_metadata?.display_name || "";

        const result = await Swal.fire({
            title: "Edit Profile",
            html: `
                <input id="editName" class="swal2-input" placeholder="Your name" value="${escapeHtml(currentName)}">
            `,
            confirmButtonText: "Save Changes",
            confirmButtonColor: "#5b3bb5",
            showCancelButton: true,
            cancelButtonText: "Cancel",
            focusConfirm: false,
            preConfirm: () => {
                const name = document.getElementById("editName").value.trim();
                if (!name) {
                    Swal.showValidationMessage("Please enter your name.");
                    return false;
                }
                return name;
            }
        });

        if (!result.isConfirmed) return;

        const newName = result.value;

        try {
            const { data, error } = await supabaseClient.auth.updateUser({
                data: { display_name: newName }
            });

            if (error) throw error;

            currentUser = data.user;

            if (userNameElement) userNameElement.textContent = newName;
            if (navUserNameElement) navUserNameElement.textContent = newName;
            if (dropdownUserName) dropdownUserName.textContent = newName;

            const newInitial = newName.charAt(0).toUpperCase();
            if (!currentUser.user_metadata?.profile_picture) {
                if (profileInitial) profileInitial.textContent = newInitial;
                if (largeProfileInitial) largeProfileInitial.textContent = newInitial;
                if (dropdownProfileInitial) dropdownProfileInitial.textContent = newInitial;
            }

            Swal.fire({
                icon: "success",
                title: "Profile Updated!",
                timer: 1800,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: error.message
            });
        }
    });
}

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        const result = await Swal.fire({
            icon: "question",
            title: "Logout?",
            text: "Are you sure you want to sign out of StudentHub?",
            showCancelButton: true,
            confirmButtonText: "Logout",
            confirmButtonColor: "#e63946",
            cancelButtonText: "Cancel"
        });

        if (!result.isConfirmed) return;

        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            Swal.fire({ icon: "error", title: "Logout Failed", text: error.message });
            return;
        }

        window.location.href = "index.html";
    });
}

// Initialize on page load
loadUser();

const hamburgerBtn = document.getElementById("hamburgerBtn");
    const navLinks = document.querySelector(".nav-links");

    hamburgerBtn.addEventListener("click", function () {

        navLinks.classList.toggle("show");

        const icon = hamburgerBtn.querySelector("i");

        if (navLinks.classList.contains("show")) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-times");
        } else {
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        }
    });


    /* Close menu when a link is clicked */

    document.querySelectorAll(".nav-links a").forEach(link => {

        link.addEventListener("click", function () {

            navLinks.classList.remove("show");

            const icon = hamburgerBtn.querySelector("i");

            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        });

    });


    /* Close menu when resizing back to desktop */

    window.addEventListener("resize", function () {

        if (window.innerWidth > 900) {

            navLinks.classList.remove("show");

            const icon = hamburgerBtn.querySelector("i");

            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        }

    });