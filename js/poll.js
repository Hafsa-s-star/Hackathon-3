// =========================================================
// SUPABASE
// =========================================================

const { createClient } = supabase;


// USE THE SAME SUPABASE URL + PUBLISHABLE KEY
// THAT YOU ARE ALREADY USING IN COMMUNITY.JS

const supabaseClient = createClient(
    "https://uiwmuwqarhngnhppqfqo.supabase.co",
    "sb_publishable_lXI3MvI6rVyWQKQ4P5r2ZA_zP8Ix1D7"
);


// =========================================================
// GLOBAL VARIABLES
// =========================================================

let currentUser = null;

let selectedOptions = {};

let allPolls = [];


// =========================================================
// DOM
// =========================================================

const pollList =
    document.getElementById("pollList");

const pollLoading =
    document.getElementById("pollLoading");

const noPolls =
    document.getElementById("noPolls");

const createPollBtn =
    document.getElementById("createPollBtn");

const emptyCreatePollBtn =
    document.getElementById("emptyCreatePollBtn");

const createPollCard =
    document.getElementById("createPollCard");

const cancelPollBtn =
    document.getElementById("cancelPollBtn");

const createPollSubmit =
    document.getElementById("createPollSubmit");

const addOptionBtn =
    document.getElementById("addOptionBtn");

const pollOptions =
    document.getElementById("pollOptions");

const pollQuestion =
    document.getElementById("pollQuestion");


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {

    await getCurrentUser();

    setupProfileMenu();

    setupPollCreator();

    await loadPolls();

});


// =========================================================
// GET USER
// =========================================================

async function getCurrentUser() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();


    if (error || !data.user) {

        window.location.href = "login.html";

        return;
    }


    currentUser = data.user;


    await loadUserProfile();

}


// =========================================================
// LOAD USER PROFILE
// =========================================================

 // =========================================================
// LOAD USER PROFILE
// SAME PROFILE SYSTEM AS COMMUNITY.JS
// =========================================================

async function loadUserProfile() {

    const user = currentUser;

    const metadata = user.user_metadata || {};

    const name =
        metadata.display_name ||
        metadata.first_name ||
        user.email?.split("@")[0] ||
        "User";

    const photo =
        metadata.profile_picture ||
        "";

    setProfile(
        name,
        user.email || "",
        photo
    );
}
// =========================================================
// SET PROFILE
// =========================================================

 // =========================================================
// SET PROFILE
// =========================================================

function setProfile(name, email, photo) {

    const firstLetter =
        (name || "U").charAt(0).toUpperCase();

    const profileInitial =
        document.getElementById("profileInitial");

    const profileImg =
        document.getElementById("profilePhotoImg");

    const navUserName =
        document.getElementById("navUserName");

    const dropdownInitial =
        document.getElementById("dropdownProfileInitial");

    const dropdownImg =
        document.getElementById("dropdownProfileImg");

    const dropdownName =
        document.getElementById("dropdownUserName");

    const dropdownEmail =
        document.getElementById("dropdownUserEmail");


    // NAME

    navUserName.textContent = name;

    dropdownName.textContent = name;

    dropdownEmail.textContent = email;


    // INITIAL

    profileInitial.textContent = firstLetter;

    dropdownInitial.textContent = firstLetter;


    // RESET IMAGES FIRST

    profileImg.style.display = "none";
    dropdownImg.style.display = "none";

    profileInitial.style.display = "flex";
    dropdownInitial.style.display = "flex";


    // SHOW PROFILE IMAGE

    if (photo && photo.trim() !== "") {

        profileImg.src = photo;

        profileImg.style.display = "block";

        profileInitial.style.display = "none";


        dropdownImg.src = photo;

        dropdownImg.style.display = "block";

        dropdownInitial.style.display = "none";


        // If image fails, return to initial

        profileImg.onerror = function () {

            this.style.display = "none";

            profileInitial.style.display = "flex";

        };


        dropdownImg.onerror = function () {

            this.style.display = "none";

            dropdownInitial.style.display = "flex";

        };

    }

}

// =========================================================
// PROFILE DROPDOWN
// =========================================================
// =========================================================
// CHANGE PROFILE PHOTO
// =========================================================

async function handleProfilePhotoChange(event) {

    const file =
        event.target.files[0];


    if (!file)
        return;


    // VALIDATE FILE TYPE

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

        Swal.fire({

            icon: "warning",

            title: "Invalid image",

            text:
                "Please select a JPG, PNG or WEBP image.",

            confirmButtonColor: "#5b3bb5"

        });


        event.target.value = "";

        return;

    }


    // LIMIT SIZE

    if (file.size > 5 * 1024 * 1024) {

        Swal.fire({

            icon: "warning",

            title: "Image too large",

            text:
                "Please choose an image smaller than 5MB.",

            confirmButtonColor: "#5b3bb5"

        });


        event.target.value = "";

        return;

    }


    try {

        Swal.fire({

            title: "Uploading...",

            text: "Please wait while your profile picture is updated.",

            allowOutsideClick: false,

            allowEscapeKey: false,

            showConfirmButton: false,

            didOpen: () => {

                Swal.showLoading();

            }

        });


        // =================================================
        // STORAGE PATH
        // =================================================

        const filePath =
            `profiles/${currentUser.id}/avatar`;


        // =================================================
        // UPLOAD
        // =================================================

        const {
            error: uploadError
        } =
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


        if (uploadError)
            throw uploadError;


        // =================================================
        // GET PUBLIC URL
        // =================================================

        const {
            data: publicData
        } =
            supabaseClient
                .storage
                .from("avatars")
                .getPublicUrl(
                    filePath
                );


        const imageUrl =
            publicData.publicUrl;


        // =================================================
        // SAVE URL TO USER METADATA
        // =================================================

        const {
            data,
            error: updateError
        } =
            await supabaseClient.auth.updateUser({

                data: {

                    profile_picture:
                        `${imageUrl}?t=${Date.now()}`

                }

            });


        if (updateError)
            throw updateError;


        // UPDATE CURRENT USER

        currentUser =
            data.user;


        // UPDATE NAVBAR IMMEDIATELY

        await loadUserProfile();


        Swal.fire({

            icon: "success",

            title: "Profile picture updated!",

            text:
                "Your new profile picture is now visible.",

            confirmButtonColor: "#5b3bb5",

            timer: 1600,

            showConfirmButton: false

        });

    }

    catch (error) {

        console.error(
            "Profile photo upload error:",
            error
        );


        Swal.fire({

            icon: "error",

            title: "Upload failed",

            text:
                error.message ||
                "Could not update your profile picture.",

            confirmButtonColor: "#5b3bb5"

        });

    }


    // Reset file input

    event.target.value = "";

}

 // =========================================================
// PROFILE DROPDOWN
// =========================================================

function setupProfileMenu() {

    const button =
        document.getElementById("profileButton");

    const dropdown =
        document.getElementById("profileDropdown");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const editProfileBtn =
        document.getElementById("editProfileBtn");

    const changePhotoBtn =
        document.getElementById("changePhotoBtn");

    const profilePhotoInput =
        document.getElementById("profilePhotoInput");


    // OPEN / CLOSE DROPDOWN

    button.addEventListener("click", (event) => {

        event.stopPropagation();

        dropdown.classList.toggle("show");

    });


    // CLOSE WHEN CLICKING OUTSIDE

    document.addEventListener("click", () => {

        dropdown.classList.remove("show");

    });


    // PREVENT DROPDOWN CLOSING INSIDE

    dropdown.addEventListener("click", (event) => {

        event.stopPropagation();

    });


    // LOGOUT

    logoutBtn.addEventListener(
        "click",
        logout
    );


    // EDIT PROFILE

    editProfileBtn.addEventListener(
        "click",
        editProfile
    );


    // CHANGE PROFILE PHOTO

    changePhotoBtn.addEventListener(
        "click",
        () => {

            profilePhotoInput.click();

        }
    );


    // PHOTO SELECTED

    profilePhotoInput.addEventListener(
        "change",
        handleProfilePhotoChange
    );

}
// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href =
        "login.html";

}


// =========================================================
// EDIT PROFILE
// =========================================================

async function editProfile() {

    const metadata =
        currentUser.user_metadata || {};

    const currentName =
        metadata.display_name ||
        metadata.first_name ||
        currentUser.email?.split("@")[0] ||
        "User";


    const { value: name } =
        await Swal.fire({

            title: "Edit Profile",

            input: "text",

            inputLabel: "Your name",

            inputValue: currentName,

            inputPlaceholder: "Enter your name",

            showCancelButton: true,

            confirmButtonText: "Save",

            cancelButtonText: "Cancel",

            confirmButtonColor: "#5b3bb5",

            inputValidator: (value) => {

                if (!value || !value.trim()) {

                    return "Please enter your name.";

                }

            }

        });


    if (!name)
        return;


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.updateUser({

                data: {

                    display_name:
                        name.trim()

                }

            });


        if (error)
            throw error;


        currentUser =
            data.user;


        await loadUserProfile();


        Swal.fire({

            icon: "success",

            title: "Profile updated!",

            text: "Your name has been updated.",

            confirmButtonColor: "#5b3bb5",

            timer: 1500,

            showConfirmButton: false

        });

    }

    catch (error) {

        console.error(
            "Edit profile error:",
            error
        );


        Swal.fire({

            icon: "error",

            title: "Update failed",

            text:
                error.message ||
                "Could not update your profile.",

            confirmButtonColor: "#5b3bb5"

        });

    }

}

// =========================================================
// CREATE POLL UI
// =========================================================

function setupPollCreator() {

    createPollBtn.addEventListener(
        "click",
        openCreatePoll
    );


    emptyCreatePollBtn.addEventListener(
        "click",
        openCreatePoll
    );


    cancelPollBtn.addEventListener(
        "click",
        closeCreatePoll
    );


    addOptionBtn.addEventListener(
        "click",
        addOption
    );


    createPollSubmit.addEventListener(
        "click",
        createPoll
    );


    pollOptions.addEventListener(
        "click",
        (event) => {

            const button =
                event.target.closest(
                    ".remove-option"
                );


            if (!button) return;


            removeOption(button);

        }
    );

}


// =========================================================
// OPEN CREATE
// =========================================================

function openCreatePoll() {

    createPollCard.classList.remove(
        "hidden"
    );


    createPollBtn.classList.add(
        "hidden"
    );


    pollQuestion.focus();

}


// =========================================================
// CLOSE CREATE
// =========================================================

function closeCreatePoll() {

    createPollCard.classList.add(
        "hidden"
    );


    createPollBtn.classList.remove(
        "hidden"
    );


    resetPollForm();

}


// =========================================================
// RESET FORM
// =========================================================

function resetPollForm() {

    pollQuestion.value = "";


    pollOptions.innerHTML = `

        <div class="option-input-row">

            <input
                type="text"
                class="poll-input option-input"
                placeholder="Option 1"
                maxlength="100"
            >

            <button
                class="remove-option"
                type="button"
                disabled
            >
                <i class="bi bi-x-lg"></i>
            </button>

        </div>


        <div class="option-input-row">

            <input
                type="text"
                class="poll-input option-input"
                placeholder="Option 2"
                maxlength="100"
            >

            <button
                class="remove-option"
                type="button"
                disabled
            >
                <i class="bi bi-x-lg"></i>
            </button>

        </div>

    `;

}


// =========================================================
// ADD OPTION
// =========================================================

function addOption() {

    const currentOptions =
        document.querySelectorAll(
            ".option-input"
        );


    if (currentOptions.length >= 6) {

        Swal.fire({

            icon: "info",

            title: "Maximum options",

            text: "You can add up to 6 options.",

            confirmButtonColor: "#5b3bb5"

        });

        return;
    }


    const number =
        currentOptions.length + 1;


    const row =
        document.createElement("div");


    row.className =
        "option-input-row";


    row.innerHTML = `

        <input
            type="text"
            class="poll-input option-input"
            placeholder="Option ${number}"
            maxlength="100"
        >

        <button
            class="remove-option"
            type="button"
        >
            <i class="bi bi-x-lg"></i>
        </button>

    `;


    pollOptions.appendChild(row);

}


// =========================================================
// REMOVE OPTION
// =========================================================

function removeOption(button) {

    const rows =
        document.querySelectorAll(
            ".option-input-row"
        );


    if (rows.length <= 2) return;


    button.closest(
        ".option-input-row"
    ).remove();

}


// =========================================================
// CREATE POLL
// =========================================================

async function createPoll() {

    const question =
        pollQuestion.value.trim();


    const optionInputs =
        document.querySelectorAll(
            ".option-input"
        );


    const options =
        [...optionInputs]
            .map(input =>
                input.value.trim()
            )
            .filter(Boolean);


    if (!question) {

        Swal.fire({

            icon: "warning",

            title: "Question required",

            text: "Please enter your poll question.",

            confirmButtonColor: "#5b3bb5"

        });

        return;
    }


    if (options.length < 2) {

        Swal.fire({

            icon: "warning",

            title: "Add options",

            text: "A poll needs at least two options.",

            confirmButtonColor: "#5b3bb5"

        });

        return;
    }


    // Prevent duplicate options

    const uniqueOptions =
        [...new Set(
            options.map(
                option =>
                    option.toLowerCase()
            )
        )];


    if (
        uniqueOptions.length !==
        options.length
    ) {

        Swal.fire({

            icon: "warning",

            title: "Duplicate option",

            text: "Each poll option must be different.",

            confirmButtonColor: "#5b3bb5"

        });

        return;
    }


    createPollSubmit.disabled =
        true;


    createPollSubmit.innerHTML =
        `<span class="spinner-border spinner-border-sm"></span> Creating...`;


    try {

        // =========================================
        // INSERT POLL
        // =========================================

        const {
            data: poll,
            error: pollError
        } =
            await supabaseClient
                .from("polls")
                .insert({

                    user_id:
                        currentUser.id,

                    question:
                        question

                })
                .select()
                .single();


        if (pollError)
            throw pollError;


        // =========================================
        // INSERT OPTIONS
        // =========================================

        const optionRows =
            options.map(
                option => ({

                    poll_id:
                        poll.id,

                    option_text:
                        option

                })
            );


        const {
            error: optionError
        } =
            await supabaseClient
                .from("poll_options")
                .insert(
                    optionRows
                );


        if (optionError)
            throw optionError;


        Swal.fire({

            icon: "success",

            title: "Poll created!",

            text: "Your poll is now available to the community.",

            confirmButtonColor: "#5b3bb5",

            timer: 1800,

            showConfirmButton: false

        });


        closeCreatePoll();


        await loadPolls();

    }

    catch (error) {

        console.error(
            "Create poll error:",
            error
        );


        Swal.fire({

            icon: "error",

            title: "Could not create poll",

            text:
                error.message ||
                "Something went wrong.",

            confirmButtonColor: "#5b3bb5"

        });

    }

    finally {

        createPollSubmit.disabled =
            false;


        createPollSubmit.innerHTML =
            `<i class="bi bi-check-lg"></i> Create Poll`;

    }

}


// =========================================================
// LOAD POLLS
// =========================================================

async function loadPolls() {

    pollLoading.classList.remove(
        "hidden"
    );


    noPolls.classList.add(
        "hidden"
    );


    pollList.innerHTML = "";


    try {

        const {
            data: polls,
            error
        } =
            await supabaseClient
                .from("polls")
                .select(`
                    id,
                    user_id,
                    question,
                    created_at,

                    poll_options (
                        id,
                        option_text
                    )
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error)
            throw error;


        allPolls =
            polls || [];


        if (!allPolls.length) {

            noPolls.classList.remove(
                "hidden"
            );

            return;
        }


        // Load all votes

        const {
            data: votes,
            error: voteError
        } =
            await supabaseClient
                .from("poll_votes")
                .select(
                    "poll_id, option_id, user_id"
                );


        if (voteError)
            throw voteError;


        allPolls.forEach(
            poll => {

                const pollVotes =
                    votes.filter(
                        vote =>
                            vote.poll_id ===
                            poll.id
                    );


                renderPoll(
                    poll,
                    pollVotes
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Load polls error:",
            error
        );


        pollList.innerHTML = `

            <div class="no-polls">

                <div class="empty-icon">
                    <i class="bi bi-exclamation-triangle"></i>
                </div>

                <h3>
                    Unable to load polls
                </h3>

                <p>
                    Please refresh the page and try again.
                </p>

            </div>

        `;

    }

    finally {

        pollLoading.classList.add(
            "hidden"
        );

    }

}


// =========================================================
// RENDER POLL
// =========================================================

function renderPoll(
    poll,
    votes
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "poll-card";


    const totalVotes =
        votes.length;


    const userVote =
        votes.find(
            vote =>
                vote.user_id ===
                currentUser.id
        );


    const isOwner =
        poll.user_id ===
        currentUser.id;


    card.innerHTML = `

        <div class="poll-card-header">

            <div>

                <h3 class="poll-question">
                    ${escapeHTML(
                        poll.question
                    )}
                </h3>

                <p class="poll-date">
                    ${formatDate(
                        poll.created_at
                    )}
                </p>

            </div>

            ${
                isOwner
                ?
                `
                <button
                    class="delete-poll-btn"
                    data-poll-id="${poll.id}"
                    title="Delete poll"
                >
                    <i class="bi bi-trash"></i>
                </button>
                `
                :
                ""
            }

        </div>


        <div
            class="poll-options"
            data-poll-id="${poll.id}"
        >

            ${poll.poll_options.map(
                option => {

                    const optionVotes =
                        votes.filter(
                            vote =>
                                vote.option_id ===
                                option.id
                        ).length;


                    const percentage =
                        totalVotes === 0
                        ?
                        0
                        :
                        Math.round(
                            (
                                optionVotes /
                                totalVotes
                            ) * 100
                        );


                    const selected =
                        userVote &&
                        userVote.option_id ===
                        option.id;


                    return `

                        <div
                            class="poll-option ${
                                selected
                                ? "selected"
                                : ""
                            }"
                            data-option-id="${option.id}"
                        >

                            <div
                                class="poll-option-bar"
                                style="width:${percentage}%"
                            ></div>


                            <div class="poll-option-content">

                                <div class="option-left">

                                    <span class="option-radio"></span>

                                    <span class="option-text">
                                        ${escapeHTML(
                                            option.option_text
                                        )}
                                    </span>

                                </div>


                                <span class="option-result">
                                    ${percentage}%
                                </span>

                            </div>

                        </div>

                    `;

                }
            ).join("")}

        </div>


        ${
            userVote
            ?
            `
            <div class="voted-message">

                <i class="bi bi-check-circle-fill"></i>

                You have already voted on this poll.

            </div>
            `
            :
            `
            <button
                class="vote-btn"
                data-poll-id="${poll.id}"
            >

                <i class="bi bi-check2-circle"></i>

                Vote

            </button>
            `
        }

    `;


    pollList.appendChild(card);


    // ==========================================
    // OPTION SELECTION
    // ==========================================

    const optionsContainer =
        card.querySelector(
            ".poll-options"
        );


    optionsContainer
        .addEventListener(
            "click",
            event => {

                const option =
                    event.target.closest(
                        ".poll-option"
                    );


                if (!option)
                    return;


                if (userVote)
                    return;


                const optionId =
                    option.dataset.optionId;


                selectedOptions[
                    poll.id
                ] = optionId;


                card.querySelectorAll(
                    ".poll-option"
                ).forEach(
                    item => {

                        item.classList.remove(
                            "selected"
                        );

                    }
                );


                option.classList.add(
                    "selected"
                );

            }
        );


    // ==========================================
    // VOTE
    // ==========================================

    const voteButton =
        card.querySelector(
            ".vote-btn"
        );


    if (voteButton) {

        voteButton.addEventListener(
            "click",
            async () => {

                await votePoll(
                    poll.id
                );

            }
        );

    }


    // ==========================================
    // DELETE
    // ==========================================

    const deleteButton =
        card.querySelector(
            ".delete-poll-btn"
        );


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            async () => {

                await deletePoll(
                    poll.id
                );

            }
        );

    }

}


// =========================================================
// VOTE
// =========================================================

async function votePoll(
    pollId
) {

    const optionId =
        selectedOptions[pollId];


    if (!optionId) {

        Swal.fire({

            icon: "warning",

            title: "Choose an option",

            text: "Please select an option before voting.",

            confirmButtonColor: "#5b3bb5"

        });

        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("poll_votes")
                .insert({

                    poll_id:
                        pollId,

                    option_id:
                        optionId,

                    user_id:
                        currentUser.id

                });


        if (error) {

            // Duplicate vote

            if (
                error.code ===
                "23505"
            ) {

                Swal.fire({

                    icon: "info",

                    title: "Already voted",

                    text:
                        "You can only vote once on each poll.",

                    confirmButtonColor:
                        "#5b3bb5"

                });

                await loadPolls();

                return;
            }


            throw error;
        }


        delete selectedOptions[
            pollId
        ];


        Swal.fire({

            icon: "success",

            title: "Vote submitted!",

            text: "Your vote has been recorded.",

            confirmButtonColor: "#5b3bb5",

            timer: 1500,

            showConfirmButton: false

        });


        await loadPolls();

    }

    catch (error) {

        console.error(
            "Vote error:",
            error
        );


        Swal.fire({

            icon: "error",

            title: "Vote failed",

            text:
                error.message ||
                "Unable to submit your vote.",

            confirmButtonColor:
                "#5b3bb5"

        });

    }

}


// =========================================================
// DELETE POLL
// =========================================================

async function deletePoll(
    pollId
) {

    const result =
        await Swal.fire({

            icon: "warning",

            title: "Delete this poll?",

            text:
                "This will remove the poll and its votes.",

            showCancelButton: true,

            confirmButtonText:
                "Yes, delete it",

            cancelButtonText:
                "Cancel",

            confirmButtonColor:
                "#dc3545"

        });


    if (!result.isConfirmed)
        return;


    try {

        const {
            error
        } =
            await supabaseClient
                .from("polls")
                .delete()
                .eq(
                    "id",
                    pollId
                )
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error)
            throw error;


        Swal.fire({

            icon: "success",

            title: "Poll deleted",

            timer: 1200,

            showConfirmButton: false

        });


        await loadPolls();

    }

    catch (error) {

        console.error(
            "Delete poll error:",
            error
        );


        Swal.fire({

            icon: "error",

            title: "Could not delete poll",

            text:
                error.message ||
                "Something went wrong.",

            confirmButtonColor:
                "#5b3bb5"

        });

    }

}


// =========================================================
// DATE
// =========================================================

function formatDate(
    date
) {

    const value =
        new Date(date);


    return value.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}

// =========================================================
// NOTIFICATIONS
// =========================================================

let notifications = [];

let notificationChannel = null;


// =========================================================
// DOM
// =========================================================

const notificationBtn =
    document.getElementById("notificationBtn");

const notificationDropdown =
    document.getElementById("notificationDropdown");

const notificationBadge =
    document.getElementById("notificationBadge");

const notificationList =
    document.getElementById("notificationList");

const notificationCountText =
    document.getElementById("notificationCountText");

const markAllReadBtn =
    document.getElementById("markAllReadBtn");


    