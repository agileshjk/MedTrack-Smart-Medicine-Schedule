# MedTrack – Smart Medicine Schedule & Reminder

A modern, responsive healthcare web application built with **HTML5, CSS3, and Vanilla JavaScript**, using **LocalStorage** for offline persistence.

> **Target:** College CSE Project  
> **Theme:** United Nations Sustainable Development Goal 3 (UN SDG 3) – **Good Health and Well-Being** (Target 3.8: Access to essential medicines & Target 3.d: Early warning & health risk reduction).

---

## 🌟 Features Overview

### 1. Interactive Health Dashboard
- **Live Clock & Date**: Displays real-time local time and calendar date with continuous ticking.
- **Dose Counters**: Real-time counts for:
  - Total Scheduled Medicines
  - Medicines Taken
  - Medicines Pending
  - Medicines Skipped
- **Adherence Rate & Progress Bar**: Dynamically calculates completion percentage:
  $$\text{Completion Percentage} = \left(\frac{\text{Taken Medicines}}{\text{Total Scheduled Medicines}}\right) \times 100$$
  Visualized with an animated, rounded progress bar and motivational adherence feedback.

### 2. Add Medicine Form
- **Inputs**: Medicine Name, Dosage, Type/Form (Tablet, Capsule, Syrup, Injection, Drops, Inhaler), Scheduled Time, Frequency (Daily, Twice Daily, Weekly, Custom), and Instructions/Notes.
- **Dynamic Field Visibility**:
  - Selecting *Twice Daily* reveals an input for the second dose time.
  - Selecting *Weekly* reveals an intake day selector.
- **Client-Side Validation**: Validates all required inputs with inline feedback messages.

### 3. Medicine Schedule & Chronological Sorting
- **Cards View**: Clean cards with medicine icon, dosage badge, scheduled time chip, frequency, instructions, and status badges.
- **Chronological Sorting**: Automatically sorts medicines by time of day.
- **Action Controls**:
  - **Mark as Taken**: Updates status, recalculates adherence, and logs to history.
  - **Skip**: Marks dose as intentionally skipped and logs to history.
  - **Reset to Pending**: Allows undoing an accidental click.
  - **Delete**: Safely removes medicine after confirmation.

### 4. Smart In-Page Reminder System
- **Real-Time Clock Monitor**: Continuously monitors the system time every second.
- **In-Page Reminder Modal**: Pops up when the current time matches a scheduled dose, presenting medicine name, dosage, time, and instructions.
- **Web Audio API Chime**: Plays a 3-tone synthesizer chime without requiring external sound files.
- **Snooze Option**: Allows snoozing a reminder for 5 minutes.
- **"Test Reminder" Button**: Allows students and evaluators to trigger and demonstrate the reminder popup instantly during viva evaluations.
- **Optional Web Push Notifications**: Integrates browser notifications if supported and allowed.

### 5. Search & Filter
- **Live Search**: Instant filtering by medicine name, dosage, or instructions.
- **Filter Pills**: Quick toggle between **All**, **Pending**, **Taken**, and **Skipped** doses with real-time count badges.

### 6. Medication Intake History Log
- Comprehensive table recording intake actions with:
  - Medicine Name
  - Dosage
  - Scheduled Time
  - Date & Timestamp of Action
  - Status (Taken / Skipped)
- **Clear Log Option**: Allows clearing the history log with confirmation.

### 7. Offline LocalStorage Persistence
- Saves medicines, daily status, history, and timestamps.
- **Automatic New-Day Reset**: When launched on a new calendar date, daily dose statuses reset to *Pending* while preserving the complete historical log.
- **Sample Data Seeder**: Includes preset sample data for immediate evaluation and viva demonstrations.

### 8. Safety Notice
- Built-in disclaimer: *"This application is a medication reminder and organization tool. It does not provide medical diagnosis or replace professional medical advice."*

---

## 📁 Project Structure

```text
medtrack/
├── index.html          # Semantic HTML5 layout and modal structure
├── style.css           # Modern healthcare dashboard theme & responsive styles
├── script.js           # Vanilla JavaScript business logic, LocalStorage & Audio API
├── test_suite.html     # Automated browser test suite (22 unit & integration tests)
└── README.md           # Project documentation and viva guide
```

---

## 🚀 How to Run

1. **Directly in Browser**:
   - Double-click or open `index.html` in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.
   - No installation, Node.js, build step, or web server required!

2. **Run Automated Tests**:
   - Double-click or open `test_suite.html` in your browser.
   - All 22 automated unit and integration tests will execute and display live results.

---

## 🎓 College Viva & CSE Presentation Guide

### 1. Why UN SDG 3?
Medication non-adherence is a major global healthcare challenge. According to the WHO, approximately 50% of patients with chronic illnesses do not take medications as prescribed. MedTrack improves adherence through automated reminders, dosage tracking, and visual progress indicators.

### 2. Why Vanilla JavaScript and LocalStorage?
- **Zero Dependencies**: Ensures maximum portability, runs anywhere without npm or build tools.
- **High Performance**: Instant load times and zero network latency.
- **Explainability**: Code is clean and modular, ideal for academic presentation and grading.

### 3. How does the Reminder System work without external libraries?
- `setInterval` evaluates current time against scheduled times.
- Native **Web Audio API** (`window.AudioContext`) synthesizes custom sound frequencies (C5, E5, G5) in real-time, removing any dependency on third-party audio files.
- Persistent session keys prevent duplicate notifications in the same minute slot.
