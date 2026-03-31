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

function validateParticipantContact(val) {
  if (!/^[0-9+]*$/.test(val)) return 'Contact should only contain numbers and + symbol';
  return '';
}

function validateParticipantPassword(val) {
  if (val.length < 5) return 'Password must be at least 5 characters long';
  if ((val.match(/[0-9]/g) || []).length < 2) return 'Password must contain at least 2 numbers';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val)) return 'Password must contain at least 1 symbol';
  return '';
}
