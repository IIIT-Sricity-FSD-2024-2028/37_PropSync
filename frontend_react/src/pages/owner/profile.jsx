import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOwner } from '../../context/OwnerContext';
import OwnerLayout from './components/OwnerLayout';
import UserProfile from '../../layouts/UserProfile';

export default function Profile() {
  const { currentUser } = useAuth();
  const { ownerProfile, updateProfile } = useOwner();

  const handleUpdateProfile = (updated) => {
    updateProfile({
      name: updated.fullName,
      unit: updated.department,
      community: updated.location,
      phone: updated.phone,
    });
  };

  const handleChangePassword = (data) => {
    if (data?.newPassword) {
      updateProfile({ password: data.newPassword });
    }
  };

  const userData = {
    fullName: ownerProfile?.name || currentUser?.name || 'Raj Kumar',
    email: ownerProfile?.email || currentUser?.email || 'raj.owner@propsync.com',
    phone: ownerProfile?.phone || '+91 98765 43210',
    role: 'Property Owner',
    id: ownerProfile?.id ? `OWN-${ownerProfile.id}` : 'OWN-101',
    idLabel: 'Owner ID',
    department: ownerProfile?.unit || currentUser?.propertyUnit || 'A-101',
    location: ownerProfile?.community || currentUser?.communityName || 'Green Valley Society',
  };

  return (
    <OwnerLayout>
      <UserProfile
        user={userData}
        role="owner"
        title="My Profile"
        subtitle="Manage your property owner information."
        onUpdateProfile={handleUpdateProfile}
        onChangePassword={handleChangePassword}
      />
    </OwnerLayout>
  );
}
