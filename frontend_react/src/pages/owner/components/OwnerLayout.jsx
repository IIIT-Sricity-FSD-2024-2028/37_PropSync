import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import { useOwner } from '../../../context/OwnerContext';
import '../owner.css';

export default function OwnerLayout({ children }) {
  const [menu, setMenu] = useState(false);
  const { currentUser } = useAuth();
  const { ownerProfile } = useOwner();

  const userName = ownerProfile?.name || currentUser?.name || 'Property Owner';

  // Listen for clicks on the navbar hamburger menu icon and fix relative logo src
  useEffect(() => {
    // Ensure logo always resolves from root /logo.png regardless of nested route
    const fixLogos = () => {
      document.querySelectorAll('img[src="logo.png"]').forEach((img) => {
        img.src = '/logo.png';
      });
    };
    fixLogos();

    const handleMenuClick = (e) => {
      const menuBtn = e.target.closest('#nav_container .menu');
      if (menuBtn) {
        setMenu((prev) => !prev);
        setTimeout(fixLogos, 10);
      }
    };
    document.addEventListener('click', handleMenuClick);
    return () => document.removeEventListener('click', handleMenuClick);
  }, [menu]);

  return (
    <div className="owner-app">
      {menu && <Sidebar role="owner" menu={menu} setMenu={setMenu} />}
      <Navbar name={userName} />
      {children}
    </div>
  );
}
