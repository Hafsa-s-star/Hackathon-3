// ================= SUPABASE =================

const { createClient } = supabase;

const supabaseClient = createClient(
    "https://uiwmuwqarhngnhppqfqo.supabase.co",
    "sb_publishable_lXI3MvI6rVyWQKQ4P5r2ZA_zP8Ix1D7"
);


// ================= FORM ELEMENTS =================

const signUpFormContainer = document.getElementById("signUpFormContainer");
const loginFormContainer = document.getElementById("loginFormContainer");

const signUpForm = document.getElementById("signUpForm");
const loginForm = document.getElementById("loginForm");

const showLogin = document.getElementById("showLogin");
const showSignup = document.getElementById("showSignup");

const googleSignup = document.getElementById("googleSignup");
const googleLogin = document.getElementById("googleLogin");


// ================= SWITCH TO LOGIN =================

showLogin.addEventListener("click", function (e) {

    e.preventDefault();

    signUpFormContainer.classList.add("d-none");
    loginFormContainer.classList.remove("d-none");

    loginForm.reset();

});


// ================= SWITCH TO SIGNUP =================

showSignup.addEventListener("click", function (e) {

    e.preventDefault();

    loginFormContainer.classList.add("d-none");
    signUpFormContainer.classList.remove("d-none");

    signUpForm.reset();

});


// ================= SIGN UP =================

signUpForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const firstName =
        document.getElementById("inputFirstName").value.trim();

    const lastName =
        document.getElementById("inputLastName").value.trim();

    const email =
        document.getElementById("inputEmail").value.trim();

    const password =
        document.getElementById("inputPassword").value;

    const phone =
        document.getElementById("inputNumber").value.trim();

    const city =
        document.getElementById("inputCity").value.trim();


    const fullName = `${firstName} ${lastName}`;


    try {

        const { data, error } =
            await supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        display_name: fullName,

                        first_name: firstName,

                        last_name: lastName,

                        phone: phone,

                        city: city,

                        role: "user"

                    }

                }

            });


        if (error) {
            throw error;
        }


        signUpForm.reset();


        await Swal.fire({

            icon: "success",

            title: "Signup Successful!",

            text: `Welcome ${fullName} to our website!`,

            confirmButtonText: "Go to Dashboard"

        });


        window.location.href = "dashboard.html";


    } catch (error) {

        console.error("Signup Error:", error);


        Swal.fire({

            icon: "error",

            title: "Signup Failed",

            text: error.message

        });

    }

});


// ================= LOGIN =================

loginForm.addEventListener("submit", async function (e) {

    e.preventDefault();


    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    try {

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (error) {
            throw error;
        }


        console.log("Logged in user:", data.user);


        // Get user's name from Supabase
        const fullName =
            data.user.user_metadata?.display_name ||
            data.user.email?.split("@")[0] ||
            "Student";


        loginForm.reset();


        await Swal.fire({

            icon: "success",

            title: "Login Successful!",

            text: `Welcome back ${fullName}!`,

            confirmButtonText: "Go to Dashboard"

        });


        window.location.href = "dashboard.html";


    } catch (error) {

        console.error("Login Error:", error);


        Swal.fire({

            icon: "error",

            title: "Login Failed",

            text: error.message

        });

    }

});


// ================= GOOGLE SIGN IN =================


// Google Signup

googleSignup.addEventListener("click", async function () {

    const { error } =
        await supabaseClient.auth.signInWithOAuth({

            provider: "google",

            options: {

                redirectTo:
                    window.location.origin + "/dashboard.html"

            }

        });


    if (error) {

        console.error("Google Signup Error:", error);

        Swal.fire({

            icon: "error",

            title: "Google Signup Failed",

            text: error.message

        });

    }

});


// Google Login

googleLogin.addEventListener("click", async function () {

    const { error } =
        await supabaseClient.auth.signInWithOAuth({

            provider: "google",

            options: {

                redirectTo:
                    window.location.origin + "/dashboard.html"

            }

        });


    if (error) {

        console.error("Google Login Error:", error);

        Swal.fire({

            icon: "error",

            title: "Google Login Failed",

            text: error.message

        });

    }

});


// ================= CHECK ACTIVE SESSION =================

async function checkActiveSession() {

    const {
        data: { session },
        error
    } = await supabaseClient.auth.getSession();


    if (error) {

        console.error("Session Error:", error);

        return;

    }


    // Already logged in
    if (session) {

        console.log(
            "Active session found:",
            session.user
        );

        window.location.href = "dashboard.html";

        return;

    }


    console.log("No active session.");

}


// Run once
checkActiveSession();