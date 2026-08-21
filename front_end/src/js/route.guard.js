(function () {
  const LOGIN_PAGE = "login_signup.html";
  const ROLE_HOME = {
    owner: "../owner/dashboard.html",
    service_provider: "../service_provider/index.html",
    maintenance_manager: "../maintenance_manager/dashboard.html",
    manager: "../maintenance_manager/dashboard.html",
    admin: "../admin/index.html",
  };
  const FOLDER_ROLES = {
    owner: ["owner"],
    service_provider: ["service_provider"],
    maintenance_manager: ["maintenance_manager", "manager"],
    admin: ["admin"],
    super_user: ["admin"],
  };

  const pathParts = window.location.pathname
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);
  const folder = pathParts[pathParts.length - 2] || "";
  const allowedRoles = FOLDER_ROLES[folder];

  if (!allowedRoles) return;

  document.documentElement.style.visibility = "hidden";

  function redirectToLogin() {
    window.location.replace("../" + LOGIN_PAGE);
  }

  function normalizeRole(role) {
    return String(role || "")
      .trim()
      .toLowerCase();
  }

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("currentUser"));
  } catch (_) {
    user = null;
  }

  const role = normalizeRole(user && user.role);
  const hasAccess = role && allowedRoles.includes(role);

  if (!hasAccess) {
    redirectToLogin();
    return;
  }

  window.PS_CURRENT_USER = user;
  window.PS_CURRENT_ROLE = role;
  window.PS_ROLE_HEADER =
    role === "maintenance_manager" ? "maintenance_manager" : role;

  document.addEventListener("DOMContentLoaded", function () {
    document.documentElement.style.visibility = "";
    document
      .querySelectorAll(
        'a[href*="login_signup.html"], button[id*="logout"], button[class*="logout"]',
      )
      .forEach(function (el) {
        el.addEventListener("click", function () {
          localStorage.removeItem("currentUser");
        });
      });
  });

  window.psLogout = function () {
    localStorage.removeItem("currentUser");
    redirectToLogin();
  };
})();
