/* ============================================================
   UTILS — Helper functions and validators
   ============================================================ */

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function validateParticipantName(val) {
  if (!/^[a-zA-Z\s]*$/.test(val)) return 'Name should only contain alphabets';
  return '';
}

function validateParticipantEmail(val) {
  if (!val) return 'Email is required';
  if (!val.includes('@')) return 'Email must contain @';
  if (!val.includes('.')) return 'Email must contain a dot (.)';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address';
  return '';
}

function validateParticipantContact(val) {
  if (!val) return 'Phone number is required';
  if (!val.startsWith('+91 ')) return 'Phone number must start with +91 followed by a space (e.g. +91 9876543210)';
  const digits = val.slice(4); // strip "+91 "
  if (!/^\d{10}$/.test(digits)) return 'Enter exactly 10 digits after +91';
  if (/^(\d)\1{9}$/.test(digits)) return 'Phone number cannot have all identical digits';
  return '';
}

function validateParticipantPassword(val) {
  if (val.length < 5) return 'Password must be at least 5 characters long';
  if ((val.match(/[0-9]/g) || []).length < 2) return 'Password must contain at least 2 numbers';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) return 'Password must contain at least 1 symbol';
  return '';
}
