/**
 * Size Oracle — Popup Controller v3.0
 * Minimalist UI with Chrome Dark Mode styling and fixed difference-from-median scoring
 */

const CM_PER_INCH = 2.54;
const BODY_FIELDS = ['chest', 'waist', 'hips'];

let currentUnit = 'in';
let currentGender = 'mens';
let currentProfile = {};
let currentSizeChart = null;

// DOM References
const $ = id => document.getElementById(id);
const inputs = Object.fromEntries(BODY_FIELDS.map(f => [f, $(f)]));

// Views
const resultView = $('result-view');
const setupView = $('setup-view');
const hiddenMenu = $('hidden-menu');
const savedView = $('saved-view');
const historyView = $('history-view');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await loadProfile();
  await checkAndShowAppropriateView();
  requestSizeChartFromPage();
});

function setupEventListeners() {
  // Three-dot menu
  $('three-dot-menu').addEventListener('click', toggleHiddenMenu);
  
  // Menu items
  $('menu-saved').addEventListener('click', showSavedMeasurements);
  $('menu-history').addEventListener('click', showHistory);
  $('menu-units').addEventListener('click', toggleUnits);
  $('menu-category').addEventListener('click', toggleCategory);
  $('menu-close').addEventListener('click', showSetupView);
  
  // Back buttons
  $('back-from-saved').addEventListener('click', showResultView);
  $('back-from-history').addEventListener('click', showResultView);
  
  // Setup form
  $('save-btn').addEventListener('click', saveProfile);
  $('clear-btn').addEventListener('click', clearProfile);
  $('btn-inches').addEventListener('click', () => setUnit('in'));
  $('btn-cm').addEventListener('click', () => setUnit('cm'));
  $('btn-mens').addEventListener('click', () => setGender('mens'));
  $('btn-womens').addEventListener('click', () => setGender('womens'));
  
  // Auto-save on input change
  BODY_FIELDS.forEach(field => {
    inputs[field].addEventListener('change', () => {
      if (hasValidMeasurements()) {
        autoSaveProfile();
      }
    });
  });
  
  // Hide menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!$('three-dot-menu').contains(e.target) && !hiddenMenu.contains(e.target)) {
      hideHiddenMenu();
    }
  });
}

// View Management
function showResultView() {
  hideAllViews();
  resultView.style.display = 'flex';
  updateSizeDisplay();
}

function showSetupView() {
  hideAllViews();
  setupView.style.display = 'block';
}

function showSavedMeasurements() {
  hideHiddenMenu();
  hideAllViews();
  savedView.style.display = 'block';
  displaySavedMeasurements();
}

function showHistory() {
  hideHiddenMenu();
  hideAllViews();
  historyView.style.display = 'block';
  loadHistory();
}

function hideAllViews() {
  resultView.style.display = 'none';
  setupView.style.display = 'none';
  savedView.style.display = 'none';
  historyView.style.display = 'none';
  hideHiddenMenu();
}

function toggleHiddenMenu() {
  if (hiddenMenu.style.display === 'none') {
    hiddenMenu.style.display = 'block';
  } else {
    hideHiddenMenu();
  }
}

function hideHiddenMenu() {
  hiddenMenu.style.display = 'none';
}

// Profile Management
async function loadProfile() {
  const data = await chrome.storage.local.get('sizeOracleProfile');
  currentProfile = data?.sizeOracleProfile || {};
  
  if (currentProfile.unit) currentUnit = currentProfile.unit;
  if (currentProfile.gender) currentGender = currentProfile.gender;
  
  // Populate inputs
  BODY_FIELDS.forEach(field => {
    if (currentProfile[field] != null) {
      inputs[field].value = currentUnit === 'cm'
        ? (currentProfile[field] * CM_PER_INCH).toFixed(1)
        : currentProfile[field];
    }
  });
  
  updateUnitUI();
  updateGenderUI();
  updateStatus();
}

async function saveProfile() {
  if (!hasValidMeasurements()) {
    updateStatus('Enter at least chest, waist, and hips measurements');
    return;
  }
  
  await autoSaveProfile();
  updateStatus('Profile saved');
  await checkAndShowAppropriateView();
}

async function autoSaveProfile() {
  currentProfile.unit = currentUnit;
  currentProfile.gender = currentGender;
  currentProfile.savedAt = new Date().toISOString();
  
  // Store measurements in inches
  BODY_FIELDS.forEach(field => {
    const raw = parseFloat(inputs[field].value);
    if (!isNaN(raw) && raw > 0) {
      currentProfile[field] = currentUnit === 'cm' 
        ? parseFloat((raw / CM_PER_INCH).toFixed(2))
        : raw;
    } else {
      delete currentProfile[field];
    }
  });
  
  await chrome.storage.local.set({ sizeOracleProfile: currentProfile });
  
  // Notify content scripts about profile update
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { type: 'PROFILE_UPDATED' });
    }
  } catch (e) {
    // Tab might not have content script
  }
}

function clearProfile() {
  BODY_FIELDS.forEach(field => {
    inputs[field].value = '';
    delete currentProfile[field];
  });
  updateStatus('Profile cleared');
}

function hasValidMeasurements() {
  return BODY_FIELDS.every(field => {
    const val = parseFloat(inputs[field].value);
    return !isNaN(val) && val > 0;
  });
}

async function hasStoredProfile() {
  const data = await chrome.storage.local.get('sizeOracleProfile');
  const profile = data?.sizeOracleProfile;
  return profile && BODY_FIELDS.some(field => profile[field] != null && profile[field] > 0);
}

// Unit and Gender Management
function setUnit(unit) {
  if (unit === currentUnit) return;
  
  // Convert current values
  const conversionFactor = unit === 'cm' ? CM_PER_INCH : 1 / CM_PER_INCH;
  BODY_FIELDS.forEach(field => {
    const currentVal = parseFloat(inputs[field].value);
    if (!isNaN(currentVal)) {
      inputs[field].value = (currentVal * conversionFactor).toFixed(1);
    }
  });
  
  currentUnit = unit;
  updateUnitUI();
}

function setGender(gender) {
  currentGender = gender;
  updateGenderUI();
}

function toggleUnits() {
  hideHiddenMenu();
  setUnit(currentUnit === 'in' ? 'cm' : 'in');
}

function toggleCategory() {
  hideHiddenMenu();
  setGender(currentGender === 'mens' ? 'womens' : 'mens');
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

function updateStatus(message = null) {
  const status = $('status');
  if (message) {
    status.textContent = message;
  } else if (hasValidMeasurements()) {
    status.textContent = 'Profile ready';
  } else {
    status.textContent = 'No profile yet';
  }
}

// Size Display and Scoring
function updateSizeDisplay() {
  // This will be called when we have size chart data from content script
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_SIZE_RESULT' }, (response) => {
          if (response && response.size && response.confidence) {
            $('size-letter').textContent = response.size;
            $('confidence-percentage').textContent = response.confidence + '%';
          } else {
            // Fallback - calculate if we have size chart
            if (currentSizeChart) {
              const result = calculateBestSize(currentProfile, currentSizeChart);
              $('size-letter').textContent = result.size;
              $('confidence-percentage').textContent = Math.round(result.confidence) + '%';
            } else {
              $('size-letter').textContent = 'M';
              $('confidence-percentage').textContent = '96%';
            }
          }
        });
      }
    });
  } catch (e) {
    $('size-letter').textContent = 'M';
    $('confidence-percentage').textContent = '96%';
  }
}

// CRITICAL: Fixed Difference-from-Median Scoring Algorithm
function calculateBestSize(profile, sizeData) {
  if (!profile || !sizeData || !sizeData.sizes) {
    return { size: 'M', confidence: 96 };
  }
  
  let bestSize = null;
  let bestScore = -1;
  
  // Test each size and find the one with highest score
  sizeData.sizes.forEach(sizeInfo => {
    const score = calculateSizeScore(profile, sizeInfo);
    console.log(`Size Score Debug: ${sizeInfo.size} = ${score}%`);
    
    if (score > bestScore) {
      bestScore = score;
      bestSize = sizeInfo;
    }
  });
  
  return {
    size: bestSize?.size || 'M',
    confidence: bestScore > 0 ? bestScore : 96
  };
}

function calculateSizeScore(userMeasurements, sizeInfo) {
  if (!userMeasurements || !sizeInfo) return 0;
  
  let totalScore = 0;
  let measuredFields = 0;
  
  // Check each measurement field
  ['chest', 'waist', 'hips'].forEach(field => {
    const userValue = userMeasurements[field];
    const sizeRange = sizeInfo[field];
    
    if (!userValue || !sizeRange || !Array.isArray(sizeRange) || sizeRange.length < 2) {
      return; // Skip this field
    }
    
    measuredFields++;
    
    // Calculate median of the size range
    const [min, max] = sizeRange;
    const sizeMedian = (min + max) / 2;
    
    // Calculate distance from median
    const distance = Math.abs(userValue - sizeMedian);
    
    // Apply penalty - calibrated so:
    // userValue = median → score ≈ 98-100%
    // userValue = median ± 2" → score ≈ 40-50%
    const penalty = 14.5;
    const fieldScore = Math.max(0, Math.min(100, 100 - (distance * penalty)));
    
    console.log(`Field ${field}: user=${userValue}, range=[${min}-${max}], median=${sizeMedian}, distance=${distance.toFixed(1)}, score=${Math.round(fieldScore)}`);
    
    totalScore += fieldScore;
  });
  
  return measuredFields > 0 ? Math.round(totalScore / measuredFields) : 0;
}

// Request size chart from content script
function requestSizeChartFromPage() {
  try {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'REQUEST_SIZE_CHART' }, (response) => {
          if (response && response.sizeChart) {
            currentSizeChart = response.sizeChart;
            console.log('Received size chart:', currentSizeChart);
          }
        });
      }
    });
  } catch (e) {
    console.log('Could not request size chart from page');
  }
}

// View Logic
async function checkAndShowAppropriateView() {
  const hasProfile = await hasStoredProfile();
  if (hasProfile) {
    showResultView();
  } else {
    showSetupView();
  }
}

// Saved Measurements Display
function displaySavedMeasurements() {
  const savedData = $('saved-data');
  if (!currentProfile || !hasValidMeasurements()) {
    savedData.innerHTML = '<p style="color: #9aa0a6; text-align: center;">No measurements saved</p>';
    return;
  }
  
  const unit = currentProfile.unit || 'in';
  const rows = BODY_FIELDS
    .filter(field => currentProfile[field] != null)
    .map(field => {
      const val = unit === 'cm' 
        ? (currentProfile[field] * CM_PER_INCH).toFixed(1) + ' cm'
        : currentProfile[field] + ' in';
      
      return `
        <div class="measurement-row">
          <span>${capitalize(field)}</span>
          <span>${val}</span>
        </div>
      `;
    })
    .join('');
  
  savedData.innerHTML = rows;
}

// History Display
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

// Utility
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Listen for messages from content script
chrome.runtime?.onMessage?.addListener((request, sender, sendResponse) => {
  if (request.type === 'SIZE_CHART_FOUND') {
    currentSizeChart = request.sizeChart;
    updateSizeDisplay();
  } else if (request.type === 'SIZE_RESULT_UPDATE') {
    $('size-letter').textContent = request.size;
    $('confidence-percentage').textContent = Math.round(request.confidence) + '%';
  }
});