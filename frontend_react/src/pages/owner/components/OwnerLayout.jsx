import React from 'react';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../context/AuthContext';
import { useOwner } from '../../../context/OwnerContext';
import '../owner.css';

export default function OwnerLayout({ children }) {
  const { currentUser } = useAuth();
  const { ownerProfile } = useOwner();

  const userName = ownerProfile?.name || currentUser?.name || 'Property Owner';

  return (
    <div className="owner-app">
      <Navbar name={userName} role="owner" />
      {children}
    </div>
  );
}
