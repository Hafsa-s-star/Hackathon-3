// =========================================================
// SUPABASE
// =========================================================

const { createClient } = supabase;

const supabaseClient = createClient(
    "https://uiwmuwqarhngnhppqfqo.supabase.co",
    "sb_publishable_lXI3MvI6rVyWQKQ4P5r2ZA_zP8Ix1D7"
);


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let currentUser = null;
let currentPostBeingEdited = null;


// =========================================================
// ELEMENTS
// =========================================================

// ---------- NAVBAR ----------

const profileButton =
    document.getElementById("profileButton");

const profileDropdown =
    document.getElementById("profileDropdown");

const logoutBtn =
    document.getElementById("logoutBtn");

const editProfileBtn =
    document.getElementById("editProfileBtn");

const changePhotoBtn =
    document.getElementById("changePhotoBtn");

const profilePhotoInput =
    document.getElementById("profilePhotoInput");

const profileInitial =
    document.getElementById("profileInitial");

const profilePhotoImg =
    document.getElementById("profilePhotoImg");

const navUserName =
    document.getElementById("navUserName");

const dropdownUserName =
    document.getElementById("dropdownUserName");

const dropdownUserEmail =
    document.getElementById("dropdownUserEmail");

const dropdownProfileInitial =
    document.getElementById("dropdownProfileInitial");

const dropdownProfileImg =
    document.getElementById("dropdownProfileImg");


// ---------- COMMUNITY ----------

const createPostBtn =
    document.getElementById("createPostBtn");

const createPostCard =
    document.getElementById("createPostCard");

const cancelPostBtn =
    document.getElementById("cancelPostBtn");

const submitPostBtn =
    document.getElementById("submitPostBtn");

const postTitle =
    document.getElementById("postTitle");

const postText =
    document.getElementById("postText");

const postImage =
    document.getElementById("postImage");

const imagePreview =
    document.getElementById("imagePreview");

const postContainer =
    document.getElementById("post");

    // ---------- NOTIFICATIONS ----------

const notificationButton =
    document.getElementById("notificationButton");

const notificationBadge =
    document.getElementById("notificationBadge");

const notificationDropdown =
    document.getElementById("notificationDropdown");

const notificationList =
    document.getElementById("notificationList");

const markAllNotificationsRead =
    document.getElementById(
        "markAllNotificationsRead"
    );

// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

    setupNavbar();

    setupCommunityEvents();

    await loadUser();

});


// =========================================================
// LOAD CURRENT USER
// =========================================================

 async function loadUser() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = user;

    console.log("Current user:", currentUser);
    setupNotifications();

    // =====================================================
    // USER NAME
    // =====================================================

    const metadata = user.user_metadata || {};

    const name =
        metadata.display_name ||
        metadata.full_name ||
        metadata.first_name ||
        user.email?.split("@")[0] ||
        "Student";

    // =====================================================
    // NAVBAR NAME
    // =====================================================

    if (navUserName) {
        navUserName.textContent = name;
    }

    if (dropdownUserName) {
        dropdownUserName.textContent = name;
    }

    if (dropdownUserEmail) {
        dropdownUserEmail.textContent = user.email || "";
    }

    // =====================================================
    // INITIAL
    // =====================================================

    const initial = name.charAt(0).toUpperCase();

    if (profileInitial) {
        profileInitial.textContent = initial;
        profileInitial.style.display = "flex";
    }

    if (dropdownProfileInitial) {
        dropdownProfileInitial.textContent = initial;
        dropdownProfileInitial.style.display = "flex";
    }

    // =====================================================
    // PROFILE IMAGE
    // =====================================================

    const profileImage =
        metadata.profile_picture || "";

    if (profileImage) {

        showProfilePicture(
            profileImage + "?t=" + Date.now()
        );

    } else {

        showProfileInitials();

    }

    // =====================================================
    // CREATE POST PROFILE
    // =====================================================

    updateCreatePostProfile(
        name,
        profileImage
    );

    // =====================================================
    // LOAD POSTS
    // =====================================================

    await getPosts();
}

// =========================================================
// NAVBAR
// =========================================================

function setupNavbar() {


    // ---------- PROFILE DROPDOWN ----------

    if (profileButton) {

        profileButton.addEventListener("click", (e) => {

            e.stopPropagation();

            if (profileDropdown) {
                profileDropdown.classList.toggle("show");
            }

        });

    }


    // ---------- CLOSE DROPDOWN ----------

    document.addEventListener("click", () => {

        if (profileDropdown) {
            profileDropdown.classList.remove("show");
        }

    });


    if (profileDropdown) {

        profileDropdown.addEventListener(
            "click",
            (e) => {
                e.stopPropagation();
            }
        );

    }


    // ---------- CHANGE PHOTO ----------

    if (changePhotoBtn) {

        changePhotoBtn.addEventListener(
            "click",
            () => {

                if (profilePhotoInput) {
                    profilePhotoInput.click();
                }

            }
        );

    }


    // ---------- EDIT PROFILE ----------

    if (editProfileBtn) {

        editProfileBtn.addEventListener(
            "click",
            editProfile
        );

    }


    // ---------- PROFILE IMAGE ----------

    if (profilePhotoInput) {

        profilePhotoInput.addEventListener(
            "change",
            uploadProfilePicture
        );

    }


    // ---------- LOGOUT ----------

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logout
        );

    }

}

// =========================================================
// NOTIFICATION SYSTEM
// =========================================================

let notificationChannel = null;


// =========================================================
// SETUP NOTIFICATIONS
// =========================================================

function setupNotifications() {

    if (!currentUser) {
        return;
    }


    // ---------- OPEN / CLOSE DROPDOWN ----------

    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                if (notificationDropdown) {

                    notificationDropdown.classList.toggle(
                        "show"
                    );

                }

            }
        );

    }


    // ---------- PREVENT CLOSE INSIDE DROPDOWN ----------

    if (notificationDropdown) {

        notificationDropdown.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

            }
        );

    }


    // ---------- CLOSE WHEN CLICKING OUTSIDE ----------

    document.addEventListener(
        "click",
        () => {

            if (notificationDropdown) {

                notificationDropdown.classList.remove(
                    "show"
                );

            }

        }
    );


    // ---------- MARK ALL ----------

    if (markAllNotificationsRead) {

        markAllNotificationsRead.addEventListener(
            "click",
            markAllNotificationsAsRead
        );

    }


    // ---------- LOAD ----------

    loadNotifications();


    // ---------- REALTIME ----------

    subscribeToNotifications();

}


// =========================================================
// LOAD NOTIFICATIONS
// =========================================================

async function loadNotifications() {

    if (!currentUser) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("notifications")
            .select("*")
            .eq(
                "recipient_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(50);


    if (error) {

        console.error(
            "Notification loading error:",
            error
        );

        return;
    }


    renderNotifications(data || []);

}


// =========================================================
// RENDER NOTIFICATIONS
// =========================================================

function renderNotifications(
    notifications
) {

    if (!notificationList) {
        return;
    }


    notificationList.innerHTML = "";


    if (
        !notifications ||
        notifications.length === 0
    ) {

        notificationList.innerHTML = `
            <div class="notification-empty">

                <i class="bi bi-bell-slash"></i>

                <p>
                    No notifications yet
                </p>

            </div>
        `;

        updateNotificationBadge([]);

        return;
    }


    notifications.forEach(
        notification => {

            const item =
                createNotificationElement(
                    notification
                );

            notificationList.appendChild(
                item
            );

        }
    );


    updateNotificationBadge(
        notifications
    );

}


// =========================================================
// CREATE NOTIFICATION ELEMENT
// =========================================================

function createNotificationElement(
    notification
) {

    const item =
        document.createElement("div");


    item.className =
        "notification-item";


    if (!notification.is_read) {

        item.classList.add(
            "unread"
        );

    }


    const icon =
        getNotificationIcon(
            notification.type
        );


    item.innerHTML = `

        <div class="notification-icon">

            <i class="${icon}"></i>

        </div>


        <div class="notification-content">

            <p class="notification-message">
                ${escapeHtml(
                    notification.message
                )}
            </p>

            <div class="notification-time">
                ${formatTime(
                    notification.created_at
                )}
            </div>

        </div>


        ${
            !notification.is_read
                ? `
                    <span
                        class="notification-unread-dot"
                    ></span>
                  `
                : ""
        }

    `;


    item.addEventListener(
        "click",
        async () => {

            await markNotificationAsRead(
                notification.id
            );


            // If notification belongs to a post,
            // scroll to that post.

            if (notification.post_id) {

                const post =
                    document.querySelector(
                        `.post-card[data-id="${notification.post_id}"]`
                    );


                if (post) {

                    post.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }

            }

        }
    );


    return item;

}


// =========================================================
// NOTIFICATION ICON
// =========================================================

function getNotificationIcon(
    type
) {

    switch (type) {

        case "like":

            return "bi bi-heart-fill";


        case "comment":

            return "bi bi-chat-fill";


        case "event_join":

            return "bi bi-calendar-check";


        case "announcement":

            return "bi bi-megaphone-fill";


        default:

            return "bi bi-bell-fill";

    }

}


// =========================================================
// UPDATE BADGE
// =========================================================

function updateNotificationBadge(
    notifications
) {

    if (!notificationBadge) {
        return;
    }


    const unreadCount =
        notifications.filter(
            notification =>
                !notification.is_read
        ).length;


    if (unreadCount <= 0) {

        notificationBadge.style.display =
            "none";

        notificationBadge.textContent =
            "";

        return;

    }


    notificationBadge.style.display =
        "flex";


    notificationBadge.textContent =
        unreadCount > 99
            ? "99+"
            : unreadCount;

}


// =========================================================
// MARK ONE AS READ
// =========================================================

async function markNotificationAsRead(
    notificationId
) {

    if (!currentUser) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("notifications")
            .update({
                is_read: true
            })
            .eq(
                "id",
                notificationId
            )
            .eq(
                "recipient_id",
                currentUser.id
            );


    if (error) {

        console.error(
            "Mark notification error:",
            error
        );

        return;
    }


    await loadNotifications();

}


// =========================================================
// MARK ALL AS READ
// =========================================================

async function markAllNotificationsAsRead() {

    if (!currentUser) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("notifications")
            .update({
                is_read: true
            })
            .eq(
                "recipient_id",
                currentUser.id
            )
            .eq(
                "is_read",
                false
            );


    if (error) {

        console.error(
            "Mark all notifications error:",
            error
        );

        return;
    }


    await loadNotifications();

}


// =========================================================
// REALTIME NOTIFICATIONS
// =========================================================

function subscribeToNotifications() {

    if (!currentUser) {
        return;
    }


    // Remove previous channel if any

    if (notificationChannel) {

        supabaseClient
            .removeChannel(
                notificationChannel
            );

    }


    notificationChannel =
        supabaseClient
            .channel(
                `notifications-${currentUser.id}`
            )


            .on(
                "postgres_changes",
                {
                    event: "INSERT",

                    schema: "public",

                    table: "notifications",

                    filter:
                        `recipient_id=eq.${currentUser.id}`
                },

                async () => {

                    await loadNotifications();

                }
            )


            .on(
                "postgres_changes",
                {
                    event: "UPDATE",

                    schema: "public",

                    table: "notifications",

                    filter:
                        `recipient_id=eq.${currentUser.id}`
                },

                async () => {

                    await loadNotifications();

                }
            )


            .subscribe();

}

// =========================================================
// SHOW PROFILE PICTURE
// =========================================================
 function showProfilePicture(imageUrl) {

    // Navbar
    if (profilePhotoImg) {
        profilePhotoImg.src = imageUrl;
        profilePhotoImg.style.display = "block";
    }

    // Dropdown
    if (dropdownProfileImg) {
        dropdownProfileImg.src = imageUrl;
        dropdownProfileImg.style.display = "block";
    }

    // Hide initials
    if (profileInitial) {
        profileInitial.style.display = "none";
    }

    if (dropdownProfileInitial) {
        dropdownProfileInitial.style.display = "none";
    }

    // Create post profile
    const createProfileInitial =
        document.querySelector(
            "#createPostCard .post-user-initial"
        );

    const createProfileImage =
        document.querySelector(
            "#createPostCard .post-user-image"
        );

    if (createProfileImage) {
        createProfileImage.src = imageUrl;
        createProfileImage.style.display = "block";
    }

    if (createProfileInitial) {
        createProfileInitial.style.display = "none";
    }
}

// =========================================================
// SHOW PROFILE INITIALS
// =========================================================

function showProfileInitials() {

    if (profilePhotoImg) {
        profilePhotoImg.src = "";
        profilePhotoImg.style.display = "none";
    }

    if (dropdownProfileImg) {
        dropdownProfileImg.src = "";
        dropdownProfileImg.style.display = "none";
    }

    if (profileInitial) {
        profileInitial.style.display = "flex";
    }

    if (dropdownProfileInitial) {
        dropdownProfileInitial.style.display = "flex";
    }
}


// =========================================================
// UPDATE CREATE POST PROFILE
// =========================================================

function updateCreatePostProfile(name, imageUrl) {

    const createProfileInitial =
        document.querySelector(
            "#createPostCard .post-user-initial"
        );

    const createProfileImage =
        document.querySelector(
            "#createPostCard .post-user-image"
        );

    const initial =
        name?.charAt(0).toUpperCase() || "U";

    if (createProfileInitial) {
        createProfileInitial.textContent = initial;

        createProfileInitial.style.display =
            imageUrl ? "none" : "flex";
    }

    if (createProfileImage) {

        if (imageUrl) {

            createProfileImage.src =
                imageUrl + "?t=" + Date.now();

            createProfileImage.style.display =
                "block";

        } else {

            createProfileImage.src = "";

            createProfileImage.style.display =
                "none";
        }
    }
}

// =========================================================
// UPLOAD PROFILE PICTURE
// =========================================================

async function uploadProfilePicture(event) {

    const file =
        event.target.files[0];


    if (!file || !currentUser) {
        return;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

        Swal.fire({
            icon: "error",
            title: "Invalid Image",
            text: "Please select JPG, PNG or WEBP."
        });

        event.target.value = "";

        return;
    }


    if (file.size > 5 * 1024 * 1024) {

        Swal.fire({
            icon: "error",
            title: "Image Too Large",
            text: "Maximum size is 5MB."
        });

        event.target.value = "";

        return;
    }


    try {

        Swal.fire({
            title: "Uploading...",
            text: "Please wait.",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });


        const filePath =
            `profiles/${currentUser.id}/avatar`;


        const { error: uploadError } =
            await supabaseClient
                .storage
                .from("avatars")
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: true,
                        contentType: file.type
                    }
                );


        if (uploadError) {
            throw uploadError;
        }


        const {
            data: publicUrlData
        } =
            supabaseClient
                .storage
                .from("avatars")
                .getPublicUrl(filePath);


        const imageUrl =
            publicUrlData.publicUrl;


        const {
            data,
            error: updateError
        } =
            await supabaseClient.auth.updateUser({

                data: {
                    profile_picture: imageUrl
                }

            });


        if (updateError) {
            throw updateError;
        }


        currentUser = data.user;

        // =====================================================
// UPDATE PROFILE PICTURE IN ALL USER POSTS
// =====================================================

await supabaseClient
    .from("my-posts")
    .update({
        profile_picture: imageUrl
    })
    .eq("user_id", currentUser.id);


// =====================================================
// UPDATE PROFILE PICTURE IN ALL USER COMMENTS
// =====================================================

await supabaseClient
    .from("post_comments")
    .update({
        profile_picture: imageUrl
    })
    .eq("user_id", currentUser.id);


        showProfilePicture(
            imageUrl + "?t=" + Date.now()
        );


        Swal.fire({
            icon: "success",
            title: "Profile Picture Updated!",
            timer: 1500,
            showConfirmButton: false
        });


        event.target.value = "";


    } catch (error) {

        console.error(error);

        Swal.fire({
            icon: "error",
            title: "Upload Failed",
            text: error.message
        });

    }

}


// =========================================================
// EDIT PROFILE
// =========================================================

async function editProfile() {

    if (!currentUser) {
        return;
    }


    const currentName =
        currentUser.user_metadata?.display_name ||
        currentUser.user_metadata?.full_name ||
        "";


    const result =
        await Swal.fire({

            title: "Edit Profile",

            html: `
                <input
                    id="editName"
                    class="swal2-input"
                    placeholder="Your name"
                    value="${escapeHtml(currentName)}"
                >
            `,

            showCancelButton: true,

            confirmButtonText: "Save Changes",

            cancelButtonText: "Cancel",

            focusConfirm: false,

            preConfirm: () => {

                const input =
                    document.getElementById("editName");

                const name =
                    input.value.trim();


                if (!name) {

                    Swal.showValidationMessage(
                        "Please enter your name."
                    );

                    return false;
                }


                return name;
            }

        });


    if (!result.isConfirmed) {
        return;
    }


    const newName =
        result.value;


    const {
        data,
        error
    } =
        await supabaseClient.auth.updateUser({

            data: {
                display_name: newName
            }

        });


    if (error) {

        Swal.fire({
            icon: "error",
            title: "Update Failed",
            text: error.message
        });

        return;
    }


    currentUser = data.user;


    if (navUserName) {
        navUserName.textContent = newName;
    }


    if (dropdownUserName) {
        dropdownUserName.textContent = newName;
    }


    const initial =
        newName.charAt(0).toUpperCase();


    if (profileInitial) {
        profileInitial.textContent = initial;
    }


    if (dropdownProfileInitial) {
        dropdownProfileInitial.textContent = initial;
    }


    Swal.fire({
        icon: "success",
        title: "Profile Updated!",
        timer: 1300,
        showConfirmButton: false
    });


    await getPosts();

}


// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    const result =
        await Swal.fire({

            icon: "question",

            title: "Logout?",

            text: "Are you sure you want to logout?",

            showCancelButton: true,

            confirmButtonText: "Logout",

            cancelButtonText: "Cancel"

        });


    if (!result.isConfirmed) {
        return;
    }


    const { error } =
        await supabaseClient.auth.signOut();


    if (error) {

        Swal.fire({
            icon: "error",
            title: "Logout Failed",
            text: error.message
        });

        return;
    }


    window.location.href =
        "index.html";

}


// =========================================================
// COMMUNITY EVENTS
// =========================================================

function setupCommunityEvents() {


    // ---------- CREATE POST BUTTON ----------

    if (createPostBtn) {

        createPostBtn.addEventListener(
            "click",
            () => {

                createPostCard.classList.remove("hidden");

                createPostBtn.style.display = "none";

                if (postTitle) {
                    postTitle.focus();
                }

            }
        );

    }


    // ---------- CANCEL ----------

    if (cancelPostBtn) {

        cancelPostBtn.addEventListener(
            "click",
            resetPostForm
        );

    }


    // ---------- SUBMIT ----------

    if (submitPostBtn) {

        submitPostBtn.addEventListener(
            "click",
            createOrUpdatePost
        );

    }


    // ---------- IMAGE ----------

    if (postImage) {

        postImage.addEventListener(
            "change",
            previewPostImage
        );

    }

}


// =========================================================
// RESET POST FORM
// =========================================================

function resetPostForm() {

    currentPostBeingEdited = null;


    if (postTitle) {
        postTitle.value = "";
    }


    if (postText) {
        postText.value = "";
    }


    if (postImage) {
        postImage.value = "";
    }


    if (imagePreview) {
        imagePreview.innerHTML = "";
    }


    if (submitPostBtn) {

        submitPostBtn.innerHTML =
            `<i class="bi bi-send"></i> Post`;

    }


    if (createPostCard) {
        createPostCard.classList.add("hidden");
    }


    if (createPostBtn) {
        createPostBtn.style.display = "";
    }

}


// =========================================================
// IMAGE PREVIEW
// =========================================================

function previewPostImage() {

    const file =
        postImage.files[0];


    if (!file) {

        imagePreview.innerHTML = "";

        return;
    }


    if (!file.type.startsWith("image/")) {

        Swal.fire({
            icon: "error",
            title: "Invalid image"
        });

        postImage.value = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload = (event) => {

        imagePreview.innerHTML = `
            <img
                src="${event.target.result}"
                class="bg-img selectedImg"
                alt="Preview"
            >
        `;

    };


    reader.readAsDataURL(file);

}


// =========================================================
// CREATE / UPDATE POST
// =========================================================

async function createOrUpdatePost() {

    if (!currentUser) {

        Swal.fire({
            icon: "error",
            title: "Please login first."
        });

        return;
    }


    const title =
        postTitle?.value.trim() || "";


    const description =
        postText?.value.trim() || "";


    if (!title) {

        Swal.fire({
            icon: "warning",
            title: "Title Required",
            text: "Please enter a post title."
        });

        postTitle.focus();

        return;
    }


    if (!description) {

        Swal.fire({
            icon: "warning",
            title: "Post Required",
            text: "Please write something."
        });

        postText.focus();

        return;
    }


    try {

        submitPostBtn.disabled = true;


        // =================================================
        // USER INFORMATION
        // =================================================

        const metadata =
            currentUser.user_metadata || {};


        const name =
            metadata.display_name ||
            metadata.full_name ||
            metadata.first_name ||
            currentUser.email?.split("@")[0] ||
            "Student";


        const role =
            metadata.role ||
            "student";

        const profilePicture =
            metadata.profile_picture || "";


        // =================================================
        // IMAGE
        // =================================================

        let imageUrl = "";


        const imageFile =
            postImage?.files?.[0];


        if (imageFile) {

            const extension =
                imageFile.name.split(".").pop();


            const fileName =
                `${currentUser.id}/${Date.now()}.${extension}`;


            const {
                error: uploadError
            } =
                await supabaseClient
                    .storage
                    .from("post-images")
                    .upload(
                        fileName,
                        imageFile,
                        {
                            cacheControl: "3600",
                            upsert: false,
                            contentType: imageFile.type
                        }
                    );


            if (uploadError) {
                throw uploadError;
            }


            const {
                data: imageData
            } =
                supabaseClient
                    .storage
                    .from("post-images")
                    .getPublicUrl(fileName);


            imageUrl =
                imageData.publicUrl;

        }


        // =================================================
        // UPDATE EXISTING POST
        // =================================================

        if (currentPostBeingEdited) {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("my-posts")
                    .update({

                        title: title,

                        description: description,

                        background:
                            imageUrl ||
                            currentPostBeingEdited.background,

                        name: name,

                        email:
                            currentUser.email,

                        role: role,
                        profile_picture: profilePicture

                    })

                    .eq(
                        "id",
                        currentPostBeingEdited.id
                    )

                    .eq(
                        "user_id",
                        currentUser.id
                    )

                    .select()
                    .single();


            if (error) {
                throw error;
            }


            // =================================================
            // IMPORTANT:
            // UPDATE THE EXISTING CARD
            // NOT CREATE ANOTHER CARD
            // =================================================

            updateExistingPostCard(data);


            resetPostForm();


            Swal.fire({
                icon: "success",
                title: "Post Updated!",
                timer: 1200,
                showConfirmButton: false
            });


            return;
        }


        // =================================================
        // CREATE NEW POST
        // =================================================

        const {
            data,
            error
        } =
            await supabaseClient
                .from("my-posts")
                .insert({

                    user_id:
                        currentUser.id,

                    name:
                        name,

                    email:
                        currentUser.email,

                    role:
                        role,

                    profile_picture:
                        profilePicture,

                    title:
                        title,

                    description:
                        description,

                    background:
                        imageUrl,





                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        // =================================================
        // ADD NEW CARD ONLY
        // =================================================

        await renderSinglePost(data);


        resetPostForm();


        Swal.fire({
            icon: "success",
            title: "Post Created!",
            timer: 1200,
            showConfirmButton: false
        });


    } catch (error) {

        console.error(
            "Post Error:",
            error
        );


        Swal.fire({
            icon: "error",
            title: "Something went wrong",
            text: error.message
        });


    } finally {

        submitPostBtn.disabled = false;

    }

}


// =========================================================
// GET ALL POSTS
// =========================================================

async function getPosts() {

    if (!postContainer) {
        return;
    }


    postContainer.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <p class="mt-3 text-muted">
                Loading posts...
            </p>
        </div>
    `;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("my-posts")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);


        postContainer.innerHTML = `
            <div class="text-center py-5">
                <p class="text-danger">
                    Failed to load posts.
                </p>
            </div>
        `;

        return;
    }


    if (!data || data.length === 0) {

        postContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-chat-square-text fs-1 text-muted"></i>

                <h4 class="mt-3">
                    No Posts Yet
                </h4>

                <p class="text-muted">
                    Be the first student to share something!
                </p>
            </div>
        `;

        return;
    }


    postContainer.innerHTML = "";


    // =====================================================
    // LOAD POSTS
    // =====================================================

    for (const post of data) {

        await renderSinglePost(post);

    }

}


// =========================================================
// RENDER SINGLE POST
// =========================================================

async function renderSinglePost(postData) {

    if (!postContainer) {
        return;
    }


    const template =
        document.getElementById(
            "postTemplate"
        );


    if (!template) {

        console.error(
            "postTemplate not found."
        );

        return;
    }


    const clone =
        template.content.cloneNode(true);


    const card =
        clone.querySelector(".post-card");


    // =====================================================
    // DATA
    // =====================================================

    card.dataset.id =
        postData.id;

    card.dataset.userid =
        postData.user_id;


    card.dataset.background =
        postData.background || "";


    // =====================================================
    // USER
    // =====================================================

     // =====================================================
// USER PROFILE
// =====================================================

const name =
    postData.name ||
    postData.email?.split("@")[0] ||
    "Student";

const initial =
    name.charAt(0).toUpperCase();

const userImage =
    card.querySelector(".post-user-image");

const userInitial =
    card.querySelector(".post-user-initial");


// =====================================================
// PROFILE IMAGE
// =====================================================

if (
    postData.profile_picture &&
    postData.profile_picture.trim() !== ""
) {

    userImage.src =
        postData.profile_picture +
        "?t=" +
        Date.now();

    userImage.style.display = "block";

    if (userInitial) {
        userInitial.style.display = "none";
    }

} else {

    userImage.src = "";

    userImage.style.display = "none";

    if (userInitial) {

        userInitial.textContent =
            initial;

        userInitial.style.display =
            "flex";
    }
}


    // =====================================================
    // PROFILE IMAGE
    // =====================================================

     // =====================================================
// PROFILE IMAGE
// =====================================================

const userImageInput =
    card.querySelector(".post-user-image");

const userInitialInput =
    card.querySelector(".post-user-initial");

if (postData.profile_picture) {

    userImageInput.src =
        postData.profile_picture + "?t=" + Date.now();

    userImageInput.style.display = "block";

    if (userInitialInput) {
        userInitialInput.style.display = "none";
    }

} else {

    userImageInput.style.display = "none";

    if (userInitialInput) {
        userInitialInput.style.display = "flex";
    }

}

    // =====================================================
    // HEADER
    // =====================================================

    card.querySelector(
        ".name-time"
    ).textContent =
        name;


    card.querySelector(
        ".time"
    ).textContent =
        formatTime(postData.created_at);


    // =====================================================
    // TITLE
    // =====================================================

    let titleElement =
        card.querySelector(
            ".post-title"
        );


    if (!titleElement) {

        const content =
            card.querySelector(
                ".post-content"
            );


        titleElement =
            document.createElement("h3");

        titleElement.className =
            "post-title";


        content.insertBefore(
            titleElement,
            content.firstChild
        );

    }


    titleElement.textContent =
        postData.title || "";


    // =====================================================
    // DESCRIPTION
    // =====================================================

    card.querySelector(
        ".post-text"
    ).textContent =
        postData.description || "";


    // =====================================================
    // IMAGE
    // =====================================================

    const imageWrapper =
        card.querySelector(
            ".post-image-wrapper"
        );


    const image =
        card.querySelector(
            ".post-image"
        );


    if (postData.background) {

        image.src =
            postData.background;

        imageWrapper.style.display =
            "block";

    } else {

        imageWrapper.style.display =
            "none";

    }


    // =====================================================
    // SHOW EDIT / DELETE ONLY FOR OWNER
    // =====================================================

    const editBtn =
        card.querySelector(
            ".editBtn"
        );


    const deleteBtn =
        card.querySelector(
            ".deleteBtn"
        );


    if (
        currentUser &&
        postData.user_id === currentUser.id
    ) {

        editBtn.style.display =
            "block";

        deleteBtn.style.display =
            "block";

    } else {

        editBtn.style.display =
            "none";

        deleteBtn.style.display =
            "none";

    }


    // =====================================================
    // EVENTS
    // =====================================================

    editBtn.addEventListener(
        "click",
        () => startEditPost(postData, card)
    );


    deleteBtn.addEventListener(
        "click",
        () => deletePost(postData.id, card)
    );


    const likeBtn =
        card.querySelector(
            ".likeBtn"
        );


    likeBtn.addEventListener(
        "click",
        () => toggleLike(postData.id, card)
    );


    const commentBtn =
        card.querySelector(
            ".commentBtn"
        );


    commentBtn.addEventListener(
        "click",
        () => {

            const section =
                card.querySelector(
                    ".comments-section"
                );


            section.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });


            const input =
                card.querySelector(
                    ".comment-input"
                );


            if (input) {
                input.focus();
            }

        }
    );


    const commentSubmit =
        card.querySelector(
            ".comment-submit"
        );


    commentSubmit.addEventListener(
        "click",
        () => addComment(postData.id, card)
    );


    const commentInput =
        card.querySelector(
            ".comment-input"
        );


    commentInput.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                event.preventDefault();

                addComment(
                    postData.id,
                    card
                );

            }

        }
    );


    const commentCountBtn =
        card.querySelector(
            ".comment-count-btn"
        );


    commentCountBtn.addEventListener(
        "click",
        () => {

            card.querySelector(
                ".comments-section"
            ).scrollIntoView({
                behavior: "smooth"
            });

        }
    );


    // =====================================================
    // LOAD LIKES / COMMENTS
    // =====================================================

    await loadLikeData(
        postData.id,
        card
    );

    // =====================================================
// CURRENT USER COMMENT PROFILE
// =====================================================

const commentProfileInitial =
    card.querySelector(
        ".comment-input-wrapper .comment-user-initial"
    );

const commentProfileImage =
    card.querySelector(
        ".comment-input-wrapper .comment-user-image"
    );


const currentMetadata =
    currentUser?.user_metadata || {};

const currentName =
    currentMetadata.display_name ||
    currentMetadata.full_name ||
    currentMetadata.first_name ||
    currentUser?.email?.split("@")[0] ||
    "Student";


const currentInitial =
    currentName.charAt(0).toUpperCase();


const currentProfilePicture =
    currentMetadata.profile_picture ||
    "";


if (
    currentProfilePicture &&
    currentProfilePicture.trim() !== ""
) {

    commentProfileImage.src =
        currentProfilePicture +
        "?t=" +
        Date.now();

    commentProfileImage.style.display =
        "block";

    commentProfileInitial.style.display =
        "none";

} else {

    commentProfileImage.src = "";

    commentProfileImage.style.display =
        "none";

    commentProfileInitial.textContent =
        currentInitial;

    commentProfileInitial.style.display =
        "flex";
}

    await loadComments(
        postData.id,
        card
    );


    postContainer.appendChild(card);

}


// =========================================================
// UPDATE EXISTING CARD
// =========================================================

function updateExistingPostCard(postData) {

    const card =
        postContainer.querySelector(
            `.post-card[data-id="${postData.id}"]`
        );


    if (!card) {

        console.log(
            "Existing card not found. Reloading posts."
        );

        getPosts();

        return;
    }


    card.dataset.background =
        postData.background || "";


    const title =
        card.querySelector(
            ".post-title"
        );


    if (title) {
        title.textContent =
            postData.title || "";
    }


    const description =
        card.querySelector(
            ".post-text"
        );


    if (description) {
        description.textContent =
            postData.description || "";
    }


    const imageWrapper =
        card.querySelector(
            ".post-image-wrapper"
        );


    const image =
        card.querySelector(
            ".post-image"
        );


    if (postData.background) {

        image.src =
            postData.background;

        imageWrapper.style.display =
            "block";

    } else {

        imageWrapper.style.display =
            "none";

    }


    // Scroll to updated card

    card.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// =========================================================
// START EDIT
// =========================================================

function startEditPost(postData) {

    if (
        !currentUser ||
        postData.user_id !== currentUser.id
    ) {

        Swal.fire({
            icon: "error",
            title: "Not Allowed",
            text: "You can only edit your own post."
        });

        return;
    }


    currentPostBeingEdited =
        postData;


    createPostCard.classList.remove(
        "hidden"
    );


    createPostBtn.style.display =
        "none";


    postTitle.value =
        postData.title || "";


    postText.value =
        postData.description || "";


    submitPostBtn.innerHTML =
        `<i class="bi bi-check-lg"></i> Update Post`;


    createPostCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// =========================================================
// DELETE POST
// =========================================================

async function deletePost(
    postId,
    card
) {

    if (!currentUser) {
        return;
    }


    const result =
        await Swal.fire({

            icon: "warning",

            title: "Delete Post?",

            text: "This post will be permanently deleted.",

            showCancelButton: true,

            confirmButtonText: "Delete",

            cancelButtonText: "Cancel"

        });


    if (!result.isConfirmed) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("my-posts")
                .delete()
                .eq(
                    "id",
                    postId
                )
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error) {
            throw error;
        }


        // REMOVE ONLY THIS CARD

        card.remove();


        Swal.fire({
            icon: "success",
            title: "Deleted!",
            timer: 1000,
            showConfirmButton: false
        });


    } catch (error) {

        Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: error.message
        });

    }

}


// =========================================================
// LIKE SYSTEM
// =========================================================

async function loadLikeData(
    postId,
    card
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("post_likes")
            .select("user_id")
            .eq(
                "post_id",
                postId
            );


    if (error) {

        console.error(
            "Like loading error:",
            error
        );

        return;
    }


    const likeCount =
        card.querySelector(
            ".like-count"
        );


    const likeBtn =
        card.querySelector(
            ".likeBtn"
        );


    const liked =
        data.some(
            like =>
                like.user_id ===
                currentUser?.id
        );


    likeCount.textContent =
        data.length;


    if (liked) {

        likeBtn.classList.add(
            "liked"
        );


        likeBtn.querySelector(
            "i"
        ).className =
            "bi bi-heart-fill";

    } else {

        likeBtn.classList.remove(
            "liked"
        );


        likeBtn.querySelector(
            "i"
        ).className =
            "bi bi-heart";

    }

}


// =========================================================
// TOGGLE LIKE
// =========================================================

async function toggleLike(
    postId,
    card
) {

    if (!currentUser) {
        return;
    }


    const likeBtn =
        card.querySelector(
            ".likeBtn"
        );


    const liked =
        likeBtn.classList.contains(
            "liked"
        );


    likeBtn.disabled =
        true;


    try {

        if (liked) {

            // REMOVE LIKE

            const {
                error
            } =
                await supabaseClient
                    .from("post_likes")
                    .delete()
                    .eq(
                        "post_id",
                        postId
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    );


            if (error) {
                throw error;
            }


        }  else {

    // =====================================================
    // ADD LIKE
    // =====================================================

    const {
        error
    } =
        await supabaseClient
            .from("post_likes")
            .insert({

                post_id:
                    postId,

                user_id:
                    currentUser.id

            });


    if (error) {
        throw error;
    }


    // =====================================================
    // GET POST OWNER
    // =====================================================

    const {
        data: post,
        error: postError
    } =
        await supabaseClient
            .from("my-posts")
            .select("user_id")
            .eq(
                "id",
                postId
            )
            .single();


    if (postError) {

        console.error(
            "Post owner error:",
            postError
        );

    } else if (
        post &&
        post.user_id !== currentUser.id
    ) {

        // =================================================
        // CURRENT USER NAME
        // =================================================

        const metadata =
            currentUser.user_metadata || {};


        const senderName =
            metadata.display_name ||
            metadata.full_name ||
            metadata.first_name ||
            currentUser.email?.split("@")[0] ||
            "Someone";


        // =================================================
        // CREATE NOTIFICATION
        // =================================================

        const {
            error: notificationError
        } =
            await supabaseClient
                .from("notifications")
                .insert({

                    recipient_id:
                        post.user_id,

                    sender_id:
                        currentUser.id,

                    type:
                        "like",

                    message:
                        `${senderName} liked your post.`,

                    post_id:
                        postId

                });


        if (notificationError) {

            console.error(
                "Like notification error:",
                notificationError
            );

        }

    }

}


        await loadLikeData(
            postId,
            card
        );


    } catch (error) {

        console.error(
            "Like error:",
            error
        );


        Swal.fire({
            icon: "error",
            title: "Like Failed",
            text: error.message
        });


    } finally {

        likeBtn.disabled =
            false;

    }

}


// =========================================================
// COMMENTS
// =========================================================

async function loadComments(
    postId,
    card
) {

    const commentsList =
        card.querySelector(
            ".comments-list"
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("post_comments")
            .select("*")
            .eq(
                "post_id",
                postId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Comments error:",
            error
        );

        return;
    }


    commentsList.innerHTML = "";


    data.forEach(
        comment => {

            renderComment(
                comment,
                commentsList
            );

        }
    );


    card.querySelector(
        ".comment-count"
    ).textContent =
        data.length;

}


// =========================================================
// ADD COMMENT
// =========================================================

 async function addComment(postId, card) {

    if (!currentUser) {
        return;
    }

    const input =
        card.querySelector(".comment-input");

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    const metadata =
        currentUser.user_metadata || {};

    const name =
        metadata.display_name ||
        metadata.full_name ||
        metadata.first_name ||
        currentUser.email?.split("@")[0] ||
        "Student";

    const role =
        metadata.role ||
        "student";

    const profilePicture =
        metadata.profile_picture ||
        "";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("post_comments")
            .insert({

                post_id:
                    postId,

                user_id:
                    currentUser.id,

                user_name:
                    name,

                user_email:
                    currentUser.email,

                user_role:
                    role,

                profile_picture:
                    profilePicture,

                comment:
                    text

            })
            .select()
            .single();


    if (error) {

        console.error(
            "Comment error:",
            error
        );

        Swal.fire({
            icon: "error",
            title: "Comment Failed",
            text: error.message
        });

        return;
    }

    // =====================================================
// GET POST OWNER
// =====================================================

const {
    data: post,
    error: postError
} =
    await supabaseClient
        .from("my-posts")
        .select("user_id")
        .eq(
            "id",
            postId
        )
        .single();


if (postError) {

    console.error(
        "Post owner error:",
        postError
    );

} else if (
    post &&
    post.user_id !== currentUser.id
) {

    // =================================================
    // CURRENT USER NAME
    // =================================================

    const senderName =
        name;


    // =================================================
    // CREATE COMMENT NOTIFICATION
    // =================================================

    const {
        error: notificationError
    } =
        await supabaseClient
            .from("notifications")
            .insert({

                recipient_id:
                    post.user_id,

                sender_id:
                    currentUser.id,

                type:
                    "comment",

                message:
                    `${senderName} commented on your post.`,

                post_id:
                    postId,

                comment_id:
                    data.id

            });


    if (notificationError) {

        console.error(
            "Comment notification error:",
            notificationError
        );

    }

}


    input.value = "";


    const commentsList =
        card.querySelector(
            ".comments-list"
        );


    renderComment(
        data,
        commentsList
    );


    const count =
        card.querySelector(
            ".comment-count"
        );


    count.textContent =
        parseInt(
            count.textContent || 0
        ) + 1;

}

// =========================================================
// RENDER COMMENT
// =========================================================

 function renderComment(comment, container) {

    const template =
        document.getElementById(
            "commentTemplate"
        );

    if (!template) {
        return;
    }


    const clone =
        template.content.cloneNode(true);


    const commentElement =
        clone.querySelector(".comment");


    const name =
        comment.user_name ||
        comment.user_email?.split("@")[0] ||
        "Student";


    const initial =
        name.charAt(0).toUpperCase();


    // =====================================================
    // COMMENT NAME
    // =====================================================

    commentElement
        .querySelector(
            ".comment-user-name"
        )
        .textContent =
        name;


    // =====================================================
    // COMMENT TEXT
    // =====================================================

    commentElement
        .querySelector(
            ".comment-text"
        )
        .textContent =
        comment.comment;


    // =====================================================
    // COMMENT TIME
    // =====================================================

    commentElement
        .querySelector(
            ".comment-time"
        )
        .textContent =
        formatTime(
            comment.created_at
        );


    commentElement.dataset.id =
        comment.id;


    // =====================================================
    // COMMENT PROFILE
    // =====================================================

    const initialElement =
        commentElement.querySelector(
            ".comment-user-initial"
        );

    const imageElement =
        commentElement.querySelector(
            ".comment-user-image"
        );


    if (
        comment.profile_picture &&
        comment.profile_picture.trim() !== ""
    ) {

        imageElement.src =
            comment.profile_picture +
            "?t=" +
            Date.now();

        imageElement.style.display =
            "block";


        if (initialElement) {
            initialElement.style.display =
                "none";
        }

    } else {

        imageElement.src = "";

        imageElement.style.display =
            "none";


        if (initialElement) {

            initialElement.textContent =
                initial;

            initialElement.style.display =
                "flex";
        }
    }


    // =====================================================
    // DELETE OWN COMMENT
    // =====================================================

    const deleteBtn =
        commentElement.querySelector(
            ".comment-delete-btn"
        );


    if (
        currentUser &&
        comment.user_id === currentUser.id
    ) {

        deleteBtn.style.display =
            "block";


        deleteBtn.addEventListener(
            "click",
            () =>
                deleteComment(
                    comment.id,
                    commentElement
                )
        );

    } else {

        deleteBtn.style.display =
            "none";

    }


    // =====================================================
    // ADD TO COMMENTS
    // =====================================================

    container.appendChild(
        commentElement
    );
}


// =========================================================
// DELETE COMMENT
// =========================================================

async function deleteComment(
    commentId,
    commentElement
) {

    const {
        error
    } =
        await supabaseClient
            .from("post_comments")
            .delete()
            .eq(
                "id",
                commentId
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: error.message
        });

        return;
    }


    commentElement.remove();


    const card =
        commentElement.closest(
            ".post-card"
        );


    if (card) {

        const count =
            card.querySelector(
                ".comment-count"
            );


        count.textContent =
            Math.max(
                0,
                parseInt(
                    count.textContent || 0
                ) - 1
            );

    }

}


// =========================================================
// TIME FORMAT
// =========================================================

function formatTime(date) {

    if (!date) {
        return "Just now";
    }


    const value =
        new Date(date);


    const now =
        new Date();


    const difference =
        Math.floor(
            (now - value) / 1000
        );


    if (difference < 60) {
        return "Just now";
    }


    if (difference < 3600) {

        return `${Math.floor(
            difference / 60
        )}m ago`;

    }


    if (difference < 86400) {

        return `${Math.floor(
            difference / 3600
        )}h ago`;

    }


    if (difference < 604800) {

        return `${Math.floor(
            difference / 86400
        )}d ago`;

    }


    return value.toLocaleDateString();

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}