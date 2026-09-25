# MedGuide AI – Multi-User Clinical Health & Medication Platform

An AI-assisted medication adherence, interaction checking, and wellness platform developed for **UN Sustainable Development Goal 3 (UN SDG 3: Good Health and Well-Being)**.

> **Architecture:** Full-Stack Multi-User Application  
> **Backend & Database:** Python 3 HTTP Server + Relational SQLite Database (`medguide.db`)  
> **Frontend:** Pure HTML5, CSS3, Vanilla JavaScript, Chart.js  
> **Execution:** Running locally on `http://localhost:5000`

---

## 👥 Multi-User Authentication & Data Isolation

MedGuide AI supports multiple independent patient accounts with complete data isolation enforced at the database layer via `user_id` foreign keys and token-based authentication.

### Demo Patient Accounts (1-Click Login):
| Account | Email | Password | Profile Summary |
| :--- | :--- | :--- | :--- |
| **Alex Johnson** (Patient A) | `alex@example.com` | `password123` | Age 52, Male, Type 2 Diabetes & Hypertension, 3 Medications (Metformin, Lisinopril, Atorvastatin) |
| **Sarah Davis** (Patient B) | `sarah@example.com` | `password123` | Age 34, Female, Bronchial Asthma & Rhinitis, 2 Medications (Albuterol Inhaler, Cetirizine) |
| **New Register** | *Any email* | *Custom* | Starts with a 100% clean, empty schedule (no hardcoded data!) |

---

## 🔒 Security & Architecture Overview

- **Protected Routes**: Unauthenticated users can only access the **Authentication Portal** (Sign In, Create Account, Reset Password).
- **Session Tokens**: Cryptographically secure 256-bit bearer tokens (`secrets.token_hex(32)`) validated on every `/api/*` call.
- **Strict Data Ownership**: Every SQL query is filtered by `WHERE user_id = ?` derived directly from the validated session token. User A can never see or modify User B's medications, symptoms, or records.
- **Password Protection**: Passwords hashed with PBKDF2-HMAC-SHA256 with individual cryptographic salts.

---

## 🛠️ Relational Database Schema (`medguide.db`)

```text
users              (id, email, password_hash, salt, created_at)
sessions           (token, user_id, created_at)
profiles           (user_id, name, age, gender, height, weight, blood_type, conditions, allergies, sleep_avg)
medications        (id, user_id, name, strength, category, frequency, time, quantity, refill_threshold, status)
adherence_records  (id, user_id, medication_id, medication_name, status, scheduled_time, logged_at, date)
symptoms           (id, user_id, name, severity, date, time, medication_name, notes)
prescriptions      (id, user_id, title, doctor_name, date_issued, extracted_data, status)
diet_preferences   (user_id, cuisine, dietary_style, activity_level)
caregivers         (user_id, name, relation, phone, email, permissions)
emergency_cards    (user_id, ice_contact_name, ice_contact_phone, doctor_name, doctor_phone, custom_notes)
```

---

## 🌟 Fully Connected Features

1. **Working Profile CRUD**:
   - View and edit demographics, biometrics, conditions, allergies, and emergency contacts.
   - Calculates real BMI dynamically; persists across sessions.

2. **Full Medication CRUD**:
   - **Add**: Form with name, strength, frequency, time, and inventory count.
   - **Edit**: Modal allows editing any active prescription.
   - **Delete**: Safely archives/deletes from the database.
   - **Track**: Clicking **Mark as Taken** creates a real adherence record in `adherence_records` and decrements pill inventory.

3. **Real Health Insights Engine**:
   - Calculates insights from the authenticated user's actual database records.
   - If a new user has no records: *"Not enough data yet. Add medications, adherence records, or symptoms to generate insights."*

4. **Symptom Tracker CRUD & Graphs**:
   - Add, edit, and delete symptoms with 1–5 severity ratings.
   - Line chart rendered from real user severity records.
   - Automated recurring pattern alert triggered when severity $\ge 3$ recurs.

5. **Top-Right Profile Dropdown**:
   - Includes **My Profile**, **Health Information**, **Settings**, **Switch Account**, and **Sign Out**.

6. **Prescription Scanner**:
   - OCR simulation with human verification step before saving to the database.

7. **Smart Refill Tracker**:
   - Tracks actual pill quantities; triggers low-supply alert when supply $\le 7$ days; working **+ Refill (+30)** button.

---

## 🚀 How to Run Locally

The server is currently running in the background:

```text
http://localhost:5000
```

To run manually at any time:
```powershell
python server.py
```
Open `http://localhost:5000` in any web browser.
