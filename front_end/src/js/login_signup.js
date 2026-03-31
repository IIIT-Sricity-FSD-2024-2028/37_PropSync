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
    document.querySelectorAll(".signupBack").forEach((ele) => {
      ele.addEventListener("click", () => {
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
});

// login form submit
const login = document.querySelector(".btn");
login.addEventListener("click", fetchUser);

async function fetchUser() {
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
    const response = await fetch(".././data/users.json");
    const users = await response.json();

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password &&
        u.role.toLowerCase() === selectedRoleLogin.toLowerCase(),
    );

    if (user) {
      errorBox.classList.remove("show");
      alert("Login Successful");

      // optional redirect
      // window.location.href = "dashboard.html";
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

//Signup form validation
function validateInputs(formData) {
  let valid = true;

  if (!formData.email.trim()) {
    showError(formData.role + "EmailError", "Email is required");
    valid = false;
  }

  if (!formData.password.trim()) {
    showError(formData.role + "PasswordError", "Password is required");
    valid = false;
  }

  if (formData.role === "Owner") {
    if (!formData.propertyUnit.trim()) {
      showError("propertyUnitError", "Property unit is required");
      valid = false;
    }

    if (!formData.communityName.trim()) {
      showError("communityNameError", "Community name is required");
      valid = false;
    }
  }

  if (
    formData.role === "Maintenance Manager" ||
    formData.role === "Administrator"
  ) {
    if (!formData.communityName.trim()) {
      showError("communityNameError", "Community name is required");
      valid = false;
    }
  }

  return valid;
}

//get form data
function getFormData(role) {
  if (role === "Owner") {
    return {
      role,
      email: document.getElementById("#Owner_form input[type='email']").value,

      password: document.getElementById("#Owner_form input[type='password']")
        .value,

      propertyUnit: document.getElementById("propertyUnit").value,

      communityName: document.getElementById("communityName").value,
    };
  }

  if (role === "Service Provider") {
    return {
      role,
      email: document.querySelector("#SP_form input[type='email']").value,

      password: document.querySelector("#SP_form input[type='password']").value,
    };
  }

  return {
    role,
    email: document.querySelector("#MMA_form input[type='email']").value,

    password: document.querySelector("#MMA_form input[type='password']").value,

    communityName: document.querySelector("#MMA_form input[type='text']").value,
  };
}

//new user creation
function createUser(formData) {
  const newUser = {
    id: Date.now(),
    role: formData.role,
    email: formData.email,
    password: formData.password,
    propertyUnit: formData.propertyUnit || "",
    communityName: formData.communityName || "",
  };

  users.push(newUser); //storing new user

  return newUser;
}
/*
document.querySelectorAll("#signupBtn").forEach((btn) => {
  btn.addEventListener("click", handleSignup);
});
*/

function handleSignup() {
  if (!selectedRoleSignUp) {
    alert("Please select a role");
    return;
  }

  const formData = getFormData(selectedRoleSignUp);
  const isValid = validateInputs(formData);
  if (!isValid) return;
  createUser(formData);
  alert("Signup Successful");
}
