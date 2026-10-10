import React from "react";
import LoginSignup from "./pages/LoginSignup";
import Navbar from "./components/Navbar";
import UserProfile from "./layouts/UserProfile";

function App() {
  return (
    <div>
      <Navbar />
      {/* <LoginSignup /> */}
      <UserProfile />
    </div>
  );
}

export default App;
