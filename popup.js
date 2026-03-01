/**
 * Size Oracle — Popup Controller v3.1
 * 
 * Popup ALWAYS shows measurement setup dashboard (no result view).
 * Supports multiple named profiles, inseam, and shoe size.
 */

const CM_PER_INCH = 2.54;
const BODY_FIELDS = ['chest', 'waist', 'hips', 'inseam'];
const DEFAULT_PROFILE_NAME = 'Me';

let currentUnit = 'in';
let currentGender = 'mens';
let currentFit = 'regular';
let currentProfileName = DEFAULT_PROFILE_NAME;
let allProfiles = {};  // { "Me": { chest, waist, ... }, "Partner": { ... } }

// DOM
const $ = id => document.getElementById(id);
const inputs = {};
BODY_FIELDS.forEach(f => { inputs[f] = $(f); });

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadAllProfiles();
  populateProfileDropdown();
  loadCurrentProfile();
});

function setupEventListeners() {
  // Save / Clear
  $('save-btn').addEventListener('click', saveProfile);
  $('clear-btn').addEventListener('click', clearProfile);

  // Unit toggles
  $('btn-inches').addEventListener('click', () => setUnit('in'));
  $('btn-cm').addEventListener('click', () => setUnit('cm'));

  // Gender toggles
  $('btn-mens').addEventListener('click', () => setGender('mens'));
  $('btn-womens').addEventListener('click', () => setGender('womens'));

  // Fit toggles
  document.querySelectorAll('.fit-btn').forEach(btn => {
    btn.addEventListener('click', () => setFit(btn.dataset.fit));
  });

  // Profile selector
  $('profile-select').addEventListener('change', () => {
    currentProfileName = $('profile-select').value;
    loadCurrentProfile();
  });

  // Add profile
  $('add-profile-btn').addEventListener('click', () => {
    $('new-profile-row').style.display = 'flex';
    $('new-profile-name').focus();
  });
  $('cancel-new-profile').addEventListener('click', () => {
    $('new-profile-row').style.display = 'none';
    $('new-profile-name').value = '';
  });
  $('confirm-new-profile').addEventListener('click', createNewProfile);
  $('new-profile-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') createNewProfile();
  });

  // Delete profile
  $('delete-profile-btn').addEventListener('click', deleteCurrentProfile);

  // Auto-save on input change
  BODY_FIELDS.forEach(field => {
    inputs[field].addEventListener('change', () => autoSaveProfile());
  });
  $('shoe-size').addEventListener('change', () => autoSaveProfile());
  $('shoe-system').addEventListener('change', () => autoSaveProfile());
}

// --- Profile Management ---

async function loadAllProfiles() {
  const data = await chrome.storage.local.get(['sizeOracleProfiles', 'sizeOracleProfile', 'sizeOracleActiveProfile']);
  
  if (data.sizeOracleProfiles && Object.keys(data.sizeOracleProfiles).length > 0) {
    allProfiles = data.sizeOracleProfiles;
  } else if (data.sizeOracleProfile && Object.keys(data.sizeOracleProfile).length > 0) {
    // Migrate from old single-profile storage
    allProfiles = { [DEFAULT_PROFILE_NAME]: data.sizeOracleProfile };
    await chrome.storage.local.set({ sizeOracleProfiles: allProfiles });
  } else {
    allProfiles = { [DEFAULT_PROFILE_NAME]: {} };
  }

  currentProfileName = data.sizeOracleActiveProfile || Object.keys(allProfiles)[0] || DEFAULT_PROFILE_NAME;
}

function populateProfileDropdown() {
  const select = $('profile-select');
  select.innerHTML = '';
  for (const name of Object.keys(allProfiles)) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === currentProfileName) opt.selected = true;
    select.appendChild(opt);
  }
  // Hide delete button if only one profile
  $('delete-profile-btn').style.display = Object.keys(allProfiles).length <= 1 ? 'none' : 'inline-flex';
}

function loadCurrentProfile() {
  const profile = allProfiles[currentProfileName] || {};
  
  if (profile.unit) currentUnit = profile.unit;
  if (profile.gender) currentGender = profile.gender;
  if (profile.fitPreference) currentFit = profile.fitPreference;

  // Populate body fields
  BODY_FIELDS.forEach(field => {
    if (profile[field] != null) {
      inputs[field].value = currentUnit === 'cm'
        ? (profile[field] * CM_PER_INCH).toFixed(1)
        : profile[field];
    } else {
      inputs[field].value = '';
    }
  });

  // Shoe size
  if (profile.shoeSize != null) {
    $('shoe-size').value = profile.shoeSize;
  } else {
    $('shoe-size').value = '';
  }
  $('shoe-system').value = profile.shoeSystem || 'us';

  updateUnitUI();
  updateGenderUI();
  updateFitUI();
  updateStatus();
}

async function createNewProfile() {
  const name = $('new-profile-name').value.trim();
  if (!name) return;
  if (allProfiles[name]) {
    updateStatus(`Profile "${name}" already exists`);
    return;
  }

  allProfiles[name] = { gender: currentGender, unit: currentUnit, fitPreference: currentFit };
  currentProfileName = name;
  await chrome.storage.local.set({ sizeOracleProfiles: allProfiles, sizeOracleActiveProfile: currentProfileName });

  $('new-profile-row').style.display = 'none';
  $('new-profile-name').value = '';
  populateProfileDropdown();
  loadCurrentProfile();
  updateStatus(`Profile "${name}" created`);
}

async function deleteCurrentProfile() {
  if (Object.keys(allProfiles).length <= 1) return;
  
  const nameToDelete = currentProfileName;
  delete allProfiles[nameToDelete];
  currentProfileName = Object.keys(allProfiles)[0];
  await chrome.storage.local.set({ sizeOracleProfiles: allProfiles, sizeOracleActiveProfile: currentProfileName });

  populateProfileDropdown();
  loadCurrentProfile();
  updateStatus(`Profile "${nameToDelete}" deleted`);
}

async function saveProfile() {
  await autoSaveProfile();
  updateStatus('Profile saved ✓');
  
  // Notify content scripts
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) chrome.tabs.sendMessage(tab.id, { type: 'PROFILE_UPDATED' });
  } catch (e) {}
}

async function autoSaveProfile() {
  const profile = allProfiles[currentProfileName] || {};
  profile.unit = currentUnit;
  profile.gender = currentGender;
  profile.fitPreference = currentFit;
  profile.savedAt = new Date().toISOString();

  // Store body measurements in inches
  BODY_FIELDS.forEach(field => {
    const raw = parseFloat(inputs[field].value);
    if (!isNaN(raw) && raw > 0) {
      profile[field] = currentUnit === 'cm'
        ? parseFloat((raw / CM_PER_INCH).toFixed(2))
        : raw;
    } else {
      delete profile[field];
    }
  });

  // Shoe size
  const shoeVal = parseFloat($('shoe-size').value);
  if (!isNaN(shoeVal) && shoeVal > 0) {
    profile.shoeSize = shoeVal;
    profile.shoeSystem = $('shoe-system').value;
  } else {
    delete profile.shoeSize;
    delete profile.shoeSystem;
  }

  allProfiles[currentProfileName] = profile;

  // Also save as the "active" single profile for content script compatibility
  await chrome.storage.local.set({
    sizeOracleProfiles: allProfiles,
    sizeOracleActiveProfile: currentProfileName,
    sizeOracleProfile: profile,  // backward compat for content scripts
  });
}

function clearProfile() {
  BODY_FIELDS.forEach(field => { inputs[field].value = ''; });
  $('shoe-size').value = '';
  updateStatus('Fields cleared');
}

// --- Unit / Gender / Fit ---

function setUnit(unit) {
  if (unit === currentUnit) return;
  const factor = unit === 'cm' ? CM_PER_INCH : 1 / CM_PER_INCH;
  BODY_FIELDS.forEach(field => {
    const val = parseFloat(inputs[field].value);
    if (!isNaN(val)) inputs[field].value = (val * factor).toFixed(1);
  });
  currentUnit = unit;
  updateUnitUI();
}

function setGender(gender) {
  currentGender = gender;
  updateGenderUI();
}

function setFit(fit) {
  currentFit = fit;
  updateFitUI();
}

function updateUnitUI() {
  const label = currentUnit === 'cm' ? 'cm' : 'in';
  document.querySelectorAll('.unit-label').forEach(el => el.textContent = `(${label})`);
  $('btn-inches').classList.toggle('toggle-btn--active', currentUnit === 'in');
  $('btn-cm').classList.toggle('toggle-btn--active', currentUnit === 'cm');
}

function updateGenderUI() {
  $('btn-mens').classList.toggle('toggle-btn--active', currentGender === 'mens');
  $('btn-womens').classList.toggle('toggle-btn--active', currentGender === 'womens');
}

function updateFitUI() {
  document.querySelectorAll('.fit-btn').forEach(btn => {
    btn.classList.toggle('toggle-btn--active', btn.dataset.fit === currentFit);
  });
}

function updateStatus(message = null) {
  const status = $('status');
  if (message) {
    status.textContent = message;
  } else {
    const profile = allProfiles[currentProfileName] || {};
    const hasMeasurements = BODY_FIELDS.some(f => profile[f] != null && profile[f] > 0);
    status.textContent = hasMeasurements ? 'Profile ready ✓' : 'No measurements yet';
  }
}
