/**
 * Size-Oracle — Popup Controller
 * Manages user profile: measurements, gender, unit preferences.
 * All data stored in chrome.storage.local — never transmitted.
 */

const CM_PER_INCH = 2.54;
const FIELDS = ['chest', 'waist', 'hips', 'inseam'];

let currentUnit = 'in'; // 'in' or 'cm'
let currentGender = 'mens';

// --- DOM References ---
const elements = {
  status: document.getElementById('status'),
  saveBtn: document.getElementById('save-btn'),
  clearBtn: document.getElementById('clear-btn'),
  savedSection: document.getElementById('saved-measurements'),
  savedData: document.getElementById('saved-data'),
  btnInches: document.getElementById('btn-inches'),
  btnCm: document.getElementById('btn-cm'),
  btnMens: document.getElementById('btn-mens'),
  btnWomens: document.getElementById('btn-womens'),
};

const inputs = Object.fromEntries(
  FIELDS.map(f => [f, document.getElementById(f)])
);

// --- Initialization ---
document.addEventListener('DOMContentLoaded', loadProfile);

// --- Event Listeners ---
elements.saveBtn.addEventListener('click', saveProfile);
elements.clearBtn.addEventListener('click', clearProfile);
elements.btnInches.addEventListener('click', () => setUnit('in'));
elements.btnCm.addEventListener('click', () => setUnit('cm'));
elements.btnMens.addEventListener('click', () => setGender('mens'));
elements.btnWomens.addEventListener('click', () => setGender('womens'));

/**
 * Load saved profile from storage and populate the UI.
 */
async function loadProfile() {
  const data = await chrome.storage.local.get('sizeOracleProfile');
  const profile = data?.sizeOracleProfile;

  if (profile) {
    currentUnit = profile.unit || 'in';
    currentGender = profile.gender || 'mens';

    // Populate inputs (stored values are always in inches)
    FIELDS.forEach(field => {
      if (profile[field] != null) {
        const val = currentUnit === 'cm'
          ? (profile[field] * CM_PER_INCH).toFixed(1)
          : profile[field];
        inputs[field].value = val;
      }
    });

    updateUnitUI();
    updateGenderUI();
    showStatus('saved', `Profile saved ✓ — ${profile.gender === 'womens' ? "Women's" : "Men's"}`);
    displaySavedMeasurements(profile);
  } else {
    showStatus('empty', 'No profile yet');
  }
}

/**
 * Save current inputs to chrome.storage.local.
 * Values are always stored in inches internally.
 */
async function saveProfile() {
  const profile = {
    gender: currentGender,
    unit: currentUnit,
    savedAt: new Date().toISOString(),
  };

  // Read values and convert to inches if currently in cm
  for (const field of FIELDS) {
    const raw = parseFloat(inputs[field].value);
    if (!isNaN(raw) && raw > 0) {
      profile[field] = currentUnit === 'cm'
        ? parseFloat((raw / CM_PER_INCH).toFixed(2))
        : raw;
    }
  }

  // Require at least one measurement
  const hasMeasurement = FIELDS.some(f => profile[f] != null);
  if (!hasMeasurement) {
    showStatus('empty', '⚠️ Enter at least one measurement');
    return;
  }

  await chrome.storage.local.set({ sizeOracleProfile: profile });
  showStatus('saved', 'Profile saved ✓');
  displaySavedMeasurements(profile);
}

/**
 * Clear all saved data.
 */
async function clearProfile() {
  await chrome.storage.local.remove('sizeOracleProfile');
  FIELDS.forEach(f => { inputs[f].value = ''; });
  elements.savedSection.classList.add('hidden');
  showStatus('empty', 'Data cleared');
}

/**
 * Switch measurement unit with auto-conversion of current input values.
 */
function setUnit(unit) {
  if (unit === currentUnit) return;

  // Convert displayed values
  FIELDS.forEach(field => {
    const raw = parseFloat(inputs[field].value);
    if (!isNaN(raw) && raw > 0) {
      inputs[field].value = unit === 'cm'
        ? (raw * CM_PER_INCH).toFixed(1)
        : (raw / CM_PER_INCH).toFixed(1);
    }
  });

  currentUnit = unit;
  updateUnitUI();
}

function setGender(gender) {
  currentGender = gender;
  updateGenderUI();
}

// --- UI Helpers ---

function updateUnitUI() {
  const label = currentUnit === 'cm' ? 'cm' : 'in';
  document.querySelectorAll('.unit-label').forEach(el => {
    el.textContent = `(${label})`;
  });
  elements.btnInches.classList.toggle('unit-btn--active', currentUnit === 'in');
  elements.btnCm.classList.toggle('unit-btn--active', currentUnit === 'cm');
}

function updateGenderUI() {
  elements.btnMens.classList.toggle('gender-btn--active', currentGender === 'mens');
  elements.btnWomens.classList.toggle('gender-btn--active', currentGender === 'womens');
}

function showStatus(type, message) {
  elements.status.className = `status status--${type === 'saved' ? 'saved' : 'empty'}`;
  elements.status.textContent = message;
}

function displaySavedMeasurements(profile) {
  const displayUnit = profile.unit || 'in';
  const rows = FIELDS
    .filter(f => profile[f] != null)
    .map(f => {
      const val = displayUnit === 'cm'
        ? (profile[f] * CM_PER_INCH).toFixed(1) + ' cm'
        : profile[f] + ' in';
      return `<div class="measurement-row"><span>${capitalize(f)}</span><span>${val}</span></div>`;
    })
    .join('');

  elements.savedData.innerHTML = rows || '<p style="color:#666">No measurements</p>';
  elements.savedSection.classList.remove('hidden');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
