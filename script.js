/**
 * MedTrack – Smart Medicine Schedule & Reminder
 * -------------------------------------------------------------
 * Target: College CSE Project (UN SDG 3 – Good Health and Well-Being)
 * Tech: Pure HTML5, CSS3, Vanilla JavaScript & LocalStorage
 * No external frameworks, no backend server, fully local & responsive.
 */

// =============================================================
// 1. STATE MANAGEMENT & LOCAL STORAGE CONSTANTS
// =============================================================

const STORAGE_KEYS = {
  MEDICINES: 'medtrack_medicines',
  HISTORY: 'medtrack_history',
  LAST_ACTIVE_DATE: 'medtrack_last_active_date',
  NOTIFICATION_PREF: 'medtrack_notification_pref'
};

// Application State
let appState = {
  medicines: [],
  history: [],
  currentFilter: 'all', // 'all' | 'pending' | 'taken' | 'skipped'
  searchQuery: '',
  activeReminderMedicine: null,
  remindedKeysThisSession: new Set(),
  snoozedReminders: {} // { medicineId: targetTimestamp }
};

// Expose on window for easy developer console inspection & viva demo
window.appState = appState;

// Web Audio API Context for native sound chime (no external MP3 needed!)
let audioCtx = null;

// =============================================================
// 2. SAMPLE DATA SEEDING (For viva & instant demo)
// =============================================================

const SAMPLE_MEDICINES = [
  {
    id: 'med_sample_1',
    name: 'Amoxicillin (Antibiotic)',
    dosage: '500 mg (1 Capsule)',
    category: 'Capsule',
    frequency: 'Twice Daily',
    time: '08:30',
    time2: '20:30',
    notes: 'Take after breakfast and dinner. Finish full 7-day course.',
    status: 'taken',
    lastActionDate: getTodayDateString(),
    lastActionTime: '08:32 AM',
    createdAt: Date.now() - 36000000
  },
  {
    id: 'med_sample_2',
    name: 'Metformin Hydrochloride',
    dosage: '500 mg (1 Tablet)',
    category: 'Tablet',
    frequency: 'Daily',
    time: '13:00',
    notes: 'Take with lunch. Helps control blood glucose level.',
    status: 'pending',
    lastActionDate: getTodayDateString(),
    lastActionTime: '',
    createdAt: Date.now() - 30000000
  },
  {
    id: 'med_sample_3',
    name: 'Atorvastatin (Cholesterol)',
    dosage: '20 mg (1 Tablet)',
    category: 'Tablet',
    frequency: 'Daily',
    time: '21:00',
    notes: 'Take before sleep at bedtime with a glass of water.',
    status: 'pending',
    lastActionDate: getTodayDateString(),
    lastActionTime: '',
    createdAt: Date.now() - 24000000
  },
  {
    id: 'med_sample_4',
    name: 'Vitamin D3 & Calcium',
    dosage: '60,000 IU (1 Sachet)',
    category: 'Drops',
    frequency: 'Weekly',
    weeklyDay: 'Sunday',
    time: '10:00',
    notes: 'Mix with warm milk after morning breakfast.',
    status: 'skipped',
    lastActionDate: getTodayDateString(),
    lastActionTime: '10:05 AM',
    createdAt: Date.now() - 18000000
  }
];

const SAMPLE_HISTORY = [
  {
    id: 'hist_sample_1',
    medicineId: 'med_sample_1',
    medicineName: 'Amoxicillin (Antibiotic)',
    dosage: '500 mg (1 Capsule)',
    scheduledTime: '08:30 AM',
    loggedTime: '08:32 AM',
    date: getTodayDateString(),
    status: 'taken'
  },
  {
    id: 'hist_sample_2',
    medicineId: 'med_sample_4',
    medicineName: 'Vitamin D3 & Calcium',
    dosage: '60,000 IU (1 Sachet)',
    scheduledTime: '10:00 AM',
    loggedTime: '10:05 AM',
    date: getTodayDateString(),
    status: 'skipped'
  }
];

// =============================================================
// 3. DATE & TIME UTILITY FUNCTIONS
// =============================================================

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object or today's date into a pleasant readable string
 * e.g. "Friday, Sep 25, 2026"
 */
function formatReadableDate(d = new Date()) {
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString(undefined, options);
}

/**
 * Converts "HH:MM" (24-hour time) to "hh:mm AM/PM" format
 */
function formatTime12Hour(time24) {
  if (!time24) return '--:--';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour should be 12
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Returns current local time as "HH:MM" in 24-hr format
 */
function getCurrentTime24() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Returns current timestamp formatted as "hh:mm:ss AM/PM"
 */
function getCurrentTimeFormatted() {
  const now = new Date();
  return now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// =============================================================
// 4. AUDIO CHIME (Web Audio API Synthesizer)
// =============================================================

/**
 * Plays a pleasant hospital/reminder chime sound using the browser's Web Audio API.
 * Eliminates the need for external MP3 audio assets.
 */
function playReminderSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // First tone (523.25 Hz - C5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second tone (659.25 Hz - E5)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.2);
    gain2.gain.setValueAtTime(0.25, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.7);

    // Third harmonizing tone (783.99 Hz - G5)
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(783.99, now + 0.4);
    gain3.gain.setValueAtTime(0.25, now + 0.4);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
    osc3.start(now + 0.4);
    osc3.stop(now + 1.1);
  } catch (err) {
    console.warn('Audio playback not permitted or supported yet:', err);
  }
}

// =============================================================
// 5. LOCAL STORAGE & PERSISTENCE
// =============================================================

/**
 * Loads persisted data from LocalStorage.
 * Handles new-day status resets automatically while preserving historical logs!
 */
function loadDataFromStorage() {
  const savedMedicines = localStorage.getItem(STORAGE_KEYS.MEDICINES);
  const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
  const lastActiveDate = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_DATE);
  const today = getTodayDateString();

  if (savedMedicines) {
    try {
      appState.medicines = JSON.parse(savedMedicines);
    } catch (e) {
      console.error('Failed to parse medicines from storage:', e);
      appState.medicines = [];
    }
  } else {
    // First time launching app - populate with rich sample medicines
    appState.medicines = JSON.parse(JSON.stringify(SAMPLE_MEDICINES));
    saveMedicines();
  }

  if (savedHistory) {
    try {
      appState.history = JSON.parse(savedHistory);
    } catch (e) {
      console.error('Failed to parse history from storage:', e);
      appState.history = [];
    }
  } else {
    // Populate default history log
    appState.history = JSON.parse(JSON.stringify(SAMPLE_HISTORY));
    saveHistory();
  }

  // Automatic New Day Check:
  // If user opens the app on a new calendar day, reset all daily medicines back to "pending",
  // but keep all historic log records intact in history table.
  if (lastActiveDate && lastActiveDate !== today) {
    appState.medicines.forEach(med => {
      med.status = 'pending';
      med.lastActionDate = today;
      med.lastActionTime = '';
    });
    saveMedicines();
  }
  localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_DATE, today);
}

/**
 * Saves current medicines array to LocalStorage
 */
function saveMedicines() {
  localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(appState.medicines));
}

/**
 * Saves current history array to LocalStorage
 */
function saveHistory() {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(appState.history));
}

// =============================================================
// 6. DASHBOARD & STATS LOGIC
// =============================================================

/**
 * Updates the dashboard stat numbers, completion percentage,
 * and attractive animated progress bar.
 */
function renderDashboard() {
  const total = appState.medicines.length;
  let taken = 0;
  let pending = 0;
  let skipped = 0;

  appState.medicines.forEach(med => {
    const st = (med.status || 'pending').toLowerCase();
    if (st === 'taken') taken++;
    else if (st === 'skipped') skipped++;
    else pending++;
  });

  // Calculate percentage: completion percentage = taken / total * 100
  const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;

  // DOM Elements Update
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statTaken').textContent = taken;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statSkipped').textContent = skipped;

  // Filter Pill Counts
  document.getElementById('filterCountAll').textContent = total;
  document.getElementById('filterCountPending').textContent = pending;
  document.getElementById('filterCountTaken').textContent = taken;
  document.getElementById('filterCountSkipped').textContent = skipped;

  // Progress Bar & Percentage Text
  const progressFill = document.getElementById('progressFill');
  const progressPercentText = document.getElementById('progressPercentage');
  const progressSummaryText = document.getElementById('progressSummary');
  const progressMottoText = document.getElementById('progressMotto');

  progressFill.style.width = `${percentage}%`;
  progressFill.setAttribute('aria-valuenow', percentage);
  progressPercentText.textContent = `${percentage}%`;
  progressSummaryText.textContent = `${taken} of ${total} medicines taken today`;

  // Dynamic Motivational Status Motto
  if (total === 0) {
    progressMottoText.textContent = 'No medicines scheduled for today. Add your first medicine!';
  } else if (percentage === 100) {
    progressMottoText.textContent = '🎉 Outstanding! 100% medication adherence achieved today!';
  } else if (percentage >= 75) {
    progressMottoText.textContent = 'Great adherence! Almost done with all daily doses.';
  } else if (percentage >= 50) {
    progressMottoText.textContent = 'Halfway through today’s prescribed medications.';
  } else if (percentage > 0) {
    progressMottoText.textContent = 'Good start. Stay consistent with your schedule!';
  } else {
    progressMottoText.textContent = 'Pending scheduled doses. Stay healthy & on time!';
  }
}

// =============================================================
// 7. MEDICINE SCHEDULE DISPLAY & SORTING
// =============================================================

/**
 * Sorts medicines array chronologically by dose time
 */
function getSortedMedicines(list) {
  return [...list].sort((a, b) => {
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    return timeA.localeCompare(timeB);
  });
}

/**
 * Returns emoji avatar based on medicine type/category
 */
function getCategoryEmoji(category) {
  switch ((category || '').toLowerCase()) {
    case 'capsule': return '💊';
    case 'syrup': return '🧴';
    case 'injection': return '💉';
    case 'drops': return '💧';
    case 'inhaler': return '🫁';
    case 'tablet':
    default: return '💊';
  }
}

/**
 * Renders the medicine cards in the schedule section based on
 * current filter, search query, and sorted by time.
 */
function renderSchedule() {
  const container = document.getElementById('medicineList');
  const emptyState = document.getElementById('emptyScheduleState');
  const emptyTitle = document.getElementById('emptyStateTitle');
  const emptyDesc = document.getElementById('emptyStateDesc');

  // Filter medicines
  let filtered = appState.medicines.filter(med => {
    // Status filter
    if (appState.currentFilter !== 'all') {
      const st = (med.status || 'pending').toLowerCase();
      if (st !== appState.currentFilter) return false;
    }

    // Search query filter
    if (appState.searchQuery.trim() !== '') {
      const q = appState.searchQuery.toLowerCase().trim();
      const nameMatch = (med.name || '').toLowerCase().includes(q);
      const dosageMatch = (med.dosage || '').toLowerCase().includes(q);
      const notesMatch = (med.notes || '').toLowerCase().includes(q);
      if (!nameMatch && !dosageMatch && !notesMatch) return false;
    }

    return true;
  });

  // Sort by time chronologically
  filtered = getSortedMedicines(filtered);

  // Clear existing items
  container.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    if (appState.medicines.length === 0) {
      emptyTitle.textContent = 'No Medicines Scheduled';
      emptyDesc.textContent = 'Add your first medicine using the form on the left or click "Load Sample Medicines" to explore.';
    } else {
      emptyTitle.textContent = 'No Matching Medicines Found';
      emptyDesc.textContent = `No medicines match your current filter (${appState.currentFilter}) or search criteria.`;
    }
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach(med => {
    const card = createMedicineCardElement(med);
    container.appendChild(card);
  });
}

/**
 * Creates DOM card element for a single medicine item
 */
function createMedicineCardElement(med) {
  const card = document.createElement('div');
  const status = (med.status || 'pending').toLowerCase();
  card.className = `med-card status-${status}`;
  card.setAttribute('data-id', med.id);

  // Category Icon & Details
  const emoji = getCategoryEmoji(med.category);
  const timeFormatted1 = formatTime12Hour(med.time);
  const timeFormatted2 = med.time2 ? ` & ${formatTime12Hour(med.time2)}` : '';

  // Status Badge details
  let statusBadgeLabel = 'Pending';
  let statusBadgeClass = 'badge-pending';
  if (status === 'taken') {
    statusBadgeLabel = 'Taken';
    statusBadgeClass = 'badge-taken';
  } else if (status === 'skipped') {
    statusBadgeLabel = 'Skipped';
    statusBadgeClass = 'badge-skipped';
  }

  // Notes HTML if present
  let notesHtml = '';
  if (med.notes && med.notes.trim() !== '') {
    notesHtml = `
      <div class="med-notes-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>${escapeHtml(med.notes)}</span>
      </div>
    `;
  }

  // Action Buttons based on current status
  let actionButtonsHtml = '';
  if (status === 'pending') {
    actionButtonsHtml = `
      <div class="action-group-primary">
        <button type="button" class="btn btn-success btn-sm btn-mark-taken" data-id="${med.id}" title="Mark medicine as Taken">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Mark as Taken
        </button>
        <button type="button" class="btn btn-danger btn-sm btn-mark-skip" data-id="${med.id}" title="Mark medicine as Skipped">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Skip
        </button>
      </div>
    `;
  } else {
    // If already Taken or Skipped, allow Undo / Reset to Pending
    actionButtonsHtml = `
      <div class="action-group-primary">
        <span class="status-recorded-text" style="font-size: 0.8rem; color: var(--text-muted); align-self: center;">
          ${status === 'taken' ? '✓ Taken' : '✕ Skipped'} ${med.lastActionTime ? `at ${med.lastActionTime}` : ''}
        </span>
        <button type="button" class="btn btn-outline btn-sm btn-reset-status" data-id="${med.id}" title="Reset to Pending">
          <svg class="btn-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          </svg>
          Reset to Pending
        </button>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="med-card-top">
      <div class="med-info-group">
        <div class="med-type-avatar" title="${escapeHtml(med.category || 'Medicine')}">${emoji}</div>
        <div class="med-title-block">
          <h4 class="med-name">${escapeHtml(med.name)}</h4>
          <div class="med-dosage-line">
            <span>Dosage:</span>
            <span class="dosage-badge">${escapeHtml(med.dosage)}</span>
          </div>
        </div>
      </div>
      <div class="med-card-meta">
        <span class="time-chip" title="Scheduled intake time">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 13px; height: 13px;">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ${timeFormatted1}${timeFormatted2}
        </span>
        <span class="frequency-chip">${escapeHtml(med.frequency || 'Daily')}${med.weeklyDay ? ` (${med.weeklyDay})` : ''}</span>
        <span class="status-badge ${statusBadgeClass}">${statusBadgeLabel}</span>
      </div>
    </div>

    ${notesHtml}

    <div class="med-card-actions">
      ${actionButtonsHtml}
      <button type="button" class="btn btn-ghost btn-sm btn-delete-med" data-id="${med.id}" title="Delete this medicine">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ef4444;">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Delete
      </button>
    </div>
  `;

  return card;
}

// =============================================================
// 8. ADD MEDICINE FORM & VALIDATION
// =============================================================

/**
 * Validates and adds a new medicine to the schedule
 */
function handleAddMedicine(e) {
  e.preventDefault();

  const nameInput = document.getElementById('medName');
  const dosageInput = document.getElementById('medDosage');
  const categoryInput = document.getElementById('medCategory');
  const frequencyInput = document.getElementById('medFrequency');
  const timeInput = document.getElementById('medTime');
  const time2Input = document.getElementById('medTime2');
  const weeklyDayInput = document.getElementById('medWeeklyDay');
  const notesInput = document.getElementById('medNotes');

  // Error spans
  const nameError = document.getElementById('medNameError');
  const dosageError = document.getElementById('medDosageError');
  const timeError = document.getElementById('medTimeError');
  const time2Error = document.getElementById('medTime2Error');

  // Clear previous errors
  nameError.textContent = '';
  dosageError.textContent = '';
  timeError.textContent = '';
  time2Error.textContent = '';
  nameInput.classList.remove('is-invalid');
  dosageInput.classList.remove('is-invalid');
  timeInput.classList.remove('is-invalid');
  time2Input.classList.remove('is-invalid');

  let isValid = true;

  // Validate Name
  const nameVal = nameInput.value.trim();
  if (!nameVal) {
    nameError.textContent = 'Please enter the medicine name.';
    nameInput.classList.add('is-invalid');
    isValid = false;
  }

  // Validate Dosage
  const dosageVal = dosageInput.value.trim();
  if (!dosageVal) {
    dosageError.textContent = 'Please enter dosage (e.g. 500 mg, 1 tablet).';
    dosageInput.classList.add('is-invalid');
    isValid = false;
  }

  // Validate Primary Time
  const timeVal = timeInput.value.trim();
  if (!timeVal) {
    timeError.textContent = 'Please select a scheduled dose time.';
    timeInput.classList.add('is-invalid');
    isValid = false;
  }

  // Validate Second Time if Twice Daily
  const freqVal = frequencyInput.value;
  let time2Val = '';
  if (freqVal === 'Twice Daily') {
    time2Val = time2Input.value.trim();
    if (!time2Val) {
      time2Error.textContent = 'Please select the second dose time.';
      time2Input.classList.add('is-invalid');
      isValid = false;
    }
  }

  if (!isValid) {
    showToast('Please correct the highlighted form errors.', 'warning');
    return;
  }

  // Create new medicine object
  const newMedicine = {
    id: 'med_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: nameVal,
    dosage: dosageVal,
    category: categoryInput.value,
    frequency: freqVal,
    time: timeVal,
    time2: time2Val,
    weeklyDay: freqVal === 'Weekly' ? weeklyDayInput.value : '',
    notes: notesInput.value.trim(),
    status: 'pending',
    lastActionDate: getTodayDateString(),
    lastActionTime: '',
    createdAt: Date.now()
  };

  // Prepend or add to state
  appState.medicines.push(newMedicine);
  saveMedicines();

  // Reset form
  resetAddForm();

  // Update UI
  renderDashboard();
  renderSchedule();

  showToast(`Added "${newMedicine.name}" to schedule!`, 'success');
}

/**
 * Resets the Add Medicine form inputs and errors
 */
function resetAddForm() {
  document.getElementById('addMedicineForm').reset();
  document.getElementById('secondaryTimeGroup').style.display = 'none';
  document.getElementById('weeklyDayGroup').style.display = 'none';

  ['medName', 'medDosage', 'medTime', 'medTime2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('is-invalid');
  });
  ['medNameError', 'medDosageError', 'medTimeError', 'medTime2Error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

// =============================================================
// 9. STATUS ACTIONS & HISTORY LOGGING
// =============================================================

/**
 * Updates a medicine's status to 'taken', 'skipped', or 'pending'
 * and records the event in history.
 */
function updateMedicineStatus(medId, newStatus) {
  const med = appState.medicines.find(m => m.id === medId);
  if (!med) return;

  const prevStatus = med.status;
  med.status = newStatus;
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  med.lastActionDate = getTodayDateString();
  med.lastActionTime = timeFormatted;

  saveMedicines();

  // Only create a history record when marked as taken or skipped
  if (newStatus === 'taken' || newStatus === 'skipped') {
    const historyEntry = {
      id: 'hist_' + Date.now(),
      medicineId: med.id,
      medicineName: med.name,
      dosage: med.dosage,
      scheduledTime: formatTime12Hour(med.time),
      loggedTime: timeFormatted,
      date: getTodayDateString(),
      status: newStatus
    };

    appState.history.unshift(historyEntry); // most recent first
    saveHistory();
    renderHistory();

    const toastMsg = newStatus === 'taken'
      ? `Marked "${med.name}" as Taken! Adherence updated.`
      : `Marked "${med.name}" as Skipped.`;
    showToast(toastMsg, newStatus === 'taken' ? 'success' : 'warning');
  } else {
    showToast(`Reset "${med.name}" to Pending.`, 'info');
  }

  renderDashboard();
  renderSchedule();
}

/**
 * Deletes a medicine from schedule with confirmation
 */
function deleteMedicine(medId) {
  const med = appState.medicines.find(m => m.id === medId);
  if (!med) return;

  const confirmed = window.confirm(`Are you sure you want to remove "${med.name}" from your medicine schedule?`);
  if (!confirmed) return;

  appState.medicines = appState.medicines.filter(m => m.id !== medId);
  saveMedicines();

  renderDashboard();
  renderSchedule();
  showToast(`Removed "${med.name}" from schedule.`, 'info');
}

/**
 * Resets all medicines to 'pending' for demonstration/testing today
 */
function resetDayStatus() {
  if (appState.medicines.length === 0) return;
  const confirmed = window.confirm('Reset all medicine statuses to "Pending" for today?');
  if (!confirmed) return;

  appState.medicines.forEach(m => {
    m.status = 'pending';
    m.lastActionTime = '';
  });
  saveMedicines();

  renderDashboard();
  renderSchedule();
  showToast('All medicine statuses reset to Pending for today.', 'info');
}

// =============================================================
// 10. HISTORY DISPLAY & MANAGEMENT
// =============================================================

/**
 * Renders the medication intake history table
 */
function renderHistory() {
  const tableBody = document.getElementById('historyTableBody');
  const emptyHistory = document.getElementById('emptyHistoryState');
  const tableContainer = document.querySelector('.history-table-container');

  tableBody.innerHTML = '';

  if (appState.history.length === 0) {
    emptyHistory.style.display = 'block';
    tableContainer.style.display = 'none';
    return;
  }

  emptyHistory.style.display = 'none';
  tableContainer.style.display = 'block';

  appState.history.forEach(entry => {
    const tr = document.createElement('tr');
    const isTaken = entry.status === 'taken';
    const badgeClass = isTaken ? 'badge-taken' : 'badge-skipped';
    const badgeText = isTaken ? 'Taken' : 'Skipped';

    tr.innerHTML = `
      <td><strong>${escapeHtml(entry.medicineName)}</strong></td>
      <td>${escapeHtml(entry.dosage)}</td>
      <td>${escapeHtml(entry.scheduledTime)}</td>
      <td>
        <span>${escapeHtml(entry.date)}</span>
        <span style="color: var(--text-muted); font-size: 0.75rem;"> at ${escapeHtml(entry.loggedTime || '')}</span>
      </td>
      <td>
        <span class="status-badge ${badgeClass}">${badgeText}</span>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

/**
 * Clears the history log with confirmation
 */
function clearHistory() {
  if (appState.history.length === 0) {
    showToast('History log is already empty.', 'info');
    return;
  }

  const confirmed = window.confirm('Are you sure you want to clear your medicine intake history log?');
  if (!confirmed) return;

  appState.history = [];
  saveHistory();
  renderHistory();
  showToast('Medication history log cleared.', 'info');
}

// =============================================================
// 11. REMINDER SYSTEM (In-Page Modal, Audio & Notifications)
// =============================================================

/**
 * Regularly checks whether current time matches any pending medicine's scheduled time.
 * Runs every second via setInterval.
 */
function checkReminders() {
  const currentTime24 = getCurrentTime24();
  const today = getTodayDateString();
  const nowMs = Date.now();

  appState.medicines.forEach(med => {
    // Only remind if currently pending
    if (med.status !== 'pending') return;

    // Check if snoozed
    if (appState.snoozedReminders[med.id] && nowMs < appState.snoozedReminders[med.id]) {
      return;
    }

    // Check primary time and secondary time (if twice daily)
    const timesToCheck = [med.time];
    if (med.frequency === 'Twice Daily' && med.time2) {
      timesToCheck.push(med.time2);
    }

    timesToCheck.forEach(timeSlot => {
      if (!timeSlot) return;

      if (timeSlot === currentTime24) {
        const sessionKey = `${med.id}_${today}_${timeSlot}`;
        // Ensure reminder pops up only once per minute slot today
        if (!appState.remindedKeysThisSession.has(sessionKey)) {
          appState.remindedKeysThisSession.add(sessionKey);
          triggerReminder(med, timeSlot);
        }
      }
    });
  });
}

/**
 * Displays the In-Page Reminder Modal, plays the synthesized sound chime,
 * and displays an optional browser notification if permission is granted.
 */
function triggerReminder(med, scheduledTime24) {
  appState.activeReminderMedicine = med;

  // Sound chime
  playReminderSound();

  // Populate Modal Fields
  const modal = document.getElementById('reminderModalBackdrop');
  document.getElementById('modalMedName').textContent = med.name;
  document.getElementById('modalMedDosage').textContent = med.dosage;
  document.getElementById('modalMedTime').textContent = formatTime12Hour(scheduledTime24 || med.time);
  document.getElementById('modalMedFrequency').textContent = med.frequency || 'Daily';

  const notesEl = document.getElementById('modalMedNotes');
  const notesWrap = document.getElementById('modalMedNotesWrap');
  if (med.notes && med.notes.trim() !== '') {
    notesEl.textContent = med.notes;
    notesWrap.style.display = 'block';
  } else {
    notesWrap.style.display = 'none';
  }

  // Display modal
  modal.style.display = 'flex';

  // Optional Browser Push Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`MedTrack Reminder: ${med.name}`, {
        body: `Time to take ${med.name} (${med.dosage}) - Scheduled at ${formatTime12Hour(scheduledTime24 || med.time)}.`,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>'
      });
    } catch (e) {
      console.warn('Browser push notification could not be shown:', e);
    }
  }
}

/**
 * Closes the in-page reminder modal
 */
function closeReminderModal() {
  document.getElementById('reminderModalBackdrop').style.display = 'none';
  appState.activeReminderMedicine = null;
}

/**
 * Handles "Test Reminder" button click:
 * Immediately triggers the reminder modal for the first pending medicine (or sample)
 * so evaluators and teachers can review the feature instantly without waiting!
 */
function testReminder() {
  // Find first pending medicine, or first medicine, or fallback
  let candidate = appState.medicines.find(m => m.status === 'pending') || appState.medicines[0];

  if (!candidate) {
    candidate = {
      id: 'demo_test',
      name: 'Paracetamol (Demo Test)',
      dosage: '500 mg',
      category: 'Tablet',
      frequency: 'Daily',
      time: getCurrentTime24(),
      notes: 'Take with warm water after lunch. (Demonstration Mode)'
    };
  }

  showToast('Demonstrating Instant Reminder Popup & Audio Chime...', 'info');
  triggerReminder(candidate, candidate.time || getCurrentTime24());
}

/**
 * Requests or toggles browser notification permissions
 */
function setupNotifications() {
  const notifBtn = document.getElementById('btnEnableNotifications');
  const notifText = document.getElementById('notifBtnText');

  if (!('Notification' in window)) {
    notifBtn.style.display = 'none';
    return;
  }

  function updateButtonState() {
    if (Notification.permission === 'granted') {
      notifText.textContent = 'Notifications: Active';
      notifBtn.classList.remove('btn-outline');
      notifBtn.classList.add('btn-secondary');
    } else if (Notification.permission === 'denied') {
      notifText.textContent = 'Notifications: Blocked';
      notifBtn.title = 'Browser notifications are blocked in your browser settings.';
    } else {
      notifText.textContent = 'Enable Notifications';
    }
  }

  updateButtonState();

  notifBtn.addEventListener('click', () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        updateButtonState();
        if (permission === 'granted') {
          showToast('Browser notifications enabled successfully!', 'success');
        } else {
          showToast('Browser notifications were not granted. In-page modal will still work!', 'info');
        }
      });
    } else if (Notification.permission === 'granted') {
      showToast('Push notifications are already active for MedTrack.', 'info');
    } else {
      showToast('Notifications are blocked by your browser settings. In-page reminder will always work.', 'warning');
    }
  });
}

// =============================================================
// 12. TOAST SYSTEM & FEEDBACK
// =============================================================

/**
 * Displays a non-intrusive floating toast notification
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3500);
}

/**
 * Escapes unsafe HTML characters to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =============================================================
// 13. CLOCK & TICKERS
// =============================================================

/**
 * Updates the top header live clock and date
 */
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = formatReadableDate(now);

  const liveTimeEl = document.getElementById('liveTime');
  const liveDateEl = document.getElementById('liveDate');
  const dateChipEl = document.getElementById('dashboardDateChip');

  if (liveTimeEl) liveTimeEl.textContent = timeStr;
  if (liveDateEl) liveDateEl.textContent = dateStr;
  if (dateChipEl) dateChipEl.textContent = dateStr;
}

// =============================================================
// 14. EVENT LISTENERS & SETUP
// =============================================================

function attachEventListeners() {
  // Form submission
  const addForm = document.getElementById('addMedicineForm');
  addForm.addEventListener('submit', handleAddMedicine);

  // Reset form button
  const resetFormBtn = document.getElementById('btnResetForm');
  resetFormBtn.addEventListener('click', resetAddForm);

  // Frequency selector change (show/hide secondary time or day)
  const freqSelect = document.getElementById('medFrequency');
  const secTimeGroup = document.getElementById('secondaryTimeGroup');
  const weeklyDayGroup = document.getElementById('weeklyDayGroup');

  freqSelect.addEventListener('change', () => {
    const val = freqSelect.value;
    secTimeGroup.style.display = val === 'Twice Daily' ? 'block' : 'none';
    weeklyDayGroup.style.display = val === 'Weekly' ? 'block' : 'none';
  });

  // Search input & clear button
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  searchInput.addEventListener('input', (e) => {
    appState.searchQuery = e.target.value;
    clearSearchBtn.style.display = appState.searchQuery.length > 0 ? 'block' : 'none';
    renderSchedule();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    appState.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderSchedule();
    searchInput.focus();
  });

  // Filter Pills (All / Pending / Taken / Skipped)
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      appState.currentFilter = pill.getAttribute('data-filter') || 'all';
      renderSchedule();
    });
  });

  // Medicine list event delegation (Taken, Skipped, Reset, Delete)
  const medList = document.getElementById('medicineList');
  medList.addEventListener('click', (e) => {
    const takenBtn = e.target.closest('.btn-mark-taken');
    if (takenBtn) {
      const id = takenBtn.getAttribute('data-id');
      updateMedicineStatus(id, 'taken');
      return;
    }

    const skipBtn = e.target.closest('.btn-mark-skip');
    if (skipBtn) {
      const id = skipBtn.getAttribute('data-id');
      updateMedicineStatus(id, 'skipped');
      return;
    }

    const resetBtn = e.target.closest('.btn-reset-status');
    if (resetBtn) {
      const id = resetBtn.getAttribute('data-id');
      updateMedicineStatus(id, 'pending');
      return;
    }

    const delBtn = e.target.closest('.btn-delete-med');
    if (delBtn) {
      const id = delBtn.getAttribute('data-id');
      deleteMedicine(id);
      return;
    }
  });

  // Reset Day button
  document.getElementById('btnResetDayStatus').addEventListener('click', resetDayStatus);

  // Clear History button
  document.getElementById('btnClearHistory').addEventListener('click', clearHistory);

  // Load Sample Medicines button
  document.getElementById('btnLoadSampleData').addEventListener('click', () => {
    const confirmed = window.confirm('Load sample medications for demonstration? This will add preset medicines to your schedule.');
    if (!confirmed) return;

    appState.medicines = JSON.parse(JSON.stringify(SAMPLE_MEDICINES));
    appState.history = JSON.parse(JSON.stringify(SAMPLE_HISTORY));
    saveMedicines();
    saveHistory();
    renderDashboard();
    renderSchedule();
    renderHistory();
    showToast('Sample medicines and history loaded successfully!', 'success');
  });

  // Test Reminder button
  document.getElementById('btnTestReminder').addEventListener('click', testReminder);

  // Reminder Modal Action buttons
  document.getElementById('modalBtnTaken').addEventListener('click', () => {
    if (appState.activeReminderMedicine) {
      updateMedicineStatus(appState.activeReminderMedicine.id, 'taken');
    }
    closeReminderModal();
  });

  document.getElementById('modalBtnSnooze').addEventListener('click', () => {
    if (appState.activeReminderMedicine) {
      // Snooze for 5 minutes (300,000 ms)
      appState.snoozedReminders[appState.activeReminderMedicine.id] = Date.now() + (5 * 60 * 1000);
      showToast(`Reminder for "${appState.activeReminderMedicine.name}" snoozed for 5 minutes.`, 'info');
    }
    closeReminderModal();
  });

  document.getElementById('modalBtnDismiss').addEventListener('click', () => {
    closeReminderModal();
  });

  // Close modal when clicking on backdrop
  document.getElementById('reminderModalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'reminderModalBackdrop') {
      closeReminderModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeReminderModal();
    }
  });
}

// =============================================================
// 15. INITIALIZATION
// =============================================================

function initApp() {
  // Load data from LocalStorage
  loadDataFromStorage();

  // Initialize Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Initialize Push Notification permissions
  setupNotifications();

  // Attach Event Listeners
  attachEventListeners();

  // Initial UI Render
  renderDashboard();
  renderSchedule();
  renderHistory();

  // Start Reminder checking loop (every 1.5 seconds)
  setInterval(checkReminders, 1500);

  console.log('MedTrack initialized successfully. UN SDG 3 Good Health & Well-Being.');
}

// Expose API on window for testing and console inspection
window.MedTrack = {
  appState,
  loadDataFromStorage,
  saveMedicines,
  saveHistory,
  renderDashboard,
  renderSchedule,
  renderHistory,
  updateMedicineStatus,
  deleteMedicine,
  resetDayStatus,
  clearHistory,
  testReminder,
  playReminderSound,
  initApp
};

// Also expose individual functions for backwards compatibility in tests
window.updateMedicineStatus = updateMedicineStatus;
window.deleteMedicine = deleteMedicine;
window.testReminder = testReminder;
window.playReminderSound = playReminderSound;
window.renderDashboard = renderDashboard;
window.renderSchedule = renderSchedule;
window.renderHistory = renderHistory;

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
