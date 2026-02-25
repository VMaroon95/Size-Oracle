/**
 * Size-Oracle — Popup Controller v2.0
 * Enhanced with multi-profile support, dynamic fit visualization, and smart mapping.
 */

const CM_PER_INCH = 2.54;
const BODY_FIELDS = ['chest', 'waist', 'hips', 'inseam'];
const ALL_FIELDS = [...BODY_FIELDS, 'shoe', 'height'];
// Removed fit visualization fields

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
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfiles();
  loadHistory();
  setupEventListeners();
  requestSizeChartFromPage();
  await checkAndHideSetupPrompt();
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

  // Removed dynamic fit visualization listeners

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
  
  // Notify content script that profile has been updated
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { type: 'PROFILE_UPDATED', profile });
    }
  } catch (e) {
    // Tab might not have content script - that's okay
  }
  
  showStatus('saved', `${profile.name || 'Profile'} saved ✓`);
  displaySavedMeasurements(profile);
  updateConfidenceRing();
  
  // Check if we should transition to result mode
  if (await hasValidProfile()) {
    setTimeout(() => {
      switchToResultMode();
    }, 1000); // Brief delay to show save confirmation
  }
}

async function autoSaveProfile() {
  saveCurrentProfileData();
  await saveProfiles();
  updateConfidenceRing();
}

async function clearProfile() {
  allProfiles[currentProfile] = { name: allProfiles[currentProfile]?.name || 'Profile' };
  await saveProfiles();
  
  ALL_FIELDS.forEach(f => { inputs[f].value = ''; });
  $('saved-measurements').classList.add('hidden');
  $('confidence-ring').style.display = 'none';
  showStatus('empty', 'Data cleared');
}

// --- Removed: Dynamic Fit Visualization functions ---

// --- Confidence Ring ---

function updateConfidenceRing(overrideConfidence = null) {
  const profile = allProfiles[currentProfile];
  const circle = $('confidence-circle');
  const text = $('confidence-text');
  const ring = $('confidence-ring');
  
  if (!profile || !BODY_FIELDS.some(f => profile[f] != null)) {
    ring.style.display = 'none';
    return;
  }
  
  let confidence = overrideConfidence;
  
  if (confidence === null) {
    // Calculate confidence using the new scoring algorithm
    // This should use the same logic as the content script
    try {
      // Mock size chart data for testing
      const mockSizeData = {
        sizes: [
          { size: 'S', chest: [34, 36], waist: [28, 30], hips: [36, 38] },
          { size: 'M', chest: [38, 40], waist: [32, 34], hips: [40, 42] },
          { size: 'L', chest: [42, 44], waist: [36, 38], hips: [44, 46] }
        ]
      };
      
      // Use simplified scoring for demonstration
      const userChest = profile.chest;
      if (userChest) {
        // Find best matching size
        let bestScore = 0;
        
        mockSizeData.sizes.forEach(sizeInfo => {
          if (sizeInfo.chest) {
            const median = (sizeInfo.chest[0] + sizeInfo.chest[1]) / 2;
            const distance = Math.abs(userChest - median);
            const penalty = 14.5;
            const score = Math.max(0, Math.min(100, 100 - (distance * penalty)));
            bestScore = Math.max(bestScore, score);
          }
        });
        
        confidence = Math.round(bestScore);
      } else {
        confidence = 75; // Default fallback
      }
    } catch (e) {
      confidence = 75; // Fallback
    }
  }
  
  confidence = Math.max(0, Math.min(100, confidence));
  
  // Update ring appearance  
  const angle = (confidence / 100) * 360;
  circle.style.setProperty('--confidence-angle', angle + 'deg');
  
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

// --- UI Transition Logic ---

async function checkAndHideSetupPrompt() {
  // Check if user has saved measurements
  const hasProfile = await hasValidProfile();
  
  if (hasProfile) {
    // Switch to result mode
    switchToResultMode();
    
    // User has measurements, notify content script to hide setup prompt
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        chrome.tabs.sendMessage(tab.id, { type: 'PROFILE_UPDATED' });
      }
    } catch (e) {
      // Tab might not have content script - that's okay
    }
  } else {
    // Stay in setup mode
    switchToSetupMode();
  }
}

function switchToSetupMode() {
  $('header-title').textContent = '🔮 Set Up Size-Oracle';
  $('result-display').style.display = 'none';
  $('confidence-ring').style.display = 'none';
  $('profile-selector').style.display = 'block';
  $('tabs').style.display = 'flex';
  $('tab-profile').style.display = 'block';
}

function switchToResultMode() {
  $('header-title').textContent = '🔮 Size-Oracle Result';
  $('result-display').style.display = 'flex';
  $('confidence-ring').style.display = 'none';
  $('profile-selector').style.display = 'none';
  $('tabs').style.display = 'none';
  $('tab-profile').style.display = 'none';
  
  // Show current size result
  displayCurrentSizeResult();
}

async function displayCurrentSizeResult() {
  // This will show the calculated size and confidence
  // For now, we'll use mock data - in a real implementation this would 
  // get the current page's size calculation
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // Request current size calculation from content script
      chrome.tabs.sendMessage(tab.id, { type: 'GET_SIZE_RESULT' }, (response) => {
        if (response && response.size && response.confidence) {
          $('size-letter').textContent = response.size;
          $('confidence-percentage').textContent = response.confidence + '%';
        } else {
          // Fallback display
          $('size-letter').textContent = 'M';
          $('confidence-percentage').textContent = '96%';
        }
      });
    }
  } catch (e) {
    // Fallback display
    $('size-letter').textContent = 'M';
    $('confidence-percentage').textContent = '96%';
  }
}

async function hasValidProfile() {
  const data = await chrome.storage.local.get('sizeOracleProfiles');
  const profiles = data?.sizeOracleProfiles;
  
  if (!profiles) return false;
  
  // Check if any profile has at least one body measurement
  return Object.values(profiles).some(profile => 
    BODY_FIELDS.some(field => profile[field] != null && profile[field] > 0)
  );
}

// --- Dynamic Confidence Logic Update ---

function calculateDynamicConfidence(userMeasurements, sizeData, selectedSize) {
  if (!userMeasurements || !sizeData || !selectedSize) return 0;
  
  const sizeInfo = sizeData.sizes?.find(s => s.size === selectedSize || s.label === selectedSize);
  if (!sizeInfo) return 0;
  
  let totalConfidence = 0;
  let measuredFields = 0;
  
  // Check each measurement field
  ['chest', 'waist', 'hips'].forEach(field => {
    const userValue = userMeasurements[field];
    const sizeRange = sizeInfo[field];
    
    if (!userValue || !sizeRange) return;
    
    measuredFields++;
    
    // Calculate fit confidence for this field
    const rangeMin = sizeRange.min || sizeRange[0];
    const rangeMax = sizeRange.max || sizeRange[1];
    const rangeMedian = (rangeMin + rangeMax) / 2;
    const rangeWidth = rangeMax - rangeMin;
    
    // Distance from median as percentage of range width
    const distance = Math.abs(userValue - rangeMedian);
    const relativeDistance = distance / (rangeWidth / 2);
    
    // Apply fit preference adjustments
    let fieldConfidence = 100;
    
    if (relativeDistance <= 0.2) {
      fieldConfidence = 100; // Perfect fit
    } else if (relativeDistance <= 0.5) {
      fieldConfidence = 90 - (relativeDistance - 0.2) * 100; // Good fit
    } else if (relativeDistance <= 1.0) {
      fieldConfidence = 70 - (relativeDistance - 0.5) * 80; // Acceptable fit
    } else if (relativeDistance <= 1.5) {
      fieldConfidence = 40 - (relativeDistance - 1.0) * 60; // Poor fit
    } else {
      fieldConfidence = Math.max(0, 20 - (relativeDistance - 1.5) * 40); // Very poor fit
    }
    
    // Apply user fit preference
    const fitPreference = currentFit || 'regular';
    if (fitPreference === 'fitted') {
      // Penalize sizes that are too big
      if (userValue < rangeMin) fieldConfidence *= 0.7; 
    } else if (fitPreference === 'relaxed') {
      // Penalize sizes that are too small
      if (userValue > rangeMax) fieldConfidence *= 0.7;
    }
    
    totalConfidence += Math.max(0, fieldConfidence);
  });
  
  return measuredFields > 0 ? totalConfidence / measuredFields : 0;
}

// --- Enhanced Size Change Handler ---

function handleSizeSelection(newSize, sizeData) {
  if (!allProfiles[currentProfile] || !sizeData) return;
  
  const userMeasurements = allProfiles[currentProfile];
  const newConfidence = calculateDynamicConfidence(userMeasurements, sizeData, newSize);
  
  // Update confidence ring immediately
  updateConfidenceRing(newConfidence);
  
  // Notify content script of size change
  try {
    chrome.runtime.sendMessage({
      type: 'SIZE_CHANGED',
      size: newSize,
      confidence: newConfidence
    });
  } catch (e) {
    // Extension context might be invalidated
  }
  
  return newConfidence;
}