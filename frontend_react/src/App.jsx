import Navbar from "./components/Navbar.jsx";
import ComplaintDetails from "./layouts/ComplaintDetails.jsx";

function App() {
  return (<div>
    <Navbar />
    <ComplaintDetails role={"admin"} />
  </div>);
}

export default App;
