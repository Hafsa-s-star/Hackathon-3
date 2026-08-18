 // ================= SUPABASE =================

const { createClient } = supabase;

const supabaseClient = createClient(
    "https://uiwmuwqarhngnhppqfqo.supabase.co",
    "sb_publishable_lXI3MvI6rVyWQKQ4P5r2ZA_zP8Ix1D7"
);


// ================= ELEMENTS =================

const userNameElement =
    document.getElementById("userName");

const navUserNameElement =
    document.getElementById("navUserName");

const profileInitial =
    document.getElementById("profileInitial");

const largeProfileInitial =
    document.getElementById("largeProfileInitial");

const profilePhotoInput =
    document.getElementById("profilePhotoInput");

const profilePhotoImg =
    document.getElementById("profilePhotoImg");

const largeProfilePhotoImg =
    document.getElementById("largeProfilePhotoImg");

const largeProfilePicture =
    document.getElementById("largeProfilePicture");

const logoutBtn =
    document.getElementById("logoutBtn");


// Profile dropdown

const profileButton =
    document.getElementById("profileButton");

const profileDropdown =
    document.getElementById("profileDropdown");

const editProfileBtn =
    document.getElementById("editProfileBtn");

const changePhotoBtn =
    document.getElementById("changePhotoBtn");

const dropdownUserName =
    document.getElementById("dropdownUserName");

const dropdownUserEmail =
    document.getElementById("dropdownUserEmail");

const dropdownProfileInitial =
    document.getElementById("dropdownProfileInitial");

const dropdownProfileImg =
    document.getElementById("dropdownProfileImg");


// ================= CURRENT USER =================

let currentUser = null;


// ================= LOAD USER =================

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


    console.log("Logged in user:", user);


    // ================= NAME =================

    const name =
        user.user_metadata?.display_name ||
        user.user_metadata?.first_name ||
        user.email?.split("@")[0] ||
        "Student";


    if (userNameElement) {
        userNameElement.textContent = name;
    }


    if (navUserNameElement) {
        navUserNameElement.textContent = name;
    }


    if (dropdownUserName) {
        dropdownUserName.textContent = name;
    }


    if (dropdownUserEmail) {
        dropdownUserEmail.textContent =
            user.email || "";
    }


    // ================= INITIAL =================

    const initial =
        name.charAt(0).toUpperCase();


    if (profileInitial) {
        profileInitial.textContent = initial;
    }


    if (largeProfileInitial) {
        largeProfileInitial.textContent = initial;
    }


    if (dropdownProfileInitial) {
        dropdownProfileInitial.textContent = initial;
    }



    // ================= PROFILE IMAGE =================

    const profileImage =
        user.user_metadata?.profile_picture;


     if (profileImage && largeProfilePhotoImg) {

        largeProfilePhotoImg.src =
            profileImage + "?t=" + Date.now();

        largeProfilePhotoImg.style.display =
            "block";


        if (largeProfileInitial) {

            largeProfileInitial.style.display =
                "none";

        }

    }

}


// ================= SHOW PROFILE PICTURE =================

function showProfilePicture(imageUrl) {

    // Navbar image

    if (profilePhotoImg) {

        profilePhotoImg.src = imageUrl;

        profilePhotoImg.style.display = "block";

    }


    // Big dashboard image

    if (largeProfilePhotoImg) {

        largeProfilePhotoImg.src = imageUrl;

        largeProfilePhotoImg.style.display = "block";

    }


    // Dropdown image

    if (dropdownProfileImg) {

        dropdownProfileImg.src = imageUrl;

        dropdownProfileImg.style.display = "block";

    }


    // Hide initials

    if (profileInitial) {

        profileInitial.style.display = "none";

    }


    if (largeProfileInitial) {

        largeProfileInitial.style.display = "none";

    }


    if (dropdownProfileInitial) {

        dropdownProfileInitial.style.display = "none";

    }

}


// ================= PROFILE DROPDOWN =================

if (profileButton) {

    profileButton.addEventListener(
        "click",
        function (e) {

            e.stopPropagation();

            profileDropdown.classList.toggle("show");

        }
    );

}


// Close dropdown when clicking outside

document.addEventListener(
    "click",
    function () {

        if (profileDropdown) {

            profileDropdown.classList.remove("show");

        }

    }
);


// Prevent dropdown itself from closing

if (profileDropdown) {

    profileDropdown.addEventListener(
        "click",
        function (e) {

            e.stopPropagation();

        }
    );

}


// ================= CHANGE PROFILE PHOTO =================

function openProfilePhotoSelector() {

    if (profilePhotoInput) {

        profilePhotoInput.click();

    }

}


if (changePhotoBtn) {

    changePhotoBtn.addEventListener(
        "click",
        function () {

            openProfilePhotoSelector();

        }
    );

}


// Big profile picture

 

// ================= PROFILE IMAGE UPLOAD =================

if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        async function () {

            const file =
                profilePhotoInput.files[0];


            if (!file) {
                return;
            }


            // ================= FILE TYPE =================

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

                    text:
                        "Please select a JPG, PNG or WEBP image."

                });

                profilePhotoInput.value = "";

                return;

            }


            // ================= FILE SIZE =================

            if (file.size > 5 * 1024 * 1024) {

                Swal.fire({

                    icon: "error",

                    title: "Image Too Large",

                    text:
                        "Please select an image smaller than 5MB."

                });

                profilePhotoInput.value = "";

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


                // ================= FIXED FILE PATH =================

                const filePath =
                    `profiles/${currentUser.id}/avatar`;


                // ================= UPLOAD =================

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


                // ================= PUBLIC URL =================

                const {
                    data: publicUrlData
                } =
                    supabaseClient
                        .storage
                        .from("avatars")
                        .getPublicUrl(filePath);


                const imageUrl =
                    publicUrlData.publicUrl;


                // ================= SAVE URL =================

                const {
                    error: updateError
                } =
                    await supabaseClient.auth.updateUser({

                        data: {

                            profile_picture:
                                imageUrl

                        }

                    });


                if (updateError) {

                    throw updateError;

                }


                // ================= DISPLAY =================

                showProfilePicture(
                    imageUrl + "?t=" + Date.now()
                );


                Swal.fire({

                    icon: "success",

                    title:
                        "Profile Picture Updated!",

                    text:
                        "Your profile picture has been saved.",

                    confirmButtonText: "OK"

                });


                profilePhotoInput.value = "";


            } catch (error) {

                console.error(
                    "Profile Upload Error:",
                    error
                );


                Swal.fire({

                    icon: "error",

                    title:
                        "Upload Failed",

                    text:
                        error.message

                });

            }

        }
    );

}


// ================= EDIT PROFILE =================

if (editProfileBtn) {

    editProfileBtn.addEventListener(
        "click",
        async function () {

            const currentName =
                currentUser
                    ?.user_metadata
                    ?.display_name || "";


            const result =
                await Swal.fire({

                    title: "Edit Profile",

                    html: `

                        <input
                            id="editName"
                            class="swal2-input"
                            placeholder="Your name"
                            value="${currentName}"
                        >

                    `,

                    confirmButtonText:
                        "Save Changes",

                    showCancelButton: true,

                    cancelButtonText:
                        "Cancel",

                    focusConfirm: false,

                    preConfirm: () => {

                        const name =
                            document
                                .getElementById("editName")
                                .value
                                .trim();


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

                        display_name:
                            newName

                    }

                });


            if (error) {

                Swal.fire({

                    icon: "error",

                    title:
                        "Update Failed",

                    text:
                        error.message

                });

                return;

            }


            // Update current user

            currentUser = data.user;


            // Update UI

            if (userNameElement) {

                userNameElement.textContent =
                    newName;

            }


            if (navUserNameElement) {

                navUserNameElement.textContent =
                    newName;

            }


            if (dropdownUserName) {

                dropdownUserName.textContent =
                    newName;

            }


            const newInitial =
                newName
                    .charAt(0)
                    .toUpperCase();


            if (
                !currentUser.user_metadata
                    ?.profile_picture
            ) {

                if (profileInitial) {

                    profileInitial.textContent =
                        newInitial;

                }


                if (largeProfileInitial) {

                    largeProfileInitial.textContent =
                        newInitial;

                }


                if (dropdownProfileInitial) {

                    dropdownProfileInitial.textContent =
                        newInitial;

                }

            }


            Swal.fire({

                icon: "success",

                title:
                    "Profile Updated!",

                text:
                    "Your profile has been updated.",

                confirmButtonText: "OK"

            });

        }
    );

}


// ================= LOGOUT =================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            const result =
                await Swal.fire({

                    icon: "question",

                    title: "Logout?",

                    text:
                        "Are you sure you want to logout?",

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

                console.error(
                    "Logout Error:",
                    error
                );

                Swal.fire({

                    icon: "error",

                    title:
                        "Logout Failed",

                    text:
                        error.message

                });

                return;

            }


            window.location.href =
                "index.html";

        }
    );

}


// ================= START =================

loadUser();