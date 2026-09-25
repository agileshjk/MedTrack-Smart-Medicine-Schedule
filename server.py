"""
MedGuide AI – Full-Stack Production Multi-User Backend & Server
================================================================
Technologies: Python 3 standard library (http.server, sqlite3, hashlib, secrets)
Features:
- Real SQLite Relational Database (medguide.db)
- Multi-User Authentication (Register, Login, Logout, Password Reset, Sessions)
- Data Isolation: strictly scopes all health data by authenticated user_id
- Full CRUD: Profile, Medications, Adherence, Symptoms, Prescriptions, Caregivers, Emergency Card
- Dynamic Health Insights Engine based on actual records
- Static file server for frontend assets on http://localhost:5000
"""

import http.server
import socketserver
import os
import sys
import json
import sqlite3
import hashlib
import secrets
import time
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta

PORT = 5000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DIRECTORY, "medguide.db")

# =============================================================
# 1. DATABASE SCHEMA & INITIALIZATION
# =============================================================

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def hash_password(password, salt=None):
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return hashed, salt

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)

    # Active Sessions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Profiles Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        age INTEGER DEFAULT 50,
        gender TEXT DEFAULT 'Male',
        height REAL DEFAULT 175,
        weight REAL DEFAULT 75,
        blood_type TEXT DEFAULT 'O+',
        sleep_avg TEXT DEFAULT '7 hours',
        conditions TEXT DEFAULT '',
        allergies TEXT DEFAULT '',
        photo_url TEXT DEFAULT '',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Medications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        strength TEXT NOT NULL,
        dosage_instructions TEXT DEFAULT '',
        category TEXT DEFAULT 'Tablet',
        frequency TEXT DEFAULT 'Daily',
        time TEXT DEFAULT '08:00',
        quantity INTEGER DEFAULT 30,
        refill_threshold INTEGER DEFAULT 7,
        status TEXT DEFAULT 'pending',
        notes TEXT DEFAULT '',
        last_action_date TEXT DEFAULT '',
        last_action_time TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Adherence Records Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS adherence_records (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        medication_id TEXT,
        medication_name TEXT NOT NULL,
        status TEXT NOT NULL, -- 'taken', 'missed', 'delayed'
        scheduled_time TEXT NOT NULL,
        logged_at TEXT NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Symptoms Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS symptoms (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        severity INTEGER NOT NULL, -- 1 to 5
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        medication_name TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Prescriptions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        doctor_name TEXT DEFAULT '',
        date_issued TEXT DEFAULT '',
        extracted_data TEXT DEFAULT '',
        status TEXT DEFAULT 'verified',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Diet Preferences Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS diet_preferences (
        user_id TEXT PRIMARY KEY,
        cuisine TEXT DEFAULT 'South Indian',
        dietary_style TEXT DEFAULT 'Vegetarian',
        activity_level TEXT DEFAULT 'Moderate',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Caregivers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS caregivers (
        user_id TEXT PRIMARY KEY,
        name TEXT DEFAULT '',
        relation TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        perm_missed_doses INTEGER DEFAULT 1,
        perm_adherence INTEGER DEFAULT 1,
        perm_med_list INTEGER DEFAULT 1,
        perm_symptoms INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Emergency Card Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emergency_cards (
        user_id TEXT PRIMARY KEY,
        ice_contact_name TEXT DEFAULT '',
        ice_contact_phone TEXT DEFAULT '',
        doctor_name TEXT DEFAULT '',
        doctor_phone TEXT DEFAULT '',
        custom_notes TEXT DEFAULT '',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    seed_demo_accounts(conn)
    conn.close()

def seed_demo_accounts(conn):
    cursor = conn.cursor()
    # Check if demo account exists
    cursor.execute("SELECT id FROM users WHERE email = 'alex@example.com'")
    if cursor.fetchone():
        return # Already seeded

    now_iso = datetime.now().isoformat()
    today_str = datetime.now().strftime("%Y-%m-%d")

    # 1. Seed Demo User A: Alex Johnson (Age 52, Hypertension & Diabetes)
    user_a_id = "user_alex_demo"
    pwd_hash, salt = hash_password("password123")
    cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", 
                   (user_a_id, "alex@example.com", pwd_hash, salt, now_iso))

    cursor.execute("""
    INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_a_id, "Alex Johnson", 52, "Male", 176.0, 81.0, "O+", "7.2 hours",
          "Type 2 Diabetes Mellitus, Essential Primary Hypertension",
          "Penicillin (Severe Rash), Shellfish", "", now_iso))

    # Medications for Alex
    meds_alex = [
        ("med_alex_1", user_a_id, "Metformin Hydrochloride", "500 mg", "1 tablet with breakfast", "Tablet", "Daily", "08:00", 10, 7, "taken", "Take with breakfast.", today_str, "08:05 AM", now_iso),
        ("med_alex_2", user_a_id, "Lisinopril", "10 mg", "1 tablet in morning", "Tablet", "Daily", "08:00", 24, 7, "taken", "ACE inhibitor for blood pressure.", today_str, "08:06 AM", now_iso),
        ("med_alex_3", user_a_id, "Atorvastatin Calcium", "20 mg", "1 tablet with dinner", "Tablet", "Daily", "20:00", 28, 7, "pending", "Avoid grapefruit juice.", today_str, "", now_iso)
    ]
    cursor.executemany("INSERT INTO medications VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", meds_alex)

    # Adherence records for Alex (Last 14 days)
    adh_alex = []
    for days_ago in range(14, 0, -1):
        d_str = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        status = "taken" if days_ago not in [4, 11] else "missed"
        adh_alex.append((f"adh_alex_{days_ago}_1", user_a_id, "med_alex_1", "Metformin Hydrochloride", status, "08:00 AM", f"{d_str} 08:05:00", d_str))
        adh_alex.append((f"adh_alex_{days_ago}_2", user_a_id, "med_alex_2", "Lisinopril", status, "08:00 AM", f"{d_str} 08:06:00", d_str))
        adh_alex.append((f"adh_alex_{days_ago}_3", user_a_id, "Atorvastatin Calcium", "Atorvastatin Calcium", "taken" if days_ago != 7 else "delayed", "08:00 PM", f"{d_str} 20:15:00", d_str))
    cursor.executemany("INSERT INTO adherence_records VALUES (?, ?, ?, ?, ?, ?, ?, ?)", adh_alex)

    # Symptoms for Alex (Fatigue progression)
    sym_alex = [
        ("sym_a_1", user_a_id, "Fatigue / Low Energy", 2, (datetime.now() - timedelta(days=21)).strftime("%Y-%m-%d"), "14:30", "Metformin Hydrochloride", "Slight midafternoon tiredness.", now_iso),
        ("sym_a_2", user_a_id, "Fatigue / Low Energy", 2, (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d"), "15:00", "Metformin Hydrochloride", "Mild fatigue after lunch.", now_iso),
        ("sym_a_3", user_a_id, "Fatigue / Low Energy", 4, (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d"), "16:15", "Metformin Hydrochloride", "Elevated fatigue and heavy limbs.", now_iso),
        ("sym_a_4", user_a_id, "Fatigue / Low Energy", 4, (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"), "15:45", "Metformin Hydrochloride", "Persistent tiredness; felt exhausted.", now_iso),
        ("sym_a_5", user_a_id, "Mild Dizziness", 2, (datetime.now() - timedelta(days=3)).strftime("%Y-%m-%d"), "09:30", "Lisinopril", "Brief dizziness upon standing.", now_iso)
    ]
    cursor.executemany("INSERT INTO symptoms VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", sym_alex)

    # Caregiver for Alex
    cursor.execute("INSERT INTO caregivers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                   (user_a_id, "Sarah Johnson", "Daughter", "(555) 234-5678", "sarah.j@example.com", 1, 1, 1, 0, now_iso))

    # Emergency Card for Alex
    cursor.execute("INSERT INTO emergency_cards VALUES (?, ?, ?, ?, ?, ?, ?)",
                   (user_a_id, "Sarah Johnson (Daughter)", "(555) 234-5678", "Dr. Robert Vance, MD", "(555) 987-6543", "Patient has Type 2 Diabetes and Hypertension.", now_iso))

    cursor.execute("INSERT INTO diet_preferences VALUES (?, ?, ?, ?, ?)",
                   (user_a_id, "South Indian", "Vegetarian", "Moderate", now_iso))

    # 2. Seed Demo User B: Sarah Davis (Completely different patient!)
    user_b_id = "user_sarah_demo"
    pwd_hash_b, salt_b = hash_password("password123")
    cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)",
                   (user_b_id, "sarah@example.com", pwd_hash_b, salt_b, now_iso))

    cursor.execute("""
    INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_b_id, "Sarah Davis", 34, "Female", 165.0, 58.0, "A+", "8.0 hours",
          "Bronchial Asthma, Seasonal Allergic Rhinitis",
          "Sulfa Antibiotics, Latex", "", now_iso))

    # Medications for Sarah (Asthma inhaler and antihistamine)
    meds_sarah = [
        ("med_sarah_1", user_b_id, "Albuterol Inhaler (Ventolin)", "90 mcg", "2 puffs as needed or before exercise", "Inhaler", "Daily", "07:30", 55, 10, "taken", "Rinse mouth after inhalation.", today_str, "07:35 AM", now_iso),
        ("med_sarah_2", user_b_id, "Cetirizine Hydrochloride", "10 mg", "1 tablet at bedtime", "Tablet", "Daily", "21:30", 30, 7, "pending", "Non-drowsy antihistamine for rhinitis.", today_str, "", now_iso)
    ]
    cursor.executemany("INSERT INTO medications VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", meds_sarah)

    conn.commit()

# =============================================================
# 2. HTTP REQUEST HANDLER WITH REST API & AUTH
# =============================================================

class MedGuideAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def parse_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                raw = self.rfile.read(content_length).decode('utf-8')
                return json.loads(raw)
        except Exception as e:
            pass
        return {}

    def get_authenticated_user_id(self):
        auth_header = self.headers.get('Authorization', '')
        token = ''
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()

        if not token:
            return None

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM sessions WHERE token = ?", (token,))
        row = cursor.fetchone()
        conn.close()

        if row:
            return row['user_id']
        return None

    # ---------------------------------------------------------
    # ROUTE DISPATCHER
    # ---------------------------------------------------------
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/"):
            self.handle_api_get(path, parse_qs(parsed.query))
        else:
            # Serve Static Assets (HTML, CSS, JS)
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/"):
            self.handle_api_post(path)
        else:
            self.send_json({"error": "Not Found"}, 404)

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/"):
            self.handle_api_put(path)
        else:
            self.send_json({"error": "Not Found"}, 404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/"):
            self.handle_api_delete(path)
        else:
            self.send_json({"error": "Not Found"}, 404)

    # ---------------------------------------------------------
    # API GET HANDLER
    # ---------------------------------------------------------
    def handle_api_get(self, path, query):
        user_id = self.get_authenticated_user_id()

        # Public Auth Check
        if path == "/api/auth/me":
            if not user_id:
                return self.send_json({"authenticated": False}, 401)
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT id, email FROM users WHERE id = ?", (user_id,))
            u = cursor.fetchone()
            cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
            p = cursor.fetchone()
            conn.close()
            return self.send_json({
                "authenticated": True,
                "user": dict(u) if u else {},
                "profile": dict(p) if p else {}
            })

        # Protected Routes (Require Authentication)
        if not user_id:
            return self.send_json({"error": "Authentication required. Please sign in."}, 401)

        conn = get_db()
        cursor = conn.cursor()

        if path == "/api/profile":
            cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
            p = cursor.fetchone()
            conn.close()
            return self.send_json(dict(p) if p else {})

        elif path == "/api/medications":
            cursor.execute("SELECT * FROM medications WHERE user_id = ? ORDER BY time ASC", (user_id,))
            meds = [dict(m) for m in cursor.fetchall()]
            conn.close()
            return self.send_json(meds)

        elif path == "/api/adherence":
            cursor.execute("SELECT * FROM adherence_records WHERE user_id = ? ORDER BY logged_at DESC LIMIT 60", (user_id,))
            records = [dict(r) for r in cursor.fetchall()]
            
            # Calculate actual adherence metrics (Section 5 & 6)
            total = len(records)
            taken = sum(1 for r in records if r['status'] == 'taken')
            missed = sum(1 for r in records if r['status'] == 'missed')
            delayed = sum(1 for r in records if r['status'] == 'delayed')
            percentage = round((taken / total * 100)) if total > 0 else 0

            conn.close()
            return self.send_json({
                "records": records,
                "total": total,
                "taken": taken,
                "missed": missed,
                "delayed": delayed,
                "percentage": percentage
            })

        elif path == "/api/symptoms":
            cursor.execute("SELECT * FROM symptoms WHERE user_id = ? ORDER BY date DESC, time DESC", (user_id,))
            syms = [dict(s) for s in cursor.fetchall()]
            conn.close()
            return self.send_json(syms)

        elif path == "/api/prescriptions":
            cursor.execute("SELECT * FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            rxs = [dict(r) for r in cursor.fetchall()]
            conn.close()
            return self.send_json(rxs)

        elif path == "/api/diet":
            cursor.execute("SELECT * FROM diet_preferences WHERE user_id = ?", (user_id,))
            d = cursor.fetchone()
            conn.close()
            return self.send_json(dict(d) if d else {"cuisine": "South Indian", "dietary_style": "Vegetarian", "activity_level": "Moderate"})

        elif path == "/api/caregiver":
            cursor.execute("SELECT * FROM caregivers WHERE user_id = ?", (user_id,))
            c = cursor.fetchone()
            conn.close()
            return self.send_json(dict(c) if c else {})

        elif path == "/api/emergency-card":
            cursor.execute("SELECT * FROM emergency_cards WHERE user_id = ?", (user_id,))
            e = cursor.fetchone()
            conn.close()
            return self.send_json(dict(e) if e else {})

        elif path == "/api/insights":
            # Real Calculated Insights (Section 6)
            cursor.execute("SELECT * FROM adherence_records WHERE user_id = ?", (user_id,))
            adh = cursor.fetchall()
            cursor.execute("SELECT * FROM symptoms WHERE user_id = ?", (user_id,))
            syms = cursor.fetchall()
            cursor.execute("SELECT * FROM medications WHERE user_id = ?", (user_id,))
            meds = cursor.fetchall()
            conn.close()

            insights = []
            total_doses = len(adh)
            taken_doses = sum(1 for r in adh if r['status'] == 'taken')
            missed_doses = sum(1 for r in adh if r['status'] == 'missed')

            if total_doses == 0 and len(meds) == 0:
                return self.send_json({
                    "insights": [],
                    "message": "Not enough data yet. Add medications, adherence records, or symptoms to generate insights."
                })

            if total_doses > 0:
                adh_pct = round((taken_doses / total_doses) * 100)
                insights.append({
                    "id": "ins_adh",
                    "type": "adherence",
                    "title": f"Actual Medication Adherence: {adh_pct}%",
                    "category": "Adherence Track",
                    "badge": f"{taken_doses} of {total_doses} Doses",
                    "text": f"Your recorded medication adherence is {adh_pct}% across {total_doses} recorded dose events."
                })

            if missed_doses > 0:
                insights.append({
                    "id": "ins_missed",
                    "type": "adherence",
                    "title": f"Identified Missed Doses: {missed_doses}",
                    "category": "Missed Doses",
                    "badge": "Advisory",
                    "text": f"You have {missed_doses} recorded missed doses. Aligning reminders with daily meal habits helps reduce omissions."
                })

            # Check for recurring symptom pattern
            if len(syms) >= 2:
                recent_high = [s for s in syms if s['severity'] >= 3]
                if len(recent_high) >= 2:
                    insights.append({
                        "id": "ins_sym_rec",
                        "type": "symptom",
                        "title": "Recurring Symptom Pattern Detected",
                        "category": "Clinical Trend",
                        "badge": "Pattern Found",
                        "text": f"A recurring pattern appears in your records ({recent_high[0]['name']} rated {recent_high[0]['severity']}/5). Consider discussing this pattern with your healthcare professional."
                    })

            # Check low medication supplies
            for m in meds:
                qty = m['quantity'] if m['quantity'] is not None else 30
                thresh = m['refill_threshold'] if m['refill_threshold'] is not None else 7
                if qty <= thresh:
                    insights.append({
                        "id": f"ins_refill_{m['id']}",
                        "type": "lifestyle",
                        "title": f"Low Supply Alert: {m['name']}",
                        "category": "Refill Buffer",
                        "badge": "Action Needed",
                        "text": f"Your recorded supply for {m['name']} is at {qty} units. Requesting a refill promptly ensures unhindered regimen continuity."
                    })

            return self.send_json({"insights": insights, "message": ""})

        conn.close()
        self.send_json({"error": "Endpoint not found"}, 404)

    # ---------------------------------------------------------
    # API POST HANDLER
    # ---------------------------------------------------------
    def handle_api_post(self, path):
        body = self.parse_body()
        conn = get_db()
        cursor = conn.cursor()

        # Public Auth Endpoints
        if path == "/api/auth/register":
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            name = body.get('name', '').strip()

            if not email or not password or not name:
                conn.close()
                return self.send_json({"error": "Full Name, email, and password are required."}, 400)

            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                conn.close()
                return self.send_json({"error": "An account with this email address already exists."}, 400)

            user_id = "user_" + secrets.token_hex(8)
            pwd_hash, salt = hash_password(password)
            now_iso = datetime.now().isoformat()

            cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", (user_id, email, pwd_hash, salt, now_iso))
            cursor.execute("""
            INSERT INTO profiles VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, name, 30, "Prefer not to say", 170.0, 70.0, "O+", "7.5 hours", "", "", "", now_iso))
            cursor.execute("INSERT INTO diet_preferences VALUES (?, ?, ?, ?, ?)", (user_id, "South Indian", "Vegetarian", "Moderate", now_iso))
            cursor.execute("INSERT INTO caregivers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (user_id, "", "", "", "", 1, 1, 1, 0, now_iso))
            cursor.execute("INSERT INTO emergency_cards VALUES (?, ?, ?, ?, ?, ?, ?)", (user_id, "", "", "", "", "", now_iso))

            token = secrets.token_hex(32)
            cursor.execute("INSERT INTO sessions VALUES (?, ?, ?)", (token, user_id, now_iso))
            conn.commit()
            conn.close()

            return self.send_json({
                "success": True,
                "token": token,
                "user": {"id": user_id, "email": email, "name": name}
            })

        elif path == "/api/auth/login":
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')

            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            if not user:
                conn.close()
                return self.send_json({"error": "Invalid email address or password."}, 401)

            expected_hash, _ = hash_password(password, user['salt'])
            if expected_hash != user['password_hash']:
                conn.close()
                return self.send_json({"error": "Invalid email address or password."}, 401)

            token = secrets.token_hex(32)
            now_iso = datetime.now().isoformat()
            cursor.execute("INSERT INTO sessions VALUES (?, ?, ?)", (token, user['id'], now_iso))

            cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user['id'],))
            prof = cursor.fetchone()
            conn.commit()
            conn.close()

            return self.send_json({
                "success": True,
                "token": token,
                "user": {"id": user['id'], "email": user['email'], "name": prof['name'] if prof else 'Patient'}
            })

        elif path == "/api/auth/demo-login":
            # Fast 1-click Demo Account Switcher
            demo_user = body.get('target', 'alex') # 'alex' or 'sarah'
            target_email = "alex@example.com" if demo_user == 'alex' else "sarah@example.com"

            cursor.execute("SELECT * FROM users WHERE email = ?", (target_email,))
            user = cursor.fetchone()
            if not user:
                conn.close()
                return self.send_json({"error": "Demo user not found"}, 404)

            token = secrets.token_hex(32)
            now_iso = datetime.now().isoformat()
            cursor.execute("INSERT INTO sessions VALUES (?, ?, ?)", (token, user['id'], now_iso))
            cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user['id'],))
            prof = cursor.fetchone()
            conn.commit()
            conn.close()

            return self.send_json({
                "success": True,
                "token": token,
                "user": {"id": user['id'], "email": user['email'], "name": prof['name'] if prof else 'Patient'}
            })

        elif path == "/api/auth/logout":
            auth_header = self.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:].strip()
                cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
                conn.commit()
            conn.close()
            return self.send_json({"success": True})

        elif path == "/api/auth/reset-password":
            email = body.get('email', '').strip().lower()
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            if user:
                # Set temporary password
                temp_pwd = "password123"
                pwd_hash, salt = hash_password(temp_pwd)
                cursor.execute("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", (pwd_hash, salt, user['id']))
                conn.commit()
                conn.close()
                return self.send_json({
                    "success": True,
                    "message": "Password reset successfully! Temporary password is set to 'password123'. Please sign in and update your password in Settings."
                })
            conn.close()
            return self.send_json({"error": "No account found with this email."}, 404)

        # Protected Endpoints
        user_id = self.get_authenticated_user_id()
        if not user_id:
            conn.close()
            return self.send_json({"error": "Authentication required"}, 401)

        now_iso = datetime.now().isoformat()
        today_str = datetime.now().strftime("%Y-%m-%d")

        if path == "/api/medications":
            name = body.get('name', '').strip()
            strength = body.get('strength', '').strip()
            if not name or not strength:
                conn.close()
                return self.send_json({"error": "Medicine name and strength are required."}, 400)

            med_id = "med_" + secrets.token_hex(6)
            cursor.execute("""
            INSERT INTO medications VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                med_id, user_id, name, strength,
                body.get('dosageInstructions', ''),
                body.get('category', 'Tablet'),
                body.get('frequency', 'Daily'),
                body.get('time', '08:00'),
                int(body.get('quantity', 30)),
                int(body.get('refillThreshold', 7)),
                'pending',
                body.get('notes', ''),
                today_str, '', now_iso
            ))
            conn.commit()
            cursor.execute("SELECT * FROM medications WHERE id = ?", (med_id,))
            created = dict(cursor.fetchone())
            conn.close()
            return self.send_json({"success": True, "medication": created}, 201)

        elif path.startswith("/api/medications/") and path.endswith("/action"):
            # Action on medication: taken, missed, delayed, refill
            parts = path.split('/')
            med_id = parts[3]
            action = body.get('action', 'taken') # 'taken', 'skipped', 'undo', 'refill'

            cursor.execute("SELECT * FROM medications WHERE id = ? AND user_id = ?", (med_id, user_id))
            med = cursor.fetchone()
            if not med:
                conn.close()
                return self.send_json({"error": "Medication not found or unauthorized"}, 404)

            time_str = datetime.now().strftime("%I:%M %p")

            if action == 'taken':
                new_qty = max(0, (med['quantity'] or 30) - 1)
                cursor.execute("""
                UPDATE medications SET status = 'taken', quantity = ?, last_action_date = ?, last_action_time = ? WHERE id = ?
                """, (new_qty, today_str, time_str, med_id))
                
                # Log actual adherence record
                adh_id = "adh_" + secrets.token_hex(6)
                cursor.execute("INSERT INTO adherence_records VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                               (adh_id, user_id, med_id, med['name'], 'taken', med['time'], now_iso, today_str))

            elif action == 'skipped':
                cursor.execute("""
                UPDATE medications SET status = 'skipped', last_action_date = ?, last_action_time = ? WHERE id = ?
                """, (today_str, time_str, med_id))
                adh_id = "adh_" + secrets.token_hex(6)
                cursor.execute("INSERT INTO adherence_records VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                               (adh_id, user_id, med_id, med['name'], 'missed', med['time'], now_iso, today_str))

            elif action == 'undo':
                cursor.execute("UPDATE medications SET status = 'pending', last_action_time = '' WHERE id = ?", (med_id,))

            elif action == 'refill':
                added = int(body.get('amount', 30))
                new_qty = (med['quantity'] or 0) + added
                cursor.execute("UPDATE medications SET quantity = ? WHERE id = ?", (new_qty, med_id))

            conn.commit()
            cursor.execute("SELECT * FROM medications WHERE id = ?", (med_id,))
            updated = dict(cursor.fetchone())
            conn.close()
            return self.send_json({"success": True, "medication": updated})

        elif path == "/api/symptoms":
            sym_id = "sym_" + secrets.token_hex(6)
            name = body.get('name', 'Symptom').strip()
            severity = int(body.get('severity', 3))
            date = body.get('date', today_str)
            t_str = body.get('time', datetime.now().strftime("%H:%M"))
            med_name = body.get('medication_name', '')
            notes = body.get('notes', '').strip()

            cursor.execute("INSERT INTO symptoms VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                           (sym_id, user_id, name, severity, date, t_str, med_name, notes, now_iso))
            conn.commit()
            cursor.execute("SELECT * FROM symptoms WHERE id = ?", (sym_id,))
            created = dict(cursor.fetchone())
            conn.close()
            return self.send_json({"success": True, "symptom": created}, 201)

        elif path == "/api/prescriptions":
            rx_id = "rx_" + secrets.token_hex(6)
            title = body.get('title', 'Uploaded Prescription').strip()
            doctor = body.get('doctor_name', 'Attending Physician')
            extracted = json.dumps(body.get('extracted_data', {}))

            cursor.execute("INSERT INTO prescriptions VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                           (rx_id, user_id, title, doctor, today_str, extracted, 'verified', now_iso))
            conn.commit()
            cursor.execute("SELECT * FROM prescriptions WHERE id = ?", (rx_id,))
            created = dict(cursor.fetchone())
            conn.close()
            return self.send_json({"success": True, "prescription": created}, 201)

        conn.close()
        self.send_json({"error": "Endpoint not found"}, 404)

    # ---------------------------------------------------------
    # API PUT HANDLER
    # ---------------------------------------------------------
    def handle_api_put(self, path):
        user_id = self.get_authenticated_user_id()
        if not user_id:
            return self.send_json({"error": "Authentication required"}, 401)

        body = self.parse_body()
        conn = get_db()
        cursor = conn.cursor()
        now_iso = datetime.now().isoformat()

        if path == "/api/profile":
            cursor.execute("""
            UPDATE profiles SET name = ?, age = ?, gender = ?, height = ?, weight = ?, blood_type = ?, sleep_avg = ?, conditions = ?, allergies = ?, updated_at = ?
            WHERE user_id = ?
            """, (
                body.get('name', 'Patient'),
                int(body.get('age', 50)),
                body.get('gender', 'Male'),
                float(body.get('height', 175)),
                float(body.get('weight', 75)),
                body.get('blood_type', 'O+'),
                body.get('sleep_avg', '7 hours'),
                body.get('conditions', ''),
                body.get('allergies', ''),
                now_iso, user_id
            ))
            conn.commit()
            cursor.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
            updated = dict(cursor.fetchone())
            conn.close()
            return self.send_json({"success": True, "profile": updated})

        elif path.startswith("/api/medications/"):
            parts = path.split('/')
            med_id = parts[3]

            cursor.execute("SELECT id FROM medications WHERE id = ? AND user_id = ?", (med_id, user_id))
            if not cursor.fetchone():
                conn.close()
                return self.send_json({"error": "Medication not found or unauthorized"}, 404)

            cursor.execute("""
            UPDATE medications SET name = ?, strength = ?, dosage_instructions = ?, category = ?, frequency = ?, time = ?, quantity = ?, refill_threshold = ?, notes = ?
            WHERE id = ? AND user_id = ?
            """, (
                body.get('name', ''),
                body.get('strength', ''),
                body.get('dosage_instructions', ''),
                body.get('category', 'Tablet'),
                body.get('frequency', 'Daily'),
                body.get('time', '08:00'),
                int(body.get('quantity', 30)),
                int(body.get('refill_threshold', 7)),
                body.get('notes', ''),
                med_id, user_id
            ))
            conn.commit()
            cursor.execute("SELECT * FROM medications WHERE id = ?", (med_id,))
            updated = dict(cursor.fetchone())
            conn.close()
            return self.send_json({"success": True, "medication": updated})

        elif path.startswith("/api/symptoms/"):
            parts = path.split('/')
            sym_id = parts[3]
            cursor.execute("""
            UPDATE symptoms SET name = ?, severity = ?, notes = ? WHERE id = ? AND user_id = ?
            """, (body.get('name', ''), int(body.get('severity', 3)), body.get('notes', ''), sym_id, user_id))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        elif path == "/api/diet":
            cursor.execute("""
            INSERT INTO diet_preferences VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET cuisine = excluded.cuisine, dietary_style = excluded.dietary_style, activity_level = excluded.activity_level, updated_at = excluded.updated_at
            """, (user_id, body.get('cuisine', 'South Indian'), body.get('dietary_style', 'Vegetarian'), body.get('activity_level', 'Moderate'), now_iso))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        elif path == "/api/caregiver":
            cursor.execute("""
            INSERT INTO caregivers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET name = excluded.name, relation = excluded.relation, phone = excluded.phone, email = excluded.email,
            perm_missed_doses = excluded.perm_missed_doses, perm_adherence = excluded.perm_adherence, perm_med_list = excluded.perm_med_list,
            perm_symptoms = excluded.perm_symptoms, updated_at = excluded.updated_at
            """, (
                user_id, body.get('name', ''), body.get('relation', ''), body.get('phone', ''), body.get('email', ''),
                1 if body.get('perm_missed_doses') else 0,
                1 if body.get('perm_adherence') else 0,
                1 if body.get('perm_med_list') else 0,
                1 if body.get('perm_symptoms') else 0,
                now_iso
            ))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        elif path == "/api/emergency-card":
            cursor.execute("""
            INSERT INTO emergency_cards VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET ice_contact_name = excluded.ice_contact_name, ice_contact_phone = excluded.ice_contact_phone,
            doctor_name = excluded.doctor_name, doctor_phone = excluded.doctor_phone, custom_notes = excluded.custom_notes, updated_at = excluded.updated_at
            """, (user_id, body.get('ice_contact_name', ''), body.get('ice_contact_phone', ''), body.get('doctor_name', ''), body.get('doctor_phone', ''), body.get('custom_notes', ''), now_iso))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        conn.close()
        self.send_json({"error": "Endpoint not found"}, 404)

    # ---------------------------------------------------------
    # API DELETE HANDLER
    # ---------------------------------------------------------
    def handle_api_delete(self, path):
        user_id = self.get_authenticated_user_id()
        if not user_id:
            return self.send_json({"error": "Authentication required"}, 401)

        conn = get_db()
        cursor = conn.cursor()

        if path.startswith("/api/medications/"):
            med_id = path.split('/')[3]
            cursor.execute("DELETE FROM medications WHERE id = ? AND user_id = ?", (med_id, user_id))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        elif path.startswith("/api/symptoms/"):
            sym_id = path.split('/')[3]
            cursor.execute("DELETE FROM symptoms WHERE id = ? AND user_id = ?", (sym_id, user_id))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        elif path.startswith("/api/prescriptions/"):
            rx_id = path.split('/')[3]
            cursor.execute("DELETE FROM prescriptions WHERE id = ? AND user_id = ?", (rx_id, user_id))
            conn.commit()
            conn.close()
            return self.send_json({"success": True})

        conn.close()
        self.send_json({"error": "Endpoint not found"}, 404)

# =============================================================
# 3. SERVER BOOTSTRAP
# =============================================================

def run():
    print("=" * 65)
    print("  Initializing MedGuide AI Database & Schema...")
    init_db()
    print("  SQLite database ready at: " + DB_PATH)
    print("  Pre-seeded Multi-User Accounts:")
    print("    1) Alex Johnson  (alex@example.com  / password123)")
    print("    2) Sarah Davis   (sarah@example.com / password123)")
    print(f"  Starting Multi-User Server on: http://localhost:{PORT}")
    print("=" * 65)

    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), MedGuideAPIHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down MedGuide AI server.")
            httpd.server_close()

if __name__ == "__main__":
    run()
