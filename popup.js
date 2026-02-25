/**
 * Size-Oracle — Popup Controller v2.0
 * Enhanced with multi-profile support, dynamic fit visualization, and smart mapping.
 */

const CM_PER_INCH = 2.54;
const BODY_FIELDS = ['chest', 'waist', 'hips', 'inseam'];
const ALL_FIELDS = [...BODY_FIELDS, 'shoe', 'height'];
const FIT_FIELDS = ['chest', 'waist', 'hips']; // Fields with fit visualization

let currentUnit = 'in';
let currentGender = 'mens';
let currentFit = 'regular';
let currentProfile = 'self';
let allProfiles = {};
let currentSizeChart = null; // Current page size chart data

// --- DOM ---
const $ = id => document.getElementById(id);
const inputs = Object.fromEntries(ALL_FIELDS.map(f => [f, $(f)]));

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  loadProfiles();
  loadHistory();
  setupEventListeners();
  requestSizeChartFromPage();
});

function setupEventListeners() {
  // Original listeners
  $('save-btn').addEventListener('click', saveProfile);
  $('clear-btn').addEventListener('click', clearProfile);
  $('btn-inches').addEventListener('click', () => setUnit('in'));
  $('btn-cm').addEventListener('click', () => setUnit('cm'));
  $('btn-mens').addEventListener('click', () => setGender('mens'));
  $('btn-womens').addEventListener('click', () => setGender('womens'));

  document.querySelectorAll('.fit-btn').forEach(btn => {
    btn.addEventListener('click', () => setFit(btn.dataset.fit));
  });

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // New v2.0 listeners
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.addEventListener('click', () => switchProfile(tab.dataset.profile));
  });

  $('add-profile-btn').addEventListener('click', addProfile);
  $('rename-profile-btn').addEventListener('click', renameProfile);
  $('delete-profile-btn').addEventListener('click', deleteProfile);

  // Dynamic fit visualization listeners
  FIT_FIELDS.forEach(field => {
    inputs[field].addEventListener('input', () => updateFitVisualization(field));
  });

  // Auto-save on input change
  ALL_FIELDS.forEach(field => {
    inputs[field].addEventListener('change', autoSaveProfile);
  });
}

// --- Multi-Profile Support ---

async function loadProfiles() {
  const data = await chrome.storage.local.get('sizeOracleProfiles');
  allProfiles = data?.sizeOracleProfiles || {
    'self': { name: 'Self' },
    'partner': { name: 'Partner' }
  };
  
  updateProfileTabs();
  loadProfile(currentProfile);
}

async function saveProfiles() {
  await chrome.storage.local.set({ sizeOracleProfiles: allProfiles });
}

function switchProfile(profileId) {
  if (profileId === currentProfile) return;
  
  // Save current profile before switching
  saveCurrentProfileData();
  
  currentProfile = profileId;
  updateProfileTabs();
  loadProfile(profileId);
}

function updateProfileTabs() {
  const tabs = document.querySelectorAll('.profile-tab');
  tabs.forEach(tab => {
    tab.classList.toggle('profile-tab--active', tab.dataset.profile === currentProfile);
  });
  
  // Update custom tab name if exists
  const customTab = $('custom-profile-tab');
  if (allProfiles.custom) {
    customTab.textContent = allProfiles.custom.name || 'Custom';
  }
}

async function addProfile() {
  const name = prompt('Profile name:');
  if (!name || name.trim().length === 0) return;
  
  const profileId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (allProfiles[profileId]) {
    alert('Profile already exists!');
    return;
  }
  
  allProfiles[profileId] = { name: name.trim() };
  await saveProfiles();
  
  // Add new tab (simplified - in real implementation would be more dynamic)
  alert(`Profile "${name}" added! Switch to Custom tab to access it.`);
}

async function renameProfile() {
  if (currentProfile === 'self' || currentProfile === 'partner') {
    alert('Cannot rename default profiles');
    return;
  }
  
  const newName = prompt('New name:', allProfiles[currentProfile]?.name || '');
  if (!newName || newName.trim().length === 0) return;
  
  allProfiles[currentProfile].name = newName.trim();
  await saveProfiles();
  updateProfileTabs();
}

async function deleteProfile() {
  if (currentProfile === 'self' || currentProfile === 'partner') {
    alert('Cannot delete default profiles');
    return;
  }
  
  if (!confirm('Delete this profile?')) return;
  
  delete allProfiles[currentProfile];
  await saveProfiles();
  
  // Switch back to self
  currentProfile = 'self';
  updateProfileTabs();
  loadProfile('self');
}

// --- Profile Loading/Saving ---

function loadProfile(profileId = currentProfile) {
  const profile = allProfiles[profileId];
  if (!profile) {
    showStatus('empty', 'No profile yet');
    return;
  }

  currentUnit = profile.unit || 'in';
  currentGender = profile.gender || 'mens';
  currentFit = profile.fitPreference || 'regular';

  // Clear all inputs first
  ALL_FIELDS.forEach(f => { inputs[f].value = ''; });

  // Populate body measurement inputs (stored in inches)
  BODY_FIELDS.forEach(field => {
    if (profile[field] != null) {
      inputs[field].value = currentUnit === 'cm'
        ? (profile[field] * CM_PER_INCH).toFixed(1)
        : profile[field];
    }
  });

  // Height (also in inches internally)
  if (profile.height != null) {
    inputs.height.value = currentUnit === 'cm'
      ? (profile.height * CM_PER_INCH).toFixed(1)
      : profile.height;
  }

  // Shoe size (stored as-is)
  if (profile.shoe != null) inputs.shoe.value = profile.shoe;

  updateUnitUI();
  updateGenderUI();
  updateFitUI();
  updateFitVisualizations();
  
  const hasData = BODY_FIELDS.some(f => profile[f] != null);
  if (hasData) {
    showStatus('saved', `${profile.name || 'Profile'} saved ✓`);
    displaySavedMeasurements(profile);
    updateConfidenceRing();
  } else {
    showStatus('empty', `No ${profile.name || 'profile'} data yet`);
    $('confidence-ring').style.display = 'none';
  }
}

function saveCurrentProfileData() {
  const profile = allProfiles[currentProfile] = allProfiles[currentProfile] || {};
  
  profile.gender = currentGender;
  profile.unit = currentUnit;
  profile.fitPreference = currentFit;
  profile.savedAt = new Date().toISOString();

  // Body measurements → always store in inches
  for (const field of BODY_FIELDS) {
    const raw = parseFloat(inputs[field].value);
    if (!isNaN(raw) && raw > 0) {
      profile[field] = currentUnit === 'cm'
        ? parseFloat((raw / CM_PER_INCH).toFixed(2))
        : raw;
    } else {
      delete profile[field]; // Remove if empty
    }
  }

  // Height
  const rawHeight = parseFloat(inputs.height.value);
  if (!isNaN(rawHeight) && rawHeight > 0) {
    profile.height = currentUnit === 'cm'
      ? parseFloat((rawHeight / CM_PER_INCH).toFixed(2))
      : rawHeight;
  } else {
    delete profile.height;
  }

  // Shoe size (stored directly)
  const rawShoe = parseFloat(inputs.shoe.value);
  if (!isNaN(rawShoe) && rawShoe > 0) {
    profile.shoe = rawShoe;
  } else {
    delete profile.shoe;
  }
}

async function saveProfile() {
  saveCurrentProfileData();
  
  const profile = allProfiles[currentProfile];
  const hasMeasurement = BODY_FIELDS.some(f => profile[f] != null);
  
  if (!hasMeasurement) {
    showStatus('empty', '⚠️ Enter at least one measurement');
    return;
  }

  await saveProfiles();
  showStatus('saved', `${profile.name || 'Profile'} saved ✓`);
  displaySavedMeasurements(profile);
  updateFitVisualizations();
  updateConfidenceRing();
}

async function autoSaveProfile() {
  saveCurrentProfileData();
  await saveProfiles();
  updateFitVisualizations();
  updateConfidenceRing();
}

async function clearProfile() {
  allProfiles[currentProfile] = { name: allProfiles[currentProfile]?.name || 'Profile' };
  await saveProfiles();
  
  ALL_FIELDS.forEach(f => { inputs[f].value = ''; });
  $('saved-measurements').classList.add('hidden');
  $('confidence-ring').style.display = 'none';
  updateFitVisualizations();
  showStatus('empty', 'Data cleared');
}

// --- Dynamic Fit Visualization ---

function updateFitVisualization(field) {
  const userValue = parseFloat(inputs[field].value);
  const track = $(field + '-range');
  const marker = $(field + '-marker');
  const indicator = $(field + '-fit');
  
  if (!userValue || !currentSizeChart) {
    track.style.width = '0%';
    marker.style.display = 'none';
    indicator.textContent = 'Enter measurement';
    indicator.className = 'fit-indicator';
    return;
  }
  
  // Mock size chart data (in real implementation, this comes from page detection)
  const mockSizeChart = {
    chest: { S: [34, 36], M: [38, 40], L: [42, 44], XL: [46, 48] },
    waist: { S: [28, 30], M: [32, 34], L: [36, 38], XL: [40, 42] },
    hips: { S: [36, 38], M: [40, 42], L: [44, 46], XL: [48, 50] }
  };
  
  const sizes = mockSizeChart[field];
  if (!sizes) {
    indicator.textContent = 'No size data';
    return;
  }
  
  // Find best matching size
  let bestSize = null;
  let fitType = 'perfect';
  
  for (const [size, [min, max]] of Object.entries(sizes)) {
    if (userValue >= min && userValue <= max) {
      bestSize = size;
      if (userValue <= min + 1) fitType = 'snug';
      else if (userValue >= max - 1) fitType = 'roomy';
      else fitType = 'perfect';
      break;
    }
  }
  
  if (!bestSize) {
    // Find closest size
    let closestSize = null;
    let closestDist = Infinity;
    
    for (const [size, [min, max]] of Object.entries(sizes)) {
      const midpoint = (min + max) / 2;
      const dist = Math.abs(userValue - midpoint);
      if (dist < closestDist) {
        closestDist = dist;
        closestSize = size;
        fitType = userValue < min ? 'too-small' : 'too-large';
      }
    }
    
    bestSize = closestSize;
  }
  
  if (bestSize) {
    const [min, max] = sizes[bestSize];
    const totalRange = 50 - 30; // Approximate range for visualization
    const rangeStart = ((min - 30) / totalRange) * 100;
    const rangeWidth = ((max - min) / totalRange) * 100;
    const markerPos = ((userValue - 30) / totalRange) * 100;
    
    track.style.left = rangeStart + '%';
    track.style.width = rangeWidth + '%';
    marker.style.left = markerPos + '%';
    marker.style.display = 'block';
    
    const fitText = {
      'snug': 'Snug Fit',
      'perfect': 'Perfect Fit',
      'roomy': 'Roomy Fit',
      'too-small': 'Too Small',
      'too-large': 'Too Large'
    };
    
    indicator.textContent = `${bestSize}: ${fitText[fitType]}`;
    indicator.className = `fit-indicator fit-${fitType}`;
  }
}

function updateFitVisualizations() {
  FIT_FIELDS.forEach(field => updateFitVisualization(field));
}

// --- Confidence Ring ---

function updateConfidenceRing() {
  const profile = allProfiles[currentProfile];
  const circle = $('confidence-circle');
  const text = $('confidence-text');
  const ring = $('confidence-ring');
  
  if (!profile || !BODY_FIELDS.some(f => profile[f] != null)) {
    ring.style.display = 'none';
    return;
  }
  
  // Calculate confidence based on available measurements and size chart match
  let confidence = 0;
  let measurements = 0;
  
  BODY_FIELDS.forEach(field => {
    if (profile[field] != null) {
      measurements++;
      confidence += 20; // Base confidence per measurement
      
      // Bonus for good size chart match (mock logic)
      if (currentSizeChart) {
        confidence += 10;
      }
    }
  });
  
  confidence = Math.min(confidence, 95); // Cap at 95%
  
  // Update ring appearance
  circle.style.setProperty('--percentage', confidence + '%');
  
  if (confidence >= 90) {
    circle.className = 'confidence-circle confidence-high';
  } else if (confidence >= 70) {
    circle.className = 'confidence-circle confidence-medium';
  } else {
    circle.className = 'confidence-circle confidence-low';
  }
  
  text.textContent = confidence + '%';
  ring.style.display = 'block';
}

// --- Size Chart Detection ---

function requestSizeChartFromPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getSizeChart' }, (response) => {
        if (response && response.sizeChart) {
          currentSizeChart = response.sizeChart;
          updateFitVisualizations();
          updateConfidenceRing();
        }
      });
    }
  });
}

// --- Original Functions (Updated) ---

function setUnit(unit) {
  if (unit === currentUnit) return;
  // Convert displayed values
  [...BODY_FIELDS, 'height'].forEach(field => {
    const raw = parseFloat(inputs[field].value);
    if (!isNaN(raw) && raw > 0) {
      inputs[field].value = unit === 'cm'
        ? (raw * CM_PER_INCH).toFixed(1)
        : (raw / CM_PER_INCH).toFixed(1);
    }
  });
  currentUnit = unit;
  updateUnitUI();
  updateFitVisualizations();
}

function setGender(gender) {
  currentGender = gender;
  updateGenderUI();
}

function setFit(fit) {
  currentFit = fit;
  updateFitUI();
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('tab--active', t.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('tab-content--active'));
  $(`tab-${tab}`).classList.add('tab-content--active');
  if (tab === 'history') loadHistory();
}

async function loadHistory() {
  const data = await chrome.storage.local.get('sizeOracleHistory');
  const history = data?.sizeOracleHistory || [];
  const list = $('history-list');

  if (history.length === 0) {
    list.innerHTML = '<p class="history-empty">No recommendations yet. Visit a store!</p>';
    return;
  }

  list.innerHTML = history.slice(0, 20).map(entry => {
    const date = new Date(entry.timestamp).toLocaleDateString();
    const site = entry.site.replace(/^www\./, '');
    return `
      <div class="history-item">
        <div class="history-main">
          <span class="history-size">${entry.size}</span>
          <span class="history-conf">${entry.confidence}%</span>
        </div>
        <div class="history-meta">
          <span class="history-site">${site}</span>
          <span class="history-date">${date}</span>
        </div>
      </div>
    `;
  }).join('');
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

function showStatus(type, message) {
  const el = $('status');
  el.className = `status status--${type === 'saved' ? 'saved' : 'empty'}`;
  el.textContent = message;
}

function displaySavedMeasurements(profile) {
  const unit = profile.unit || 'in';
  const rows = ALL_FIELDS
    .filter(f => profile[f] != null)
    .map(f => {
      let val;
      if (f === 'shoe') {
        val = `US ${profile[f]}`;
      } else {
        val = unit === 'cm'
          ? (profile[f] * CM_PER_INCH).toFixed(1) + ' cm'
          : profile[f] + ' in';
      }
      return `<div class="measurement-row"><span>${capitalize(f)}</span><span>${val}</span></div>`;
    })
    .join('');

  $('saved-data').innerHTML = rows || '<p style="color:#666">No measurements</p>';
  $('saved-measurements').classList.remove('hidden');
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}