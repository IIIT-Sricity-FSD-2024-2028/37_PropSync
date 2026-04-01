// selecting role
const role = document.querySelectorAll(".role");
let selectedRoleLogin = "";
const signupRoles = document.querySelectorAll(".s_role");
let selectedRoleSignUp = "";

function removeActive(element) {
  element.forEach((ele) => {
    ele.classList.remove("active");
  });
}

role.forEach((ele) => {
  ele.addEventListener("click", () => {
    removeActive(role);

    ele.classList.add("active");
    selectedRoleLogin = ele.querySelector("p").innerText.trim();
  });
});

const signup_form = document.querySelector("#signup_form");
const owner_form = document.querySelector("#Owner_form");
const sp_form = document.querySelector("#SP_form");
const mma_form = document.querySelector("#MMA_form");
const signUpBtn = document.querySelector("#signupBtn");
const signupBack = document.querySelector(".signupBack");

signupRoles.forEach((role) => {
  role.addEventListener("click", () => {
    removeActive(signupRoles);
    role.classList.add("active");
    selectedRoleSignUp = role.querySelector("p").innerText.trim();
    signup_form.classList.add("hidden");
    if (selectedRoleSignUp === "Owner") {
      owner_form.classList.remove("hidden");
    } else if (selectedRoleSignUp === "Service Provider") {
      sp_form.classList.remove("hidden");
    } else if (
      selectedRoleSignUp === "Maintenance Manager" ||
      selectedRoleSignUp === "Administrator"
    ) {
      mma_form.classList.remove("hidden");
    }
    signUpBtn.classList.remove("hidden");
    signupBack.classList.remove("hidden");
    signupBack.addEventListener("click", () => {
      signup_form.classList.remove("hidden");
      if (selectedRoleSignUp === "Owner") {
        owner_form.classList.add("hidden");
      } else if (selectedRoleSignUp === "Service Provider") {
        sp_form.classList.add("hidden");
      } else if (
        selectedRoleSignUp === "Maintenance Manager" ||
        selectedRoleSignUp === "Administrator"
      ) {
        mma_form.classList.add("hidden");
      }
    });
  });
});

// login form submit
const login = document.querySelector(".btn");
login.addEventListener("click", searchUser);

let users = [];

async function fetchUser() {
  try {
    const response = await fetch("../data/users.json");
    const jsonUsers = await response.json();
    const localUsers = JSON.parse(localStorage.getItem("newUser")) || [];
    users = [...jsonUsers, localUsers];

    console.log(users);
  } catch (error) {
    console.log("Error loading users:", error);
  }
}
fetchUser();

function searchUser() {
  const errorBox = document.getElementById("loginError");
  let email = document.querySelector("#log_email").value.trim();
  let password = document.querySelector("#log_pass").value.trim();

  if (!selectedRoleLogin) {
    errorBox.classList.add("show");
    errorBox.textContent = "Please select a role.";
    return;
  } else if (!email || !password) {
    errorBox.classList.add("show");
    errorBox.textContent = "Please enter all details.";
    return;
  }

  try {
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.role.toLowerCase() === selectedRoleLogin.toLowerCase(),
    );

    if (user) {
      errorBox.classList.remove("show");
      alert("Login Successful");

      if (selectedRoleLogin === "Owner")
        window.location.href = "./owner/dashboard.html";
      else if (selectedRoleLogin === "Service Provider")
        window.location.href = "./service_provider/index.html";
      else if (selectedRoleLogin === "Maintenance Manager")
        window.location.href = "./maintenance_manager/dashboard.html";
      else window.location.href = "./admin/index.html";
    } else {
      errorBox.classList.add("show");
      errorBox.textContent = "Invalid Credentials, User not Found";
      document.querySelector("#log_email").value = "";
      document.querySelector("#log_pass").value = "";
      removeActive(role);
    }
  } catch (error) {
    console.log(error);
  }
}

//Signup sliding animation
const toggleBtn = document.querySelectorAll(".toggleBtn");
let toggle = 0; // 0-login, 1-signup
const center_box = document.querySelector(".center_box");
const box = document.querySelectorAll(".box");
const content = document.querySelectorAll(".content");

toggleBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (toggle == 0) {
      center_box.style.flexDirection = "row-reverse";

      box[0].classList.add("hidden");
      box[1].classList.remove("hidden");

      content[0].classList.add("hidden");
      content[1].classList.remove("hidden");

      box[1].style.borderRadius = "30px 210px 210px 30px";
      toggle = 1;
    } else if (toggle == 1) {
      center_box.style.flexDirection = "row";

      box[1].classList.add("hidden");
      box[0].classList.remove("hidden");

      content[0].classList.remove("hidden");
      content[1].classList.add("hidden");

      toggle = 0;
    }
  });
});

// SIGNUP WITH LOCAL STORAGE

function handleSignup(form, roleName) {
  signUpBtn.addEventListener("click", function (e) {
    const Signup_errorBox = document.querySelector("#signupError");
    const email = form.querySelectorAll("input")[0].value.trim();
    const password = form.querySelectorAll("input")[1].value.trim();
    if (roleName === "Owner") {
      const propertyUnit = form.querySelectorAll("input")[2].value.trim();
      const communityName = form.querySelectorAll("input")[3].value.trim();
    } else if (
      roleName === "Maintenance Manager" ||
      roleName === "Administrator"
    ) {
      const communityName = form.querySelectorAll("input")[2].value.trim();
    }

    if (!email || !password) {
      Signup_errorBox.classList.add("show");
      Signup_errorBox.textContent = "Please enter all details.";
      return;
    }

    const exists = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.role.toLowerCase() === selectedRoleLogin.toLowerCase(),
    );
    if (exists) {
      Signup_errorBox.classList.add("show");
      Signup_errorBox.textContent = "User already exists with this email.";
      return;
    }

    const newUser = {
      id: Date.now(),
      email: email,
      password: password,
      role: roleName,
      propertyUnit: propertyUnit || "",
      communityName: communityName || "",
    };

    localStorage.setItem("newUser", JSON.stringify(newUser));
    Signup_errorBox.classList.remove("show");
    alert("Account successfully created!");
  });
}
handleSignup(owner_form, "Owner");
handleSignup(sp_form, "Service Provider");
handleSignup(mma_form, "Maintenance Manager");

const superUser = document.querySelector("#superUser");
superUser.addEventListener("click", checkPin);
function checkPin() {
  const correctPin = "1234";
  const userPin = prompt("Enter your PIN:");

  if (userPin === null) {
    alert("Cancelled");
  } else if (userPin.trim() === "") {
    alert("PIN cannot be empty");
  } else if (userPin === correctPin) {
    window.location.href = "../super_user/index.html";
  } else {
    alert("Wrong PIN");
  }
}
