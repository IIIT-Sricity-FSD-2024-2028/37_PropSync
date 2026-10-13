import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOwner } from '../../context/OwnerContext';
import { createComplaint } from '../../services/ownerService';
import OwnerLayout from './components/OwnerLayout';
import './owner.css';

export default function NewComplaint() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { ownerProfile, refreshComplaints } = useOwner();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState('medium');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.title = 'PropSync – New Complaint';
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, file: 'Image is too large. Please select an image under 5MB.' }));
        setFile(null);
        setPreviewUrl(null);
        return;
      }
      setErrors((prev) => ({ ...prev, file: null }));
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!title.trim()) newErrors.title = 'Title is required.';
    if (!description.trim()) newErrors.description = 'Description is required.';
    if (file && file.size > 5 * 1024 * 1024) newErrors.file = 'Image is too large. Max 5MB.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('priority', priority);
      formData.append('ownerId', String(currentUser?.id || 1));

      if (file) {
        formData.append('photo', file);
      }

      await createComplaint(formData, currentUser);
      await refreshComplaints();

      setToastMessage('Complaint submitted successfully!');
      setTimeout(() => {
        navigate('/owner/dashboard');
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayLocation = `${ownerProfile?.unit || currentUser?.propertyUnit || 'Property unit not set'} | ${ownerProfile?.community || currentUser?.communityName || 'Community not set'}`;

  return (
    <OwnerLayout>
      <div className="form-content">
        <h2>Submit Complaint</h2>
        <p>Enter Complaint Details and wait for Maintenance Manager to approve</p>

        {toastMessage && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              borderRadius: '8px',
              marginBottom: '16px',
              fontWeight: 600
            }}
          >
            {toastMessage}
          </div>
        )}

        <form id="complaintForm" onSubmit={handleSubmit}>
          <label htmlFor="form_title">Complaint Title</label>
          <input
            type="text"
            id="form_title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '2px' }}>{errors.title}</p>}

          <label htmlFor="desc">Description</label>
          <textarea
            id="desc"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
          {errors.description && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '2px' }}>{errors.description}</p>}

          <label>Complaint Location</label>
          <div
            id="profile_location_display"
            style={{
              padding: '12px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: '#f9fafb',
              color: '#374151',
              fontWeight: 600,
            }}
          >
            {displayLocation}
          </div>

          <label htmlFor="form_image">Upload Photo</label>
          <input
            type="file"
            id="form_image"
            accept="image/*"
            onChange={handleFileChange}
          />
          {errors.file && <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '2px' }}>{errors.file}</p>}
          {previewUrl && (
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              <img
                src={previewUrl}
                alt="Upload Preview"
                style={{ maxHeight: '160px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
            </div>
          )}

          <label htmlFor="complaint_cat"></label>
          <select
            name="category"
            id="complaint_cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Plumbing">Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="HVAC">HVAC</option>
            <option value="Carpentry">Carpentry</option>
            <option value="Painting">Painting</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Security">Security</option>
            <option value="Elevator">Elevator</option>
            <option value="General">General</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <label htmlFor="complaint_priority">Priority</label>
          <select
            name="priority"
            id="complaint_priority"
            required
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </OwnerLayout>
  );
}
