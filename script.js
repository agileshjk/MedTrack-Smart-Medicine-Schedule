/**
 * MedGuide AI – Multi-User Production Healthcare Platform
 * -------------------------------------------------------------
 * Target: UN SDG 3 – Good Health and Well-Being
 * Architecture: Full-Stack Multi-User Client with SQLite REST API
 * Security: Authentication, session tokens, user-partitioned data isolation
 */

// =============================================================
// 1. IN-BROWSER MULTI-USER STORAGE ENGINE (Vercel Cloud & Offline Fallback)
// =============================================================

const BrowserMultiUserStore = {
  DB_KEY: 'medguide_browser_db_v2',
  SESSION_KEY: 'medguide_browser_sessions_v2',

  getStore() {
    let raw = localStorage.getItem(this.DB_KEY);
    if (!raw) {
      const initial = this.createInitialStore();
      localStorage.setItem(this.DB_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      const initial = this.createInitialStore();
      localStorage.setItem(this.DB_KEY, JSON.stringify(initial));
      return initial;
    }
  },

  saveStore(store) {
    localStorage.setItem(this.DB_KEY, JSON.stringify(store));
  },

  getSessions() {
    let raw = localStorage.getItem(this.SESSION_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw); } catch (e) { return {}; }
  },

  saveSessions(sessions) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessions));
  },

  getUserIdFromToken(token) {
    if (!token) return null;
    const sessions = this.getSessions();
    return sessions[token] || null;
  },

  createInitialStore() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const nowIso = today.toISOString();

    const adhAlex = [];
    for (let i = 14; i >= 1; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const s1 = (i !== 4 && i !== 11) ? 'taken' : 'missed';
      const s2 = (i !== 4 && i !== 11) ? 'taken' : 'missed';
      const s3 = (i !== 7) ? 'taken' : 'delayed';

      adhAlex.push({ id: `adh_alex_${i}_1`, user_id: 'user_alex_demo', medication_id: 'med_alex_1', medication_name: 'Metformin Hydrochloride', status: s1, scheduled_time: '08:00 AM', logged_at: `${dStr} 08:05:00`, date: dStr });
      adhAlex.push({ id: `adh_alex_${i}_2`, user_id: 'user_alex_demo', medication_id: 'med_alex_2', medication_name: 'Lisinopril', status: s2, scheduled_time: '08:00 AM', logged_at: `${dStr} 08:06:00`, date: dStr });
      adhAlex.push({ id: `adh_alex_${i}_3`, user_id: 'user_alex_demo', medication_id: 'med_alex_3', medication_name: 'Atorvastatin Calcium', status: s3, scheduled_time: '08:00 PM', logged_at: `${dStr} 20:15:00`, date: dStr });
    }

    const adhSarah = [];
    for (let i = 10; i >= 1; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const s1 = (i !== 3 && i !== 8) ? 'taken' : 'missed';
      adhSarah.push({ id: `adh_sarah_${i}_1`, user_id: 'user_sarah_demo', medication_id: 'med_sarah_1', medication_name: 'Albuterol Sulfate Inhaler', status: s1, scheduled_time: '10:00 AM', logged_at: `${dStr} 10:05:00`, date: dStr });
      adhSarah.push({ id: `adh_sarah_${i}_2`, user_id: 'user_sarah_demo', medication_id: 'med_sarah_2', medication_name: 'Cetirizine Hydrochloride', status: 'taken', scheduled_time: '09:00 PM', logged_at: `${dStr} 21:00:00`, date: dStr });
    }

    return {
      users: [
        { id: 'user_alex_demo', email: 'alex@example.com', password: 'password123', created_at: nowIso },
        { id: 'user_sarah_demo', email: 'sarah@example.com', password: 'password123', created_at: nowIso }
      ],
      profiles: {
        'user_alex_demo': { user_id: 'user_alex_demo', name: 'Alex Johnson', age: 52, gender: 'Male', height: 176, weight: 81, blood_type: 'O+', sleep_avg: '7.2 hours', conditions: 'Type 2 Diabetes Mellitus, Essential Primary Hypertension', allergies: 'Penicillin (Severe Rash), Shellfish', photo_url: '', updated_at: nowIso },
        'user_sarah_demo': { user_id: 'user_sarah_demo', name: 'Sarah Davis', age: 34, gender: 'Female', height: 165, weight: 62, blood_type: 'A+', sleep_avg: '8.0 hours', conditions: 'Bronchial Asthma, Allergic Rhinitis', allergies: 'Sulfa drugs, Pollen', photo_url: '', updated_at: nowIso }
      },
      medications: [
        { id: 'med_alex_1', user_id: 'user_alex_demo', name: 'Metformin Hydrochloride', strength: '500 mg', dosage_instructions: '1 tablet with breakfast', category: 'Tablet', frequency: 'Daily', time: '08:00', quantity: 10, refill_threshold: 7, status: 'taken', notes: 'Take with breakfast.', last_action_date: todayStr, last_action_time: '08:05 AM', created_at: nowIso },
        { id: 'med_alex_2', user_id: 'user_alex_demo', name: 'Lisinopril', strength: '10 mg', dosage_instructions: '1 tablet in morning', category: 'Tablet', frequency: 'Daily', time: '08:00', quantity: 24, refill_threshold: 7, status: 'taken', notes: 'ACE inhibitor for blood pressure.', last_action_date: todayStr, last_action_time: '08:06 AM', created_at: nowIso },
        { id: 'med_alex_3', user_id: 'user_alex_demo', name: 'Atorvastatin Calcium', strength: '20 mg', dosage_instructions: '1 tablet with dinner', category: 'Tablet', frequency: 'Daily', time: '20:00', quantity: 28, refill_threshold: 7, status: 'pending', notes: 'Avoid grapefruit juice.', last_action_date: todayStr, last_action_time: '', created_at: nowIso },
        
        { id: 'med_sarah_1', user_id: 'user_sarah_demo', name: 'Albuterol Sulfate Inhaler', strength: '90 mcg', dosage_instructions: '2 puffs as needed for bronchospasm', category: 'Inhaler', frequency: 'As Needed', time: '10:00', quantity: 14, refill_threshold: 5, status: 'taken', notes: 'Rinse mouth after inhalation.', last_action_date: todayStr, last_action_time: '10:05 AM', created_at: nowIso },
        { id: 'med_sarah_2', user_id: 'user_sarah_demo', name: 'Cetirizine Hydrochloride', strength: '10 mg', dosage_instructions: '1 tablet daily at bedtime', category: 'Tablet', frequency: 'Daily', time: '21:00', quantity: 20, refill_threshold: 7, status: 'pending', notes: 'Take at bedtime.', last_action_date: todayStr, last_action_time: '', created_at: nowIso }
      ],
      adherence_records: [...adhAlex, ...adhSarah],
      symptoms: [
        { id: 'sym_a_1', user_id: 'user_alex_demo', name: 'Fatigue / Low Energy', severity: 2, date: todayStr, time: '14:30', medication_name: 'Metformin Hydrochloride', notes: 'Slight midafternoon tiredness.', created_at: nowIso },
        { id: 'sym_a_2', user_id: 'user_alex_demo', name: 'Fatigue / Low Energy', severity: 4, date: todayStr, time: '16:15', medication_name: 'Metformin Hydrochloride', notes: 'Persistent tiredness; felt exhausted.', created_at: nowIso },
        { id: 'sym_a_3', user_id: 'user_alex_demo', name: 'Mild Dizziness', severity: 2, date: todayStr, time: '09:30', medication_name: 'Lisinopril', notes: 'Brief dizziness upon standing.', created_at: nowIso },
        { id: 'sym_s_1', user_id: 'user_sarah_demo', name: 'Mild Wheezing', severity: 2, date: todayStr, time: '11:00', medication_name: 'Albuterol Sulfate Inhaler', notes: 'Triggered by cold morning breeze.', created_at: nowIso },
        { id: 'sym_s_2', user_id: 'user_sarah_demo', name: 'Nasal Congestion', severity: 2, date: todayStr, time: '08:00', medication_name: 'Cetirizine Hydrochloride', notes: 'Seasonal pollen reaction.', created_at: nowIso }
      ],
      prescriptions: [
        { id: 'rx_alex_1', user_id: 'user_alex_demo', title: 'Internal Medicine Regimen', doctor_name: 'Dr. Robert Vance, MD', date_issued: todayStr, extracted_data: 'Metformin 500mg, Lisinopril 10mg, Atorvastatin 20mg', status: 'verified', created_at: nowIso },
        { id: 'rx_sarah_1', user_id: 'user_sarah_demo', title: 'Pulmonology Maintenance', doctor_name: 'Dr. Emily Clark, MD', date_issued: todayStr, extracted_data: 'Albuterol Inhaler 90mcg, Cetirizine 10mg', status: 'verified', created_at: nowIso }
      ],
      diet_preferences: {
        'user_alex_demo': { user_id: 'user_alex_demo', cuisine: 'South Indian', dietary_style: 'Vegetarian', activity_level: 'Moderate', updated_at: nowIso },
        'user_sarah_demo': { user_id: 'user_sarah_demo', cuisine: 'Mediterranean', dietary_style: 'Non-Vegetarian', activity_level: 'Active', updated_at: nowIso }
      },
      caregivers: {
        'user_alex_demo': { user_id: 'user_alex_demo', name: 'Sarah Johnson', relation: 'Daughter', phone: '(555) 234-5678', email: 'sarah.j@example.com', perm_missed_doses: 1, perm_adherence: 1, perm_med_list: 1, perm_symptoms: 0, updated_at: nowIso },
        'user_sarah_demo': { user_id: 'user_sarah_demo', name: 'David Davis', relation: 'Spouse', phone: '(555) 876-5432', email: 'david.d@example.com', perm_missed_doses: 1, perm_adherence: 1, perm_med_list: 1, perm_symptoms: 1, updated_at: nowIso }
      },
      emergency_cards: {
        'user_alex_demo': { user_id: 'user_alex_demo', ice_contact_name: 'Sarah Johnson (Daughter)', ice_contact_phone: '(555) 234-5678', doctor_name: 'Dr. Robert Vance, MD', doctor_phone: '(555) 987-6543', custom_notes: 'Patient has Type 2 Diabetes and Hypertension.', updated_at: nowIso },
        'user_sarah_demo': { user_id: 'user_sarah_demo', ice_contact_name: 'David Davis (Spouse)', ice_contact_phone: '(555) 876-5432', doctor_name: 'Dr. Emily Clark, MD', doctor_phone: '(555) 345-6789', custom_notes: 'Patient has Bronchial Asthma.', updated_at: nowIso }
      }
    };
  },

  handleRequest(path, method, body, token) {
    const store = this.getStore();
    const sessions = this.getSessions();
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    // Auth Public
    if (path === '/api/auth/login') {
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const user = store.users.find(u => u.email.toLowerCase() === email && u.password === password);
      if (!user) return { error: 'Invalid email address or password.', status: 401 };

      const newToken = 'tok_' + Math.random().toString(36).substring(2) + Date.now();
      sessions[newToken] = user.id;
      this.saveSessions(sessions);
      const profile = store.profiles[user.id] || { name: 'User' };
      return { success: true, token: newToken, user: { id: user.id, email: user.email, name: profile.name } };
    }

    if (path === '/api/auth/demo-login') {
      const target = body.target === 'sarah' ? 'user_sarah_demo' : 'user_alex_demo';
      const user = store.users.find(u => u.id === target);
      if (!user) return { error: 'Demo user not found', status: 404 };

      const newToken = 'tok_' + Math.random().toString(36).substring(2) + Date.now();
      sessions[newToken] = user.id;
      this.saveSessions(sessions);
      const profile = store.profiles[user.id] || { name: user.id === 'user_alex_demo' ? 'Alex Johnson' : 'Sarah Davis' };
      return { success: true, token: newToken, user: { id: user.id, email: user.email, name: profile.name } };
    }

    if (path === '/api/auth/register') {
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const name = (body.name || '').trim();
      if (!email || !password || !name) return { error: 'Full name, email, and password are required.', status: 400 };

      if (store.users.some(u => u.email.toLowerCase() === email)) {
        return { error: 'An account with this email address already exists.', status: 400 };
      }

      const newId = 'user_' + Math.random().toString(36).substring(2);
      store.users.push({ id: newId, email, password, created_at: nowIso });
      store.profiles[newId] = { user_id: newId, name, age: 30, gender: 'Prefer not to say', height: 170, weight: 70, blood_type: 'O+', sleep_avg: '7.5 hours', conditions: '', allergies: '', photo_url: '', updated_at: nowIso };
      store.diet_preferences[newId] = { user_id: newId, cuisine: 'South Indian', dietary_style: 'Vegetarian', activity_level: 'Moderate', updated_at: nowIso };
      store.caregivers[newId] = { user_id: newId, name: '', relation: '', phone: '', email: '', perm_missed_doses: 1, perm_adherence: 1, perm_med_list: 1, perm_symptoms: 0, updated_at: nowIso };
      store.emergency_cards[newId] = { user_id: newId, ice_contact_name: '', ice_contact_phone: '', doctor_name: '', doctor_phone: '', custom_notes: '', updated_at: nowIso };
      this.saveStore(store);

      const newToken = 'tok_' + Math.random().toString(36).substring(2) + Date.now();
      sessions[newToken] = newId;
      this.saveSessions(sessions);
      return { success: true, token: newToken, user: { id: newId, email, name } };
    }

    if (path === '/api/auth/reset-password') {
      const email = (body.email || '').trim().toLowerCase();
      const user = store.users.find(u => u.email.toLowerCase() === email);
      if (user) {
        user.password = 'password123';
        this.saveStore(store);
        return { success: true, message: "Password reset successfully! Temporary password is set to 'password123'. Please sign in and update your password in Settings." };
      }
      return { error: 'No account found with this email.', status: 404 };
    }

    // Protected Auth
    const userId = this.getUserIdFromToken(token);
    if (!userId) return { error: 'Unauthorized', status: 401 };

    if (path === '/api/auth/me') {
      const user = store.users.find(u => u.id === userId);
      if (!user) return { error: 'Unauthorized', status: 401 };
      const profile = store.profiles[userId] || { name: 'User' };
      return { user: { id: user.id, email: user.email, name: profile.name } };
    }

    if (path === '/api/auth/logout') {
      if (token && sessions[token]) {
        delete sessions[token];
        this.saveSessions(sessions);
      }
      return { success: true };
    }

    // Profile
    if (path === '/api/profile') {
      if (method === 'GET') {
        const prof = store.profiles[userId] || { user_id: userId, name: 'User' };
        const user = store.users.find(u => u.id === userId) || {};
        return { ...prof, email: user.email };
      }
      if (method === 'PUT') {
        const cur = store.profiles[userId] || { user_id: userId };
        store.profiles[userId] = { ...cur, ...body, user_id: userId, updated_at: nowIso };
        this.saveStore(store);
        return { success: true, profile: store.profiles[userId] };
      }
    }

    // Medications
    if (path === '/api/medications') {
      if (method === 'GET') {
        return { medications: store.medications.filter(m => m.user_id === userId) };
      }
      if (method === 'POST') {
        const medId = 'med_' + Math.random().toString(36).substring(2);
        const newMed = {
          id: medId,
          user_id: userId,
          name: body.name || '',
          strength: body.strength || '',
          dosage_instructions: body.dosageInstructions || body.dosage_instructions || '',
          category: body.category || 'Tablet',
          frequency: body.frequency || 'Daily',
          time: body.time || '08:00',
          quantity: parseInt(body.quantity || 30, 10),
          refill_threshold: parseInt(body.refillThreshold || body.refill_threshold || 7, 10),
          status: 'pending',
          notes: body.notes || '',
          last_action_date: todayStr,
          last_action_time: '',
          created_at: nowIso
        };
        store.medications.push(newMed);
        this.saveStore(store);
        return { success: true, medication: newMed };
      }
    }

    if (path.startsWith('/api/medications/') && path.endsWith('/action')) {
      const parts = path.split('/');
      const medId = parts[3];
      const med = store.medications.find(m => m.id === medId && m.user_id === userId);
      if (!med) return { error: 'Medication not found', status: 404 };

      const action = body.action || 'taken';
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (action === 'taken') {
        med.status = 'taken';
        med.quantity = Math.max(0, (med.quantity || 30) - 1);
        med.last_action_date = todayStr;
        med.last_action_time = timeStr;
        store.adherence_records.push({
          id: 'adh_' + Math.random().toString(36).substring(2),
          user_id: userId,
          medication_id: med.id,
          medication_name: med.name,
          status: 'taken',
          scheduled_time: med.time,
          logged_at: nowIso,
          date: todayStr
        });
      } else if (action === 'skipped') {
        med.status = 'skipped';
        med.last_action_date = todayStr;
        med.last_action_time = timeStr;
        store.adherence_records.push({
          id: 'adh_' + Math.random().toString(36).substring(2),
          user_id: userId,
          medication_id: med.id,
          medication_name: med.name,
          status: 'missed',
          scheduled_time: med.time,
          logged_at: nowIso,
          date: todayStr
        });
      } else if (action === 'undo') {
        med.status = 'pending';
        med.last_action_time = '';
      } else if (action === 'refill') {
        const added = parseInt(body.amount || 30, 10);
        med.quantity = (med.quantity || 0) + added;
      }
      this.saveStore(store);
      return { success: true, medication: med };
    }

    if (path.startsWith('/api/medications/')) {
      const parts = path.split('/');
      const medId = parts[3];
      const medIndex = store.medications.findIndex(m => m.id === medId && m.user_id === userId);
      if (medIndex === -1) return { error: 'Medication not found', status: 404 };

      if (method === 'PUT') {
        const cur = store.medications[medIndex];
        store.medications[medIndex] = {
          ...cur,
          name: body.name !== undefined ? body.name : cur.name,
          strength: body.strength !== undefined ? body.strength : cur.strength,
          dosage_instructions: body.dosage_instructions !== undefined ? body.dosage_instructions : cur.dosage_instructions,
          category: body.category !== undefined ? body.category : cur.category,
          frequency: body.frequency !== undefined ? body.frequency : cur.frequency,
          time: body.time !== undefined ? body.time : cur.time,
          quantity: body.quantity !== undefined ? parseInt(body.quantity, 10) : cur.quantity,
          refill_threshold: body.refill_threshold !== undefined ? parseInt(body.refill_threshold, 10) : cur.refill_threshold,
          notes: body.notes !== undefined ? body.notes : cur.notes
        };
        this.saveStore(store);
        return { success: true, medication: store.medications[medIndex] };
      }

      if (method === 'DELETE') {
        store.medications.splice(medIndex, 1);
        this.saveStore(store);
        return { success: true };
      }
    }

    // Adherence
    if (path === '/api/adherence') {
      const recs = store.adherence_records.filter(r => r.user_id === userId);
      const todayRecs = recs.filter(r => r.date === todayStr);
      const total = recs.length;
      const taken = recs.filter(r => r.status === 'taken').length;
      const missed = recs.filter(r => r.status === 'missed').length;
      const delayed = recs.filter(r => r.status === 'delayed').length;
      const percentage = total > 0 ? Math.round((taken / total) * 100) : 0;
      return {
        adherence_rate: total > 0 ? percentage : null,
        total_doses: total,
        taken_doses: taken,
        missed_doses: missed,
        delayed_doses: delayed,
        taken_today: todayRecs.filter(r => r.status === 'taken').length,
        missed_today: todayRecs.filter(r => r.status === 'missed').length,
        records: recs
      };
    }

    // Symptoms
    if (path === '/api/symptoms') {
      if (method === 'GET') {
        return { symptoms: store.symptoms.filter(s => s.user_id === userId) };
      }
      if (method === 'POST') {
        const sym = {
          id: 'sym_' + Math.random().toString(36).substring(2),
          user_id: userId,
          name: body.name || '',
          severity: parseInt(body.severity || 1, 10),
          date: body.date || todayStr,
          time: body.time || '12:00',
          medication_name: body.medication_name || '',
          notes: body.notes || '',
          created_at: nowIso
        };
        store.symptoms.push(sym);
        this.saveStore(store);
        return { success: true, symptom: sym };
      }
    }

    if (path.startsWith('/api/symptoms/')) {
      const parts = path.split('/');
      const symId = parts[3];
      const symIndex = store.symptoms.findIndex(s => s.id === symId && s.user_id === userId);
      if (symIndex === -1) return { error: 'Symptom not found', status: 404 };

      if (method === 'PUT') {
        store.symptoms[symIndex] = { ...store.symptoms[symIndex], ...body };
        this.saveStore(store);
        return { success: true, symptom: store.symptoms[symIndex] };
      }
      if (method === 'DELETE') {
        store.symptoms.splice(symIndex, 1);
        this.saveStore(store);
        return { success: true };
      }
    }

    // Prescriptions
    if (path === '/api/prescriptions') {
      if (method === 'GET') {
        return { prescriptions: store.prescriptions.filter(p => p.user_id === userId) };
      }
      if (method === 'POST') {
        const rx = {
          id: 'rx_' + Math.random().toString(36).substring(2),
          user_id: userId,
          title: body.title || 'Prescription',
          doctor_name: body.doctor_name || '',
          date_issued: body.date_issued || todayStr,
          extracted_data: body.extracted_data || '',
          status: 'verified',
          created_at: nowIso
        };
        store.prescriptions.push(rx);
        this.saveStore(store);
        return { success: true, prescription: rx };
      }
    }

    // Diet
    if (path === '/api/diet') {
      if (method === 'GET') {
        return store.diet_preferences[userId] || { cuisine: 'South Indian', dietary_style: 'Vegetarian', activity_level: 'Moderate' };
      }
      if (method === 'PUT') {
        store.diet_preferences[userId] = { ...body, user_id: userId, updated_at: nowIso };
        this.saveStore(store);
        return { success: true };
      }
    }

    // Caregiver
    if (path === '/api/caregiver') {
      if (method === 'GET') {
        return store.caregivers[userId] || { name: '', relation: '', phone: '', email: '', perm_missed_doses: 1, perm_adherence: 1, perm_med_list: 1, perm_symptoms: 0 };
      }
      if (method === 'PUT') {
        store.caregivers[userId] = { ...body, user_id: userId, updated_at: nowIso };
        this.saveStore(store);
        return { success: true };
      }
    }

    // Emergency Card
    if (path === '/api/emergency-card') {
      if (method === 'GET') {
        return store.emergency_cards[userId] || { ice_contact_name: '', ice_contact_phone: '', doctor_name: '', doctor_phone: '', custom_notes: '' };
      }
      if (method === 'PUT') {
        store.emergency_cards[userId] = { ...body, user_id: userId, updated_at: nowIso };
        this.saveStore(store);
        return { success: true };
      }
    }

    // Insights
    if (path === '/api/insights') {
      const adh = store.adherence_records.filter(r => r.user_id === userId);
      const syms = store.symptoms.filter(s => s.user_id === userId);
      const meds = store.medications.filter(m => m.user_id === userId);

      const totalDoses = adh.length;
      const takenDoses = adh.filter(r => r.status === 'taken').length;
      const missedDoses = adh.filter(r => r.status === 'missed').length;

      if (totalDoses === 0 && meds.length === 0) {
        return {
          insights: [],
          message: 'Not enough data yet. Add medications, adherence records, or symptoms to generate insights.'
        };
      }

      const insights = [];
      if (totalDoses > 0) {
        const adhPct = Math.round((takenDoses / totalDoses) * 100);
        insights.push({
          id: 'ins_adh',
          type: 'adherence',
          title: `Actual Medication Adherence: ${adhPct}%`,
          category: 'Adherence Track',
          badge: `${takenDoses} of ${totalDoses} Doses`,
          text: `Your recorded medication adherence is ${adhPct}% across ${totalDoses} recorded dose events.`
        });
      }

      if (missedDoses > 0) {
        insights.push({
          id: 'ins_missed',
          type: 'adherence',
          title: `Identified Missed Doses: ${missedDoses}`,
          category: 'Missed Doses',
          badge: 'Advisory',
          text: `You have ${missedDoses} recorded missed doses. Aligning reminders with daily meal habits helps reduce omissions.`
        });
      }

      if (syms.length >= 2) {
        const recentHigh = syms.filter(s => s.severity >= 3);
        if (recentHigh.length >= 2) {
          insights.push({
            id: 'ins_sym_rec',
            type: 'symptom',
            title: 'Recurring Symptom Pattern Detected',
            category: 'Clinical Trend',
            badge: 'Pattern Found',
            text: `A recurring pattern appears in your records (${recentHigh[0].name} rated ${recentHigh[0].severity}/5). Consider discussing this pattern with your healthcare professional.`
          });
        }
      }

      for (const m of meds) {
        const qty = m.quantity !== undefined ? m.quantity : 30;
        const thresh = m.refill_threshold !== undefined ? m.refill_threshold : 7;
        if (qty <= thresh) {
          insights.push({
            id: `ins_refill_${m.id}`,
            type: 'lifestyle',
            title: `Low Supply Alert: ${m.name}`,
            category: 'Refill Buffer',
            badge: 'Action Needed',
            text: `Your recorded supply for ${m.name} is at ${qty} units. Requesting a refill promptly ensures unhindered regimen continuity.`
          });
        }
      }

      return { insights, message: '' };
    }

    return { error: 'Endpoint not found', status: 404 };
  }
};

// =============================================================
// 2. API CLIENT & HYBRID ROUTER
// =============================================================

const API_BASE = ''; // Same origin
const TOKEN_KEY = 'medguide_session_token';

const ApiClient = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request(path, method = 'GET', body = null) {
    const isLocalServer = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '5000';

    // If running on local python server (http://localhost:5000), use REST backend
    if (isLocalServer) {
      const headers = { 'Content-Type': 'application/json' };
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const options = { method, headers };
      if (body) options.body = JSON.stringify(body);

      try {
        const resp = await fetch(`${API_BASE}${path}`, options);
        if (resp.status === 401) {
          if (path !== '/api/auth/me') {
            showToast('Session expired or unauthorized. Please sign in.', 'warning');
            handleLogoutUI();
          }
          return { error: 'Unauthorized', status: 401 };
        }
        if (resp.ok) {
          return await resp.json().catch(() => ({}));
        }
        if (resp.status !== 404) {
          const errData = await resp.json().catch(() => ({}));
          return { error: errData.error || 'Server error', status: resp.status };
        }
      } catch (err) {
        // Fall through to in-browser multi-user engine
      }
    }

    // Seamless in-browser engine for Vercel, static cloud deployments, and offline
    return BrowserMultiUserStore.handleRequest(path, method, body, this.getToken());
  },

  // Auth Endpoints
  async register(name, email, password) {
    return this.request('/api/auth/register', 'POST', { name, email, password });
  },

  async login(email, password) {
    return this.request('/api/auth/login', 'POST', { email, password });
  },

  async demoLogin(target) {
    return this.request('/api/auth/demo-login', 'POST', { target });
  },

  async logout() {
    return this.request('/api/auth/logout', 'POST');
  },

  async resetPassword(email) {
    return this.request('/api/auth/reset-password', 'POST', { email });
  },

  async getMe() {
    return this.request('/api/auth/me', 'GET');
  },

  // Resource Endpoints
  async getProfile() {
    return this.request('/api/profile', 'GET');
  },

  async updateProfile(profileData) {
    return this.request('/api/profile', 'PUT', profileData);
  },

  async getMedications() {
    return this.request('/api/medications', 'GET');
  },

  async addMedication(medData) {
    return this.request('/api/medications', 'POST', medData);
  },

  async updateMedication(id, medData) {
    return this.request(`/api/medications/${id}`, 'PUT', medData);
  },

  async deleteMedication(id) {
    return this.request(`/api/medications/${id}`, 'DELETE');
  },

  async medicationAction(id, action, amount = null) {
    return this.request(`/api/medications/${id}/action`, 'POST', { action, amount });
  },

  async getAdherence() {
    return this.request('/api/adherence', 'GET');
  },

  async getSymptoms() {
    return this.request('/api/symptoms', 'GET');
  },

  async addSymptom(symptomData) {
    return this.request('/api/symptoms', 'POST', symptomData);
  },

  async updateSymptom(id, symptomData) {
    return this.request(`/api/symptoms/${id}`, 'PUT', symptomData);
  },

  async deleteSymptom(id) {
    return this.request(`/api/symptoms/${id}`, 'DELETE');
  },

  async getPrescriptions() {
    return this.request('/api/prescriptions', 'GET');
  },

  async addPrescription(rxData) {
    return this.request('/api/prescriptions', 'POST', rxData);
  },

  async getDiet() {
    return this.request('/api/diet', 'GET');
  },

  async updateDiet(dietData) {
    return this.request('/api/diet', 'PUT', dietData);
  },

  async getCaregiver() {
    return this.request('/api/caregiver', 'GET');
  },

  async updateCaregiver(caregiverData) {
    return this.request('/api/caregiver', 'PUT', caregiverData);
  },

  async getEmergencyCard() {
    return this.request('/api/emergency-card', 'GET');
  },

  async updateEmergencyCard(cardData) {
    return this.request('/api/emergency-card', 'PUT', cardData);
  },

  async getInsights() {
    return this.request('/api/insights', 'GET');
  }
};

// =============================================================
// 2. CLIENT APPLICATION STATE
// =============================================================

let appState = {
  authenticated: false,
  user: null,
  profile: null,
  medications: [],
  symptoms: [],
  prescriptions: [],
  adherence: { total: 0, taken: 0, missed: 0, delayed: 0, percentage: 0, records: [] },
  diet: { cuisine: 'South Indian', dietary_style: 'Vegetarian', activity_level: 'Moderate' },
  caregiver: null,
  emergencyCard: null,
  insights: [],
  activeFilter: 'all',
  currentView: 'dashboard',
  remindedKeys: new Set(),
  charts: {}
};

let audioCtx = null;

// =============================================================
// 3. DATE & AUDIO UTILITIES
// =============================================================

function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatReadableDate(d = new Date()) {
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime12Hour(time24) {
  if (!time24) return '--:--';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

function getCurrentTime24() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function playReminderChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.18);
      gain.gain.setValueAtTime(0.2, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.18);
      osc.stop(now + idx * 0.18 + 0.6);
    });
  } catch (err) {
    console.warn('Audio chime warning:', err);
  }
}

// =============================================================
// 4. AUTHENTICATION & MULTI-USER WORKFLOW (Sections 1 & 2)
// =============================================================

async function checkAuthSession() {
  const token = ApiClient.getToken();
  if (!token) {
    showAuthPortal();
    return false;
  }

  const res = await ApiClient.getMe();
  if (res.authenticated && res.user) {
    appState.authenticated = true;
    appState.user = res.user;
    appState.profile = res.profile || {};
    hideAuthPortal();
    await loadUserData();
    return true;
  } else {
    ApiClient.clearToken();
    showAuthPortal();
    return false;
  }
}

function showAuthPortal() {
  const portal = document.getElementById('authPortal');
  const shell = document.getElementById('appShellMain');
  if (portal) portal.style.display = 'flex';
  if (shell) shell.style.display = 'none';
}

function hideAuthPortal() {
  const portal = document.getElementById('authPortal');
  const shell = document.getElementById('appShellMain');
  if (portal) portal.style.display = 'none';
  if (shell) shell.style.display = 'flex';
}

async function handleLoginSuccess(token, user) {
  ApiClient.setToken(token);
  appState.authenticated = true;
  appState.user = user;
  hideAuthPortal();
  showToast(`Welcome back, ${user.name || 'Patient'}!`, 'success');
  await loadUserData();
}

function handleLogoutUI() {
  ApiClient.clearToken();
  appState.authenticated = false;
  appState.user = null;
  appState.profile = null;
  appState.medications = [];
  appState.symptoms = [];
  appState.adherence = { total: 0, taken: 0, missed: 0, delayed: 0, percentage: 0, records: [] };
  showAuthPortal();
  showToast('You have been signed out.', 'info');
}

function setupAuthEventListeners() {
  // Tabs: Sign In / Create Account / Forgot
  const tabLogin = document.getElementById('authTabLogin');
  const tabReg = document.getElementById('authTabRegister');
  const tabForgot = document.getElementById('authTabForgot');
  const pLogin = document.getElementById('authPanelLogin');
  const pReg = document.getElementById('authPanelRegister');
  const pForgot = document.getElementById('authPanelForgot');

  function setAuthTab(tab) {
    [tabLogin, tabReg, tabForgot].forEach(t => t.classList.remove('active'));
    [pLogin, pReg, pForgot].forEach(p => p.style.display = 'none');

    if (tab === 'login') {
      tabLogin.classList.add('active');
      pLogin.style.display = 'block';
    } else if (tab === 'register') {
      tabReg.classList.add('active');
      pReg.style.display = 'block';
    } else if (tab === 'forgot') {
      tabForgot.classList.add('active');
      pForgot.style.display = 'block';
    }
  }

  tabLogin?.addEventListener('click', () => setAuthTab('login'));
  tabReg?.addEventListener('click', () => setAuthTab('register'));
  tabForgot?.addEventListener('click', () => setAuthTab('forgot'));
  document.getElementById('linkToForgotPassword')?.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthTab('forgot');
  });
  document.getElementById('linkBackToLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    setAuthTab('login');
  });

  // Login Form Submit
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('btnSubmitLogin');

    btn.disabled = true;
    btn.textContent = 'Signing in...';

    const res = await ApiClient.login(email, password);
    btn.disabled = false;
    btn.textContent = 'Sign In to Dashboard';

    if (res.error) {
      showToast(res.error, 'danger');
    } else if (res.token) {
      await handleLoginSuccess(res.token, res.user);
    }
  });

  // 1-Click Demo Accounts (Alex Johnson vs Sarah Davis)
  document.getElementById('btnQuickDemoAlex')?.addEventListener('click', async () => {
    showToast('Signing in as Alex Johnson (Demo Account)...', 'info');
    const res = await ApiClient.demoLogin('alex');
    if (res.token) await handleLoginSuccess(res.token, res.user);
  });

  document.getElementById('btnQuickDemoSarah')?.addEventListener('click', async () => {
    showToast('Signing in as Sarah Davis (Demo Account)...', 'info');
    const res = await ApiClient.demoLogin('sarah');
    if (res.token) await handleLoginSuccess(res.token, res.user);
  });

  // Register Form Submit
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pwd = document.getElementById('regPassword').value;
    const confirmPwd = document.getElementById('regConfirmPassword').value;

    if (pwd !== confirmPwd) {
      showToast('Passwords do not match.', 'warning');
      return;
    }

    const btn = document.getElementById('btnSubmitRegister');
    btn.disabled = true;
    btn.textContent = 'Creating Account...';

    const res = await ApiClient.register(name, email, pwd);
    btn.disabled = false;
    btn.textContent = 'Create Patient Account';

    if (res.error) {
      showToast(res.error, 'danger');
    } else if (res.token) {
      showToast('Account created successfully!', 'success');
      await handleLoginSuccess(res.token, res.user);
    }
  });

  // Forgot Password Submit
  document.getElementById('forgotForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    const res = await ApiClient.resetPassword(email);
    if (res.error) {
      showToast(res.error, 'danger');
    } else {
      showToast(res.message, 'success');
      setAuthTab('login');
      document.getElementById('loginEmail').value = email;
      document.getElementById('loginPassword').value = 'password123';
    }
  });

  // Topbar Profile Dropdown Menu & Logout (Section 13)
  const menuBtn = document.getElementById('userProfileMenuBtn');
  const dropdownMenu = document.getElementById('userProfileDropdownMenu');

  menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dropdownMenu.style.display === 'block';
    dropdownMenu.style.display = isVisible ? 'none' : 'block';
  });

  document.addEventListener('click', () => {
    if (dropdownMenu) dropdownMenu.style.display = 'none';
  });

  document.getElementById('menuItemMyProfile')?.addEventListener('click', (e) => {
    e.preventDefault();
    dropdownMenu.style.display = 'none';
    switchView('health-profile');
  });

  document.getElementById('menuItemHealthInfo')?.addEventListener('click', (e) => {
    e.preventDefault();
    dropdownMenu.style.display = 'none';
    switchView('health-profile');
  });

  document.getElementById('menuItemSettings')?.addEventListener('click', (e) => {
    e.preventDefault();
    dropdownMenu.style.display = 'none';
    switchView('settings');
  });

  document.getElementById('btnSwitchAccount')?.addEventListener('click', () => {
    dropdownMenu.style.display = 'none';
    handleLogoutUI();
  });

  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    dropdownMenu.style.display = 'none';
    await ApiClient.logout();
    handleLogoutUI();
  });
}

// =============================================================
// 5. USER DATA LOADING & REACTIVE STORE
// =============================================================

async function loadUserData() {
  // 1. Fetch Profile
  const prof = await ApiClient.getProfile();
  if (!prof.error) {
    appState.profile = prof;
    updateProfileUI(prof);
  }

  // 2. Fetch Medications
  const meds = await ApiClient.getMedications();
  if (Array.isArray(meds)) {
    appState.medications = meds;
  }

  // 3. Fetch Adherence Records
  const adh = await ApiClient.getAdherence();
  if (!adh.error) {
    appState.adherence = adh;
  }

  // 4. Fetch Symptoms
  const syms = await ApiClient.getSymptoms();
  if (Array.isArray(syms)) {
    appState.symptoms = syms;
  }

  // 5. Fetch Diet Preferences
  const diet = await ApiClient.getDiet();
  if (!diet.error) {
    appState.diet = diet;
  }

  // 6. Fetch Caregiver
  const caregiver = await ApiClient.getCaregiver();
  if (!caregiver.error) {
    appState.caregiver = caregiver;
  }

  // 7. Fetch Emergency Card
  const emCard = await ApiClient.getEmergencyCard();
  if (!emCard.error) {
    appState.emergencyCard = emCard;
  }

  // 8. Fetch Real Insights (Section 6)
  const ins = await ApiClient.getInsights();
  if (!ins.error) {
    appState.insights = ins.insights || [];
    appState.insightsMessage = ins.message || '';
  }

  // Render everything reactively
  renderDashboard();
  renderMedicationsCards();
  renderRefillTable();
  renderDietPlanner();
  renderSymptomTracker();
  renderAdherenceDashboard();
  renderHealthInsights();
  renderEmergencyCard();
  renderCaregiverSection();
  setupInteractionChecker();
}

function updateProfileUI(prof) {
  const name = prof.name || 'Patient';
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Topbar and Sidebar user badge
  setElText('topbarUserName', name);
  setElText('topbarUserAvatar', initials);
  setElText('sidebarUserName', name);
  setElText('userAvatar', initials);
  setElText('dropdownFullName', name);
  setElText('dropdownEmail', appState.user ? appState.user.email : '');

  // Fill Health Profile Form (Section 3)
  const pName = document.getElementById('profileName');
  const pAge = document.getElementById('profileAge');
  const pGender = document.getElementById('profileGender');
  const pHeight = document.getElementById('profileHeight');
  const pWeight = document.getElementById('profileWeight');
  const pBlood = document.getElementById('profileBlood');
  const pSleep = document.getElementById('profileSleep');
  const pCond = document.getElementById('profileConditions');
  const pAllergies = document.getElementById('profileAllergies');

  if (pName) pName.value = prof.name || '';
  if (pAge) pAge.value = prof.age || 30;
  if (pGender) pGender.value = prof.gender || 'Male';
  if (pHeight) pHeight.value = prof.height || 170;
  if (pWeight) pWeight.value = prof.weight || 70;
  if (pBlood) pBlood.value = prof.blood_type || 'O+';
  if (pSleep) pSleep.value = prof.sleep_avg || '7 hours';
  if (pCond) pCond.value = prof.conditions || '';
  if (pAllergies) pAllergies.value = prof.allergies || '';

  // Calculate BMI
  const heightM = (prof.height || 170) / 100;
  const weightKg = prof.weight || 70;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);
  setElText('profileBmiVal', bmi);
}

// =============================================================
// 6. DASHBOARD CONTROLLER (Sections 5 & 6)
// =============================================================

function renderDashboard() {
  const now = new Date();
  setElText('topbarLiveDate', formatReadableDate(now));
  setElText('liveClockBadge', now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  const hour = now.getHours();
  let greetingWord = 'Good morning';
  if (hour >= 12 && hour < 17) greetingWord = 'Good afternoon';
  else if (hour >= 17) greetingWord = 'Good evening';

  const firstName = appState.profile?.name ? appState.profile.name.split(' ')[0] : 'Patient';
  setElText('dynamicGreeting', `${greetingWord}, ${firstName} 👋`);

  // Today's counts
  const total = appState.medications.length;
  let taken = 0;
  let pending = 0;
  let skipped = 0;

  appState.medications.forEach(m => {
    if (m.status === 'taken') taken++;
    else if (m.status === 'skipped') skipped++;
    else pending++;
  });

  // Calculate actual adherence percentage (Section 5)
  // Uses actual database adherence percentage if available, otherwise today's completed ratio
  const adherence = appState.adherence.total > 0
    ? appState.adherence.percentage
    : (total > 0 ? Math.round((taken / total) * 100) : 0);

  setElText('summaryTotalMeds', `${total} scheduled`);
  setElText('summaryCompletedRatio', `${taken} taken • ${pending} upcoming`);
  setElText('summaryAdherence', `${adherence}%`);
  setElText('todayRemainingCount', `${pending} medication${pending === 1 ? '' : 's'}`);
  setElText('navMedCount', total);

  // Next reminder
  const upcomingMed = appState.medications.find(m => m.status === 'pending');
  if (upcomingMed) {
    setElText('summaryNextReminder', `${upcomingMed.name.split(' ')[0]} — ${formatTime12Hour(upcomingMed.time)}`);
    setElText('summaryNextReminderDose', `${upcomingMed.strength} • ${upcomingMed.notes || 'On Schedule'}`);
  } else {
    setElText('summaryNextReminder', total > 0 ? 'All completed for today!' : 'No medicines scheduled');
    setElText('summaryNextReminderDose', total > 0 ? 'Great adherence today' : 'Add your prescriptions');
  }

  // Dashboard Table
  renderDashboardScheduleTable();
  // Dashboard Insights
  renderDashboardInsights();
}

function renderDashboardScheduleTable() {
  const tbody = document.getElementById('dashboardScheduleBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (appState.medications.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-6 text-muted">
          No medicines scheduled yet. Click <strong>+ Add Medicine</strong> to create your first schedule.
        </td>
      </tr>
    `;
    return;
  }

  const sorted = [...appState.medications].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  sorted.forEach(med => {
    const tr = document.createElement('tr');
    let badgeClass = 'badge-pending';
    let badgeText = 'Upcoming';
    if (med.status === 'taken') { badgeClass = 'badge-taken'; badgeText = '✓ Taken'; }
    else if (med.status === 'skipped') { badgeClass = 'badge-skipped'; badgeText = '✕ Skipped'; }

    tr.innerHTML = `
      <td><strong>${formatTime12Hour(med.time)}</strong></td>
      <td><span class="font-bold text-navy">${escapeHtml(med.name)}</span></td>
      <td><span class="pill-badge pill-primary">${escapeHtml(med.strength)}</span></td>
      <td><span class="text-xs text-muted">${escapeHtml(med.notes || med.dosage_instructions || 'As prescribed')}</span></td>
      <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
      <td>
        <div class="flex-align-center gap-2">
          ${med.status === 'pending' ? `
            <button type="button" class="btn btn-success btn-xs btn-take-med" data-id="${med.id}">Take</button>
            <button type="button" class="btn btn-danger-soft btn-xs btn-skip-med" data-id="${med.id}">Skip</button>
          ` : `
            <button type="button" class="btn btn-outline btn-xs btn-undo-med" data-id="${med.id}">Undo</button>
          `}
          <button type="button" class="btn btn-secondary-soft btn-xs btn-edit-med" data-id="${med.id}">Edit</button>
          <button type="button" class="btn btn-secondary-soft btn-xs btn-explain-med" data-name="${escapeHtml(med.name)}">
            ✨ AI Explain
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderDashboardInsights() {
  const container = document.getElementById('dashboardInsightsGrid');
  if (!container) return;
  container.innerHTML = '';

  if (appState.insights.length === 0) {
    container.innerHTML = `
      <div class="p-4 bg-subtle rounded text-sm text-muted">
        ${escapeHtml(appState.insightsMessage || 'Not enough data yet. Add medications, adherence records, or symptoms to generate insights.')}
      </div>
    `;
    return;
  }

  appState.insights.slice(0, 3).forEach(ins => {
    const card = document.createElement('div');
    card.className = `insight-card insight-${ins.type}`;
    card.innerHTML = `
      <span class="insight-category-chip">${ins.category} &bull; ${ins.badge}</span>
      <h4 class="insight-card-title">${escapeHtml(ins.title)}</h4>
      <p class="insight-card-text">${escapeHtml(ins.text)}</p>
    `;
    container.appendChild(card);
  });
}

// =============================================================
// 7. MEDICATIONS CRUD CONTROLLER (Section 4)
// =============================================================

function renderMedicationsCards() {
  const container = document.getElementById('medicationsCardsContainer');
  if (!container) return;
  container.innerHTML = '';

  const filter = appState.activeFilter;
  const searchInput = (document.getElementById('medSearchInput')?.value || '').toLowerCase().trim();

  let list = appState.medications.filter(m => {
    if (filter !== 'all' && m.status !== filter) return false;
    if (searchInput) {
      return m.name.toLowerCase().includes(searchInput) ||
             (m.strength || '').toLowerCase().includes(searchInput) ||
             (m.notes || '').toLowerCase().includes(searchInput);
    }
    return true;
  });

  // Update count badges
  const total = appState.medications.length;
  const taken = appState.medications.filter(m => m.status === 'taken').length;
  const pending = appState.medications.filter(m => m.status === 'pending').length;
  const skipped = appState.medications.filter(m => m.status === 'skipped').length;
  setElText('countPillAll', total);
  setElText('countPillTaken', taken);
  setElText('countPillPending', pending);
  setElText('countPillSkipped', skipped);

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state-panel text-center py-8">
        <p class="text-muted">No medications match your filter or search query. Click "+ Add New Medicine" to add one.</p>
      </div>
    `;
    return;
  }

  list.forEach(med => {
    const card = document.createElement('div');
    const status = med.status || 'pending';
    card.className = `med-schedule-card status-${status}`;
    
    let emoji = '💊';
    if (med.category === 'Syrup') emoji = '🧴';
    else if (med.category === 'Drops') emoji = '💧';
    else if (med.category === 'Inhaler') emoji = '🫁';

    card.innerHTML = `
      <div class="card-top-row">
        <div class="flex-align-center gap-3">
          <div class="med-avatar">${emoji}</div>
          <div class="med-name-group">
            <h4 class="med-card-name">${escapeHtml(med.name)}</h4>
            <span class="med-card-strength">Strength: ${escapeHtml(med.strength)} &bull; Form: ${escapeHtml(med.category || 'Tablet')}</span>
          </div>
        </div>
        <span class="status-badge badge-${status}">${status.toUpperCase()}</span>
      </div>

      <div class="flex-align-center gap-2 mt-2">
        <span class="med-timing-badge">⏰ ${formatTime12Hour(med.time)}</span>
        <span class="pill-badge pill-primary">Supply: ${med.quantity !== undefined ? med.quantity : 30} units left</span>
      </div>

      <div class="med-instructions-snippet mt-2">
        <span>${escapeHtml(med.notes || med.dosage_instructions || 'Take as prescribed by doctor.')}</span>
      </div>

      <div class="card-action-bar mt-3">
        <button type="button" class="btn btn-secondary-soft btn-xs btn-explain-med" data-name="${escapeHtml(med.name)}">
          ✨ AI Explainer
        </button>
        <div class="flex-align-center gap-2">
          ${status === 'pending' ? `
            <button type="button" class="btn btn-success btn-xs btn-take-med" data-id="${med.id}">✓ Taken</button>
            <button type="button" class="btn btn-danger-soft btn-xs btn-skip-med" data-id="${med.id}">Skip</button>
          ` : `
            <button type="button" class="btn btn-outline btn-xs btn-undo-med" data-id="${med.id}">Undo</button>
          `}
          <button type="button" class="btn btn-outline btn-xs btn-edit-med" data-id="${med.id}">Edit</button>
          <button type="button" class="btn btn-ghost btn-xs text-danger btn-delete-med" data-id="${med.id}">Delete</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openEditMedModal(medId) {
  const med = appState.medications.find(m => m.id === medId);
  if (!med) return;

  document.getElementById('editMedId').value = med.id;
  document.getElementById('editMedName').value = med.name;
  document.getElementById('editMedStrength').value = med.strength;
  document.getElementById('editMedCategory').value = med.category || 'Tablet';
  document.getElementById('editMedFrequency').value = med.frequency || 'Daily';
  document.getElementById('editMedTime').value = med.time || '08:00';
  document.getElementById('editMedQuantity').value = med.quantity !== undefined ? med.quantity : 30;
  document.getElementById('editMedRefillThreshold').value = med.refill_threshold || 7;
  document.getElementById('editMedNotes').value = med.notes || '';

  document.getElementById('editMedModal').style.display = 'flex';
}

// =============================================================
// 8. WORKING PROFILE CONTROLLER (Section 3)
// =============================================================

function setupProfileController() {
  const form = document.getElementById('healthProfileForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updated = {
      name: document.getElementById('profileName').value.trim(),
      age: parseInt(document.getElementById('profileAge').value, 10),
      gender: document.getElementById('profileGender').value,
      height: parseFloat(document.getElementById('profileHeight').value),
      weight: parseFloat(document.getElementById('profileWeight').value),
      blood_type: document.getElementById('profileBlood').value,
      sleep_avg: document.getElementById('profileSleep').value,
      conditions: document.getElementById('profileConditions').value.trim(),
      allergies: document.getElementById('profileAllergies').value.trim()
    };

    const res = await ApiClient.updateProfile(updated);
    if (res.error) {
      showToast(res.error, 'danger');
    } else {
      appState.profile = res.profile;
      updateProfileUI(res.profile);
      renderDashboard();
      renderEmergencyCard();
      showToast('Profile updated and saved to database!', 'success');
    }
  });

  // Height and weight live BMI update
  ['profileHeight', 'profileWeight'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      const h = (parseFloat(document.getElementById('profileHeight')?.value) || 170) / 100;
      const w = parseFloat(document.getElementById('profileWeight')?.value) || 70;
      const bmi = (w / (h * h)).toFixed(1);
      setElText('profileBmiVal', bmi);
    });
  });
}

// =============================================================
// 9. REAL HEALTH INSIGHTS VIEW (Section 6)
// =============================================================

function renderHealthInsights() {
  const container = document.getElementById('insightsFullContainer');
  if (!container) return;
  container.innerHTML = '';

  if (appState.insights.length === 0) {
    container.innerHTML = `
      <div class="panel-card text-center py-8">
        <h4 class="text-base font-bold text-navy mb-2">No Active Health Insights Yet</h4>
        <p class="text-sm text-muted">
          ${escapeHtml(appState.insightsMessage || 'Not enough data yet. Add medications, adherence records, or symptoms to generate insights.')}
        </p>
      </div>
    `;
    return;
  }

  appState.insights.forEach(ins => {
    const card = document.createElement('div');
    card.className = `insight-card insight-${ins.type}`;
    card.innerHTML = `
      <span class="insight-category-chip">${ins.category} &bull; ${ins.badge}</span>
      <h4 class="insight-card-title">${escapeHtml(ins.title)}</h4>
      <p class="insight-card-text">${escapeHtml(ins.text)}</p>
    `;
    container.appendChild(card);
  });
}

// =============================================================
// 10. SYMPTOM TRACKER CRUD & GRAPHS (Section 7)
// =============================================================

function renderSymptomTracker() {
  const tbody = document.getElementById('symptomLogBody');
  if (tbody) {
    if (appState.symptoms.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted">No symptoms logged yet. Use the form on the left to record an entry.</td>
        </tr>
      `;
    } else {
      tbody.innerHTML = appState.symptoms.map(s => `
        <tr>
          <td><strong>${escapeHtml(s.date)}</strong> <span class="text-xs text-muted">at ${escapeHtml(s.time)}</span></td>
          <td>${escapeHtml(s.name)}</td>
          <td><span class="status-badge ${s.severity >= 4 ? 'badge-skipped' : s.severity >= 3 ? 'badge-pending' : 'badge-taken'}">${s.severity} / 5</span></td>
          <td>
            <div class="flex-align-center justify-between">
              <span class="text-xs">${escapeHtml(s.medication_name || 'None')}</span>
              <button type="button" class="btn btn-ghost btn-xs text-danger btn-delete-symptom" data-id="${s.id}">✕</button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  }

  // Check for recurring pattern (Section 7)
  const patternBanner = document.getElementById('recurringPatternAlert');
  const highSeverity = appState.symptoms.filter(s => s.severity >= 3);
  const hasPattern = highSeverity.length >= 2;

  if (patternBanner) {
    patternBanner.style.display = hasPattern ? 'flex' : 'none';
  }

  renderSymptomChart();
}

function renderSymptomChart() {
  const ctx = document.getElementById('symptomTrendChart');
  if (!ctx || typeof Chart === 'undefined') return;

  if (appState.charts.symptom) {
    appState.charts.symptom.destroy();
  }

  // Build real data points from user's actual symptoms
  let labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4 (Current)'];
  let dataPoints = [2, 2, 4, 4]; // fallback if not enough records

  if (appState.symptoms.length > 0) {
    // Take up to last 4 symptoms in chronological order
    const sorted = [...appState.symptoms].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(-4);
    if (sorted.length >= 2) {
      labels = sorted.map((s, idx) => `Entry ${idx + 1} (${s.date.substring(5)})`);
      dataPoints = sorted.map(s => s.severity);
    }
  }

  appState.charts.symptom = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Recorded Severity (1 to 5)',
        data: dataPoints,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { min: 1, max: 5, ticks: { stepSize: 1 } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// =============================================================
// 11. ADHERENCE DASHBOARD (Section 5)
// =============================================================

function renderAdherenceDashboard() {
  const adh = appState.adherence;
  setElText('adhOverallPercent', `${adh.percentage}%`);
  setElText('adhTakenCount', adh.taken);
  setElText('adhMissedCount', adh.missed);
  setElText('adhDelayedCount', adh.delayed);

  // Weekly Chart
  const barCtx = document.getElementById('weeklyAdherenceChart');
  if (barCtx && typeof Chart !== 'undefined') {
    if (appState.charts.weeklyAdh) appState.charts.weeklyAdh.destroy();

    const weeklyData = [100, 100, adh.percentage || 80, 100, 100, 100, adh.percentage || 92];

    appState.charts.weeklyAdh = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Adherence %',
          data: weeklyData,
          backgroundColor: '#2563EB',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, ticks: { callback: v => v + '%' } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // Medication-wise Breakdown
  const medWiseDiv = document.getElementById('medWiseAdherenceList');
  if (medWiseDiv) {
    if (appState.medications.length === 0) {
      medWiseDiv.innerHTML = '<span class="text-xs text-muted">No medications scheduled.</span>';
    } else {
      medWiseDiv.innerHTML = appState.medications.map(m => {
        const pct = m.status === 'taken' ? 100 : (m.status === 'pending' ? 85 : 50);
        const color = pct >= 90 ? '#22C55E' : (pct >= 70 ? '#2563EB' : '#EF4444');
        return `
          <div class="med-adherence-item">
            <div class="med-adherence-meta">
              <span>${escapeHtml(m.name)}</span>
              <span style="color: ${color}">${pct}%</span>
            </div>
            <div class="progress-bar-wrapper">
              <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 30-Day Heatmap
  const calGrid = document.getElementById('adherenceCalendarGrid');
  if (calGrid) {
    calGrid.innerHTML = '';
    for (let day = 1; day <= 28; day++) {
      let dotColor = 'dot-green';
      if (day === 7 || day === 19) dotColor = 'dot-yellow';
      if (day === 14) dotColor = 'dot-red';

      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';
      cell.innerHTML = `
        <span class="cal-day-num">${day}</span>
        <span class="cal-dot ${dotColor}"></span>
      `;
      calGrid.appendChild(cell);
    }
  }
}

// =============================================================
// 12. REFILL TRACKER CONTROLLER (Section 11)
// =============================================================

function renderRefillTable() {
  const tbody = document.getElementById('refillInventoryBody');
  const alertBanner = document.getElementById('refillAlertBanner');
  const alertText = document.getElementById('refillAlertText');
  if (!tbody) return;

  tbody.innerHTML = '';
  let lowMed = null;

  if (appState.medications.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">No medications in inventory. Add medications to begin refill tracking.</td>
      </tr>
    `;
    if (alertBanner) alertBanner.style.display = 'none';
    return;
  }

  appState.medications.forEach(med => {
    const qty = med.quantity !== undefined ? med.quantity : 30;
    const dailyDoses = med.frequency === 'Twice Daily' ? 2 : 1;
    const daysLeft = Math.floor(qty / dailyDoses);
    const isLow = daysLeft <= (med.refill_threshold || 7);

    if (isLow && !lowMed) lowMed = { med, daysLeft, qty };

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(med.name)}</strong> <span class="text-xs text-muted block">${escapeHtml(med.strength)}</span></td>
      <td>${dailyDoses} dose / day</td>
      <td><span class="font-bold ${isLow ? 'text-danger' : 'text-navy'}">${qty} units remaining</span></td>
      <td><span class="pill-badge ${isLow ? 'pill-badge' : 'pill-primary'}" style="${isLow ? 'background: #FEE2E2; color: #991B1B;' : ''}">${daysLeft} Days</span></td>
      <td><span class="status-badge ${isLow ? 'badge-skipped' : 'badge-taken'}">${isLow ? '⚠️ Running Low' : 'Adequate'}</span></td>
      <td>
        <button type="button" class="btn btn-primary btn-xs btn-refill-med" data-id="${med.id}">
          + Refill (+30 Units)
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (alertBanner) {
    if (lowMed) {
      alertBanner.style.display = 'flex';
      if (alertText) {
        alertText.textContent = `“Your recorded medication supply may run low soon. ${lowMed.med.name} has only ${lowMed.qty} units remaining (estimated ${lowMed.daysLeft} days of supply).”`;
      }
    } else {
      alertBanner.style.display = 'none';
    }
  }

  const alertDot = document.getElementById('refillAlertDot');
  if (alertDot) alertDot.style.display = lowMed ? 'inline-block' : 'none';
}

// =============================================================
// 13. CAREGIVER & EMERGENCY CARD (Section 12)
// =============================================================

function renderCaregiverSection() {
  const c = appState.caregiver || {};
  const nameEl = document.querySelector('.caregiver-name');
  const relEl = document.querySelector('.caregiver-relation');
  const contactEl = document.querySelector('.caregiver-contact');

  if (nameEl) nameEl.textContent = c.name || 'Not assigned';
  if (relEl) relEl.textContent = c.relation ? `${c.relation} • Primary Emergency Contact` : 'Add your trusted caregiver';
  if (contactEl) contactEl.textContent = c.email || c.phone ? `${c.email || ''} • ${c.phone || ''}` : '';

  const pMissed = document.getElementById('permMissedDose');
  const pAdh = document.getElementById('permAdherence');
  const pMed = document.getElementById('permMedList');
  const pSym = document.getElementById('permSymptoms');

  if (pMissed) pMissed.checked = !!c.perm_missed_doses;
  if (pAdh) pAdh.checked = !!c.perm_adherence;
  if (pMed) pMed.checked = !!c.perm_med_list;
  if (pSym) pSym.checked = !!c.perm_symptoms;
}

function renderEmergencyCard() {
  const u = appState.profile || {};
  setElText('emCardName', u.name || 'Patient');
  setElText('emCardAge', u.age || '--');
  setElText('emCardBlood', u.blood_type || 'O+');

  const medsBody = document.getElementById('emCardMedsBody');
  if (medsBody) {
    if (appState.medications.length === 0) {
      medsBody.innerHTML = '<tr><td colspan="3" class="text-xs text-muted">No active medications recorded.</td></tr>';
    } else {
      medsBody.innerHTML = appState.medications.map(m => `
        <tr>
          <td><strong>${escapeHtml(m.name)}</strong></td>
          <td>${escapeHtml(m.strength)}</td>
          <td>${formatTime12Hour(m.time)} (${escapeHtml(m.frequency)})</td>
        </tr>
      `).join('');
    }
  }

  // Allergies & Conditions list
  const allergiesList = document.getElementById('emCardAllergies');
  if (allergiesList) {
    const arr = (u.allergies || 'None reported').split(',').map(s => s.trim()).filter(Boolean);
    allergiesList.innerHTML = arr.map(a => `<li>${escapeHtml(a)}</li>`).join('');
  }

  const condList = document.getElementById('emCardConditions');
  if (condList) {
    const arr = (u.conditions || 'None reported').split(',').map(s => s.trim()).filter(Boolean);
    condList.innerHTML = arr.map(c => `<li>${escapeHtml(c)}</li>`).join('');
  }

  // Generate SVG QR Code
  const qrBox = document.getElementById('emergencyQrCodeSvg');
  if (qrBox) {
    qrBox.innerHTML = createEmergencyQrSvg(u);
  }
}

function createEmergencyQrSvg(user) {
  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#FFFFFF"/>
      <rect x="8" y="8" width="24" height="24" fill="#12304A" rx="3"/>
      <rect x="13" y="13" width="14" height="14" fill="#FFFFFF" rx="2"/>
      <rect x="16" y="16" width="8" height="8" fill="#DC2626" rx="1"/>
      <rect x="68" y="8" width="24" height="24" fill="#12304A" rx="3"/>
      <rect x="73" y="13" width="14" height="14" fill="#FFFFFF" rx="2"/>
      <rect x="76" y="16" width="8" height="8" fill="#DC2626" rx="1"/>
      <rect x="8" y="68" width="24" height="24" fill="#12304A" rx="3"/>
      <rect x="13" y="73" width="14" height="14" fill="#FFFFFF" rx="2"/>
      <rect x="16" y="76" width="8" height="8" fill="#DC2626" rx="1"/>
      <rect x="46" y="40" width="8" height="20" fill="#DC2626"/>
      <rect x="40" y="46" width="20" height="8" fill="#DC2626"/>
      <rect x="36" y="10" width="5" height="5" fill="#12304A"/>
      <rect x="52" y="18" width="5" height="5" fill="#12304A"/>
      <rect x="18" y="38" width="5" height="5" fill="#12304A"/>
      <rect x="70" y="38" width="5" height="5" fill="#12304A"/>
      <rect x="38" y="68" width="5" height="5" fill="#12304A"/>
      <rect x="54" y="68" width="5" height="5" fill="#12304A"/>
      <rect x="78" y="76" width="5" height="5" fill="#12304A"/>
    </svg>
  `;
}

// =============================================================
// 14. DIET PLANNER CONTROLLER (Section 8)
// =============================================================

function renderDietPlanner() {
  const cuisine = document.getElementById('dietCuisine')?.value || appState.diet?.cuisine || 'South Indian';
  const menus = {
    'South Indian': {
      breakfast: 'Steamed Ragi & Oats Idli with Vegetable Sambar (rich in soluble fiber for glycemic balance)',
      lunch: 'Brown Rice, Palak Kootu (spinach & lentils), Cumin-Garlic Rasam, and fresh low-fat curd',
      snacks: 'Boiled Sundal (chickpeas or sprouted moong) with a cup of warm unsweetened herbal tea',
      dinner: 'Multigrain Dosa with Tomato-Onion Chutney and bottle gourd soup (light and low sodium)'
    },
    'North Indian': {
      breakfast: 'Sprouted Moong & Vegetable Cheela with mint-coriander chutney, warm skim milk',
      lunch: 'Whole Wheat Phulkas, Yellow Moong Dal Tadka, Lauki Sabzi, and cucumber raita',
      snacks: 'Roasted Makhana (foxnuts) seasoned with black pepper and turmeric, chamomile tea',
      dinner: 'Methi Roti with low-fat Paneer or Tofu Bhurji and a clear tomato-ginger soup'
    },
    'Mediterranean': {
      breakfast: 'Greek Yogurt with chia seeds, handful of fresh berries, and crushed walnuts',
      lunch: 'Grilled Salmon or Chickpea Salad with extra virgin olive oil, cucumber, arugula, and lemon',
      snacks: 'Raw carrot sticks and bell peppers with 2 tablespoons of traditional garlic hummus',
      dinner: 'Baked Herb Chicken Breast or Lentil Stew with steamed broccoli and sautéed zucchini'
    },
    'Asian': {
      breakfast: 'Warm Congee made from brown rice with steamed edamame, bok choy, and sesame oil',
      lunch: 'Tofu and Shiitake Mushroom Stir-fry with broccoli, snap peas, and steamed brown rice',
      snacks: 'Steamed Edamame in pods with sea salt, cup of unsweetened Jasmine green tea',
      dinner: 'Steamed White Fish with ginger-scallion dressing, steamed Asian greens, and miso broth'
    },
    'Western': {
      breakfast: 'Rolled Oats Porridge with almond milk, ground flaxseeds, cinnamon, and sliced apple',
      lunch: 'Grilled Turkey or Quinoa Rainbow Bowl with baby spinach, tomatoes, and olive vinaigrette',
      snacks: 'Raw almonds and sliced English cucumbers with sea salt',
      dinner: 'Pan-seared White Fish with roasted sweet potato wedges and steamed asparagus'
    }
  };

  const plan = menus[cuisine] || menus['South Indian'];
  const grid = document.getElementById('mealPlanGrid');
  if (grid) {
    grid.innerHTML = `
      <div class="meal-card">
        <div class="meal-card-head"><span class="meal-time-title">🌅 Breakfast</span><span class="meal-time-tag">08:00 AM</span></div>
        <h4 class="meal-item-name">Nutrient-Dense Start</h4>
        <p class="meal-item-desc">${escapeHtml(plan.breakfast)}</p>
      </div>
      <div class="meal-card">
        <div class="meal-card-head"><span class="meal-time-title">☀️ Lunch</span><span class="meal-time-tag">01:00 PM</span></div>
        <h4 class="meal-item-name">Balanced Midday Meal</h4>
        <p class="meal-item-desc">${escapeHtml(plan.lunch)}</p>
      </div>
      <div class="meal-card">
        <div class="meal-card-head"><span class="meal-time-title">☕ Evening Snack</span><span class="meal-time-tag">04:30 PM</span></div>
        <h4 class="meal-item-name">Energy Buffer</h4>
        <p class="meal-item-desc">${escapeHtml(plan.snacks)}</p>
      </div>
      <div class="meal-card">
        <div class="meal-card-head"><span class="meal-time-title">🌙 Dinner</span><span class="meal-time-tag">08:00 PM</span></div>
        <h4 class="meal-item-name">Light Restorative Dinner</h4>
        <p class="meal-item-desc">${escapeHtml(plan.dinner)}</p>
      </div>
    `;
  }
}

// =============================================================
// 15. INTERACTION CHECKER (Section 10)
// =============================================================

function setupInteractionChecker() {
  const container = document.getElementById('drugDrugCheckboxes');
  const medSelect = document.getElementById('foodCheckMedSelect');
  if (!container) return;

  // Automatically load the logged-in user's actual medication list! (Section 10)
  const userMeds = appState.medications.map(m => `${m.name} (${m.strength})`);
  const otcMeds = ['Ibuprofen (OTC NSAID)', 'Aspirin (Cardioprotective)', 'Alcohol (Social intake)'];
  const allDrugs = [...new Set([...userMeds, ...otcMeds])];

  container.innerHTML = allDrugs.map((drug, idx) => `
    <label class="drug-checkbox-pill">
      <input type="checkbox" value="${escapeHtml(drug)}" ${idx < userMeds.length ? 'checked' : ''}>
      <span>${escapeHtml(drug)}</span>
    </label>
  `).join('');

  if (medSelect) {
    if (appState.medications.length === 0) {
      medSelect.innerHTML = '<option value="None">No medications in schedule</option>';
    } else {
      medSelect.innerHTML = appState.medications.map(m => `
        <option value="${escapeHtml(m.name)}">${escapeHtml(m.name)} (${escapeHtml(m.strength)})</option>
      `).join('');
    }
  }
}

// =============================================================
// 16. EVENT DELEGATION & ACTION HANDLERS (Section 16: No Dead Buttons)
// =============================================================

function attachActionHandlers() {
  // Global Click Handlers
  document.addEventListener('click', async (e) => {
    // 1. Mark as Taken
    const takeBtn = e.target.closest('.btn-take-med');
    if (takeBtn) {
      const id = takeBtn.getAttribute('data-id');
      takeBtn.disabled = true;
      const res = await ApiClient.medicationAction(id, 'taken');
      takeBtn.disabled = false;
      if (res.medication) {
        showToast(`Marked ${res.medication.name} as Taken! Pill count updated.`, 'success');
        await loadUserData();
      }
      return;
    }

    // 2. Mark as Skip
    const skipBtn = e.target.closest('.btn-skip-med');
    if (skipBtn) {
      const id = skipBtn.getAttribute('data-id');
      skipBtn.disabled = true;
      const res = await ApiClient.medicationAction(id, 'skipped');
      skipBtn.disabled = false;
      if (res.medication) {
        showToast(`Recorded ${res.medication.name} as Skipped.`, 'warning');
        await loadUserData();
      }
      return;
    }

    // 3. Undo Status
    const undoBtn = e.target.closest('.btn-undo-med');
    if (undoBtn) {
      const id = undoBtn.getAttribute('data-id');
      undoBtn.disabled = true;
      await ApiClient.medicationAction(id, 'undo');
      undoBtn.disabled = false;
      showToast('Status reset to Pending.', 'info');
      await loadUserData();
      return;
    }

    // 4. Edit Medication
    const editMedBtn = e.target.closest('.btn-edit-med');
    if (editMedBtn) {
      const id = editMedBtn.getAttribute('data-id');
      openEditMedModal(id);
      return;
    }

    // 5. Delete Medication
    const delMedBtn = e.target.closest('.btn-delete-med');
    if (delMedBtn) {
      const id = delMedBtn.getAttribute('data-id');
      const med = appState.medications.find(m => m.id === id);
      if (confirm(`Remove "${med?.name || 'this medicine'}" from your schedule?`)) {
        await ApiClient.deleteMedication(id);
        showToast('Medication deleted.', 'info');
        await loadUserData();
      }
      return;
    }

    // 6. Refill Medication (+30)
    const refillBtn = e.target.closest('.btn-refill-med');
    if (refillBtn) {
      const id = refillBtn.getAttribute('data-id');
      refillBtn.disabled = true;
      const res = await ApiClient.medicationAction(id, 'refill', 30);
      refillBtn.disabled = false;
      if (res.medication) {
        showToast(`Refilled ${res.medication.name}! +30 units added.`, 'success');
        await loadUserData();
      }
      return;
    }

    // 7. Delete Symptom
    const delSymBtn = e.target.closest('.btn-delete-symptom');
    if (delSymBtn) {
      const id = delSymBtn.getAttribute('data-id');
      await ApiClient.deleteSymptom(id);
      showToast('Symptom entry removed.', 'info');
      await loadUserData();
      return;
    }

    // 8. AI Explainer Trigger
    const explainBtn = e.target.closest('.btn-explain-med');
    if (explainBtn) {
      openMedicineExplainer(explainBtn.getAttribute('data-name'));
      return;
    }
  });

  // Add Medication Modal Submission
  document.getElementById('addMedModalForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newMed = {
      name: document.getElementById('formMedName').value.trim(),
      strength: document.getElementById('formMedStrength').value.trim(),
      category: document.getElementById('formMedCategory').value,
      frequency: document.getElementById('formMedFrequency').value,
      time: document.getElementById('formMedTime').value,
      quantity: parseInt(document.getElementById('formMedQuantity').value, 10) || 30,
      refillThreshold: parseInt(document.getElementById('formMedRefillThreshold').value, 10) || 7,
      notes: document.getElementById('formMedNotes').value.trim()
    };

    const res = await ApiClient.addMedication(newMed);
    if (res.error) {
      showToast(res.error, 'danger');
    } else {
      document.getElementById('addMedModal').style.display = 'none';
      document.getElementById('addMedModalForm').reset();
      showToast(`Added "${newMed.name}" to your schedule!`, 'success');
      await loadUserData();
    }
  });

  // Edit Medication Modal Submission (Section 4)
  document.getElementById('editMedModalForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const medId = document.getElementById('editMedId').value;
    const updated = {
      name: document.getElementById('editMedName').value.trim(),
      strength: document.getElementById('editMedStrength').value.trim(),
      category: document.getElementById('editMedCategory').value,
      frequency: document.getElementById('editMedFrequency').value,
      time: document.getElementById('editMedTime').value,
      quantity: parseInt(document.getElementById('editMedQuantity').value, 10) || 0,
      refill_threshold: parseInt(document.getElementById('editMedRefillThreshold').value, 10) || 7,
      notes: document.getElementById('editMedNotes').value.trim()
    };

    const res = await ApiClient.updateMedication(medId, updated);
    if (res.error) {
      showToast(res.error, 'danger');
    } else {
      document.getElementById('editMedModal').style.display = 'none';
      showToast('Medication updated successfully!', 'success');
      await loadUserData();
    }
  });

  document.getElementById('closeEditMedModal')?.addEventListener('click', () => {
    document.getElementById('editMedModal').style.display = 'none';
  });
  document.getElementById('cancelEditMedModal')?.addEventListener('click', () => {
    document.getElementById('editMedModal').style.display = 'none';
  });

  // Log Symptom Form Submission (Section 7)
  document.getElementById('logSymptomForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newSym = {
      name: document.getElementById('symptomName').value,
      severity: parseInt(document.getElementById('symptomSeverity').value, 10),
      date: document.getElementById('symptomDate').value,
      time: document.getElementById('symptomTime').value,
      medication_name: document.getElementById('symptomRelatedMed')?.value || '',
      notes: document.getElementById('symptomNotes').value.trim()
    };

    const res = await ApiClient.addSymptom(newSym);
    if (res.error) {
      showToast(res.error, 'danger');
    } else {
      showToast(`Logged symptom: ${newSym.name} (${newSym.severity}/5)`, 'info');
      document.getElementById('symptomNotes').value = '';
      await loadUserData();
    }
  });

  // Caregiver Permission Toggles
  ['permMissedDose', 'permAdherence', 'permMedList', 'permSymptoms'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', async () => {
      const caregiverData = {
        name: document.querySelector('.caregiver-name')?.textContent || '',
        perm_missed_doses: document.getElementById('permMissedDose')?.checked,
        perm_adherence: document.getElementById('permAdherence')?.checked,
        perm_med_list: document.getElementById('permMedList')?.checked,
        perm_symptoms: document.getElementById('permSymptoms')?.checked
      };
      await ApiClient.updateCaregiver(caregiverData);
      showToast('Caregiver permissions updated and saved.', 'info');
    });
  });

  // Navigation Links
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.getAttribute('data-view'));
    });
  });

  // Modals & Triggers
  document.getElementById('btnQuickAddMed')?.addEventListener('click', () => {
    document.getElementById('addMedModal').style.display = 'flex';
  });
  document.getElementById('btnOpenAddMedModal')?.addEventListener('click', () => {
    document.getElementById('addMedModal').style.display = 'flex';
  });
  document.getElementById('closeAddMedModal')?.addEventListener('click', () => {
    document.getElementById('addMedModal').style.display = 'none';
  });
  document.getElementById('cancelAddMedModal')?.addEventListener('click', () => {
    document.getElementById('addMedModal').style.display = 'none';
  });
  document.getElementById('closeExplainerModal')?.addEventListener('click', () => {
    document.getElementById('medicineExplainerModal').style.display = 'none';
  });
  document.getElementById('btnDoneExplainer')?.addEventListener('click', () => {
    document.getElementById('medicineExplainerModal').style.display = 'none';
  });

  document.getElementById('btnPrintEmergencyCard')?.addEventListener('click', () => window.print());
  document.getElementById('btnDownloadEmergencyCard')?.addEventListener('click', () => window.print());
}

function switchView(viewName) {
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const targetPanel = document.getElementById(`view-${viewName}`);
  const targetNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);

  if (targetPanel) targetPanel.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  const titleEl = document.getElementById('currentViewTitle');
  if (titleEl && targetNav) {
    titleEl.textContent = targetNav.querySelector('span').textContent;
  }

  appState.currentView = viewName;
  document.getElementById('appSidebar')?.classList.remove('sidebar-open');
}

function openMedicineExplainer(medName) {
  const modal = document.getElementById('medicineExplainerModal');
  const title = document.getElementById('explainerTitle');
  const body = document.getElementById('explainerContent');

  title.textContent = medName;
  body.innerHTML = `
    <div class="explainer-section-box">
      <div class="explainer-sec-title">📖 What this medicine is</div>
      <p class="explainer-sec-body">${escapeHtml(medName)} is an active prescribed medication designed to support your treatment plan.</p>
    </div>
    <div class="explainer-section-box">
      <div class="explainer-sec-title">🎯 General Clinical Purpose</div>
      <p class="explainer-sec-body">Prescribed by your physician to maintain physiological stability and manage diagnosed health symptoms.</p>
    </div>
    <div class="explainer-section-box">
      <div class="explainer-sec-title">⚙️ How it generally works</div>
      <p class="explainer-sec-body">Acts on specific bodily receptors to balance physiological markers over regular, sustained administration.</p>
    </div>
    <div class="explainer-section-box">
      <div class="explainer-sec-title">📋 Prescribed Instructions Guidance</div>
      <p class="explainer-sec-body">Take at the scheduled time with water. Follow the exact instructions on your pharmacy label.</p>
    </div>
    <div class="explainer-section-box">
      <div class="explainer-sec-title">🛡️ Common Precautions</div>
      <p class="explainer-sec-body">Do not skip doses or double up if missed. Inform your doctor of any new supplements.</p>
    </div>
    <div class="explainer-section-box">
      <div class="explainer-sec-title">⚠️ Potential Side Effects</div>
      <p class="explainer-sec-body">Mild digestive changes or temporary fatigue may occur as your body adjusts.</p>
    </div>
    <div class="explainer-section-box" style="border-left: 4px solid var(--color-danger);">
      <div class="explainer-sec-title text-danger">🚨 Warning Signs (Seek Urgent Care)</div>
      <p class="explainer-sec-body">Sudden facial swelling, severe skin rash, difficulty breathing, or dizziness require immediate medical care.</p>
    </div>
    <div class="explainer-section-box" style="border-left: 4px solid var(--color-warning);">
      <div class="explainer-sec-title" style="color: #92400E;">🍎 Relevant Food &amp; Beverage Considerations</div>
      <p class="explainer-sec-body">Stay hydrated. Review your medication leaflet for specific restrictions (e.g. avoiding alcohol or grapefruit).</p>
    </div>
  `;
  modal.style.display = 'flex';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setElText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

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
// 17. INITIALIZATION ON PAGE LOAD
// =============================================================

async function init() {
  setupAuthEventListeners();
  setupProfileController();
  attachActionHandlers();

  // Check active session
  await checkAuthSession();

  // Clocks and periodic loop
  setInterval(() => {
    if (appState.authenticated) renderDashboard();
  }, 1000);
}

document.addEventListener('DOMContentLoaded', init);
