const role = document.querySelectorAll(".role");
let selectedRoleLogin = "";
const signupRoles = document.querySelectorAll(".s_role");
let selectedRoleSignUp = "";
const home_icon = document.querySelector("#home_icon");
home_icon.addEventListener("click", () => {
  window.location.href = ".././index.html";
});

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
  });
});

signupBack.addEventListener("click", () => {
  signup_form.classList.remove("hidden");
  owner_form.classList.add("hidden");
  sp_form.classList.add("hidden");
  mma_form.classList.add("hidden");
  signUpBtn.classList.add("hidden");
  signupBack.classList.add("hidden");
});

// Helper Function for Final Submit Email Validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Global users array
let users = [];

async function fetchUser() {
  try {
    const response = await fetch("../data/users.json");
    const jsonUsers = await response.json();

    let localUsers = JSON.parse(localStorage.getItem("newUsers")) || [];
    if (!Array.isArray(localUsers)) localUsers = [localUsers];

    users = [...jsonUsers, ...localUsers];
  } catch (error) {
    console.log("Error loading users:", error);
  }
}
fetchUser();

// --- LOGIN VALIDATION & SUBMIT ---
const loginBtn = document.querySelector(".btn");
loginBtn.addEventListener("click", searchUser);

function searchUser() {
  const errorBox = document.getElementById("loginError");
  let email = document.querySelector("#log_email").value.trim();
  let password = document.querySelector("#log_pass").value.trim();

  errorBox.classList.remove("show");

  if (!selectedRoleLogin) {
    errorBox.textContent = "Please select a role.";
    errorBox.classList.add("show");
    return;
  }
  if (!email || !password) {
    errorBox.textContent = "Please enter both email and password.";
    errorBox.classList.add("show");
    return;
  }
  if (!isValidEmail(email)) {
    errorBox.textContent = "Please enter a valid email address.";
    errorBox.classList.add("show");
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
      errorBox.textContent = "Invalid Credentials. User not found.";
      errorBox.classList.add("show");
    }
  } catch (error) {
    console.log(error);
  }
}

// --- SIGNUP VALIDATION & SUBMIT ---
signUpBtn.addEventListener("click", function (e) {
  e.preventDefault();
  const errorBox = document.querySelector("#signupError");
  errorBox.classList.remove("show");

  if (!selectedRoleSignUp) {
    errorBox.textContent = "Please select a role.";
    errorBox.classList.add("show");
    return;
  }

  let activeForm;
  if (selectedRoleSignUp === "Owner") activeForm = owner_form;
  else if (selectedRoleSignUp === "Service Provider") activeForm = sp_form;
  else activeForm = mma_form;

  const inputs = activeForm.querySelectorAll("input");
  const email = inputs[0].value.trim();
  const password = inputs[1].value.trim();
  let propertyUnit = "";
  let communityName = "";

  if (!email || !password) {
    errorBox.textContent = "Please enter both email and password.";
    errorBox.classList.add("show");
    return;
  }
  if (!isValidEmail(email)) {
    errorBox.textContent = "Please enter a valid email address.";
    errorBox.classList.add("show");
    return;
  }
  if (password.length < 6) {
    errorBox.textContent = "Password must be at least 6 characters long.";
    errorBox.classList.add("show");
    return;
  }

  if (selectedRoleSignUp === "Owner") {
    propertyUnit = inputs[2].value.trim();
    communityName = inputs[3].value.trim();
    if (!propertyUnit || !communityName) {
      errorBox.textContent =
        "Please enter your Property Unit and Community Name.";
      errorBox.classList.add("show");
      return;
    }
  } else if (
    selectedRoleSignUp === "Maintenance Manager" ||
    selectedRoleSignUp === "Administrator"
  ) {
    communityName = inputs[2].value.trim();
    if (!communityName) {
      errorBox.textContent = "Please enter your Community Name.";
      errorBox.classList.add("show");
      return;
    }
  }

  const exists = users.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() &&
      u.role.toLowerCase() === selectedRoleSignUp.toLowerCase(),
  );

  if (exists) {
    errorBox.textContent = "A user already exists with this email and role.";
    errorBox.classList.add("show");
    return;
  }

  const newUser = {
    id: Date.now(),
    email: email,
    password: password,
    role: selectedRoleSignUp,
    propertyUnit: propertyUnit,
    communityName: communityName,
  };

  let localUsers = JSON.parse(localStorage.getItem("newUsers")) || [];
  if (!Array.isArray(localUsers)) localUsers = [localUsers];

  localUsers.push(newUser);
  localStorage.setItem("newUsers", JSON.stringify(localUsers));

  users.push(newUser);

  alert("Account successfully created! Please log in.");

  inputs.forEach((input) => (input.value = ""));
  document.querySelectorAll(".toggleBtn")[1].click();
});

// --- SLIDING ANIMATION ---
const toggleBtn = document.querySelectorAll(".toggleBtn");
let toggle = 0; // 0-login, 1-signup
const center_box = document.querySelector(".center_box");
const box = document.querySelectorAll(".box");
const content = document.querySelectorAll(".content");

toggleBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    document.getElementById("loginError").classList.remove("show");
    document.getElementById("signupError").classList.remove("show");

    if (toggle === 0) {
      center_box.style.flexDirection = "row-reverse";
      box[0].classList.add("hidden");
      box[1].classList.remove("hidden");
      content[0].classList.add("hidden");
      content[1].classList.remove("hidden");
      box[1].style.borderRadius = "30px 210px 210px 30px";
      toggle = 1;
    } else {
      center_box.style.flexDirection = "row";
      box[1].classList.add("hidden");
      box[0].classList.remove("hidden");
      content[0].classList.remove("hidden");
      content[1].classList.add("hidden");
      toggle = 0;
    }
  });
});

// --- REAL-TIME INPUT VALIDATION (NEW) ---
function showFieldError(input, message) {
  // Check if we already have a span for this input to avoid duplicates
  let errorSpan = input.nextElementSibling;
  if (!errorSpan || !errorSpan.classList.contains("realtime-error")) {
    errorSpan = document.createElement("span");
    errorSpan.className = "realtime-error error-message show";
    // Small inline styles so you don't need to change CSS
    errorSpan.style.fontSize = "12px";
    errorSpan.style.marginTop = "-5px";
    errorSpan.style.marginBottom = "5px";
    errorSpan.style.textAlign = "left";
    errorSpan.style.width = "300px";
    errorSpan.style.display = "block";
    input.parentNode.insertBefore(errorSpan, input.nextSibling);
  }
  errorSpan.textContent = message;
}

function clearFieldError(input) {
  const errorSpan = input.nextElementSibling;
  if (errorSpan && errorSpan.classList.contains("realtime-error")) {
    errorSpan.remove();
  }
}

// Attach listeners to all Email fields
document.querySelectorAll('input[type="email"]').forEach((emailInput) => {
  emailInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val.length > 0 && !val.includes("@")) {
      showFieldError(e.target, "Please include an '@' in the email address.");
    } else {
      clearFieldError(e.target);
    }
  });
});

// Attach listeners to all Password fields
document.querySelectorAll('input[type="password"]').forEach((passInput) => {
  passInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val.length > 0 && val.length < 6) {
      showFieldError(e.target, "Password must be at least 6 characters.");
    } else {
      clearFieldError(e.target);
    }
  });
});
