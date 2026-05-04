$file = 'c:\Users\sahas\Prop_Sync\37_PropSync\front_end\src\service_provider\profile.html'
$content = [System.IO.File]::ReadAllText($file)
$norm = $content -replace "`r`n", "`n"

# Find the start of renderProfileCard function
$start = $norm.IndexOf("async function renderProfileCard()")
if ($start -lt 0) { Write-Host "NOT FOUND"; exit 1 }

# Find the matching closing brace by counting braces from the opening {
$braceCount = 0
$i = $norm.IndexOf("{", $start)
$end = -1
while ($i -lt $norm.Length) {
    if ($norm[$i] -eq '{') { $braceCount++ }
    elseif ($norm[$i] -eq '}') {
        $braceCount--
        if ($braceCount -eq 0) { $end = $i + 1; break }
    }
    $i++
}

if ($end -lt 0) { Write-Host "Could not find closing brace"; exit 1 }

Write-Host "Found function from $start to $end (length $($end - $start))"

$newFunc = @'
async function renderProfileCard() {
  const profile = await getProfile();
  const card = document.getElementById('profile-card');
  if (!card) return;

  // Build card shell (cannot await inside template literals)
  const editBtns = !isEditing
    ? '<button class="btn btn-accent btn-sm" id="edit-btn"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit Profile</button>'
    : '<div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn btn-accent btn-sm" id="save-btn"><svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Changes</button><button class="btn btn-ghost btn-sm" id="cancel-btn"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Cancel</button></div>';
  const camBtn = isEditing ? '<button class="profile-camera-btn" title="Change photo"><svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></button>' : '';

  card.innerHTML = '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;"><h2>Profile Information</h2>' + editBtns + '</div>'
    + '<div class="profile-details-grid">'
    + '<div class="profile-photo-area"><div class="profile-photo-wrap"><div class="profile-avatar-large">' + (profile.initials || profile.name[0].toUpperCase()) + '</div>' + camBtn + '</div>'
    + '<p class="profile-sp-id">Service Provider ID: ' + profile.spId + '</p></div>'
    + '<div id="profile-fields-slot"></div></div>';

  // Now await the field rows and inject them
  const svgName = '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
  const svgEmail = '<svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>';
  const svgPhone = '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.37 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l1.27-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
  const svgCat = '<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
  const svgExp = '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  const svgLoc = '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

  const rows = await Promise.all([
    fieldRow('Full Name',           'name',       'text',  'Full Name',                  svgName),
    fieldRow('Email Address',       'email',      'email', 'Email',                      svgEmail),
    fieldRow('Phone Number',        'phone',      'tel',   'Phone',                      svgPhone),
    fieldRow('Service Category',    'category',   'text',  'Category',                   svgCat),
    fieldRow('Years of Experience', 'experience', 'text',  'Years',                      svgExp),
    fieldRow('Service Locations',   'locations',  'text',  'Locations (comma separated)', svgLoc),
  ]);
  const slot = document.getElementById('profile-fields-slot');
  if (slot) slot.innerHTML = rows.join('');

  if (!isEditing) {
    document.getElementById('edit-btn').addEventListener('click', async () => {
      editData = { ...await getProfile() };
      isEditing = true;
      await renderProfileCard();
    });
  } else {
    document.getElementById('save-btn').addEventListener('click', async () => {
      const nameVal  = (document.getElementById('field-name')?.value  || '').trim();
      const emailVal = (document.getElementById('field-email')?.value || '').trim();
      const phoneVal = (document.getElementById('field-phone')?.value || '').trim();
      let errors = [];
      if (!nameVal) errors.push('Full name is required.');
      else if (!/^[a-zA-Z\s'\-]+$/.test(nameVal)) errors.push('Name should only contain letters.');
      if (!emailVal) errors.push('Email address is required.');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) errors.push('Please enter a valid email address.');
      if (phoneVal && !/^[\+]?[\d\s\-\(\)]{7,15}$/.test(phoneVal)) errors.push('Please enter a valid phone number (7-15 digits).');
      if (errors.length > 0) { spShowToast('!! ' + errors[0]); return; }
      ['name','email','phone','category','experience','locations'].forEach(k => {
        const el = document.getElementById('field-' + k);
        if (el) editData[k] = el.value.trim();
      });
      isEditing = false;
      await renderProfileCard();
      spShowToast('Profile updated successfully!');
    });
    document.getElementById('cancel-btn').addEventListener('click', async () => {
      editData = {};
      isEditing = false;
      await renderProfileCard();
    });
  }
}
'@

$before = $norm.Substring(0, $start)
$after  = $norm.Substring($end)
$newContent = $before + ($newFunc -replace "`r`n", "`n") + $after
$newContent = $newContent -replace "`n", "`r`n"
[System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "SUCCESS: profile.html updated"
