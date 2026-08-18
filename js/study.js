 /* =========================================================
   STUDY PARTNER FINDER
   SUPABASE
========================================================= */

const { createClient } = supabase;


/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const supabaseClient = createClient(
    "https://uiwmuwqarhngnhppqfqo.supabase.co",
    "sb_publishable_lXI3MvI6rVyWQKQ4P5r2ZA_zP8Ix1D7"
);


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentUser = null;
let currentUserName = "User";
let currentUserEmail = "";
let currentUserAvatar = "";

let allPartners = [];

let currentStudyProfile = null;

let connectionRequests = new Set();
let connectedUsers = new Set();


/* =========================================================
   DOM
========================================================= */

const profileButton =
    document.getElementById("profileButton");

const profileDropdown =
    document.getElementById("profileDropdown");

const logoutBtn =
    document.getElementById("logoutBtn");

const navUserName =
    document.getElementById("navUserName");

const profileInitial =
    document.getElementById("profileInitial");

const profilePhotoImg =
    document.getElementById("profilePhotoImg");

const dropdownUserName =
    document.getElementById("dropdownUserName");

const dropdownUserEmail =
    document.getElementById("dropdownUserEmail");

const dropdownProfileInitial =
    document.getElementById("dropdownProfileInitial");

const dropdownProfileImg =
    document.getElementById("dropdownProfileImg");

const changePhotoBtn =
    document.getElementById("changePhotoBtn");

const profilePhotoInput =
    document.getElementById("profilePhotoInput");

const editProfileBtn =
    document.getElementById("editProfileBtn");


/* =========================================================
   STUDY DOM
========================================================= */

const createProfileBtn =
    document.getElementById("createProfileBtn");

const profileModal =
    document.getElementById("profileModal");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelModalBtn =
    document.getElementById("cancelModalBtn");

const studyProfileForm =
    document.getElementById("studyProfileForm");

const modalTitle =
    document.getElementById("modalTitle");

const profileName =
    document.getElementById("profileName");

const profileSubjects =
    document.getElementById("profileSubjects");

const profileSkills =
    document.getElementById("profileSkills");

const profileExperience =
    document.getElementById("profileExperience");

const profileAvailability =
    document.getElementById("profileAvailability");

const profileIntroduction =
    document.getElementById("profileIntroduction");

const formProfileInitial =
    document.getElementById("formProfileInitial");

const formProfileImage =
    document.getElementById("formProfileImage");

const formUserName =
    document.getElementById("formUserName");

const searchInput =
    document.getElementById("searchInput");

const subjectFilter =
    document.getElementById("subjectFilter");

const skillFilter =
    document.getElementById("skillFilter");

const experienceFilter =
    document.getElementById("experienceFilter");

const clearFiltersBtn =
    document.getElementById("clearFiltersBtn");

const notFoundClearBtn =
    document.getElementById("notFoundClearBtn");

const studyPartnersGrid =
    document.getElementById("studyPartnersGrid");

const notFound =
    document.getElementById("notFound");

const resultsCount =
    document.getElementById("resultsCount");

const resultsText =
    document.getElementById("resultsText");

const viewProfileModal =
    document.getElementById("viewProfileModal");

const closeViewModalBtn =
    document.getElementById("closeViewModalBtn");

const viewProfileContent =
    document.getElementById("viewProfileContent");


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    await checkUser();

});


/* =========================================================
   CHECK AUTH USER
========================================================= */

async function checkUser() {

    const {
        data: {
            session
        }
    } = await supabaseClient.auth.getSession();


    if (!session) {

        window.location.href = "index.html";

        return;

    }


    currentUser = session.user;

    currentUserEmail =
        currentUser.email || "";


    await loadCurrentUser();

    await loadStudyProfiles();

    await loadConnections();

}


/* =========================================================
   LOAD CURRENT USER
========================================================= */

async function loadCurrentUser() {

    /*
       We first try metadata.

       This works if your signup/profile system
       already stores the user's name in metadata.
    */

    currentUserName =
        currentUser.user_metadata?.display_name ||
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.first_name ||
        currentUser.user_metadata?.name ||
        currentUser.user_metadata?.username ||
        currentUser.email?.split("@")[0] ||
        "User";


    /*
       Try to get profile information from your
       existing profiles table if you have one.
    */

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("name, full_name, username, avatar_url, profile_picture")
            .eq("id", currentUser.id)
            .maybeSingle();


        if (!error && data) {

            currentUserName =
                data.name ||
                data.full_name ||
                data.username ||
                currentUserName;


            currentUserAvatar =
                data.avatar_url ||
                data.profile_picture ||
                "";

        }

    } catch (error) {

        console.log(
            "Existing profiles table not available:",
            error
        );

    }


    /*
       Fallback to Auth metadata avatar.
    */

    if (!currentUserAvatar) {

        currentUserAvatar =
            currentUser.user_metadata?.avatar_url ||
            currentUser.user_metadata?.picture ||
            currentUser.user_metadata?.profile_picture ||
            "";

    }


    updateNavbarProfile();

}


/* =========================================================
   UPDATE NAVBAR PROFILE
========================================================= */

function updateNavbarProfile() {

    const initial =
        getInitial(currentUserName);


    navUserName.textContent =
        currentUserName;

    profileInitial.textContent =
        initial;

    dropdownUserName.textContent =
        currentUserName;

    dropdownUserEmail.textContent =
        currentUserEmail;

    dropdownProfileInitial.textContent =
        initial;

    formUserName.textContent =
        currentUserName;

    profileName.value =
        currentUserName;

    formProfileInitial.textContent =
        initial;


    if (currentUserAvatar) {

        profilePhotoImg.src =
            currentUserAvatar;

        profilePhotoImg.style.display =
            "block";

        profileInitial.style.display =
            "none";


        dropdownProfileImg.src =
            currentUserAvatar;

        dropdownProfileImg.style.display =
            "block";

        dropdownProfileInitial.style.display =
            "none";


        formProfileImage.src =
            currentUserAvatar;

        formProfileImage.style.display =
            "block";

        formProfileInitial.style.display =
            "none";

    } else {

        profilePhotoImg.style.display =
            "none";

        profileInitial.style.display =
            "flex";


        dropdownProfileImg.style.display =
            "none";

        dropdownProfileInitial.style.display =
            "flex";


        formProfileImage.style.display =
            "none";

        formProfileInitial.style.display =
            "flex";

    }

}


/* =========================================================
   INITIAL
========================================================= */

function getInitial(name) {

    if (!name) {
        return "U";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();

}


/* =========================================================
   LOAD STUDY PROFILES
========================================================= */

async function loadStudyProfiles() {

    studyPartnersGrid.innerHTML = `

        <div class="loading-state">
            Loading study partners...
        </div>

    `;


    const {
        data,
        error
    } = await supabaseClient
        .from("study_partners")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        studyPartnersGrid.innerHTML = "";

        Swal.fire({
            icon: "error",
            title: "Unable to load profiles",
            text: error.message
        });

        return;

    }


    allPartners = data || [];


    /*
       Don't show "not found" here.

       If there are simply no profiles yet,
       we show an empty informational message instead.
    */

    if (allPartners.length === 0) {

        resultsCount.textContent = "0";

        resultsText.textContent =
            "No study profiles have been created yet.";

        studyPartnersGrid.innerHTML = `

            <div class="not-found">

                <div class="not-found-icon">
                    <i class="bi bi-people"></i>
                </div>

                <h3>
                    No study profiles yet
                </h3>

                <p>
                    Be the first student to create a study profile.
                </p>

            </div>

        `;

        return;

    }


    renderPartners(allPartners);

}


/* =========================================================
   RENDER PARTNERS
========================================================= */

function renderPartners(partners) {

    studyPartnersGrid.innerHTML = "";


    resultsCount.textContent =
        partners.length;


    if (partners.length === 1) {

        resultsText.textContent =
            "1 study partner found.";

    } else {

        resultsText.textContent =
            `${partners.length} study partners found.`;

    }


    /*
       IMPORTANT:

       Only show "not found" after
       an actual search/filter.
    */

    const hasActiveFilter =
        searchInput.value.trim() !== "" ||
        subjectFilter.value !== "" ||
        skillFilter.value !== "" ||
        experienceFilter.value !== "";


    if (partners.length === 0 && hasActiveFilter) {

        notFound.classList.remove("hidden");

        return;

    }


    notFound.classList.add("hidden");


    partners.forEach(partner => {

        const card =
            createPartnerCard(partner);

        studyPartnersGrid.appendChild(card);

    });

    if (window.StudentHubAnim && typeof window.StudentHubAnim.animateCardsEntrance === "function") {
        window.StudentHubAnim.animateCardsEntrance(".partner-card");
    }

}


/* =========================================================
   CREATE PARTNER CARD
========================================================= */

function createPartnerCard(partner) {

    const card =
        document.createElement("article");

    card.className =
        "partner-card";


    const subjects =
        splitValues(partner.subjects);

    const skills =
        splitValues(partner.skills);


    const isOwnProfile =
        partner.user_id === currentUser?.id;


    const isConnected =
        connectedUsers.has(partner.user_id);

    const isPending =
        connectionRequests.has(partner.user_id);


    let connectButton = "";


    if (isOwnProfile) {

        connectButton = `

            <button
                class="connect-btn own-profile"
                disabled>

                Your Profile

            </button>

        `;

    } else if (isConnected) {

        connectButton = `

            <button
                class="connect-btn connected"
                disabled>

                <i class="bi bi-check-circle"></i>
                Connected

            </button>

        `;

    } else if (isPending) {

        connectButton = `

            <button
                class="connect-btn pending"
                disabled>

                <i class="bi bi-clock"></i>
                Request Sent

            </button>

        `;

    } else {

        connectButton = `

            <button
                class="connect-btn connect-partner-btn"
                data-user-id="${partner.user_id}">

                <i class="bi bi-person-plus"></i>
                Connect

            </button>

        `;

    }


    card.innerHTML = `

        <div class="partner-header">

            <div class="partner-picture">

                <span>
                    ${escapeHTML(getInitial(partner.name))}
                </span>

                ${
                    partner.profile_picture
                    ?
                    `
                    <img
                        src="${escapeAttribute(partner.profile_picture)}"
                        alt="${escapeAttribute(partner.name)}"
                        onerror="this.style.display='none'"
                    >
                    `
                    :
                    ""
                }

            </div>


            <div>

                <h3 class="partner-name">
                    ${escapeHTML(partner.name)}
                </h3>

                <span class="partner-level">
                    ${escapeHTML(partner.experience_level || "Student")}
                </span>

            </div>

        </div>


        <div class="partner-info">


            <div class="info-block">

                <span class="info-label">
                    Subjects
                </span>

                <div class="tags">

                    ${
                        subjects.length
                        ?
                        subjects.map(subject => `
                            <span class="tag">
                                ${escapeHTML(subject)}
                            </span>
                        `).join("")
                        :
                        `<span class="info-value">Not specified</span>`
                    }

                </div>

            </div>


            <div class="info-block">

                <span class="info-label">
                    Skills
                </span>

                <div class="tags">

                    ${
                        skills.length
                        ?
                        skills.map(skill => `
                            <span class="tag">
                                ${escapeHTML(skill)}
                            </span>
                        `).join("")
                        :
                        `<span class="info-value">Not specified</span>`
                    }

                </div>

            </div>


            <div class="info-block">

                <span class="info-label">
                    Availability
                </span>

                <span class="availability">

                    <i class="bi bi-clock"></i>

                    ${escapeHTML(
                        partner.availability ||
                        "Flexible"
                    )}

                </span>

            </div>


            <div class="info-block">

                <span class="info-label">
                    Introduction
                </span>

                <p class="partner-introduction">

                    "${escapeHTML(
                        partner.introduction ||
                        "No introduction provided."
                    )}"

                </p>

            </div>

        </div>


        <div class="partner-actions">

            <button
                class="view-btn view-profile-btn"
                data-user-id="${partner.user_id}">

                <i class="bi bi-person"></i>
                View Profile

            </button>

            ${connectButton}

        </div>

    `;


    /*
       CONNECT
    */

    const connectBtn =
        card.querySelector(".connect-partner-btn");


    if (connectBtn) {

        connectBtn.addEventListener(
            "click",
            () => sendConnectionRequest(partner)
        );

    }


    /*
       VIEW PROFILE
    */

    const viewBtn =
        card.querySelector(".view-profile-btn");


    viewBtn.addEventListener(
        "click",
        () => openProfile(partner)
    );


    return card;

}


/* =========================================================
   SPLIT VALUES
========================================================= */

function splitValues(value) {

    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);

}


/* =========================================================
   SEARCH + FILTER
========================================================= */

function applyFilters() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const subject =
        subjectFilter.value
            .trim()
            .toLowerCase();


    const skill =
        skillFilter.value
            .trim()
            .toLowerCase();


    const experience =
        experienceFilter.value
            .trim()
            .toLowerCase();


    const filtered =
        allPartners.filter(partner => {


            /*
               SEARCH

               Searches:
               name
               subjects
               skills
               introduction
               availability
            */

            const searchableText = [

                partner.name,
                partner.subjects,
                partner.skills,
                partner.introduction,
                partner.availability,
                partner.experience_level

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(search);


            /*
               SUBJECT
            */

            const subjects =
                splitValues(partner.subjects)
                    .map(item => item.toLowerCase());


            const matchesSubject =
                !subject ||
                subjects.some(item =>
                    item === subject
                );


            /*
               SKILL
            */

            const skills =
                splitValues(partner.skills)
                    .map(item => item.toLowerCase());


            const matchesSkill =
                !skill ||
                skills.some(item =>
                    item === skill
                );


            /*
               EXPERIENCE
            */

            const matchesExperience =
                !experience ||
                (
                    partner.experience_level &&
                    partner.experience_level
                        .toLowerCase() === experience
                );


            return (
                matchesSearch &&
                matchesSubject &&
                matchesSkill &&
                matchesExperience
            );

        });


    renderPartners(filtered);

}


/* =========================================================
   SEARCH EVENTS
========================================================= */

searchInput.addEventListener(
    "input",
    applyFilters
);

subjectFilter.addEventListener(
    "change",
    applyFilters
);

skillFilter.addEventListener(
    "change",
    applyFilters
);

experienceFilter.addEventListener(
    "change",
    applyFilters
);


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearFilters() {

    searchInput.value = "";

    subjectFilter.value = "";

    skillFilter.value = "";

    experienceFilter.value = "";

    renderPartners(allPartners);

}


clearFiltersBtn.addEventListener(
    "click",
    clearFilters
);

notFoundClearBtn.addEventListener(
    "click",
    clearFilters
);


/* =========================================================
   CREATE / EDIT PROFILE
========================================================= */

createProfileBtn.addEventListener(
    "click",
    openCreateProfile
);

editProfileBtn.addEventListener(
    "click",
    async () => {

        profileDropdown.classList.remove("show");

        await openEditProfile();

    }
);


async function openCreateProfile() {

    modalTitle.textContent =
        "Create Study Profile";

    clearProfileForm();

    profileName.value =
        currentUserName;

    profileModal.classList.add("show");

}


async function openEditProfile() {

    if (!currentStudyProfile) {

        await findCurrentStudyProfile();

    }


    if (!currentStudyProfile) {

        openCreateProfile();

        return;

    }


    modalTitle.textContent =
        "Edit Study Profile";


    profileName.value =
        currentStudyProfile.name || currentUserName;


    profileSubjects.value =
        currentStudyProfile.subjects || "";


    profileSkills.value =
        currentStudyProfile.skills || "";


    profileExperience.value =
        currentStudyProfile.experience_level || "";


    profileAvailability.value =
        currentStudyProfile.availability || "";


    profileIntroduction.value =
        currentStudyProfile.introduction || "";


    profileModal.classList.add("show");

}


/* =========================================================
   FIND MY PROFILE
========================================================= */

async function findCurrentStudyProfile() {

    const {
        data,
        error
    } = await supabaseClient
        .from("study_partners")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();


    if (error) {

        console.error(error);

        return null;

    }


    currentStudyProfile =
        data || null;


    return currentStudyProfile;

}


/* =========================================================
   CLEAR FORM
========================================================= */

function clearProfileForm() {

    profileSubjects.value = "";

    profileSkills.value = "";

    profileExperience.value = "";

    profileAvailability.value = "";

    profileIntroduction.value = "";

}


/* =========================================================
   SAVE PROFILE
========================================================= */

studyProfileForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) {

            return;

        }


        const subjects =
            profileSubjects.value.trim();

        const skills =
            profileSkills.value.trim();

        const experience =
            profileExperience.value;

        const availability =
            profileAvailability.value;

        const introduction =
            profileIntroduction.value.trim();


        if (
            !subjects ||
            !skills ||
            !experience ||
            !availability ||
            !introduction
        ) {

            Swal.fire({
                icon: "warning",
                title: "Complete your profile",
                text: "Please fill in all study profile fields."
            });

            return;

        }


        /*
           IMPORTANT:

           We use the SAME profile picture
           as the main StudentHub account.
        */

        const profilePicture =
            currentUserAvatar || null;


        /*
           Check if profile already exists.
        */

        const existing =
            await findCurrentStudyProfile();


        let error;


        if (existing) {

            const result =
                await supabaseClient
                    .from("study_partners")
                    .update({

                        name: currentUserName,

                        profile_picture:
                            profilePicture,

                        subjects,

                        skills,

                        experience_level:
                            experience,

                        availability,

                        introduction,

                        updated_at:
                            new Date().toISOString()

                    })
                    .eq("user_id", currentUser.id);


            error =
                result.error;


        } else {

            const result =
                await supabaseClient
                    .from("study_partners")
                    .insert({

                        user_id:
                            currentUser.id,

                        name:
                            currentUserName,

                        profile_picture:
                            profilePicture,

                        subjects,

                        skills,

                        experience_level:
                            experience,

                        availability,

                        introduction

                    });


            error =
                result.error;

        }


        if (error) {

            console.error(error);

            Swal.fire({
                icon: "error",
                title: "Could not save profile",
                text: error.message
            });

            return;

        }


        profileModal.classList.remove("show");


        Swal.fire({
            icon: "success",
            title: existing
                ? "Profile updated!"
                : "Profile created!",
            text: "Your study partner profile is now available.",
            timer: 1800,
            showConfirmButton: false
        });


        await findCurrentStudyProfile();

        await loadStudyProfiles();

    }
);


/* =========================================================
   VIEW PROFILE
========================================================= */

function openProfile(partner) {

    const subjects =
        splitValues(partner.subjects);

    const skills =
        splitValues(partner.skills);


    viewProfileContent.innerHTML = `

        <div class="view-profile-top">

            <div class="view-profile-picture">

                <span>
                    ${escapeHTML(
                        getInitial(partner.name)
                    )}
                </span>

                ${
                    partner.profile_picture
                    ?
                    `
                    <img
                        src="${escapeAttribute(partner.profile_picture)}"
                        alt="${escapeAttribute(partner.name)}"
                        onerror="this.style.display='none'"
                    >
                    `
                    :
                    ""
                }

            </div>


            <h2>
                ${escapeHTML(partner.name)}
            </h2>


            <span>
                ${escapeHTML(
                    partner.experience_level ||
                    "Student"
                )}
            </span>

        </div>


        <div class="view-info">

            <h4>
                📚 Subjects
            </h4>

            <div class="view-tags">

                ${
                    subjects.map(subject => `
                        <span class="view-tag">
                            ${escapeHTML(subject)}
                        </span>
                    `).join("")
                }

            </div>

        </div>


        <div class="view-info">

            <h4>
                🛠️ Skills
            </h4>

            <div class="view-tags">

                ${
                    skills.map(skill => `
                        <span class="view-tag">
                            ${escapeHTML(skill)}
                        </span>
                    `).join("")
                }

            </div>

        </div>


        <div class="view-info">

            <h4>
                🕐 Availability
            </h4>

            <p>
                ${escapeHTML(
                    partner.availability ||
                    "Flexible"
                )}
            </p>

        </div>


        <div class="view-info">

            <h4>
                💬 About
            </h4>

            <p>
                ${escapeHTML(
                    partner.introduction ||
                    "No introduction provided."
                )}
            </p>

        </div>


        ${
            partner.user_id !== currentUser?.id
            ?
            `
            <div style="margin-top:20px">

                <button
                    class="primary-btn"
                    style="width:100%"
                    id="modalConnectBtn">

                    <i class="bi bi-person-plus"></i>
                    Connect with ${escapeHTML(partner.name)}

                </button>

            </div>
            `
            :
            ""
        }

    `;


    viewProfileModal.classList.add("show");


    const modalConnectBtn =
        document.getElementById(
            "modalConnectBtn"
        );


    if (modalConnectBtn) {

        modalConnectBtn.addEventListener(
            "click",
            async () => {

                await sendConnectionRequest(
                    partner
                );

                viewProfileModal.classList.remove(
                    "show"
                );

            }
        );

    }

}


/* =========================================================
   CONNECTIONS
========================================================= */

async function loadConnections() {

    if (!currentUser) {
        return;
    }


    /*
       This expects a study_connections table.

       If you already created it, this will work
       immediately.
    */

    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("study_connections")
            .select("*")
            .or(
                `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
            );


        if (error) {

            console.log(
                "Connection table not available yet:",
                error.message
            );

            return;

        }


        connectionRequests.clear();

        connectedUsers.clear();


        (data || []).forEach(connection => {

            const otherUser =
                connection.sender_id === currentUser.id
                    ? connection.receiver_id
                    : connection.sender_id;


            if (
                connection.status === "pending" &&
                connection.sender_id === currentUser.id
            ) {

                connectionRequests.add(
                    otherUser
                );

            }


            if (
                connection.status === "accepted"
            ) {

                connectedUsers.add(
                    otherUser
                );

            }

        });


    } catch (error) {

        console.log(error);

    }

}


/* =========================================================
   SEND CONNECTION REQUEST
========================================================= */

async function sendConnectionRequest(partner) {

    if (!currentUser) {

        return;

    }


    if (
        partner.user_id === currentUser.id
    ) {

        return;

    }


    /*
       Already connected
    */

    if (
        connectedUsers.has(
            partner.user_id
        )
    ) {

        Swal.fire({
            icon: "info",
            title: "Already connected",
            text: `You are already connected with ${partner.name}.`
        });

        return;

    }


    /*
       Already requested
    */

    if (
        connectionRequests.has(
            partner.user_id
        )
    ) {

        Swal.fire({
            icon: "info",
            title: "Request already sent",
            text: `Your connection request to ${partner.name} is pending.`
        });

        return;

    }


    /*
       Insert request
    */

    const {
        error
    } = await supabaseClient
        .from("study_connections")
        .insert({

            sender_id:
                currentUser.id,

            receiver_id:
                partner.user_id,

            status:
                "pending"

        });


    if (error) {

        console.error(error);


        Swal.fire({
            icon: "error",
            title: "Connection failed",
            text: error.message
        });

        return;

    }


    connectionRequests.add(
        partner.user_id
    );


    renderPartners(
        getCurrentlyFilteredPartners()
    );


    Swal.fire({
        icon: "success",
        title: "Request sent!",
        text: `Your study connection request was sent to ${partner.name}.`,
        timer: 1800,
        showConfirmButton: false
    });

}


/* =========================================================
   GET CURRENT FILTERED PARTNERS
========================================================= */

function getCurrentlyFilteredPartners() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const subject =
        subjectFilter.value
            .trim()
            .toLowerCase();

    const skill =
        skillFilter.value
            .trim()
            .toLowerCase();

    const experience =
        experienceFilter.value
            .trim()
            .toLowerCase();


    return allPartners.filter(partner => {

        const searchableText = [

            partner.name,
            partner.subjects,
            partner.skills,
            partner.introduction,
            partner.availability,
            partner.experience_level

        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        const subjects =
            splitValues(partner.subjects)
                .map(x => x.toLowerCase());


        const skills =
            splitValues(partner.skills)
                .map(x => x.toLowerCase());


        return (

            (!search ||
                searchableText.includes(search))

            &&

            (!subject ||
                subjects.includes(subject))

            &&

            (!skill ||
                skills.includes(skill))

            &&

            (!experience ||
                (
                    partner.experience_level &&
                    partner.experience_level
                        .toLowerCase() === experience
                ))

        );

    });

}


/* =========================================================
   MODAL CLOSE
========================================================= */

closeModalBtn.addEventListener(
    "click",
    () => {

        profileModal.classList.remove("show");

    }
);


cancelModalBtn.addEventListener(
    "click",
    () => {

        profileModal.classList.remove("show");

    }
);


closeViewModalBtn.addEventListener(
    "click",
    () => {

        viewProfileModal.classList.remove(
            "show"
        );

    }
);


/* CLOSE WHEN CLICKING OUTSIDE */

profileModal.addEventListener(
    "click",
    event => {

        if (
            event.target === profileModal
        ) {

            profileModal.classList.remove(
                "show"
            );

        }

    }
);


viewProfileModal.addEventListener(
    "click",
    event => {

        if (
            event.target === viewProfileModal
        ) {

            viewProfileModal.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================================
   PROFILE DROPDOWN
========================================================= */

profileButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        profileDropdown.classList.toggle(
            "show"
        );

    }
);


document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".profile-menu-wrapper"
            )
        ) {

            profileDropdown.classList.remove(
                "show"
            );

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn.addEventListener(
    "click",
    async () => {

        const result =
            await Swal.fire({

                icon: "question",

                title: "Logout?",

                text: "Are you sure you want to logout?",

                showCancelButton: true,

                confirmButtonColor:
                    "#5b3bb5",

                confirmButtonText:
                    "Logout"

            });


        if (!result.isConfirmed) {
            return;
        }


        await supabaseClient.auth.signOut();


        window.location.href =
            "index.html";

    }
);


/* =========================================================
   PROFILE PICTURE CHANGE
========================================================= */

changePhotoBtn.addEventListener(
    "click",
    () => {

        profilePhotoInput.click();

    }
);


profilePhotoInput.addEventListener(
    "change",
    async event => {

        const file =
            event.target.files[0];


        if (!file) {
            return;
        }


        if (
            !file.type.startsWith("image/")
        ) {

            Swal.fire({
                icon: "error",
                title: "Invalid image",
                text: "Please select a valid image."
            });

            return;

        }


        /*
           Existing avatars bucket.

           We upload the image using the current
           user's ID so the same image can be
           reused throughout StudentHub.
        */

        const extension =
            file.name
                .split(".")
                .pop();


        const filePath =
            `${currentUser.id}/profile.${extension}`;


        const {
            error: uploadError
        } = await supabaseClient.storage
            .from("avatars")
            .upload(
                filePath,
                file,
                {
                    upsert: true
                }
            );


        if (uploadError) {

            console.error(uploadError);

            Swal.fire({
                icon: "error",
                title: "Upload failed",
                text: uploadError.message
            });

            return;

        }


        const {
            data
        } = supabaseClient.storage
            .from("avatars")
            .getPublicUrl(filePath);


        const publicUrl =
            data.publicUrl;


        currentUserAvatar =
            `${publicUrl}?t=${Date.now()}`;


        /*
           Update auth metadata too.
        */

        await supabaseClient.auth.updateUser({

            data: {
                avatar_url:
                    currentUserAvatar
            }

        });


        updateNavbarProfile();


        /*
           Update existing study profile
           automatically.
        */

        await supabaseClient
            .from("study_partners")
            .update({
                profile_picture:
                    currentUserAvatar,
                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "user_id",
                currentUser.id
            );


        await loadStudyProfiles();


        Swal.fire({
            icon: "success",
            title: "Profile picture updated!",
            timer: 1500,
            showConfirmButton: false
        });

    }
);


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}