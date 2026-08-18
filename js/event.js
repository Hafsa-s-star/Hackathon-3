// =========================================================
// SUPABASE
// =========================================================

const { createClient } = supabase;

const supabaseClient = createClient(
    "https://uiwmuwqarhngnhppqfqo.supabase.co",
    "sb_publishable_lXI3MvI6rVyWQKQ4P5r2ZA_zP8Ix1D7"
);


// =========================================================
// GLOBAL
// =========================================================

let currentUser = null;
let currentEventBeingEdited = null;
let allEvents = [];


// =========================================================
// ELEMENTS
// =========================================================

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


const createEventBtn =
    document.getElementById("createEventBtn");

const createEventCard =
    document.getElementById("createEventCard");

const cancelEventBtn =
    document.getElementById("cancelEventBtn");

const submitEventBtn =
    document.getElementById("submitEventBtn");

const eventTitle =
    document.getElementById("eventTitle");

const eventDescription =
    document.getElementById("eventDescription");

const eventDate =
    document.getElementById("eventDate");

const eventTime =
    document.getElementById("eventTime");

const eventLocation =
    document.getElementById("eventLocation");

const eventImage =
    document.getElementById("eventImage");

const eventImagePreview =
    document.getElementById("eventImagePreview");

const eventsContainer =
    document.getElementById("eventsContainer");

const eventSearch =
    document.getElementById("eventSearch");

const eventFilter =
    document.getElementById("eventFilter");


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupNavbar();
        setupEvents();

        await loadUser();

    }
);


// =========================================================
// LOAD USER
// =========================================================

async function loadUser() {

    const {
        data: {
            user
        },
        error
    } =
        await supabaseClient.auth.getUser();


    if (error || !user) {

        window.location.href =
            "index.html";

        return;

    }


    currentUser = user;


    const metadata =
        user.user_metadata || {};


    const name =
        metadata.display_name ||
        metadata.full_name ||
        metadata.first_name ||
        user.email?.split("@")[0] ||
        "Student";


    // NAV NAME

    if (navUserName) {
        navUserName.textContent = name;
    }

    if (dropdownUserName) {
        dropdownUserName.textContent = name;
    }

    if (dropdownUserEmail) {
        dropdownUserEmail.textContent =
            user.email || "";
    }


    // INITIAL

    const initial =
        name.charAt(0).toUpperCase();


    if (profileInitial) {

        profileInitial.textContent =
            initial;

        profileInitial.style.display =
            "flex";

    }


    if (dropdownProfileInitial) {

        dropdownProfileInitial.textContent =
            initial;

        dropdownProfileInitial.style.display =
            "flex";

    }


    // PROFILE IMAGE

    const profileImage =
        metadata.profile_picture;


    if (profileImage) {

        showProfilePicture(
            profileImage + "?t=" + Date.now()
        );

    }


    await loadEvents();

}


// =========================================================
// NAVBAR
// =========================================================

function setupNavbar() {

    if (profileButton) {

        profileButton.addEventListener(
            "click",
            (e) => {

                e.stopPropagation();

                profileDropdown?.classList.toggle(
                    "show"
                );

            }
        );

    }


    document.addEventListener(
        "click",
        () => {

            profileDropdown?.classList.remove(
                "show"
            );

        }
    );


    profileDropdown?.addEventListener(
        "click",
        e => e.stopPropagation()
    );


    changePhotoBtn?.addEventListener(
        "click",
        () => profilePhotoInput?.click()
    );


    profilePhotoInput?.addEventListener(
        "change",
        uploadProfilePicture
    );


    editProfileBtn?.addEventListener(
        "click",
        editProfile
    );


    logoutBtn?.addEventListener(
        "click",
        logout
    );

}


// =========================================================
// PROFILE IMAGE
// =========================================================

function showProfilePicture(imageUrl) {

    if (profilePhotoImg) {

        profilePhotoImg.src =
            imageUrl;

        profilePhotoImg.style.display =
            "block";

    }


    if (dropdownProfileImg) {

        dropdownProfileImg.src =
            imageUrl;

        dropdownProfileImg.style.display =
            "block";

    }


    if (profileInitial) {

        profileInitial.style.display =
            "none";

    }


    if (dropdownProfileInitial) {

        dropdownProfileInitial.style.display =
            "none";

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


    if (!file.type.startsWith("image/")) {

        Swal.fire(
            "Invalid Image",
            "Please select an image.",
            "error"
        );

        return;

    }


    try {

        Swal.fire({
            title: "Uploading...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });


        const filePath =
            `profiles/${currentUser.id}/avatar`;


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


        if (uploadError) {
            throw uploadError;
        }


        const {
            data
        } =
            supabaseClient
                .storage
                .from("avatars")
                .getPublicUrl(filePath);


        const imageUrl =
            data.publicUrl;


        const {
            data: updatedUser,
            error
        } =
            await supabaseClient.auth.updateUser({

                data: {
                    profile_picture:
                        imageUrl
                }

            });


        if (error) {
            throw error;
        }


        currentUser =
            updatedUser.user;


        showProfilePicture(
            imageUrl + "?t=" + Date.now()
        );


        Swal.fire({
            icon: "success",
            title: "Profile Picture Updated!",
            timer: 1300,
            showConfirmButton: false
        });


    } catch (error) {

        console.error(error);

        Swal.fire(
            "Upload Failed",
            error.message,
            "error"
        );

    }


    event.target.value = "";

}


// =========================================================
// EDIT PROFILE
// =========================================================

async function editProfile() {

    if (!currentUser) {
        return;
    }


    const metadata =
        currentUser.user_metadata || {};


    const currentName =
        metadata.display_name ||
        metadata.full_name ||
        "";


    const result =
        await Swal.fire({

            title: "Edit Profile",

            input: "text",

            inputValue:
                currentName,

            inputPlaceholder:
                "Your name",

            showCancelButton:
                true,

            confirmButtonText:
                "Save Changes",

            inputValidator:
                value => {

                    if (!value.trim()) {
                        return "Please enter your name.";
                    }

                }

        });


    if (!result.isConfirmed) {
        return;
    }


    const newName =
        result.value.trim();


    const {
        data,
        error
    } =
        await supabaseClient.auth.updateUser({

            data: {
                display_name:
                    newName
            }

        });


    if (error) {

        Swal.fire(
            "Update Failed",
            error.message,
            "error"
        );

        return;

    }


    currentUser =
        data.user;


    navUserName.textContent =
        newName;

    dropdownUserName.textContent =
        newName;


    profileInitial.textContent =
        newName.charAt(0).toUpperCase();

}


// =========================================================
// LOGOUT
// =========================================================

async function logout() {

    const result =
        await Swal.fire({

            icon: "question",

            title: "Logout?",

            text:
                "Are you sure you want to logout?",

            showCancelButton:
                true,

            confirmButtonText:
                "Logout",

            cancelButtonText:
                "Cancel"

        });


    if (!result.isConfirmed) {
        return;
    }


    await supabaseClient.auth.signOut();


    window.location.href =
        "index.html";

}


// =========================================================
// EVENTS SETUP
// =========================================================

function setupEvents() {


    createEventBtn?.addEventListener(
        "click",
        () => {

            createEventCard.classList.remove(
                "hidden"
            );

            createEventBtn.style.display =
                "none";

            eventTitle.focus();

        }
    );


    cancelEventBtn?.addEventListener(
        "click",
        resetEventForm
    );


    submitEventBtn?.addEventListener(
        "click",
        createOrUpdateEvent
    );


    eventImage?.addEventListener(
        "change",
        previewEventImage
    );


    eventSearch?.addEventListener(
        "input",
        applyFilters
    );


    eventFilter?.addEventListener(
        "change",
        applyFilters
    );


    document.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".event-menu-dropdown.show"
                )
                .forEach(menu =>
                    menu.classList.remove("show")
                );

        }
    );

}


// =========================================================
// IMAGE PREVIEW
// =========================================================

function previewEventImage() {

    const file =
        eventImage.files[0];


    if (!file) {

        eventImagePreview.innerHTML =
            "";

        return;

    }


    if (!file.type.startsWith("image/")) {

        Swal.fire(
            "Invalid Image",
            "Please select an image.",
            "error"
        );

        eventImage.value = "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        e => {

            eventImagePreview.innerHTML = `
                <img
                    src="${e.target.result}"
                    alt="Preview"
                >
            `;

        };


    reader.readAsDataURL(file);

}


// =========================================================
// RESET FORM
// =========================================================

function resetEventForm() {

    currentEventBeingEdited =
        null;


    eventTitle.value =
        "";

    eventDescription.value =
        "";

    eventDate.value =
        "";

    eventTime.value =
        "";

    eventLocation.value =
        "";

    eventImage.value =
        "";

    eventImagePreview.innerHTML =
        "";


    submitEventBtn.innerHTML =
        `<i class="bi bi-calendar-check"></i>
         Create Event`;


    createEventCard.classList.add(
        "hidden"
    );


    createEventBtn.style.display =
        "";

}


// =========================================================
// CREATE / UPDATE EVENT
// =========================================================

async function createOrUpdateEvent() {

    if (!currentUser) {
        return;
    }


    const title =
        eventTitle.value.trim();

    const description =
        eventDescription.value.trim();

    const date =
        eventDate.value;

    const time =
        eventTime.value;

    const location =
        eventLocation.value.trim();


    if (
        !title ||
        !description ||
        !date ||
        !time ||
        !location
    ) {

        Swal.fire(
            "Missing Information",
            "Please fill in all event fields.",
            "warning"
        );

        return;

    }


    if (
        new Date(`${date}T${time}`) <
        new Date()
    ) {

        Swal.fire(
            "Invalid Date",
            "Please choose a future date and time.",
            "warning"
        );

        return;

    }


    try {

        submitEventBtn.disabled =
            true;


        const metadata =
            currentUser.user_metadata || {};


        const name =
            metadata.display_name ||
            metadata.full_name ||
            metadata.first_name ||
            currentUser.email?.split("@")[0] ||
            "Student";


        const profilePicture =
            metadata.profile_picture ||
            "";


        let imageUrl =
            currentEventBeingEdited?.event_image ||
            "";


        // =================================================
        // IMAGE
        // =================================================

        const file =
            eventImage.files[0];


        if (file) {

            const extension =
                file.name
                    .split(".")
                    .pop();


            const fileName =
                `${currentUser.id}/${Date.now()}.${extension}`;


            const {
                error
            } =
                await supabaseClient
                    .storage
                    .from("event-images")
                    .upload(
                        fileName,
                        file,
                        {
                            cacheControl: "3600",
                            upsert: false,
                            contentType: file.type
                        }
                    );


            if (error) {
                throw error;
            }


            const {
                data
            } =
                supabaseClient
                    .storage
                    .from("event-images")
                    .getPublicUrl(
                        fileName
                    );


            imageUrl =
                data.publicUrl;

        }


        // =================================================
        // UPDATE
        // =================================================

        if (currentEventBeingEdited) {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("events")
                    .update({

                        title,

                        description,

                        event_date:
                            date,

                        event_time:
                            time,

                        location,

                        event_image:
                            imageUrl,

                        creator_name:
                            name,

                        creator_email:
                            currentUser.email,

                        creator_profile_picture:
                            profilePicture

                    })
                    .eq(
                        "id",
                        currentEventBeingEdited.id
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


            await loadEvents();


            resetEventForm();


            Swal.fire({
                icon: "success",
                title: "Event Updated!",
                timer: 1300,
                showConfirmButton: false
            });


            return;

        }


        // =================================================
        // CREATE
        // =================================================

        const {
            error
        } =
            await supabaseClient
                .from("events")
                .insert({

                    user_id:
                        currentUser.id,

                    title,

                    description,

                    event_date:
                        date,

                    event_time:
                        time,

                    location,

                    event_image:
                        imageUrl,

                    creator_name:
                        name,

                    creator_email:
                        currentUser.email,

                    creator_profile_picture:
                        profilePicture

                });


        if (error) {
            throw error;
        }


        await loadEvents();


        resetEventForm();


        Swal.fire({
            icon: "success",
            title: "Event Created!",
            timer: 1300,
            showConfirmButton: false
        });


    } catch (error) {

        console.error(error);

        Swal.fire(
            "Event Failed",
            error.message,
            "error"
        );

    } finally {

        submitEventBtn.disabled =
            false;

    }

}


// =========================================================
// LOAD EVENTS
// =========================================================

async function loadEvents() {

    eventsContainer.innerHTML = `

        <div class="text-center py-5"
             style="grid-column:1/-1">

            <div class="spinner-border text-primary"></div>

            <p class="mt-3 text-muted">
                Loading events...
            </p>

        </div>

    `;


    const {
        data,
        error
    } =
        await supabaseClient
            .from("events")
            .select("*")
            .order(
                "event_date",
                {
                    ascending: true
                }
            )
            .order(
                "event_time",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(error);

        eventsContainer.innerHTML = `

            <div
                class="text-center py-5"
                style="grid-column:1/-1"
            >

                <p class="text-danger">
                    Failed to load events.
                </p>

            </div>

        `;

        return;

    }


    allEvents =
        data || [];


    await renderEvents(
        allEvents
    );

}


// =========================================================
// RENDER EVENTS
// =========================================================

async function renderEvents(events) {

    eventsContainer.innerHTML =
        "";


    if (!events.length) {

        eventsContainer.innerHTML = `

            <div
                class="text-center py-5"
                style="grid-column:1/-1"
            >

                <i
                    class="bi bi-calendar-x"
                    style="font-size:50px;color:#8b5cf6"
                ></i>

                <h3 class="mt-3">
                    No Events Found
                </h3>

                <p class="text-muted">
                    Be the first student to create an event.
                </p>

            </div>

        `;

        return;

    }


    for (const event of events) {

        await renderEvent(event);

    }

}


// =========================================================
// RENDER SINGLE EVENT
// =========================================================

async function renderEvent(eventData) {

    const template =
        document.getElementById(
            "eventTemplate"
        );


    const clone =
        template.content.cloneNode(true);


    const card =
        clone.querySelector(
            ".event-card"
        );


    card.dataset.id =
        eventData.id;


    // =================================================
    // IMAGE
    // =================================================

    const image =
        card.querySelector(
            ".event-card-image"
        );


    if (eventData.event_image) {

        image.src =
            eventData.event_image;

    } else {

        image.src =
            "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80";

    }


    // =================================================
    // DATE
    // =================================================

    const date =
        new Date(
            `${eventData.event_date}T${eventData.event_time}`
        );


    const day =
        date.getDate();


    const month =
        date.toLocaleDateString(
            "en-US",
            {
                month: "short"
            }
        ).toUpperCase();


    card.querySelector(
        ".event-day"
    ).textContent =
        day;


    card.querySelector(
        ".event-month"
    ).textContent =
        month;


    card.querySelector(
        ".event-title"
    ).textContent =
        eventData.title;


    card.querySelector(
        ".event-description"
    ).textContent =
        eventData.description;


    card.querySelector(
        ".event-date"
    ).textContent =
        date.toLocaleDateString(
            "en-US",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    card.querySelector(
        ".event-time"
    ).textContent =
        date.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    card.querySelector(
        ".event-location"
    ).textContent =
        eventData.location;


    // =================================================
    // CREATOR
    // =================================================

    const creatorName =
        eventData.creator_name ||
        "Student";


    card.querySelector(
        ".event-creator-name"
    ).textContent =
        creatorName;


    const creatorInitial =
        creatorName
            .charAt(0)
            .toUpperCase();


    const creatorInitialElement =
        card.querySelector(
            ".event-creator-initial"
        );


    const creatorImage =
        card.querySelector(
            ".event-creator-image"
        );


    if (eventData.creator_profile_picture) {

        creatorImage.src =
            eventData.creator_profile_picture +
            "?t=" +
            Date.now();

        creatorImage.style.display =
            "block";

        creatorInitialElement.style.display =
            "none";

    } else {

        creatorInitialElement.textContent =
            creatorInitial;

        creatorInitialElement.style.display =
            "flex";

        creatorImage.style.display =
            "none";

    }


    // =================================================
    // OWNER MENU
    // =================================================

    const menu =
        card.querySelector(
            ".event-menu-dropdown"
        );


    const menuButton =
        card.querySelector(
            ".event-menu-btn"
        );


    if (
        currentUser &&
        eventData.user_id ===
        currentUser.id
    ) {

        menuButton.style.display =
            "block";


        menuButton.addEventListener(
            "click",
            e => {

                e.stopPropagation();

                menu.classList.toggle(
                    "show"
                );

            }
        );


        card.querySelector(
            ".event-edit-btn"
        ).addEventListener(
            "click",
            () =>
                startEditEvent(eventData)
        );


        card.querySelector(
            ".event-delete-btn"
        ).addEventListener(
            "click",
            () =>
                deleteEvent(eventData.id)
        );

    } else {

        menuButton.style.display =
            "none";

    }


    // =================================================
    // REGISTRATIONS
    // =================================================

    const {
        data: registrations,
        error
    } =
        await supabaseClient
            .from("event_registrations")
            .select("user_id")
            .eq(
                "event_id",
                eventData.id
            );


    if (error) {

        console.error(error);

    }


    const registrationList =
        registrations || [];


    card.querySelector(
        ".participant-count"
    ).textContent =
        registrationList.length;


    const registerButton =
        card.querySelector(
            ".event-register-btn"
        );


    const registered =
        registrationList.some(
            registration =>
                registration.user_id ===
                currentUser.id
        );


    if (registered) {

        registerButton.classList.add(
            "registered"
        );

        registerButton.innerHTML =
            `
                <i class="bi bi-check-circle-fill"></i>
                Registered
            `;

    } else {

        registerButton.classList.remove(
            "registered"
        );

        registerButton.innerHTML =
            `
                <i class="bi bi-check-circle"></i>
                Register
            `;

    }


    registerButton.addEventListener(
        "click",
        () =>
            toggleRegistration(
                eventData.id,
                registerButton,
                card
            )
    );


    eventsContainer.appendChild(
        card
    );

}


// =========================================================
// REGISTER / CANCEL
// =========================================================

async function toggleRegistration(
    eventId,
    button,
    card
) {

    if (!currentUser) {
        return;
    }


    const isRegistered =
        button.classList.contains(
            "registered"
        );


    button.disabled =
        true;


    try {

        if (isRegistered) {

            const {
                error
            } =
                await supabaseClient
                    .from("event_registrations")
                    .delete()
                    .eq(
                        "event_id",
                        eventId
                    )
                    .eq(
                        "user_id",
                        currentUser.id
                    );


            if (error) {
                throw error;
            }


            button.classList.remove(
                "registered"
            );


            button.innerHTML =
                `
                    <i class="bi bi-check-circle"></i>
                    Register
                `;


            const count =
                card.querySelector(
                    ".participant-count"
                );


            count.textContent =
                Math.max(
                    0,
                    Number(count.textContent) - 1
                );


            Swal.fire({
                icon: "success",
                title: "Registration Cancelled",
                timer: 1000,
                showConfirmButton: false
            });


        } else {

            const metadata =
                currentUser.user_metadata ||
                {};


            const name =
                metadata.display_name ||
                metadata.full_name ||
                currentUser.email
                    ?.split("@")[0] ||
                "Student";


            const {
                error
            } =
                await supabaseClient
                    .from("event_registrations")
                    .insert({

                        event_id:
                            eventId,

                        user_id:
                            currentUser.id,

                        user_name:
                            name,

                        user_email:
                            currentUser.email

                    });


            if (error) {
                throw error;
            }


            button.classList.add(
                "registered"
            );


            button.innerHTML =
                `
                    <i class="bi bi-check-circle-fill"></i>
                    Registered
                `;


            const count =
                card.querySelector(
                    ".participant-count"
                );


            count.textContent =
                Number(count.textContent) + 1;


            Swal.fire({
                icon: "success",
                title: "Registered!",
                timer: 1000,
                showConfirmButton: false
            });

        }

    } catch (error) {

        console.error(error);

        Swal.fire(
            "Registration Failed",
            error.message,
            "error"
        );

    } finally {

        button.disabled =
            false;

    }

}


// =========================================================
// EDIT EVENT
// =========================================================

function startEditEvent(eventData) {

    currentEventBeingEdited =
        eventData;


    createEventCard.classList.remove(
        "hidden"
    );


    createEventBtn.style.display =
        "none";


    eventTitle.value =
        eventData.title || "";


    eventDescription.value =
        eventData.description || "";


    eventDate.value =
        eventData.event_date || "";


    eventTime.value =
        eventData.event_time?.slice(0, 5) || "";


    eventLocation.value =
        eventData.location || "";


    submitEventBtn.innerHTML =
        `
            <i class="bi bi-check-lg"></i>
            Update Event
        `;


    createEventCard.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// =========================================================
// DELETE EVENT
// =========================================================

async function deleteEvent(eventId) {

    const result =
        await Swal.fire({

            icon: "warning",

            title: "Delete Event?",

            text:
                "This event and its registrations will be deleted.",

            showCancelButton:
                true,

            confirmButtonText:
                "Delete",

            cancelButtonText:
                "Cancel"

        });


    if (!result.isConfirmed) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("events")
            .delete()
            .eq(
                "id",
                eventId
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        Swal.fire(
            "Delete Failed",
            error.message,
            "error"
        );

        return;

    }


    await loadEvents();


    Swal.fire({
        icon: "success",
        title: "Event Deleted!",
        timer: 1100,
        showConfirmButton: false
    });

}


// =========================================================
// SEARCH + FILTER
// =========================================================

async function applyFilters() {

    const search =
        eventSearch.value
            .trim()
            .toLowerCase();


    const filter =
        eventFilter.value;


    let filtered =
        [...allEvents];


    // =================================================
    // SEARCH
    // =================================================

    if (search) {

        filtered =
            filtered.filter(
                event =>

                    event.title
                        .toLowerCase()
                        .includes(search)

                    ||

                    event.description
                        .toLowerCase()
                        .includes(search)

                    ||

                    event.location
                        .toLowerCase()
                        .includes(search)

                    ||

                    event.creator_name
                        .toLowerCase()
                        .includes(search)
            );

    }


    // =================================================
    // UPCOMING
    // =================================================

    if (filter === "upcoming") {

        const now =
            new Date();


        filtered =
            filtered.filter(
                event => {

                    const eventDate =
                        new Date(
                            `${event.event_date}T${event.event_time}`
                        );

                    return eventDate >= now;

                }
            );

    }


    // =================================================
    // MY EVENTS
    // =================================================

    if (filter === "created") {

        filtered =
            filtered.filter(
                event =>
                    event.user_id ===
                    currentUser.id
            );

    }


    // =================================================
    // MY REGISTRATIONS
    // =================================================

    if (filter === "registered") {

        const {
            data
        } =
            await supabaseClient
                .from("event_registrations")
                .select("event_id")
                .eq(
                    "user_id",
                    currentUser.id
                );


        const registeredIds =
            new Set(
                (data || [])
                    .map(
                        item =>
                            item.event_id
                    )
            );


        filtered =
            filtered.filter(
                event =>
                    registeredIds.has(
                        event.id
                    )
            );

    }


    await renderEvents(
        filtered
    );

}