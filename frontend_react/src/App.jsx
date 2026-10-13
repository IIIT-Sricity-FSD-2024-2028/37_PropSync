<<<<<<< HEAD
import Navbar from "./components/Navbar.jsx";
import ComplaintDetails from "./layouts/ComplaintDetails.jsx";

function App() {
  return (<div>
    <Navbar />
    <ComplaintDetails role={"admin"} />
  </div>);
}

export default App;
=======
// SHARED - may be replaced by team version
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
} 
>>>>>>> 7e5ec18958298604d3dead715d2f43755a617fd9
