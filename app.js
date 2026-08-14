 // Get both form containers
const signUpFormContainer = document.getElementById("signUpFormContainer");
const loginFormContainer = document.getElementById("loginFormContainer");

// Get the links
const showLogin = document.getElementById("showLogin");
const showSignup = document.getElementById("showSignup");


// ================= SHOW LOGIN =================

showLogin.addEventListener("click", function (e) {
    e.preventDefault();

    // Hide signup
    signUpFormContainer.classList.add("d-none");

    // Show login
    loginFormContainer.classList.remove("d-none");
});


// ================= SHOW SIGNUP =================

showSignup.addEventListener("click", function (e) {
    e.preventDefault();

    // Hide login
    loginFormContainer.classList.add("d-none");

    // Show signup
    signUpFormContainer.classList.remove("d-none");
});