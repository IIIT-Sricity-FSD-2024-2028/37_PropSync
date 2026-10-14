import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../services/api";
import "./LoginSignup.css";

const HomeIcon = () => {
  const navigate = useNavigate();
  return (
    <div
      id="home_icon"
      onClick={() => navigate("/")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate("/")}
      aria-label="Return to home page"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
      >
        <path
          d="M15 36.6666V20H25V36.6666M5 15L20 3.33331L35 15V33.3333C35 34.2174 34.6488 35.0652 34.0237 35.6903C33.3986 36.3155 32.5507 36.6666 31.6667 36.6666H8.33333C7.44928 36.6666 6.60143 36.3155 5.97631 35.6903C5.35119 35.0652 5 34.2174 5 33.3333V15Z"
          stroke="#F3F3F3"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const SuperUserBtn = () => {
  const navigate = useNavigate();
  return (
    <button id="superUser" type="button" onClick={() => navigate("/super_user")}>
      Open Super User
    </button>
  );
};

const RoleSelector = ({ roles, selectedRole, onRoleSelect }) => {
  return (
    <div className="roles">
      {roles.map((role) => (
        <button
          type="button"
          key={role}
          className={`role ${selectedRole === role ? "active" : ""}`}
          aria-pressed={selectedRole === role}
          onClick={() => onRoleSelect(role)}
        >
          {role}
        </button>
      ))}
    </div>
  );
};

const LoginForm = ({ onLogin, isHidden }) => {
  const [selectedRole, setSelectedRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const roles = [
    "Owner",
    "Service Provider",
    "Maintenance Manager",
    "Administrator",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedRole) return setError("Please select a role.");
    if (!email || !password)
      return setError("Please enter both email and password.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Please enter a valid email address.");

    onLogin(email, password, selectedRole, setError);
  };

  return (
    <div className={`content ${isHidden ? "hidden" : ""}`}>
      <h1 className="heading1">PROPSYNC</h1>
      <h2 className="heading2">Log In</h2>
      <div id="login_form">
        <div className={`error-message ${error ? "show" : ""}`}>{error}</div>
        <p>Select Your Role:</p>
        <RoleSelector
          roles={roles}
          selectedRole={selectedRole}
          onRoleSelect={setSelectedRole}
        />
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn" type="submit">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

const SignupForm = ({ onSignup, isHidden }) => {
  const [selectedRole, setSelectedRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [propertyUnit, setPropertyUnit] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const roles = [
    "Owner",
    "Service Provider",
    "Maintenance Manager",
    "Administrator",
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(2);
    setError("");
  };

  const handleBack = () => {
    setStep(1);
    setSelectedRole("");
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password)
      return setError("Please enter both email and password.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Please enter a valid email address.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters long.");

    if (selectedRole === "Owner") {
      if (!propertyUnit || !communityName)
        return setError("Please enter your Property Unit and Community Name.");
    } else if (
      selectedRole === "Maintenance Manager" ||
      selectedRole === "Administrator"
    ) {
      if (!communityName) return setError("Please enter your Community Name.");
    }

    onSignup(
      email,
      password,
      selectedRole,
      propertyUnit,
      communityName,
      setError,
      handleBack,
    );
  };

  return (
    <div className={`content ${isHidden ? "hidden" : ""}`}>
      <h1 className="heading1">PROPSYNC</h1>
      <h2 className="heading2">Sign Up</h2>
      <div className={`error-message ${error ? "show" : ""}`}>{error}</div>

      {step === 1 ? (
        <div id="signup_form" style={{ width: "100%" }}>
          <p>Select Your Role:</p>
          <div className="s_roles">
            {roles.map((role) => (
              <button
                type="button"
                key={role}
                className={`s_role ${selectedRole === role ? "active" : ""}`}
                onClick={() => handleRoleSelect(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {selectedRole === "Owner" && (
            <>
              <input
                type="text"
                placeholder="Property unit"
                value={propertyUnit}
                onChange={(e) => setPropertyUnit(e.target.value)}
              />
              <input
                type="text"
                placeholder="Community name"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
              />
            </>
          )}

          {(selectedRole === "Maintenance Manager" ||
            selectedRole === "Administrator") && (
            <input
              type="text"
              placeholder="Community name"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
            />
          )}

          <button className="btn" type="submit">
            Sign Up
          </button>
          <a
            className="signupBack"
            onClick={handleBack}
            style={{ cursor: "pointer", marginTop: "10px" }}
          >
            ← Back
          </a>
        </form>
      )}
    </div>
  );
};

export default function LoginSignup({ initialMode }) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const modeParam = searchParams.get("mode") || location.state?.mode;
  const isInitialSignup =
    initialMode === "signup" ||
    location.pathname === "/signup" ||
    modeParam === "signup";

  const [isLoginView, setIsLoginView] = useState(!isInitialSignup);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (
      initialMode === "signup" ||
      location.pathname === "/signup" ||
      modeParam === "signup"
    ) {
      setIsLoginView(false);
    } else if (
      initialMode === "login" ||
      location.pathname === "/login" ||
      modeParam === "login"
    ) {
      setIsLoginView(true);
    }
  }, [initialMode, location.pathname, modeParam]);

  const toggleView = () => {
    setIsLoginView(!isLoginView);
  };

  const handleLogin = async (email, password, role, setError) => {
    const roleFormatMap = {
      Owner: "owner",
      "Maintenance Manager": "maintenance_manager",
      "Service Provider": "service_provider",
      Administrator: "admin",
    };
    try {
      const user = await login(email, password, roleFormatMap[role]);
      const dashboardByRole = {
        owner: "/owner/dashboard",
        service_provider: "/service-provider/dashboard",
        maintenance_manager: "/maintenance_manager/dashboard",
        admin: "/admin/dashboard",
        super_user: "/super_user/dashboard",
      };
      navigate(dashboardByRole[user.role] || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Error connecting to the server.");
    }
  };

  const handleSignup = async (
    email,
    password,
    role,
    propertyUnit,
    communityName,
    setError,
    resetForm,
  ) => {
    const roleFormatMap = {
      Owner: "owner",
      "Maintenance Manager": "maintenance_manager",
      "Service Provider": "service_provider",
      Administrator: "admin",
    };
    try {
      const newUser = {
        name: email.split("@")[0],
        email,
        password,
        role: roleFormatMap[role],
      };
      if (propertyUnit) newUser.propertyUnit = propertyUnit;
      if (communityName) newUser.communityName = communityName;
      if (role === "Service Provider") newUser.category = "General";

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", role: "admin" },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert(
          "Account request submitted. Please wait for admin approval before logging in.",
        );
        resetForm();
        setIsLoginView(true);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Signup failed.");
      }
    } catch {
      setError("Error connecting to server.");
    }
  };

  return (
    <main className="login-page">
      <HomeIcon />
      <SuperUserBtn />
      <div
        className="center_box"
        style={{ flexDirection: isLoginView ? "row" : "row-reverse" }}
      >
        <LoginForm onLogin={handleLogin} isHidden={!isLoginView} />
        <SignupForm onSignup={handleSignup} isHidden={isLoginView} />

        <div>
          <div className={`box ${!isLoginView ? "hidden" : ""}`}>
            <h2 className="boxTitle">New to PropSync?</h2>
            <p className="boxText">
              Create an account today and start your journey with PropSync now!
            </p>
            <button className="toggleBtn" type="button" onClick={toggleView}>
              Sign Up
            </button>
          </div>

          <div
            className={`box ${isLoginView ? "hidden" : ""}`}
            style={{ borderRadius: "30px 210px 210px 30px" }}
          >
            <h2 className="boxTitle">Already have account?</h2>
            <p className="boxText">
              To keep connected with your service requests and property, please
              login with your personal info.
            </p>
            <button className="toggleBtn" type="button" onClick={toggleView}>
              Log In
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
