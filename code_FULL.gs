/**
 * ============================================================
 *  Smart School Office v1.4 — Backend (Apps Script)
 *  รวมทุก Part ไว้ในไฟล์เดียว
 *
 *  ประกอบด้วย 6 ส่วน:
 *    Part 1 — Core: Auth | Session | Dashboard | Upload | Helpers
 *    Part 2 — Students | Personnel | Attendance
 *    Part 3 — Academic | Finance | Documents | Approvals | Registration
 *    Part 4 — Reports | Calendar | Files | Users | Settings
 *    Part 5 — ตารางสอน มาตรฐาน สพฐ.
 *    Part 6 — LINE OA Messaging API
 *
 *  วิธีติดตั้ง:
 *    1. วางไฟล์นี้ทั้งหมดใน Code.gs ใน Apps Script
 *    2. รัน initializeSheets() ครั้งเดียว
 *    3. Deploy → Web app
 * ============================================================
 */


/* ==========================================================
 *  Part 1 — Core: Auth | Session | Dashboard | Upload | Helpers
 ============================================================ */

const CONFIG = {
  APP_NAME       : 'Smart School Office',
  APP_VERSION    : '1.2',
  SESSION_TIMEOUT: 3600,
  ITEMS_PER_PAGE : 20,
  DEFAULT_USERS  : {
    'admin': { password: 'Admin@2024', role: 'admin', name: 'ผู้ดูแลระบบ' },
    'staff': { password: 'Staff@2024', role: 'staff', name: 'เจ้าหน้าที่' }
  },
  USER_ROLES: {
    admin  : { name: 'ผู้ดูแลระบบ',  permissions: ['read','write','delete','approve','settings','users'] },
    staff  : { name: 'เจ้าหน้าที่',  permissions: ['read','write'] },
    teacher: { name: 'ครู',          permissions: ['read','write_own'] }
  },
  REQUIRED_SHEETS: [
    'Config','Users','Sessions','Students','Personnel','Attendance',
    'Academic','Registration','Finance','Documents','Approvals',
    'Calendar','Files','Errors',
    'Schedule'
  ]
};


/* ============================================================
 *  API Entry Points (JSON API for GitHub Pages frontend)
 * ============================================================ */
const CORS_ORIGIN = '*'; // หรือใส่ URL GitHub Pages ที่ deploy

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  // ถ้าเป็น API call → ส่ง JSON
  const action = e && e.parameter && e.parameter.action;
  const token  = e && e.parameter && e.parameter.token;
  if (action) {
    const result = routeApi(action, e.parameter, token);
    return jsonResponse(result);
  }
  // fallback: render HTML (สำหรับ transition period)
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Smart School Office')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function doPost(e) {
  let payload = {};
  try { payload = JSON.parse(e.postData.contents || '{}'); } catch (err) {}
  const action = payload.action || (e.parameter && e.parameter.action);
  const token  = payload.token  || (e.parameter && e.parameter.token);
  // Merge top-level payload fields and payload.data so routeApi sees all params
  const params = Object.assign({}, payload, payload.data || {});
  const result = routeApi(action, params, token);
  return jsonResponse(result);
}

/**
 * API Router — map action string → backend function
 */
function routeApi(action, params, token) {
  try {
    switch (action) {
      // ---------- AUTH ----------
      case 'login': return login(params.username, params.password);
      case 'validateSession': return validateSession(params.token || token);
      case 'logout': return logout(params.token || token);
      case 'sendPasswordReset': return sendPasswordReset(params.email);
      case 'resetPasswordByToken': return resetPasswordByToken(params.token, params.new_password);

      // ---------- DASHBOARD / CONFIG ----------
      case 'getDashboardData': return getDashboardData(token);
      case 'getSidebarBadges': return getSidebarBadges(token);
      case 'getConfig': return getConfig();
      case 'saveConfig': return saveConfig(params);
      case 'changeOwnPassword': return changeOwnPassword(token, params.old_password, params.new_password);

      // ---------- STUDENTS ----------
      case 'getStudents': return getStudents(params, token);
      case 'getStudentById': return getStudentById(params.id, token);
      case 'saveStudent': return saveStudent(params.data ? JSON.parse(params.data) : params, token);
      case 'deleteStudent': return deleteStudent(params.id, token);
      case 'importStudents': return importStudents(params, token);
      case 'importStudentsCSV': return importStudentsCSV(JSON.parse(params.records || '[]'), token);

      // ---------- PERSONNEL ----------
      case 'getPersonnel': return getPersonnel(params, token);
      case 'getPersonnelById': return getPersonnelById(params.id, token);
      case 'savePersonnel': return savePersonnel(params.data ? (typeof params.data === 'string' ? JSON.parse(params.data) : params.data) : params, token);
      case 'getTeachersForDropdown': return getTeachersForDropdown(token);
      case 'getUsersAndTeachers': return getUsersAndTeachers(token);
      case 'deletePersonnel': return deletePersonnel(params.id, token);
      case 'createUsersFromPersonnel': return createUsersFromPersonnel(token);
      case 'importPersonnel': return importPersonnel(params, token);
      case 'importPersonnelCSV': return importPersonnelCSV(JSON.parse(params.records || '[]'), token);
      case 'exportData': return exportData(params.type, token);

      // ---------- CLASSROOMS ----------
      case 'getClassrooms': return getClassrooms(token);
      case 'getClassroomList': return getClassroomList(params, token);
      case 'getClassroomById': return getClassroomById(params.id, token);
      case 'getClassroomsForDropdown': return getClassroomsForDropdown(token);
      case 'saveClassroom': return saveClassroom(params, token);
      case 'deleteClassroom': return deleteClassroom(params.id, token);
      case 'getClassroomStudents': return getClassroomStudents(params.classroomName, params.academic_year, token);
      case 'transferStudents': return transferStudents(JSON.parse(params.studentIds || '[]'), params.targetRoom, token);

      // ---------- ACADEMIC ----------
      case 'getSubjects': return getSubjects(params, token);
      case 'getSubjectById': return getSubjectById(params.id, token);
      case 'saveSubject': return saveSubject(params.data ? (typeof params.data === 'string' ? JSON.parse(params.data) : params.data) : params, token);
      case 'deleteSubject': return deleteSubject(params.id, token);
      case 'getGradeSheet': return getGradeSheet(params.id || params.subject_id, token);
      case 'saveGradeSheet': return saveGradeSheet(params, token);
      case 'saveGradeBulk': return saveGradeBulk(params.subject_id || params.id, JSON.parse(params.records || '[]'), token);
      case 'getGradeReport': return getGradeReport(params.student_id || params.id, token);
      case 'calculateGPA': return calculateGPA(params.studentId || params.id, params.year, token);
      case 'generatePP5HTML': return generatePP5HTML(params.id || params.subject_id, token);
      case 'generatePP6HTML': return generatePP6HTML(params.studentId || params.id, params.sem, params.year, token);

      // ---------- ATTENDANCE ----------
      case 'getAttendanceByClassDate': return getAttendanceByClassDate(params.classroom, params.date, token);
      case 'getAttendanceBySubjectDate': return getAttendanceBySubjectDate(params.subject_id, params.date, token);
      case 'saveAttendanceBulk': return saveAttendanceBulk(params, token);
      case 'getAttendanceReport': return getAttendanceReport(params, token);
      case 'getAttendanceByStudent': return getAttendanceByStudent(params.student_id, token);
      case 'exportAttendance': return exportAttendance(params, token);

      // ---------- BEHAVIOR ----------
      case 'getBehaviorSummary': return getBehaviorSummary(token);
      case 'getBehaviorRecords': return getBehaviorRecords(params, token);
      case 'saveBehaviorRecord': return saveBehaviorRecord(params, token);
      case 'deleteBehaviorRecord': return deleteBehaviorRecord(params.id, token);

      // ---------- FINANCE ----------
      case 'getTransactions': return getTransactions(params, token);
      case 'saveTransaction': return saveTransaction(params, token);
      case 'deleteTransaction': return deleteTransaction(params.id, token);
      case 'getFinancialReport': return getFinancialReport(params, token);
      case 'getFinanceSummary': return getFinanceSummary(params.year, params.month, token);
      case 'generateReceiptHTML': return generateReceiptHTML(params.id, token);

      // ---------- DOCUMENTS ----------
      case 'getDocuments': return getDocuments(params, token);
      case 'saveDocument': return saveDocument(params, token);
      case 'deleteDocument': return deleteDocument(params.id, token);

      // ---------- APPROVALS ----------
      case 'getApprovals': return getApprovals(params, token);
      case 'saveApproval': return saveApproval(params.data ? (typeof params.data === 'string' ? JSON.parse(params.data) : params.data) : params, token);
      case 'reviewApproval': return reviewApproval(params.id, params.action, params.comment || '', token);
      case 'deleteApproval': return deleteApproval(params.id, token);
      case 'getRegistrations': return getRegistrations(params, token);
      case 'saveRegistration': return saveRegistration(params.data ? (typeof params.data === 'string' ? JSON.parse(params.data) : params.data) : params, token);
      case 'approveRegistration': return approveRegistration(params.id, token);
      case 'rejectRegistration': return rejectRegistration(params.id, token);

      // ---------- CALENDAR ----------
      case 'getCalendarEvents': return getCalendarEvents(params, token);
      case 'saveCalendarEvent': return saveCalendarEvent(params, token);
      case 'deleteCalendarEvent': return deleteCalendarEvent(params.id, token);

      // ---------- FILES ----------
      case 'getFilesList': return getFilesList(params.category, token);
      case 'uploadFile': return uploadFile(params.base64, params.fileName, params.mimeType, params.category);
      case 'deleteFile': return deleteFile(params.id);
      case 'deleteFileById': return deleteFile(params.id);

      // ---------- REPORTS ----------
      case 'getReportsOverview': return getReportsOverview(token);

      // ---------- USERS ----------
      case 'getUsers': return getUsers(params, token);
      case 'saveUser': return saveUser(params, token);
      case 'deleteUser': return deleteUser(params.id, token);
      case 'toggleUserActive': return toggleUserActive(params.id, token);
      case 'adminResetPassword': return adminResetPassword(params.user_id, token);

      // ---------- SCHEDULE ----------
      case 'getSchedule': return getSchedule(params, token);
      case 'saveSchedule': return saveSchedule(params, token);
      case 'deleteSchedule': return deleteSchedule(params.id, token);
      case 'getPeriodConfig': return getPeriodConfig(params.year, params.semester, token);
      case 'savePeriodConfig': return savePeriodConfig(params, token);
      case 'getRooms': return getRooms(params, token);
      case 'saveRoom': return saveRoom(params, token);
      case 'deleteRoom': return deleteRoom(params.id, token);
      case 'checkScheduleConflicts': return checkScheduleConflicts(params, token);
      case 'copySchedule': return copySchedule(params, token);

      // ---------- LINE OA ----------
      case 'getLineOAConfig': return getLineOAConfig(token);
      case 'saveLineOAConfig': return saveLineOAConfig(params, token);
      case 'sendBroadcast': return sendBroadcast(params, token);
      case 'getLineMessages': return getLineMessages(params, token);
      case 'testLineNotify': return testLineNotify(params.id, token);

      // ---------- STUDENT CARD ----------
      case 'getStudentCardData': return getStudentCardData(params, token);

      // ---------- QR ATTENDANCE ----------
      case 'recordQRAttendance': return recordQRAttendance(params.studentCode, params.date, token);
      case 'scanAttendance': return scanAttendance(params.code, token);

      // ---------- DEFAULT ----------
      default: return { status:'error', message:'ไม่รู้จัก action: ' + (action||'') };
    }
  } catch (err) {
    logError({ fn:'routeApi', action:action, error:err.message });
    return { status:'error', message:err.message };
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


/* ============================================================
 *  initializeSheets — เรียกครั้งเดียวตอนติดตั้งระบบ
 * ============================================================ */
function initializeSheets() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    CONFIG.REQUIRED_SHEETS.forEach(name => {
      if (!ss.getSheetByName(name)) {
        const sheet = ss.insertSheet(name);
        const header = (name === 'Config')   ? 'config_json'
                     : (name === 'Users')    ? 'user_json'
                     : (name === 'Sessions') ? 'session_json'
                     : (name === 'Errors')   ? 'error_json'
                     : 'data_json';
        sheet.appendRow([header]);
        sheet.setColumnWidth(1, 800);
      }
    });

    // ลบ Sheet1 default ถ้ามี
    const def = ss.getSheetByName('Sheet1');
    if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

    // สร้าง Config เริ่มต้น
    const cfg = readJsonSheet_('Config');
    if (cfg.length === 0) {
      const now = new Date().toISOString();
      const defaultConfig = {
        app_name: CONFIG.APP_NAME,
        school_name: 'โรงเรียนตัวอย่าง',
        school_address: '',
        school_district: '',
        school_province: '',
        school_phone: '',
        school_email: '',
        school_logo: '',
        qr_code_contact: '',
        folder_id: '',
        academic_year: String(new Date().getFullYear() + 543),
        semester: '1',
        notification_enabled: true,
        email_notifications: false,
        email_list: '',
        session_timeout: CONFIG.SESSION_TIMEOUT,
        app_version: CONFIG.APP_VERSION,
        maintenance_mode: false,
        grade_thresholds: [
          {min:80,grade:4},{min:75,grade:3.5},{min:70,grade:3},
          {min:65,grade:2.5},{min:60,grade:2},{min:55,grade:1.5},
          {min:50,grade:1},{min:0,grade:0}
        ],
        min_attendance_pct: 80,
        min_gpa_promote: 1.00,
        character_criteria: [
          'รักชาติ ศาสน์ กษัตริย์','ซื่อสัตย์สุจริต','มีวินัย',
          'ใฝ่เรียนรู้','อยู่อย่างพอเพียง','มุ่งมั่นในการทำงาน',
          'รักความเป็นไทย','มีจิตสาธารณะ'
        ],
        activity_types: [
          'กิจกรรมแนะแนว','กิจกรรมนักเรียน','กิจกรรมเพื่อสังคมและสาธารณประโยชน์'
        ],
        created_at: now,
        updated_at: now
      };
      appendJsonRow_('Config', defaultConfig);
    }

    // สร้างผู้ใช้เริ่มต้น
    const users = readJsonSheet_('Users');
    if (users.length === 0) {
      Object.keys(CONFIG.DEFAULT_USERS).forEach(uname => {
        const u = CONFIG.DEFAULT_USERS[uname];
        const now = new Date().toISOString();
        appendJsonRow_('Users', {
          id: generateId(),
          username: uname,
          password: hashPassword(u.password),
          role: u.role,
          name: u.name,
          email: '',
          phone: '',
          department: '',
          avatar: '',
          signature: '',
          permissions: CONFIG.USER_ROLES[u.role].permissions,
          active: true,
          last_login: null,
          created_at: now,
          updated_at: now
        });
      });
    }

    return { status:'success', message:'ติดตั้งระบบสำเร็จ — Login ด้วย admin / Admin@2024' };

  } catch (e) {
    logError({ fn:'initializeSheets', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  Sheet JSON Helpers — อ่าน/เขียน JSON ต่อแถว
 * ============================================================ */
function readJsonSheet_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const values = sheet.getRange(2,1,last-1,1).getValues();
  return values
    .map(r => r[0])
    .filter(s => s && String(s).trim() !== '')
    .map(s => { try { return JSON.parse(s); } catch(_) { return null; } })
    .filter(Boolean);
}

function _ensureSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['data_json']);
    sheet.setColumnWidth(1, 800);
  }
  return sheet;
}

function appendJsonRow_(sheetName, obj) {
  const sheet = _ensureSheet_(sheetName);
  sheet.appendRow([JSON.stringify(obj)]);
}

function writeJsonSheet_(sheetName, arr) {
  const sheet = _ensureSheet_(sheetName);
  const last = sheet.getLastRow();
  if (last > 1) sheet.getRange(2,1,last-1,1).clearContent();
  if (arr.length === 0) return;
  const rows = arr.map(o => [JSON.stringify(o)]);
  sheet.getRange(2,1,rows.length,1).setValues(rows);
}

function updateJsonById_(sheetName, id, updater) {
  const arr = readJsonSheet_(sheetName);
  let found = false;
  const next = arr.map(o => {
    if (o.id === id) { found = true; return updater(o); }
    return o;
  });
  if (found) writeJsonSheet_(sheetName, next);
  return found;
}

function deleteJsonById_(sheetName, id) {
  const arr = readJsonSheet_(sheetName);
  const next = arr.filter(o => o.id !== id);
  writeJsonSheet_(sheetName, next);
  return arr.length !== next.length;
}


/* ============================================================
 *  Config
 * ============================================================ */
function getConfig() {
  const arr = readJsonSheet_('Config');
  return arr[0] || {};
}

function saveConfig(configData) {
  try {
    const current = getConfig();
    const merged = Object.assign({}, current, configData, {
      updated_at: new Date().toISOString()
    });
    writeJsonSheet_('Config', [merged]);
    return { status:'success', data: merged };
  } catch (e) {
    logError({ fn:'saveConfig', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  Auth — Login / Logout / Session
 * ============================================================ */
function login(username, password) {
  try {
    if (!username || !password) {
      return { status:'error', message:'กรุณากรอกข้อมูลให้ครบถ้วน' };
    }
    const users = readJsonSheet_('Users');
    const user = users.find(u =>
      String(u.username).toLowerCase() === String(username).toLowerCase() &&
      u.active !== false
    );
    if (!user) return { status:'error', message:'ไม่พบบัญชีผู้ใช้งานนี้' };

    if (user.password !== hashPassword(password)) {
      return { status:'error', message:'รหัสผ่านไม่ถูกต้อง' };
    }

    // อัปเดต last_login
    updateJsonById_('Users', user.id, u => {
      u.last_login = new Date().toISOString();
      return u;
    });

    // สร้าง Session
    const config = getConfig();
    const timeout = (config.session_timeout || CONFIG.SESSION_TIMEOUT) * 1000;
    const token = generateId() + '-' + Date.now();
    const session = {
      token: token,
      user_id: user.id,
      role: user.role,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + timeout).toISOString()
    };
    appendJsonRow_('Sessions', session);
    cleanExpiredSessions_();

    // ส่งคืนข้อมูลที่ปลอดภัย
    const safeUser = Object.assign({}, user);
    delete safeUser.password;

    return {
      status: 'success',
      token: token,
      user: safeUser,
      role_info: CONFIG.USER_ROLES[user.role] || null,
      message: 'เข้าสู่ระบบสำเร็จ'
    };

  } catch (e) {
    logError({ fn:'login', error:e.message });
    return { status:'error', message:e.message };
  }
}

function logout(sessionToken) {
  try {
    const arr = readJsonSheet_('Sessions');
    const next = arr.filter(s => s.token !== sessionToken);
    writeJsonSheet_('Sessions', next);
    return { status:'success' };
  } catch (e) {
    logError({ fn:'logout', error:e.message });
    return { status:'error', message:e.message };
  }
}

function validateSession(sessionToken) {
  try {
    if (!sessionToken) return { valid:false };
    const sessions = readJsonSheet_('Sessions');
    const s = sessions.find(x => x.token === sessionToken);
    if (!s) return { valid:false };
    if (new Date(s.expires_at).getTime() < Date.now()) {
      logout(sessionToken);
      return { valid:false, expired:true };
    }
    const users = readJsonSheet_('Users');
    const user = users.find(u => u.id === s.user_id);
    if (!user) return { valid:false };
    const safe = Object.assign({}, user);
    delete safe.password;
    return {
      valid: true,
      user: safe,
      role: s.role,
      role_info: CONFIG.USER_ROLES[s.role] || null
    };
  } catch (e) {
    logError({ fn:'validateSession', error:e.message });
    return { valid:false };
  }
}

function cleanExpiredSessions_() {
  const arr = readJsonSheet_('Sessions');
  const now = Date.now();
  const next = arr.filter(s => new Date(s.expires_at).getTime() > now);
  if (next.length !== arr.length) writeJsonSheet_('Sessions', next);
}

function changeOwnPassword(sessionToken, oldPassword, newPassword) {
  try {
    const v = validateSession(sessionToken);
    if (!v.valid) return { status:'error', message:'หมดอายุการใช้งาน' };
    const users = readJsonSheet_('Users');
    const me = users.find(u => u.id === v.user.id);
    if (me.password !== hashPassword(oldPassword)) {
      return { status:'error', message:'รหัสผ่านเดิมไม่ถูกต้อง' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { status:'error', message:'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' };
    }
    updateJsonById_('Users', me.id, u => {
      u.password = hashPassword(newPassword);
      u.updated_at = new Date().toISOString();
      return u;
    });
    return { status:'success', message:'เปลี่ยนรหัสผ่านสำเร็จ' };
  } catch (e) {
    logError({ fn:'changeOwnPassword', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  Dashboard
 * ============================================================ */
function getDashboardData(sessionToken) {
  try {
    const v = validateSession(sessionToken);
    if (!v.valid) return { status:'error', message:'session_invalid' };

    const config     = getConfig();
    const students   = readJsonSheet_('Students');
    const personnel  = readJsonSheet_('Personnel');
    const attendance = readJsonSheet_('Attendance');
    const finance    = readJsonSheet_('Finance');
    const approvals  = readJsonSheet_('Approvals');
    const calendar   = readJsonSheet_('Calendar');

    // นักเรียน active
    const studentsActive = students.filter(s => s.status !== 'inactive' && s.status !== 'graduate' && s.status !== 'transfer').length;
    const personnelActive = personnel.filter(p => p.status !== 'inactive' && p.status !== 'retired').length;

    // อัตราเข้าเรียนวันนี้
    const today = new Date().toISOString().slice(0,10);
    const todays = attendance.filter(a => a.date === today);
    const presentToday = todays.filter(a => a.status === 'present').length;
    const attendancePct = todays.length > 0 ? Math.round((presentToday / todays.length) * 1000) / 10 : 0;

    // การเงิน
    let income = 0, expense = 0;
    finance.forEach(f => {
      const amt = Number(f.amount) || 0;
      if (f.type === 'income')  income  += amt;
      if (f.type === 'expense') expense += amt;
    });
    const balance = income - expense;

    // กราฟเข้าเรียนรายสัปดาห์ (7 วันย้อนหลัง)
    const weekChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0,10);
      const list = attendance.filter(a => a.date === ds);
      const pct = list.length > 0
        ? Math.round((list.filter(a=>a.status==='present').length / list.length) * 100)
        : 0;
      weekChart.push({ date: ds, pct: pct, label: ['อา','จ','อ','พ','พฤ','ศ','ส'][d.getDay()] });
    }

    // ประกาศล่าสุด
    const announcements = calendar
      .filter(c => c.type === 'academic' || c.type === 'activity' || c.is_pinned)
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    // คำขอรออนุมัติ
    const pendingApprovals = approvals.filter(a => a.status === 'pending').length;

    return {
      status: 'success',
      data: {
        config: { school_name: config.school_name, school_logo: config.school_logo, academic_year: config.academic_year, semester: config.semester },
        stats: {
          students      : studentsActive,
          personnel     : personnelActive,
          attendance_pct: attendancePct,
          balance       : balance
        },
        finance: { income: income, expense: expense, balance: balance },
        week_chart   : weekChart,
        announcements: announcements,
        pending_approvals: pendingApprovals
      }
    };
  } catch (e) {
    logError({ fn:'getDashboardData', error:e.message });
    return { status:'error', message:e.message };
  }
}

function getSidebarBadges(sessionToken) {
  try {
    const v = validateSession(sessionToken);
    if (!v.valid) return { status:'error' };
    const approvals = readJsonSheet_('Approvals');
    return {
      status:'success',
      pending_approvals: approvals.filter(a => a.status === 'pending').length
    };
  } catch (e) {
    return { status:'error' };
  }
}


/* ============================================================
 *  File Upload (Section 14.5)
 * ============================================================ */
function uploadFile(base64, fileName, mimeType, category) {
  try {
    const config   = getConfig();
    let   folderId = config.folder_id;

    // ถ้าไม่มี folder_id ใน Config → สร้าง folder root อัตโนมัติ
    if (!folderId) {
      const root = DriveApp.createFolder('SmartSchoolOffice_Files');
      folderId   = root.getId();
      saveConfig({ folder_id: folderId });
    }

    const folder = DriveApp.getFolderById(folderId);

    // แยก subfolder ตาม category
    let target = folder;
    if (category && category !== 'general') {
      const it = folder.getFoldersByName(category);
      target = it.hasNext() ? it.next() : folder.createFolder(category);
    }

    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
    const file = target.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    return {
      status      : 'success',
      file_id     : fileId,
      view_url    : 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400-h400',
      download_url: 'https://drive.google.com/uc?export=download&id=' + fileId,
      thumb_url   : 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400-h400',
      size        : file.getSize(),
      name        : file.getName(),
      mime_type   : mimeType,
      category    : category || 'general',
      created_at  : new Date().toISOString()
    };

  } catch (e) {
    logError({ fn:'uploadFile', error:e.message, file:fileName });
    return { status:'error', message:e.message };
  }
}

function deleteFile(fileId) {
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
    return { status:'success' };
  } catch (e) {
    logError({ fn:'deleteFile', error:e.message, file_id:fileId });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  Helpers
 * ============================================================ */
function generateId() {
  return Utilities.getUuid();
}

function hashPassword(password) {
  const raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(password)
  );
  return raw.map(b => ('0' + ((b + 256) & 0xff).toString(16)).slice(-2)).join('');
}

function logError(errObj) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Errors');
    if (!sheet) return;
    sheet.appendRow([JSON.stringify({
      time: new Date().toISOString(),
      ...errObj
    })]);
  } catch (_) {}
}

function sanitize(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/* ============================================================
 *  END Part 1 — เพิ่ม CRUD ใน Part 2 ต่อไป
 * ============================================================ */


/* ==========================================================
 *  Part 2 — Students | Personnel | Attendance
 ============================================================ */

/* ============================================================
 *  Auth Guard (re-usable)
 * ============================================================ */
function _requireAuth_(token, requireWrite) {
  const v = validateSession(token);
  if (!v.valid) {
    return { ok:false, response:{ status:'error', message:'session_invalid', code:401 } };
  }
  if (requireWrite) {
    const perms = (v.user && v.user.permissions) || [];
    if (!perms.includes('write') && !perms.includes('write_own')) {
      return { ok:false, response:{ status:'error', message:'no_permission', code:403 } };
    }
  }
  return { ok:true, user:v.user, role:v.role };
}

function _paginate_(arr, page, perPage) {
  page    = Math.max(1, Number(page) || 1);
  perPage = Math.max(1, Number(perPage) || CONFIG.ITEMS_PER_PAGE);
  const total = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage   = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  return {
    data       : arr.slice(start, start + perPage),
    page       : safePage,
    per_page   : perPage,
    total      : total,
    total_pages: totalPages
  };
}


/* ============================================================
 *  STUDENTS
 * ============================================================ */
function getStudents(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Students');
    params = params || {};

    // filter
    let filtered = all.slice();
    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(s => {
        const blob = [
          s.student_id, s.national_id, s.first_name, s.last_name,
          s.classroom, s.parent_name, s.parent_phone
        ].filter(Boolean).join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (params.classroom)     filtered = filtered.filter(s => String(s.classroom) === String(params.classroom));
    if (params.academic_year) filtered = filtered.filter(s => String(s.academic_year) === String(params.academic_year));
    if (params.status)        filtered = filtered.filter(s => s.status === params.status);
    if (params.gender)        filtered = filtered.filter(s => s.gender === params.gender);

    // sort
    filtered.sort((a, b) => {
      const ay = String(a.academic_year || '');
      const by = String(b.academic_year || '');
      if (ay !== by) return by.localeCompare(ay);
      const ac = String(a.classroom || '');
      const bc = String(b.classroom || '');
      if (ac !== bc) return ac.localeCompare(bc, 'th');
      const af = String(a.first_name || '');
      const bf = String(b.first_name || '');
      return af.localeCompare(bf, 'th');
    });

    // distinct values สำหรับ filter dropdown
    const distinct = {
      classrooms    : Array.from(new Set(all.map(s => s.classroom).filter(Boolean))).sort(),
      academic_years: Array.from(new Set(all.map(s => s.academic_year).filter(Boolean))).sort().reverse()
    };

    const paged = _paginate_(filtered, params.page, params.per_page);
    paged.distinct = distinct;
    paged.status   = 'success';
    return paged;

  } catch (e) {
    logError({ fn:'getStudents', error:e.message });
    return { status:'error', message:e.message };
  }
}

function getStudentById(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const all = readJsonSheet_('Students');
    const s = all.find(x => x.id === id);
    return s
      ? { status:'success', data:s }
      : { status:'error', message:'ไม่พบข้อมูลนักเรียน' };
  } catch (e) {
    logError({ fn:'getStudentById', error:e.message });
    return { status:'error', message:e.message };
  }
}

function saveStudent(studentData, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    if (!studentData || !studentData.first_name || !studentData.last_name) {
      return { status:'error', message:'กรุณากรอกชื่อและนามสกุล' };
    }

    // sanitize
    const clean = {
      prefix       : sanitize(studentData.prefix),
      first_name   : sanitize(studentData.first_name),
      last_name    : sanitize(studentData.last_name),
      national_id  : sanitize(studentData.national_id),
      birth_date   : studentData.birth_date || null,
      gender       : studentData.gender || '',
      blood_type   : studentData.blood_type || '',
      nationality  : sanitize(studentData.nationality) || 'ไทย',
      religion     : sanitize(studentData.religion)    || 'พุทธ',
      photo        : studentData.photo || '',
      classroom    : sanitize(studentData.classroom),
      academic_year: sanitize(studentData.academic_year) || getConfig().academic_year,
      address      : sanitize(studentData.address),
      parent_name  : sanitize(studentData.parent_name),
      parent_phone : sanitize(studentData.parent_phone),
      parent_relation: studentData.parent_relation || '',
      status       : studentData.status || 'active'
    };

    // ตรวจสอบเลขบัตรซ้ำ
    if (clean.national_id) {
      const all = readJsonSheet_('Students');
      const dup = all.find(s => s.national_id === clean.national_id && s.id !== studentData.id);
      if (dup) return { status:'error', message:'เลขบัตรประชาชนนี้มีในระบบแล้ว' };
    }

    if (studentData.id) {
      // update
      let updated = null;
      const found = updateJsonById_('Students', studentData.id, s => {
        Object.assign(s, clean);
        s.updated_at = new Date().toISOString();
        updated = s;
        return s;
      });
      if (!found) return { status:'error', message:'ไม่พบข้อมูลที่จะแก้ไข' };
      return { status:'success', data:updated, message:'แก้ไขข้อมูลนักเรียนสำเร็จ' };
    } else {
      // insert
      const now = new Date().toISOString();
      const obj = Object.assign({
        id        : generateId(),
        student_id: generateStudentId(),
      }, clean, { created_at: now, updated_at: now });
      appendJsonRow_('Students', obj);
      return { status:'success', data:obj, message:'เพิ่มนักเรียนสำเร็จ' };
    }
  } catch (e) {
    logError({ fn:'saveStudent', error:e.message });
    return { status:'error', message:e.message };
  }
}

function importStudentsCSV(rows, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    if (!Array.isArray(rows) || !rows.length) {
      return { status:'error', message:'ไม่มีข้อมูล' };
    }

    const all = readJsonSheet_('Students');
    const now = new Date().toISOString();
    const inserted = [];
    const errors = [];

    rows.forEach((row, idx) => {
      try {
        if (!row.first_name || !row.last_name) {
          errors.push('แถว ' + (idx + 1) + ': ไม่มีชื่อ/นามสกุล'); return;
        }
        const clean = {
          prefix       : sanitize(row.prefix),
          first_name   : sanitize(row.first_name),
          last_name    : sanitize(row.last_name),
          national_id  : sanitize(row.national_id),
          birth_date   : row.birth_date || null,
          gender       : row.gender || '',
          blood_type   : row.blood_type || '',
          nationality  : sanitize(row.nationality) || 'ไทย',
          religion     : sanitize(row.religion) || 'พุทธ',
          photo        : row.photo || '',
          classroom    : sanitize(row.classroom),
          academic_year: sanitize(row.academic_year) || getConfig().academic_year,
          address      : sanitize(row.address),
          parent_name  : sanitize(row.parent_name),
          parent_phone : sanitize(row.parent_phone),
          parent_relation: row.parent_relation || '',
          status       : row.status || 'active'
        };
        if (clean.national_id) {
          const dup = all.find(s => s.national_id === clean.national_id);
          if (dup) { errors.push('แถว ' + (idx + 1) + ': เลขบัตร ' + clean.national_id + ' ซ้ำ'); return; }
        }
        const obj = Object.assign({
          id        : generateId(),
          student_id: generateStudentId()
        }, clean, { created_at: now, updated_at: now });
        appendJsonRow_('Students', obj);
        inserted.push(obj);
        all.push(obj);
      } catch (e) {
        errors.push('แถว ' + (idx + 1) + ': ' + e.message);
      }
    });

    return {
      status: inserted.length ? 'success' : 'error',
      message: 'นำเข้าสำเร็จ ' + inserted.length + ' รายการ' + (errors.length ? ' (ข้อผิดพลาด ' + errors.length + ' รายการ)' : ''),
      inserted: inserted.length,
      errors: errors
    };
  } catch (e) {
    logError({ fn:'importStudentsCSV', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteStudent(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('delete')) {
      return { status:'error', message:'no_permission', code:403 };
    }

    const ok = deleteJsonById_('Students', id);
    return ok
      ? { status:'success', message:'ลบข้อมูลสำเร็จ' }
      : { status:'error', message:'ไม่พบข้อมูลที่จะลบ' };
  } catch (e) {
    logError({ fn:'deleteStudent', error:e.message });
    return { status:'error', message:e.message };
  }
}

function generateStudentId() {
  const config = getConfig();
  const year = String(config.academic_year || (new Date().getFullYear() + 543));
  const all = readJsonSheet_('Students');
  // running ในปีเดียวกัน
  const inYear = all.filter(s => String(s.student_id || '').slice(0, year.length) === year);
  const next = inYear.length + 1;
  return year + String(next).padStart(4, '0');
}


/* ============================================================
 *  PERSONNEL
 * ============================================================ */
function getPersonnel(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Personnel');
    params = params || {};

    let filtered = all.slice();
    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(p => {
        const blob = [
          p.personnel_id, p.national_id, p.first_name, p.last_name,
          p.position, p.department, p.phone
        ].filter(Boolean).join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (params.department) filtered = filtered.filter(p => p.department === params.department);
    if (params.type)       filtered = filtered.filter(p => p.type === params.type);
    if (params.status)     filtered = filtered.filter(p => p.status === params.status);

    filtered.sort((a, b) => {
      const at = String(a.type || '');
      const bt = String(b.type || '');
      if (at !== bt) return at.localeCompare(bt);
      return String(a.first_name || '').localeCompare(String(b.first_name || ''), 'th');
    });

    const distinct = {
      departments: Array.from(new Set(all.map(p => p.department).filter(Boolean))).sort(),
      positions  : Array.from(new Set(all.map(p => p.position).filter(Boolean))).sort()
    };

    const paged = _paginate_(filtered, params.page, params.per_page);
    paged.distinct = distinct;
    paged.status   = 'success';
    return paged;

  } catch (e) {
    logError({ fn:'getPersonnel', error:e.message });
    return { status:'error', message:e.message };
  }
}

function getPersonnelById(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const all = readJsonSheet_('Personnel');
    const p = all.find(x => x.id === id);
    return p
      ? { status:'success', data:p }
      : { status:'error', message:'ไม่พบข้อมูลบุคลากร' };
  } catch (e) {
    return { status:'error', message:e.message };
  }
}

function savePersonnel(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    if (!data || !data.first_name || !data.last_name) {
      return { status:'error', message:'กรุณากรอกชื่อและนามสกุล' };
    }

    // ครู → แก้ไขได้เฉพาะข้อมูลตัวเอง ห้ามเพิ่มหรือแก้ไขคนอื่น
    if (auth.role === 'teacher') {
      if (!data.id) return { status:'error', message:'ไม่มีสิทธิ์เพิ่มบุคลากร' };
      const ownP = readJsonSheet_('Personnel').find(p =>
        String(p.personnel_id || '').toLowerCase() === String(auth.user.username).toLowerCase()
      );
      if (!ownP || ownP.id !== data.id) {
        return { status:'error', message:'ไม่มีสิทธิ์แก้ไขข้อมูลบุคลากรคนอื่น' };
      }
    }

    const clean = {
      prefix         : sanitize(data.prefix),
      first_name     : sanitize(data.first_name),
      last_name      : sanitize(data.last_name),
      national_id    : sanitize(data.national_id),
      birth_date     : data.birth_date || null,
      gender         : data.gender || '',
      position       : sanitize(data.position),
      department     : sanitize(data.department),
      type           : data.type || 'teacher',
      academic_level : sanitize(data.academic_level),
      start_date     : data.start_date || null,
      phone          : sanitize(data.phone),
      email          : sanitize(data.email),
      address        : sanitize(data.address),
      photo          : data.photo || '',
      signature      : data.signature || '',
      status         : data.status || 'active'
    };

    if (clean.national_id) {
      const all = readJsonSheet_('Personnel');
      const dup = all.find(p => p.national_id === clean.national_id && p.id !== data.id);
      if (dup) return { status:'error', message:'เลขบัตรประชาชนนี้มีในระบบแล้ว' };
    }

    if (data.id) {
      let updated = null;
      const found = updateJsonById_('Personnel', data.id, p => {
        Object.assign(p, clean);
        p.updated_at = new Date().toISOString();
        updated = p;
        return p;
      });
      if (!found) return { status:'error', message:'ไม่พบข้อมูลที่จะแก้ไข' };
      return { status:'success', data:updated, message:'แก้ไขข้อมูลสำเร็จ' };
    } else {
      const now = new Date().toISOString();
      const obj = Object.assign({
        id           : generateId(),
        personnel_id : generatePersonnelId()
      }, clean, { created_at: now, updated_at: now });
      appendJsonRow_('Personnel', obj);
      return { status:'success', data:obj, message:'เพิ่มบุคลากรสำเร็จ' };
    }
  } catch (e) {
    logError({ fn:'savePersonnel', error:e.message });
    return { status:'error', message:e.message };
  }
}

function importPersonnelCSV(rows, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    if (!Array.isArray(rows) || !rows.length) {
      return { status:'error', message:'ไม่มีข้อมูล' };
    }

    const all = readJsonSheet_('Personnel');
    const now = new Date().toISOString();
    const inserted = [];
    const errors = [];

    rows.forEach((row, idx) => {
      try {
        if (!row.first_name || !row.last_name) {
          errors.push('แถว ' + (idx + 1) + ': ไม่มีชื่อ/นามสกุล'); return;
        }
        const clean = {
          prefix         : sanitize(row.prefix),
          first_name     : sanitize(row.first_name),
          last_name      : sanitize(row.last_name),
          national_id    : sanitize(row.national_id),
          birth_date     : row.birth_date || null,
          gender         : row.gender || '',
          position       : sanitize(row.position),
          department     : sanitize(row.department),
          type           : row.type || 'teacher',
          academic_level : sanitize(row.academic_level),
          start_date     : row.start_date || null,
          phone          : sanitize(row.phone),
          email          : sanitize(row.email),
          address        : sanitize(row.address),
          photo          : row.photo || '',
          signature      : row.signature || '',
          status         : row.status || 'active'
        };
        if (clean.national_id) {
          const dup = all.find(p => p.national_id === clean.national_id);
          if (dup) { errors.push('แถว ' + (idx + 1) + ': เลขบัตร ' + clean.national_id + ' ซ้ำ'); return; }
        }
        const obj = Object.assign({
          id           : generateId(),
          personnel_id : generatePersonnelId()
        }, clean, { created_at: now, updated_at: now });
        appendJsonRow_('Personnel', obj);
        inserted.push(obj);
        all.push(obj);
      } catch (e) {
        errors.push('แถว ' + (idx + 1) + ': ' + e.message);
      }
    });

    return {
      status: inserted.length ? 'success' : 'error',
      message: 'นำเข้าสำเร็จ ' + inserted.length + ' รายการ' + (errors.length ? ' (ข้อผิดพลาด ' + errors.length + ' รายการ)' : ''),
      inserted: inserted.length,
      errors: errors
    };
  } catch (e) {
    logError({ fn:'importPersonnelCSV', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deletePersonnel(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('delete')) {
      return { status:'error', message:'no_permission' };
    }
    const ok = deleteJsonById_('Personnel', id);
    return ok
      ? { status:'success', message:'ลบข้อมูลสำเร็จ' }
      : { status:'error', message:'ไม่พบข้อมูล' };
  } catch (e) {
    logError({ fn:'deletePersonnel', error:e.message });
    return { status:'error', message:e.message };
  }
}

function generatePersonnelId() {
  const all = readJsonSheet_('Personnel');
  const next = all.length + 1;
  return 'P' + String(next).padStart(5, '0');
}


/* ============================================================
 *  ATTENDANCE
 * ============================================================ */

/**
 * ดึงรายชื่อนักเรียนตามห้อง พร้อมสถานะการเข้าเรียนของวันที่ระบุ
 * (สำหรับหน้าบันทึก)
 */
function getAttendanceByClassDate(classroom, date, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    if (!classroom || !date) {
      return { status:'error', message:'กรุณาเลือกชั้นเรียนและวันที่' };
    }

    const students = readJsonSheet_('Students')
      .filter(s => String(s.classroom) === String(classroom) && s.status === 'active')
      .sort((a, b) => String(a.first_name || '').localeCompare(String(b.first_name || ''), 'th'));

    const att = readJsonSheet_('Attendance').filter(a => a.date === date);

    const rows = students.map(s => {
      const exist = att.find(a => a.student_id === s.id);
      return {
        student_id  : s.id,
        student_code: s.student_id,
        prefix      : s.prefix,
        first_name  : s.first_name,
        last_name   : s.last_name,
        photo       : s.photo,
        status      : exist ? exist.status : 'present',
        leave_type  : exist ? exist.leave_type : '',
        note        : exist ? exist.note : '',
        attendance_id: exist ? exist.id : null
      };
    });

    return { status:'success', data:rows, date:date, classroom:classroom };

  } catch (e) {
    logError({ fn:'getAttendanceByClassDate', error:e.message });
    return { status:'error', message:e.message };
  }
}

/**
 * ดึงรายชื่อนักเรียนตามวิชา พร้อมสถานะการเข้าเรียนของวันที่ระบุ
 */
function getAttendanceBySubjectDate(subject_id, date, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    if (!subject_id || !date) return { status:'error', message:'กรุณาเลือกวิชาและวันที่' };

    const subj = readJsonSheet_('Academic').find(x => x.id === subject_id && x._kind === 'subject');
    if (!subj) return { status:'error', message:'ไม่พบรายวิชา' };

    const students = readJsonSheet_('Students')
      .filter(s => String(s.classroom) === String(subj.grade_level) && s.status === 'active')
      .sort((a, b) => String(a.first_name||'').localeCompare(String(b.first_name||''), 'th'));

    const att = readJsonSheet_('Attendance').filter(a => a.date === date && a.subject_id === subject_id);

    const rows = students.map(s => {
      const exist = att.find(a => a.student_id === s.id);
      return {
        student_id   : s.id,
        student_code : s.student_id,
        prefix       : s.prefix,
        first_name   : s.first_name,
        last_name    : s.last_name,
        photo        : s.photo,
        status       : exist ? exist.status  : 'present',
        leave_type   : exist ? exist.leave_type : '',
        note         : exist ? exist.note    : '',
        attendance_id: exist ? exist.id      : null
      };
    });

    return { status:'success', data:rows, date:date, subject_id:subject_id,
             subject_name: subj.subject_name, classroom: subj.grade_level };

  } catch (e) {
    logError({ fn:'getAttendanceBySubjectDate', error:e.message });
    return { status:'error', message:e.message };
  }
}

/**
 * บันทึก Attendance แบบ Bulk
 * รับ array: [{student_id, status, leave_type, note}, ...]
 * payload.subject_id ถ้ามี = บันทึกรายวิชา, ถ้าไม่มี = บันทึกรายวัน
 */
function saveAttendanceBulk(payload, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    if (!payload || !payload.date || !Array.isArray(payload.records)) {
      return { status:'error', message:'ข้อมูลไม่ครบถ้วน' };
    }
    const date = payload.date;
    const recordedBy = auth.user.id;

    const all = readJsonSheet_('Attendance');
    const studentIds = new Set(payload.records.map(r => r.student_id));
    const subjectId  = payload.subject_id || null;

    // เก็บระเบียนที่ไม่ใช่ของบล็อกนี้
    const kept = all.filter(a => {
      if (a.date !== date) return true;
      if (!studentIds.has(a.student_id)) return true;
      // ถ้า bulk เป็นรายวิชา ให้ลบเฉพาะระเบียนวิชาเดียวกัน
      if (subjectId) return a.subject_id !== subjectId;
      // ถ้า bulk เป็นรายวัน ให้ลบเฉพาะระเบียนรายวัน (ไม่มี subject_id)
      return !!a.subject_id;
    });

    const now = new Date().toISOString();
    const inserted = payload.records
      .filter(r => r.student_id && r.status)
      .map(r => ({
        id          : generateId(),
        student_id  : r.student_id,
        date        : date,
        subject_id  : subjectId || '',
        status      : r.status,
        leave_type  : r.leave_type || '',
        note        : sanitize(r.note),
        recorded_by : recordedBy,
        created_at  : now
      }));

    writeJsonSheet_('Attendance', kept.concat(inserted));

    // LINE OA แจ้งเตือนนักเรียนขาด/มาสาย
    try {
      const absLate = (records||[]).filter(r => r.status==='absent' || r.status==='late');
      if (absLate.length > 0) {
        notifyAttendance_({ date:date, records:records }, payload.classroom || '');
      }
    } catch(_) {}

    return {
      status:'success',
      message:'บันทึกการเข้าเรียนสำเร็จ ' + inserted.length + ' รายการ',
      count: inserted.length
    };

  } catch (e) {
    logError({ fn:'saveAttendanceBulk', error:e.message });
    return { status:'error', message:e.message };
  }
}

/**
 * รายงานการเข้าเรียน
 * Mode 'student' : รายนักเรียน 1 คน ในช่วงเวลา
 * Mode 'class'   : รายห้อง ในช่วงเวลา (สรุป)
 * Mode 'monthly' : รายห้อง รายเดือน (calendar grid)
 */
function getAttendanceReport(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    params = params || {};
    const mode  = params.mode || 'class';
    const start = params.start_date;
    const end   = params.end_date;

    let attendance = readJsonSheet_('Attendance');
    if (start) attendance = attendance.filter(a => a.date >= start);
    if (end)   attendance = attendance.filter(a => a.date <= end);

    const students = readJsonSheet_('Students');

    if (mode === 'student') {
      if (!params.student_id) return { status:'error', message:'กรุณาเลือกนักเรียน' };
      const list = attendance
        .filter(a => a.student_id === params.student_id)
        .sort((a, b) => a.date.localeCompare(b.date));
      const summary = _attendanceSummary_(list);
      return { status:'success', data:list, summary:summary };
    }

    if (mode === 'class') {
      if (!params.classroom) return { status:'error', message:'กรุณาเลือกชั้นเรียน' };
      const classStudents = students.filter(s => String(s.classroom) === String(params.classroom));
      const ids = new Set(classStudents.map(s => s.id));
      const list = attendance.filter(a => ids.has(a.student_id));

      const perStudent = classStudents.map(s => {
        const stu = list.filter(a => a.student_id === s.id);
        return Object.assign(
          { student_id: s.id, student_code: s.student_id, prefix: s.prefix,
            first_name: s.first_name, last_name: s.last_name },
          _attendanceSummary_(stu)
        );
      });
      const total = _attendanceSummary_(list);
      return { status:'success', data:perStudent, summary:total };
    }

    if (mode === 'monthly') {
      if (!params.classroom || !params.year || !params.month) {
        return { status:'error', message:'ข้อมูลไม่ครบ' };
      }
      const classStudents = students
        .filter(s => String(s.classroom) === String(params.classroom))
        .sort((a, b) => String(a.first_name || '').localeCompare(String(b.first_name || ''), 'th'));
      const ids = new Set(classStudents.map(s => s.id));
      const ymPref = params.year + '-' + String(params.month).padStart(2, '0');
      const list = attendance.filter(a => ids.has(a.student_id) && a.date.startsWith(ymPref));
      const grid = classStudents.map(s => ({
        student_id: s.id, student_code: s.student_id,
        prefix: s.prefix, first_name: s.first_name, last_name: s.last_name,
        records: list.filter(a => a.student_id === s.id)
      }));
      return { status:'success', data:grid, year:params.year, month:params.month };
    }

    return { status:'error', message:'mode ไม่ถูกต้อง' };

  } catch (e) {
    logError({ fn:'getAttendanceReport', error:e.message });
    return { status:'error', message:e.message };
  }
}

function _attendanceSummary_(records) {
  const sum = { present:0, absent:0, leave:0, late:0, total: records.length };
  records.forEach(r => { if (sum.hasOwnProperty(r.status)) sum[r.status]++; });
  sum.attendance_pct = records.length > 0
    ? Math.round(((sum.present + sum.late) / records.length) * 1000) / 10
    : 0;
  return sum;
}


/* ============================================================
 *  Master Data — สำหรับ Dropdown
 * ============================================================ */
function getClassrooms(sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const all = readJsonSheet_('Students');
    const list = Array.from(new Set(all.map(s => s.classroom).filter(Boolean))).sort();
    return { status:'success', data:list };
  } catch (e) {
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  Export — Excel (CSV จริงๆ ส่ง client แล้วโหลดเป็น xls)
 * ============================================================ */
function exportData(sheetType, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    let headers = [], rows = [];

    if (sheetType === 'students') {
      headers = ['รหัสนักเรียน','คำนำหน้า','ชื่อ','นามสกุล','เลขบัตรประชาชน','ชั้น',
                 'ปีการศึกษา','เพศ','วันเกิด','ผู้ปกครอง','โทรผู้ปกครอง','สถานะ'];
      rows = readJsonSheet_('Students').map(s => [
        s.student_id, s.prefix, s.first_name, s.last_name, s.national_id,
        s.classroom, s.academic_year, s.gender, s.birth_date,
        s.parent_name, s.parent_phone, s.status
      ]);
    } else if (sheetType === 'personnel') {
      headers = ['รหัสบุคลากร','คำนำหน้า','ชื่อ','นามสกุล','เลขบัตร','ตำแหน่ง',
                 'ฝ่าย/กลุ่มสาระ','ประเภท','วิทยฐานะ','โทรศัพท์','อีเมล','สถานะ'];
      rows = readJsonSheet_('Personnel').map(p => [
        p.personnel_id, p.prefix, p.first_name, p.last_name, p.national_id,
        p.position, p.department, p.type, p.academic_level,
        p.phone, p.email, p.status
      ]);
    } else if (sheetType === 'attendance') {
      const students = readJsonSheet_('Students');
      const map = {};
      students.forEach(s => map[s.id] = s);
      headers = ['วันที่','รหัสนักเรียน','ชื่อ-นามสกุล','ชั้น','สถานะ','ประเภทลา','หมายเหตุ'];
      rows = readJsonSheet_('Attendance').map(a => {
        const s = map[a.student_id] || {};
        return [
          a.date, s.student_id || '',
          [s.prefix, s.first_name, s.last_name].filter(Boolean).join(' '),
          s.classroom || '', a.status, a.leave_type, a.note
        ];
      });
    } else {
      return { status:'error', message:'sheetType ไม่ถูกต้อง' };
    }

    return { status:'success', headers:headers, rows:rows };

  } catch (e) {
    logError({ fn:'exportData', error:e.message });
    return { status:'error', message:e.message };
  }
}

/* ============================================================
 *  END Part 2 Backend
 * ============================================================ */


/* ==========================================================
 *  Part 3 — Academic | Finance | Documents | Approvals | Registration
 ============================================================ */

/* ============================================================
 *  ACADEMIC — Subjects
 * ============================================================ */
function getSubjects(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Academic').filter(x => x._kind === 'subject');
    params = params || {};

    let filtered = all.slice();

    // ครู → เห็นเฉพาะวิชาที่ตนเองรับผิดชอบ
    if (auth.role === 'teacher') {
      const ownP = readJsonSheet_('Personnel').find(p =>
        String(p.personnel_id || '').toLowerCase() === String(auth.user.username).toLowerCase()
      );
      filtered = ownP ? filtered.filter(s => s.teacher_id === ownP.id) : [];
    }

    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(s => {
        const blob = [s.subject_code, s.subject_name, s.subject_group, s.grade_level]
          .filter(Boolean).join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (params.subject_group) filtered = filtered.filter(s => s.subject_group === params.subject_group);
    if (params.grade_level)   filtered = filtered.filter(s => s.grade_level === params.grade_level);
    if (params.academic_year) filtered = filtered.filter(s => String(s.academic_year) === String(params.academic_year));
    if (params.semester)      filtered = filtered.filter(s => String(s.semester) === String(params.semester));

    filtered.sort((a, b) => String(a.subject_code || '').localeCompare(String(b.subject_code || '')));

    const personnel = readJsonSheet_('Personnel');
    const persMap = {};
    personnel.forEach(p => persMap[p.id] = p);
    filtered = filtered.map(s => {
      const t = persMap[s.teacher_id];
      return Object.assign({}, s, {
        teacher_name: t ? ((t.prefix||'') + (t.first_name||'') + ' ' + (t.last_name||'')) : '-'
      });
    });

    const distinct = {
      groups: ['ภาษาไทย','คณิตศาสตร์','วิทยาศาสตร์','สังคมศึกษาฯ','สุขศึกษาและพลศึกษา','ศิลปะ','การงานอาชีพ','ภาษาต่างประเทศ'],
      grades: Array.from(new Set(all.map(s => s.grade_level).filter(Boolean))).sort()
    };

    const paged = _paginate_(filtered, params.page, params.per_page);
    paged.distinct = distinct;
    paged.status = 'success';
    return paged;

  } catch (e) {
    logError({ fn:'getSubjects', error:e.message });
    return { status:'error', message:e.message };
  }
}

function getSubjectById(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const all = readJsonSheet_('Academic').filter(x => x._kind === 'subject');
    const s = all.find(x => x.id === id);
    return s ? { status:'success', data:s } : { status:'error', message:'ไม่พบรายวิชา' };
  } catch (e) {
    return { status:'error', message:e.message };
  }
}

function saveSubject(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    if (!data || !data.subject_name) return { status:'error', message:'กรุณากรอกชื่อวิชา' };

    const clean = {
      _kind         : 'subject',
      subject_code  : sanitize(data.subject_code),
      subject_name  : sanitize(data.subject_name),
      subject_group : sanitize(data.subject_group),
      subject_type  : data.subject_type || 'basic',
      credit        : Number(data.credit) || 0,
      hours_per_week: Number(data.hours_per_week) || 0,
      grade_level   : sanitize(data.grade_level),
      semester      : String(data.semester || '1'),
      academic_year : sanitize(data.academic_year) || getConfig().academic_year,
      teacher_id    : data.teacher_id || '',
      midterm_weight: Number(data.midterm_weight) || 70,
      final_weight  : Number(data.final_weight) || 30
    };

    const arr = readJsonSheet_('Academic');
    if (data.id) {
      let updated = null;
      const found = updateJsonById_('Academic', data.id, s => {
        Object.assign(s, clean);
        s.updated_at = new Date().toISOString();
        updated = s;
        return s;
      });
      if (!found) return { status:'error', message:'ไม่พบรายวิชาที่จะแก้ไข' };
      return { status:'success', data:updated, message:'แก้ไขรายวิชาสำเร็จ' };
    } else {
      const now = new Date().toISOString();
      const obj = Object.assign({ id: generateId() }, clean, { created_at: now, updated_at: now });
      appendJsonRow_('Academic', obj);
      return { status:'success', data:obj, message:'เพิ่มรายวิชาสำเร็จ' };
    }
  } catch (e) {
    logError({ fn:'saveSubject', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteSubject(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('delete')) return { status:'error', message:'no_permission' };

    // ลบ grade ที่อ้างถึงด้วย
    const all = readJsonSheet_('Academic');
    const next = all.filter(x => x.id !== id && x.subject_id !== id);
    writeJsonSheet_('Academic', next);
    return { status:'success', message:'ลบรายวิชาสำเร็จ' };
  } catch (e) {
    logError({ fn:'deleteSubject', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  ACADEMIC — Grades (ปพ.5 บันทึกคะแนน)
 * ============================================================ */

/**
 * ดึงตาราง ปพ.5 ของรายวิชา → คืน students ในห้องที่เปิดวิชานี้ + คะแนนเดิม
 */
function getGradeSheet(subjectId, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const subject = readJsonSheet_('Academic')
      .filter(x => x._kind === 'subject').find(x => x.id === subjectId);
    if (!subject) return { status:'error', message:'ไม่พบรายวิชา' };

    const students = readJsonSheet_('Students')
      .filter(s => s.classroom === subject.grade_level && s.status === 'active')
      .sort((a, b) => String(a.first_name || '').localeCompare(String(b.first_name || ''), 'th'));

    const grades = readJsonSheet_('Academic').filter(x =>
      x._kind === 'grade' && x.subject_id === subjectId &&
      String(x.academic_year) === String(subject.academic_year) &&
      String(x.semester) === String(subject.semester)
    );

    const rows = students.map(s => {
      const g = grades.find(g => g.student_id === s.id) || {};
      return {
        grade_id      : g.id || null,
        student_id    : s.id,
        student_code  : s.student_id,
        prefix        : s.prefix,
        first_name    : s.first_name,
        last_name     : s.last_name,
        photo         : s.photo,
        score_midterm : g.score_midterm == null ? '' : g.score_midterm,
        score_final   : g.score_final   == null ? '' : g.score_final,
        attendance_hours: g.attendance_hours == null ? '' : g.attendance_hours,
        total_hours   : g.total_hours   == null ? '' : g.total_hours,
        character_result: g.character_result || '',
        reading_result: g.reading_result || '',
        activity_result: g.activity_result || '',
        grade_special : g.grade_special || ''
      };
    });

    return { status:'success', subject:subject, data:rows };

  } catch (e) {
    logError({ fn:'getGradeSheet', error:e.message });
    return { status:'error', message:e.message };
  }
}

/**
 * บันทึกคะแนน ปพ.5 แบบ Bulk
 */
function saveGradeBulk(subjectId, records, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    const subject = readJsonSheet_('Academic')
      .filter(x => x._kind === 'subject').find(x => x.id === subjectId);
    if (!subject) return { status:'error', message:'ไม่พบรายวิชา' };

    const config = getConfig();
    const thresholds = config.grade_thresholds;
    const minAttPct = Number(config.min_attendance_pct) || 80;

    const all = readJsonSheet_('Academic');
    // ลบ grade เดิมของวิชา/เทอม/ปีเดียวกัน
    const others = all.filter(x => !(
      x._kind === 'grade' &&
      x.subject_id === subjectId &&
      String(x.academic_year) === String(subject.academic_year) &&
      String(x.semester) === String(subject.semester)
    ));

    const now = new Date().toISOString();
    const recordedBy = auth.user.id;

    const inserted = (records || [])
      .filter(r => r.student_id && (r.score_midterm !== '' || r.score_final !== '' || r.grade_special))
      .map(r => {
        const sm = (r.score_midterm === '' || r.score_midterm == null) ? null : Number(r.score_midterm);
        const sf = (r.score_final   === '' || r.score_final   == null) ? null : Number(r.score_final);

        let total = null;
        if (sm !== null && sf !== null) total = sm + sf;
        else if (sm !== null) total = sm;
        else if (sf !== null) total = sf;

        const attH = (r.attendance_hours === '' || r.attendance_hours == null) ? null : Number(r.attendance_hours);
        const totH = (r.total_hours === '' || r.total_hours == null) ? null : Number(r.total_hours);
        const attPct = (totH && attH != null) ? Math.round((attH / totH) * 1000) / 10 : null;

        // คำนวณระดับผล
        let grade_level = null;
        let grade_special = r.grade_special || null;
        if (!grade_special) {
          if (attPct != null && attPct < minAttPct) {
            grade_special = 'มส';
          } else if (total != null) {
            grade_level = calculateGradeLevel(total, 100, thresholds);
          }
        }

        return {
          id            : r.grade_id || generateId(),
          _kind         : 'grade',
          student_id    : r.student_id,
          subject_id    : subjectId,
          academic_year : subject.academic_year,
          semester      : subject.semester,
          score_midterm : sm,
          score_final   : sf,
          score_total   : total,
          max_score     : 100,
          midterm_weight: subject.midterm_weight,
          final_weight  : subject.final_weight,
          grade_level   : grade_level,
          grade_special : grade_special,
          attendance_hours: attH,
          total_hours   : totH,
          attendance_pct: attPct,
          character_result: r.character_result || '',
          reading_result: r.reading_result || '',
          activity_result: r.activity_result || '',
          recorded_by   : recordedBy,
          created_at    : now,
          updated_at    : now
        };
      });

    writeJsonSheet_('Academic', others.concat(inserted));

    return {
      status:'success',
      message:'บันทึก ปพ.5 สำเร็จ ' + inserted.length + ' รายการ',
      count: inserted.length
    };

  } catch (e) {
    logError({ fn:'saveGradeBulk', error:e.message });
    return { status:'error', message:e.message };
  }
}

function calculateGradeLevel(score, maxScore, thresholds) {
  const pct = (Number(score) / Number(maxScore || 100)) * 100;
  const defaultT = [
    {min:80,grade:4},{min:75,grade:3.5},{min:70,grade:3},
    {min:65,grade:2.5},{min:60,grade:2},{min:55,grade:1.5},
    {min:50,grade:1},{min:0,grade:0}
  ];
  const t = (thresholds && thresholds.length) ? thresholds : defaultT;
  for (const row of t) {
    if (pct >= Number(row.min)) return Number(row.grade);
  }
  return 0;
}

/**
 * คำนวณ GPA นักเรียน
 */
function calculateGPA(studentId, academicYear, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Academic');
    const subjects = all.filter(x => x._kind === 'subject');
    const grades   = all.filter(x => x._kind === 'grade' && x.student_id === studentId);
    const subMap = {};
    subjects.forEach(s => subMap[s.id] = s);

    let yearGrades = grades;
    if (academicYear) yearGrades = grades.filter(g => String(g.academic_year) === String(academicYear));

    let sumPoints = 0, sumCredits = 0;
    const details = [];
    yearGrades.forEach(g => {
      const s = subMap[g.subject_id];
      if (!s) return;
      const credit = Number(s.credit) || 0;
      if (g.grade_level != null && credit > 0) {
        sumPoints  += g.grade_level * credit;
        sumCredits += credit;
      }
      details.push({
        subject_code: s.subject_code,
        subject_name: s.subject_name,
        credit      : credit,
        score_total : g.score_total,
        grade_level : g.grade_level,
        grade_special: g.grade_special,
        attendance_pct: g.attendance_pct,
        semester    : g.semester,
        academic_year: g.academic_year
      });
    });

    const gpa = sumCredits > 0 ? Math.round((sumPoints / sumCredits) * 100) / 100 : 0;

    return {
      status: 'success',
      gpa: gpa,
      total_credits: sumCredits,
      details: details
    };

  } catch (e) {
    logError({ fn:'calculateGPA', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  ACADEMIC — Print Documents
 * ============================================================ */

/**
 * สร้าง HTML ปพ.5 — สำหรับเปิดในหน้าต่างใหม่แล้ว print
 */
function generatePP5HTML(subjectId, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const config = getConfig();
    const subject = readJsonSheet_('Academic')
      .filter(x => x._kind === 'subject').find(x => x.id === subjectId);
    if (!subject) return { status:'error', message:'ไม่พบรายวิชา' };

    const sheet = getGradeSheet(subjectId, sessionToken);
    if (sheet.status !== 'success') return sheet;

    const personnel = readJsonSheet_('Personnel');
    const teacher = personnel.find(p => p.id === subject.teacher_id) || {};

    const html = renderPP5Template_(config, subject, teacher, sheet.data);
    return { status:'success', html: html };

  } catch (e) {
    logError({ fn:'generatePP5HTML', error:e.message });
    return { status:'error', message:e.message };
  }
}

function renderPP5Template_(config, subject, teacher, rows) {
  const teacherName = teacher.id ? ((teacher.prefix||'') + (teacher.first_name||'') + ' ' + (teacher.last_name||'')) : '...........................';
  const grade = (g, special) => {
    if (special) return special;
    if (g == null) return '-';
    return Number(g).toFixed(g % 1 ? 1 : 0);
  };

  const tableRows = rows.map((r, i) => {
    const m = (r.score_midterm === '' || r.score_midterm == null) ? '' : Number(r.score_midterm);
    const f = (r.score_final   === '' || r.score_final   == null) ? '' : Number(r.score_final);
    const t = (m !== '' && f !== '') ? (Number(m) + Number(f))
              : (m !== '' ? m : (f !== '' ? f : ''));
    const pct = (r.attendance_hours !== '' && r.total_hours !== '' && r.total_hours)
      ? Math.round((r.attendance_hours / r.total_hours) * 1000) / 10 : '';
    const gradeLv = (t !== '') ? calculateGradeLevel(t, 100, config.grade_thresholds) : null;
    return `
      <tr>
        <td class="t-center">${i+1}</td>
        <td class="t-center">${r.student_code || ''}</td>
        <td>${escapeHTMLServer_((r.prefix||'') + (r.first_name||'') + ' ' + (r.last_name||''))}</td>
        <td class="t-center">${m}</td>
        <td class="t-center">${f}</td>
        <td class="t-center">${t}</td>
        <td class="t-center">${pct !== '' ? pct + '%' : ''}</td>
        <td class="t-center"><b>${grade(gradeLv, r.grade_special)}</b></td>
      </tr>`;
  }).join('');

  return `
<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><title>ปพ.5 ${escapeHTMLServer_(subject.subject_code)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 1.2cm; }
  body { font-family: 'Sarabun', sans-serif; font-size: 12px; color: #000; }
  h1 { text-align: center; font-size: 16px; margin: 0 0 4px; }
  .sub { text-align: center; font-size: 13px; margin-bottom: 14px; font-weight: 600; }
  .school { text-align: center; font-size: 14px; font-weight: 700; margin-bottom: 2px; }
  .info-table { width: 100%; margin-bottom: 12px; border-collapse: collapse; }
  .info-table td { padding: 3px 6px; font-size: 12px; }
  .info-table .lbl { color: #555; width: 100px; }
  .grade-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  .grade-table th, .grade-table td {
    border: 1px solid #333; padding: 4px 6px; font-size: 11px;
  }
  .grade-table th { background: #f0f0f0; text-align: center; font-weight: 600; }
  .t-center { text-align: center; }
  .signature-row {
    display: flex; justify-content: space-around;
    margin-top: 40px; font-size: 12px; text-align: center;
  }
  .signature-row .sig img { max-height: 50px; margin-bottom: 4px; }
  .sig-line {
    border-bottom: 1px dotted #000;
    width: 200px; margin: 0 auto 4px; padding-bottom: 30px;
  }
  @media print { .no-print { display: none; } }
  .no-print {
    position: fixed; top: 10px; right: 10px;
    background: #1E40AF; color: white; padding: 10px 16px;
    border-radius: 8px; cursor: pointer; border: none; font-family: inherit;
    font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,.2);
  }
</style></head><body>

<button class="no-print" onclick="window.print()">พิมพ์</button>

<div class="school">${escapeHTMLServer_(config.school_name || 'โรงเรียน...')}</div>
<h1>แบบบันทึกผลการเรียน (ปพ.5)</h1>
<div class="sub">รายวิชา ${escapeHTMLServer_(subject.subject_code || '')} ${escapeHTMLServer_(subject.subject_name || '')}</div>

<table class="info-table">
  <tr>
    <td class="lbl">กลุ่มสาระฯ:</td>
    <td>${escapeHTMLServer_(subject.subject_group || '-')}</td>
    <td class="lbl">หน่วยกิต:</td>
    <td>${subject.credit || 0} หน่วยกิต</td>
    <td class="lbl">ชั่วโมง/สัปดาห์:</td>
    <td>${subject.hours_per_week || 0} ชม.</td>
  </tr>
  <tr>
    <td class="lbl">ชั้น:</td>
    <td>${escapeHTMLServer_(subject.grade_level || '-')}</td>
    <td class="lbl">ภาคเรียน:</td>
    <td>${escapeHTMLServer_(subject.semester || '-')}</td>
    <td class="lbl">ปีการศึกษา:</td>
    <td>${escapeHTMLServer_(subject.academic_year || '-')}</td>
  </tr>
  <tr>
    <td class="lbl">ครูผู้สอน:</td>
    <td colspan="5">${escapeHTMLServer_(teacherName)}</td>
  </tr>
</table>

<table class="grade-table">
  <thead>
    <tr>
      <th style="width:40px;">ที่</th>
      <th style="width:80px;">รหัส</th>
      <th>ชื่อ-นามสกุล</th>
      <th style="width:75px;">ระหว่างภาค<br>(${subject.midterm_weight || 70})</th>
      <th style="width:65px;">ปลายภาค<br>(${subject.final_weight || 30})</th>
      <th style="width:50px;">รวม</th>
      <th style="width:60px;">เวลาเรียน</th>
      <th style="width:55px;">ผลการเรียน</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>

<div class="signature-row">
  <div class="sig">
    <div class="sig-line">${teacher.signature ? `<img src="${escapeHTMLServer_(teacher.signature)}" alt="signature">` : ''}</div>
    <div>(${escapeHTMLServer_(teacherName)})</div>
    <div>ครูผู้สอน</div>
  </div>
  <div class="sig">
    <div class="sig-line"></div>
    <div>(.............................................)</div>
    <div>หัวหน้ากลุ่มสาระฯ</div>
  </div>
  <div class="sig">
    <div class="sig-line"></div>
    <div>(.............................................)</div>
    <div>ผู้อำนวยการโรงเรียน</div>
  </div>
</div>

</body></html>`;
}

/**
 * สร้าง HTML ปพ.6 — สมุดพก รายนักเรียน
 */
function generatePP6HTML(studentId, semester, academicYear, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const config  = getConfig();
    const student = readJsonSheet_('Students').find(s => s.id === studentId);
    if (!student) return { status:'error', message:'ไม่พบนักเรียน' };

    const all = readJsonSheet_('Academic');
    const subjects = all.filter(x => x._kind === 'subject');
    const subMap = {};
    subjects.forEach(s => subMap[s.id] = s);

    let grades = all.filter(x =>
      x._kind === 'grade' && x.student_id === studentId
    );
    if (semester)     grades = grades.filter(g => String(g.semester) === String(semester));
    if (academicYear) grades = grades.filter(g => String(g.academic_year) === String(academicYear));

    const html = renderPP6Template_(config, student, grades, subMap);
    return { status:'success', html: html };

  } catch (e) {
    logError({ fn:'generatePP6HTML', error:e.message });
    return { status:'error', message:e.message };
  }
}

function renderPP6Template_(config, student, grades, subMap) {
  let sumPoints = 0, sumCredits = 0;

  const rows = grades.map(g => {
    const s = subMap[g.subject_id] || {};
    if (g.grade_level != null && s.credit) {
      sumPoints  += g.grade_level * s.credit;
      sumCredits += s.credit;
    }
    return `
      <tr>
        <td>${escapeHTMLServer_(s.subject_code || '')}</td>
        <td>${escapeHTMLServer_(s.subject_name || '')}</td>
        <td class="t-center">${s.credit || 0}</td>
        <td class="t-center">${g.score_total != null ? g.score_total : '-'}</td>
        <td class="t-center"><b>${g.grade_special || (g.grade_level != null ? g.grade_level : '-')}</b></td>
        <td class="t-center">${g.attendance_pct != null ? g.attendance_pct + '%' : '-'}</td>
      </tr>`;
  }).join('');

  const gpa = sumCredits > 0 ? (sumPoints / sumCredits).toFixed(2) : '-';

  return `
<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><title>ปพ.6 ${escapeHTMLServer_(student.student_id)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 1.5cm; }
  body { font-family: 'Sarabun', sans-serif; font-size: 13px; }
  .cover {
    text-align: center; border: 3px double #1E40AF; padding: 30px; margin-bottom: 20px;
    border-radius: 8px;
  }
  .cover h1 { color: #1E40AF; margin: 0 0 8px; }
  .cover .school { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
  .photo {
    width: 100px; height: 120px; margin: 12px auto;
    border: 2px solid #ddd; background-size: cover; background-position: center;
    background-color: #f5f5f5;
  }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { border: 1px solid #333; padding: 5px 8px; font-size: 12px; }
  th { background: #1E40AF; color: white; }
  .t-center { text-align: center; }
  .gpa-box {
    background: #EFF6FF; border: 2px solid #3B82F6; padding: 16px;
    border-radius: 8px; text-align: center; margin-top: 20px;
  }
  .gpa-box .lbl { font-size: 14px; color: #555; }
  .gpa-box .val { font-size: 32px; font-weight: 700; color: #1E40AF; }
  @media print { .no-print { display: none; } }
  .no-print {
    position: fixed; top: 10px; right: 10px;
    background: #1E40AF; color: white; padding: 10px 16px;
    border-radius: 8px; cursor: pointer; border: none;
    font-family: inherit; font-weight: 600;
  }
  h2 { color: #1E40AF; font-size: 16px; border-bottom: 2px solid #3B82F6; padding-bottom: 4px; }
</style></head><body>

<button class="no-print" onclick="window.print()">พิมพ์</button>

<div class="cover">
  <div class="school">${escapeHTMLServer_(config.school_name || 'โรงเรียน...')}</div>
  <h1>สมุดบันทึกผลการเรียน (ปพ.6)</h1>
  ${student.photo ? `<div class="photo" style="background-image:url('${escapeHTMLServer_(student.photo)}');"></div>` : `<div class="photo"></div>`}
  <div style="font-size:16px; font-weight:700;">
    ${escapeHTMLServer_((student.prefix||'') + (student.first_name||'') + ' ' + (student.last_name||''))}
  </div>
  <div style="margin-top:6px;">รหัสนักเรียน: ${escapeHTMLServer_(student.student_id || '')}</div>
  <div>ชั้น ${escapeHTMLServer_(student.classroom || '-')} · ปีการศึกษา ${escapeHTMLServer_(student.academic_year || '-')}</div>
</div>

<h2>ผลการเรียนรายวิชา</h2>
<table>
  <thead>
    <tr>
      <th style="width:80px;">รหัสวิชา</th>
      <th>ชื่อรายวิชา</th>
      <th style="width:60px;">หน่วยกิต</th>
      <th style="width:60px;">คะแนน</th>
      <th style="width:60px;">เกรด</th>
      <th style="width:80px;">เวลาเรียน</th>
    </tr>
  </thead>
  <tbody>${rows || `<tr><td colspan="6" class="t-center" style="padding:20px;">ยังไม่มีข้อมูลผลการเรียน</td></tr>`}</tbody>
</table>

<div class="gpa-box">
  <div class="lbl">เกรดเฉลี่ยสะสม (GPA)</div>
  <div class="val">${gpa}</div>
  <div style="font-size:12px;color:#666;">หน่วยกิตรวม ${sumCredits} หน่วยกิต</div>
</div>

</body></html>`;
}


/* ============================================================
 *  FINANCE
 * ============================================================ */
function getTransactions(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Finance');
    params = params || {};

    let filtered = all.slice();
    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(f => {
        const blob = [f.receipt_number, f.transaction_id, f.description, f.category]
          .filter(Boolean).join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (params.type)     filtered = filtered.filter(f => f.type === params.type);
    if (params.category) filtered = filtered.filter(f => f.category === params.category);
    if (params.start)    filtered = filtered.filter(f => f.date >= params.start);
    if (params.end)      filtered = filtered.filter(f => f.date <= params.end);

    filtered.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    const paged = _paginate_(filtered, params.page, params.per_page);
    paged.distinct = {
      categories_income : ['ค่าเทอม','ค่าบำรุง','ค่ากิจกรรม','เงินบริจาค','อื่นๆ'],
      categories_expense: ['ค่าวัสดุ','ค่าน้ำค่าไฟ','ค่าจ้าง','ค่าซ่อมบำรุง','อื่นๆ']
    };
    paged.status = 'success';
    return paged;

  } catch (e) {
    logError({ fn:'getTransactions', error:e.message });
    return { status:'error', message:e.message };
  }
}

function saveTransaction(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    if (!data || !data.type || !data.amount) {
      return { status:'error', message:'กรุณากรอกประเภทและจำนวนเงิน' };
    }

    const clean = {
      type           : data.type,
      category       : sanitize(data.category),
      amount         : Number(data.amount),
      description    : sanitize(data.description),
      reference_id   : data.reference_id || '',
      payment_method : data.payment_method || 'cash',
      date           : data.date || new Date().toISOString().slice(0, 10),
      attachment     : data.attachment || ''
    };

    if (data.id) {
      let updated = null;
      const found = updateJsonById_('Finance', data.id, f => {
        Object.assign(f, clean);
        f.updated_at = new Date().toISOString();
        updated = f;
        return f;
      });
      if (!found) return { status:'error', message:'ไม่พบรายการ' };
      return { status:'success', data:updated, message:'แก้ไขรายการสำเร็จ' };
    } else {
      const now = new Date().toISOString();
      const obj = Object.assign({
        id            : generateId(),
        transaction_id: generateTransactionId(),
        receipt_number: data.type === 'income' ? generateReceiptNumber() : '',
        recorded_by   : auth.user.id
      }, clean, { created_at: now, updated_at: now });
      appendJsonRow_('Finance', obj);
      // LINE OA แจ้งเตือนรายรับ-รายจ่าย
      try { notifyFinance_(obj); } catch(_) {}
      return { status:'success', data:obj, message:'บันทึกรายการสำเร็จ' };
    }
  } catch (e) {
    logError({ fn:'saveTransaction', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteTransaction(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('delete')) return { status:'error', message:'no_permission' };
    const ok = deleteJsonById_('Finance', id);
    return ok ? { status:'success', message:'ลบสำเร็จ' } : { status:'error', message:'ไม่พบรายการ' };
  } catch (e) {
    logError({ fn:'deleteTransaction', error:e.message });
    return { status:'error', message:e.message };
  }
}

function getFinanceSummary(year, month, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Finance');
    let income = 0, expense = 0;
    const byCategory = { income: {}, expense: {} };
    const monthly = {};  // YYYY-MM => {income, expense}

    all.forEach(f => {
      if (year && (f.date || '').slice(0,4) !== String(year)) return;
      const amt = Number(f.amount) || 0;
      if (f.type === 'income')  { income += amt;  byCategory.income[f.category]  = (byCategory.income[f.category]  || 0) + amt; }
      if (f.type === 'expense') { expense += amt; byCategory.expense[f.category] = (byCategory.expense[f.category] || 0) + amt; }

      const ym = (f.date || '').slice(0, 7);
      if (ym) {
        if (!monthly[ym]) monthly[ym] = { income:0, expense:0 };
        if (f.type === 'income')  monthly[ym].income  += amt;
        if (f.type === 'expense') monthly[ym].expense += amt;
      }
    });

    return {
      status:'success',
      income: income, expense: expense, balance: income - expense,
      by_category: byCategory,
      monthly: monthly
    };

  } catch (e) {
    logError({ fn:'getFinanceSummary', error:e.message });
    return { status:'error', message:e.message };
  }
}

function generateTransactionId() {
  const all = readJsonSheet_('Finance');
  const next = all.length + 1;
  return 'TX' + new Date().getFullYear() + String(next).padStart(5, '0');
}
function generateReceiptNumber() {
  const all = readJsonSheet_('Finance').filter(f => f.receipt_number);
  const next = all.length + 1;
  return 'R' + new Date().getFullYear() + String(next).padStart(4, '0');
}

/**
 * สร้าง HTML ใบเสร็จ A4
 */
function generateReceiptHTML(transactionId, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const config = getConfig();
    const tx = readJsonSheet_('Finance').find(f => f.id === transactionId);
    if (!tx) return { status:'error', message:'ไม่พบรายการ' };

    let student = null;
    if (tx.reference_id) {
      student = readJsonSheet_('Students').find(s => s.id === tx.reference_id) || null;
    }

    const html = renderReceiptTemplate_(config, tx, student);
    return { status:'success', html: html };

  } catch (e) {
    logError({ fn:'generateReceiptHTML', error:e.message });
    return { status:'error', message:e.message };
  }
}

function renderReceiptTemplate_(config, tx, student) {
  const customerName = student
    ? ((student.prefix||'') + (student.first_name||'') + ' ' + (student.last_name||''))
    : (tx.description || '-');

  const amountWords = bahtText_(tx.amount);
  const dateText = formatThaiDateServer_(tx.date);

  return `
<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><title>ใบเสร็จ ${escapeHTMLServer_(tx.receipt_number || '')}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 1.5cm; }
  body { font-family: 'Sarabun', sans-serif; font-size: 14px; color: #000; max-width: 800px; margin: auto; }
  .receipt-box {
    border: 2px solid #1E40AF;
    padding: 24px; border-radius: 12px;
    position: relative; overflow: hidden;
  }
  .header { display: flex; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 2px dashed #1E40AF; margin-bottom: 14px; }
  .logo { width: 70px; height: 70px; }
  .logo img { width: 100%; }
  .school { flex: 1; }
  .school .name { font-size: 18px; font-weight: 700; color: #1E40AF; }
  .school .addr { font-size: 11px; color: #555; line-height: 1.4; }
  .receipt-title {
    text-align: right; padding-left: 16px;
  }
  .receipt-title h2 { margin: 0; color: #1E40AF; }
  .receipt-title .no { font-size: 13px; }
  .info-row { display: flex; gap: 30px; margin-bottom: 8px; font-size: 13px; }
  .info-row .lbl { color: #666; min-width: 80px; }
  .item-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .item-table th, .item-table td { padding: 10px; border-bottom: 1px solid #ddd; }
  .item-table th { background: #EFF6FF; color: #1E40AF; text-align: left; font-weight: 600; }
  .item-table td.amt { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-top: 8px; }
  .totals-table { width: 280px; }
  .totals-table td { padding: 6px 10px; }
  .totals-table .total {
    background: #1E40AF; color: white; font-weight: 700; font-size: 15px;
    border-radius: 6px;
  }
  .amount-words {
    text-align: center; padding: 10px; background: #F1F5F9;
    border-radius: 8px; margin-top: 16px;
    font-style: italic; color: #1E40AF; font-weight: 600;
  }
  .signature {
    display: flex; justify-content: space-around;
    margin-top: 50px; font-size: 12px; text-align: center;
  }
  .sig-line { border-bottom: 1px dotted #000; padding-bottom: 30px; width: 220px; margin: 0 auto 4px; }
  .watermark {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 80px; color: rgba(30,64,175,.04); pointer-events: none;
    font-weight: 900;
  }
  @media print { .no-print { display: none; } }
  .no-print {
    position: fixed; top: 10px; right: 10px;
    background: #1E40AF; color: white; padding: 10px 16px;
    border-radius: 8px; cursor: pointer; border: none;
    font-family: inherit; font-weight: 600;
  }
</style></head><body>

<button class="no-print" onclick="window.print()">พิมพ์</button>

<div class="receipt-box">
  <div class="watermark">RECEIPT</div>
  <div class="header">
    <div class="logo">${config.school_logo ? `<img src="${escapeHTMLServer_(config.school_logo)}">` : '<div style="width:70px;height:70px;background:#EFF6FF;border-radius:8px;"></div>'}</div>
    <div class="school">
      <div class="name">${escapeHTMLServer_(config.school_name || 'โรงเรียน...')}</div>
      <div class="addr">${escapeHTMLServer_(config.school_address || '')} ${escapeHTMLServer_(config.school_district || '')} ${escapeHTMLServer_(config.school_province || '')}<br>
      โทร. ${escapeHTMLServer_(config.school_phone || '-')}</div>
    </div>
    <div class="receipt-title">
      <h2>ใบเสร็จรับเงิน</h2>
      <div class="no">เลขที่ <b>${escapeHTMLServer_(tx.receipt_number || tx.transaction_id || '-')}</b></div>
      <div class="no">วันที่ ${dateText}</div>
    </div>
  </div>

  <div class="info-row"><span class="lbl">ได้รับจาก:</span> <b>${escapeHTMLServer_(customerName)}</b></div>
  ${student ? `<div class="info-row"><span class="lbl">รหัสนักเรียน:</span> ${escapeHTMLServer_(student.student_id || '-')} · ชั้น ${escapeHTMLServer_(student.classroom || '-')}</div>` : ''}
  <div class="info-row"><span class="lbl">วิธีชำระ:</span> ${({cash:'เงินสด',transfer:'โอนเงิน',cheque:'เช็ค'})[tx.payment_method] || tx.payment_method}</div>

  <table class="item-table">
    <thead>
      <tr><th>รายการ</th><th class="amt" style="width:140px;">จำนวนเงิน (บาท)</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <b>${escapeHTMLServer_(tx.category || '-')}</b>
          ${tx.description ? `<br><span style="color:#666;font-size:12px;">${escapeHTMLServer_(tx.description)}</span>` : ''}
        </td>
        <td class="amt">${Number(tx.amount).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr class="total">
        <td>รวมทั้งสิ้น</td>
        <td class="amt" style="text-align:right;">${Number(tx.amount).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} บาท</td>
      </tr>
    </table>
  </div>

  <div class="amount-words">( ${escapeHTMLServer_(amountWords)} )</div>

  <div class="signature">
    <div>
      <div class="sig-line"></div>
      <div>(.............................................)</div>
      <div>ผู้รับเงิน</div>
    </div>
    <div>
      <div class="sig-line"></div>
      <div>(.............................................)</div>
      <div>ผู้จ่ายเงิน</div>
    </div>
  </div>
</div>

</body></html>`;
}

/**
 * แปลงตัวเลขเป็นคำอ่านภาษาไทย
 */
function bahtText_(number) {
  number = Number(number);
  if (isNaN(number)) return 'ศูนย์บาทถ้วน';
  const txt = ['','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า','สิบ'];
  const pos = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
  function _readSegment(num) {
    let s = String(parseInt(num));
    let res = '';
    const len = s.length;
    for (let i = 0; i < len; i++) {
      const n = parseInt(s.charAt(i));
      const p = len - i - 1;
      if (n === 0) continue;
      if (p === 0 && n === 1 && len > 1) res += 'เอ็ด';
      else if (p === 1 && n === 2) res += 'ยี่';
      else if (p === 1 && n === 1) res += '';
      else res += txt[n];
      res += pos[p];
    }
    return res;
  }
  const split = String(number.toFixed(2)).split('.');
  let baht = parseInt(split[0]);
  const stang = parseInt(split[1]);
  let text = '';
  if (baht >= 1000000) {
    const m = Math.floor(baht / 1000000);
    text += _readSegment(m) + 'ล้าน';
    baht = baht % 1000000;
  }
  if (baht > 0) text += _readSegment(baht);
  text += 'บาท';
  if (stang > 0) text += _readSegment(stang) + 'สตางค์';
  else text += 'ถ้วน';
  return text;
}


/* ============================================================
 *  DOCUMENTS (สารบรรณ)
 * ============================================================ */
function getDocuments(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Documents');
    params = params || {};

    let filtered = all.slice();
    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(d => {
        const blob = [d.doc_number, d.subject, d.from, d.to, d.content]
          .filter(Boolean).join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (params.doc_type) filtered = filtered.filter(d => d.doc_type === params.doc_type);
    if (params.status)   filtered = filtered.filter(d => d.status === params.status);
    if (params.start)    filtered = filtered.filter(d => d.date >= params.start);
    if (params.end)      filtered = filtered.filter(d => d.date <= params.end);

    filtered.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

    const paged = _paginate_(filtered, params.page, params.per_page);
    paged.status = 'success';
    return paged;

  } catch (e) {
    logError({ fn:'getDocuments', error:e.message });
    return { status:'error', message:e.message };
  }
}

function saveDocument(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    if (!data || !data.subject || !data.doc_type) {
      return { status:'error', message:'กรุณากรอกประเภทและเรื่อง' };
    }

    const clean = {
      doc_type   : data.doc_type,
      subject    : sanitize(data.subject),
      from       : sanitize(data.from),
      to         : sanitize(data.to),
      date       : data.date || new Date().toISOString().slice(0, 10),
      content    : sanitize(data.content),
      attachment : data.attachment || '',
      status     : data.status || 'draft',
      priority   : data.priority || 'normal'
    };

    if (data.id) {
      let updated = null;
      const found = updateJsonById_('Documents', data.id, d => {
        Object.assign(d, clean);
        d.updated_at = new Date().toISOString();
        updated = d;
        return d;
      });
      if (!found) return { status:'error', message:'ไม่พบเอกสาร' };
      return { status:'success', data:updated, message:'แก้ไขเอกสารสำเร็จ' };
    } else {
      const now = new Date().toISOString();
      const obj = Object.assign({
        id        : generateId(),
        doc_number: generateDocNumber(data.doc_type),
        created_by: auth.user.id
      }, clean, { created_at: now, updated_at: now });
      appendJsonRow_('Documents', obj);
      return { status:'success', data:obj, message:'บันทึกเอกสารสำเร็จ' };
    }
  } catch (e) {
    logError({ fn:'saveDocument', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteDocument(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('delete')) return { status:'error', message:'no_permission' };
    const ok = deleteJsonById_('Documents', id);
    return ok ? { status:'success', message:'ลบสำเร็จ' } : { status:'error', message:'ไม่พบเอกสาร' };
  } catch (e) {
    return { status:'error', message:e.message };
  }
}

function generateDocNumber(docType) {
  const all = readJsonSheet_('Documents').filter(d => d.doc_type === docType);
  const next = all.length + 1;
  const year = (new Date().getFullYear() + 543);
  const prefix = ({
    receive : 'รับ',
    send    : 'ส่ง',
    order   : 'คำสั่ง',
    memo    : 'บันทึก',
    announce: 'ประกาศ',
    form    : 'แบบฟอร์ม'
  })[docType] || 'เอกสาร';
  return prefix + ' ' + String(next).padStart(3, '0') + '/' + year;
}


/* ============================================================
 *  APPROVALS
 * ============================================================ */
function getApprovals(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Approvals');
    params = params || {};

    let filtered = all.slice();
    // ถ้าไม่ใช่ admin → เห็นแค่ของตัวเอง
    if (auth.role !== 'admin' && !(auth.user.permissions || []).includes('approve')) {
      filtered = filtered.filter(a => a.requested_by === auth.user.id);
    }

    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(a => {
        const blob = [a.request_id, a.subject, a.detail].filter(Boolean).join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (params.type)   filtered = filtered.filter(a => a.type === params.type);
    if (params.status) filtered = filtered.filter(a => a.status === params.status);

    filtered.sort((a, b) => String(b.requested_at || '').localeCompare(String(a.requested_at || '')));

    // ผูกชื่อผู้ขอ
    const users = readJsonSheet_('Users');
    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    filtered = filtered.map(a => {
      const u = userMap[a.requested_by];
      const r = userMap[a.reviewed_by];
      return Object.assign({}, a, {
        requester_name: u ? (u.name || u.username) : '-',
        reviewer_name : r ? (r.name || r.username) : null
      });
    });

    const paged = _paginate_(filtered, params.page, params.per_page);
    paged.status = 'success';
    return paged;

  } catch (e) {
    logError({ fn:'getApprovals', error:e.message });
    return { status:'error', message:e.message };
  }
}

function saveApproval(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    if (!data || !data.type || !data.subject) {
      return { status:'error', message:'กรุณากรอกประเภทและเรื่อง' };
    }
    const clean = {
      type         : data.type,
      subject      : sanitize(data.subject),
      detail       : sanitize(data.detail),
      amount       : Number(data.amount) || 0,
      requested_by : auth.user.id,
      requested_at : new Date().toISOString(),
      status       : 'pending',
      attachment   : data.attachment || ''
    };

    if (data.id) {
      // แก้ได้เฉพาะคนที่ขอ และยังไม่อนุมัติ
      const all = readJsonSheet_('Approvals');
      const cur = all.find(x => x.id === data.id);
      if (!cur) return { status:'error', message:'ไม่พบคำขอ' };
      if (cur.requested_by !== auth.user.id) return { status:'error', message:'แก้ไขได้เฉพาะของตัวเอง' };
      if (cur.status !== 'pending') return { status:'error', message:'คำขอนี้ผ่านการพิจารณาแล้ว' };
      let updated = null;
      updateJsonById_('Approvals', data.id, a => {
        Object.assign(a, clean);
        updated = a;
        return a;
      });
      return { status:'success', data:updated, message:'แก้ไขสำเร็จ' };
    } else {
      const obj = Object.assign({
        id        : generateId(),
        request_id: generateRequestId()
      }, clean);
      appendJsonRow_('Approvals', obj);
      // LINE OA แจ้งเตือนคำขออนุมัติใหม่
      try { notifyNewApproval_(obj); } catch(_) {}
      return { status:'success', data:obj, message:'ส่งคำขออนุมัติสำเร็จ' };
    }
  } catch (e) {
    logError({ fn:'saveApproval', error:e.message });
    return { status:'error', message:e.message };
  }
}

function reviewApproval(id, action, comment, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('approve')) return { status:'error', message:'ไม่มีสิทธิ์อนุมัติ' };
    if (action !== 'approve' && action !== 'reject') {
      return { status:'error', message:'action ไม่ถูกต้อง' };
    }

    let updated = null;
    const found = updateJsonById_('Approvals', id, a => {
      a.status = action === 'approve' ? 'approved' : 'rejected';
      a.reviewed_by = auth.user.id;
      a.reviewed_at = new Date().toISOString();
      a.comment = sanitize(comment);
      updated = a;
      return a;
    });
    if (!found) return { status:'error', message:'ไม่พบคำขอ' };
    return { status:'success', data:updated, message: action === 'approve' ? 'อนุมัติคำขอแล้ว' : 'ปฏิเสธคำขอแล้ว' };

  } catch (e) {
    logError({ fn:'reviewApproval', error:e.message });
    return { status:'error', message:e.message };
  }
}

function generateRequestId() {
  const all = readJsonSheet_('Approvals');
  const next = all.length + 1;
  const year = (new Date().getFullYear() + 543);
  return 'REQ' + year + '-' + String(next).padStart(4, '0');
}


/* ============================================================
 *  REGISTRATION
 * ============================================================ */
function getRegistrations(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Registration');
    params = params || {};

    let filtered = all.slice();
    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(r => {
        const blob = [
          r.application_id,
          (r.student_data && (r.student_data.first_name + ' ' + r.student_data.last_name)),
          r.grade_applying
        ].filter(Boolean).join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (params.status) filtered = filtered.filter(r => r.status === params.status);
    if (params.academic_year) filtered = filtered.filter(r => String(r.academic_year) === String(params.academic_year));

    filtered.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

    const paged = _paginate_(filtered, params.page, params.per_page);
    paged.status = 'success';
    return paged;

  } catch (e) {
    logError({ fn:'getRegistrations', error:e.message });
    return { status:'error', message:e.message };
  }
}

function saveRegistration(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    if (!data || !data.student_data || !data.student_data.first_name) {
      return { status:'error', message:'กรุณากรอกข้อมูลนักเรียน' };
    }

    const clean = {
      academic_year      : sanitize(data.academic_year) || getConfig().academic_year,
      grade_applying     : sanitize(data.grade_applying),
      student_data       : data.student_data,  // เก็บ object ทั้งก้อน
      documents_submitted: Array.isArray(data.documents_submitted) ? data.documents_submitted : [],
      status             : data.status || 'pending',
      note               : sanitize(data.note)
    };

    if (data.id) {
      let updated = null;
      const found = updateJsonById_('Registration', data.id, r => {
        Object.assign(r, clean);
        r.updated_at = new Date().toISOString();
        updated = r;
        return r;
      });
      if (!found) return { status:'error', message:'ไม่พบใบสมัคร' };
      return { status:'success', data:updated, message:'แก้ไขสำเร็จ' };
    } else {
      const now = new Date().toISOString();
      const obj = Object.assign({
        id            : generateId(),
        application_id: generateApplicationId()
      }, clean, { created_at: now, updated_at: now });
      appendJsonRow_('Registration', obj);
      return { status:'success', data:obj, message:'บันทึกใบสมัครสำเร็จ' };
    }
  } catch (e) {
    logError({ fn:'saveRegistration', error:e.message });
    return { status:'error', message:e.message };
  }
}

function approveRegistration(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('approve')) return { status:'error', message:'ไม่มีสิทธิ์อนุมัติ' };

    const all = readJsonSheet_('Registration');
    const reg = all.find(r => r.id === id);
    if (!reg) return { status:'error', message:'ไม่พบใบสมัคร' };
    if (reg.status === 'approved') return { status:'error', message:'อนุมัติแล้ว' };

    // สร้าง Student ใหม่จาก student_data
    const sd = reg.student_data || {};
    const now = new Date().toISOString();
    const newStudent = {
      id          : generateId(),
      student_id  : generateStudentId(),
      prefix      : sd.prefix || '',
      first_name  : sd.first_name || '',
      last_name   : sd.last_name || '',
      national_id : sd.national_id || '',
      birth_date  : sd.birth_date || null,
      gender      : sd.gender || '',
      blood_type  : sd.blood_type || '',
      nationality : sd.nationality || 'ไทย',
      religion    : sd.religion || 'พุทธ',
      photo       : sd.photo || '',
      classroom   : reg.grade_applying || '',
      academic_year: reg.academic_year,
      address     : sd.address || '',
      parent_name : sd.parent_name || '',
      parent_phone: sd.parent_phone || '',
      parent_relation: sd.parent_relation || '',
      status      : 'active',
      created_at  : now,
      updated_at  : now
    };
    appendJsonRow_('Students', newStudent);

    updateJsonById_('Registration', id, r => {
      r.status = 'approved';
      r.updated_at = now;
      r.student_id_created = newStudent.id;
      return r;
    });
    return { status:'success', message:'อนุมัติและสร้างข้อมูลนักเรียนแล้ว', student_id: newStudent.id };

  } catch (e) {
    logError({ fn:'approveRegistration', error:e.message });
    return { status:'error', message:e.message };
  }
}

function rejectRegistration(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('approve')) return { status:'error', message:'ไม่มีสิทธิ์' };
    const found = updateJsonById_('Registration', id, r => {
      r.status = 'rejected';
      r.updated_at = new Date().toISOString();
      return r;
    });
    return found ? { status:'success', message:'ปฏิเสธใบสมัครแล้ว' } : { status:'error', message:'ไม่พบ' };
  } catch (e) {
    logError({ fn:'rejectRegistration', error:e.message });
    return { status:'error', message:e.message };
  }
}

function generateApplicationId() {
  const all = readJsonSheet_('Registration');
  const next = all.length + 1;
  const year = (new Date().getFullYear() + 543);
  return 'APP' + year + '-' + String(next).padStart(4, '0');
}


/* ============================================================
 *  Master Data — Personnel as Teachers (สำหรับ dropdown)
 * ============================================================ */
function getTeachersForDropdown(sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const list = readJsonSheet_('Personnel')
      .filter(p => p.type === 'teacher' && p.status === 'active')
      .map(p => ({
        id: p.id,
        name: (p.prefix||'') + (p.first_name||'') + ' ' + (p.last_name||''),
        department: p.department
      }));
    return { status:'success', data:list };
  } catch (e) {
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  Server-side helpers
 * ============================================================ */
function escapeHTMLServer_(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function formatThaiDateServer_(d) {
  if (!d) return '-';
  const date = (d instanceof Date) ? d : new Date(d);
  if (isNaN(date.getTime())) return '-';
  const m = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
             'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  return date.getDate() + ' ' + m[date.getMonth()] + ' ' + (date.getFullYear() + 543);
}

/* ============================================================
 *  END Part 3 Backend
 * ============================================================ */


/* ==========================================================
 *  Part 4 — Reports | Calendar | Files | Users | Settings
 ============================================================ */

/* ============================================================
 *  REPORTS — สรุปรายงาน
 * ============================================================ */
function getReportsOverview(sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const students   = readJsonSheet_('Students');
    const personnel  = readJsonSheet_('Personnel');
    const attendance = readJsonSheet_('Attendance');
    const finance    = readJsonSheet_('Finance');
    const academic   = readJsonSheet_('Academic');
    const documents  = readJsonSheet_('Documents');
    const approvals  = readJsonSheet_('Approvals');
    const registrations = readJsonSheet_('Registration');

    // นักเรียน แบ่งตามชั้น
    const studentByGrade = {};
    students.filter(s => s.status === 'active').forEach(s => {
      const c = s.classroom || 'ไม่ระบุ';
      studentByGrade[c] = (studentByGrade[c] || 0) + 1;
    });

    // เพศ
    const studentGender = { male: 0, female: 0, other: 0 };
    students.filter(s => s.status === 'active').forEach(s => {
      if (s.gender === 'male')   studentGender.male++;
      else if (s.gender === 'female') studentGender.female++;
      else studentGender.other++;
    });

    // บุคลากร แบ่งตามฝ่าย
    const personnelByDept = {};
    personnel.filter(p => p.status === 'active').forEach(p => {
      const d = p.department || 'ไม่ระบุ';
      personnelByDept[d] = (personnelByDept[d] || 0) + 1;
    });

    // อัตราการเข้าเรียน 30 วันย้อนหลัง
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0,10);
      const list = attendance.filter(a => a.date === ds);
      const pct = list.length > 0
        ? Math.round((list.filter(a => a.status === 'present' || a.status === 'late').length / list.length) * 100)
        : null;
      last30.push({ date: ds, pct: pct });
    }

    // การเงินรายเดือน 12 เดือน
    const monthly = {};
    finance.forEach(f => {
      const ym = (f.date || '').slice(0, 7);
      if (!ym) return;
      if (!monthly[ym]) monthly[ym] = { income: 0, expense: 0 };
      const amt = Number(f.amount) || 0;
      if (f.type === 'income')  monthly[ym].income  += amt;
      if (f.type === 'expense') monthly[ym].expense += amt;
    });
    const monthlyArr = Object.keys(monthly).sort().slice(-12).map(ym => ({
      ym: ym, income: monthly[ym].income, expense: monthly[ym].expense
    }));

    return {
      status: 'success',
      data: {
        counts: {
          students_active : students.filter(s => s.status === 'active').length,
          students_total  : students.length,
          personnel_active: personnel.filter(p => p.status === 'active').length,
          personnel_total : personnel.length,
          subjects        : academic.filter(x => x._kind === 'subject').length,
          documents       : documents.length,
          approvals_pending: approvals.filter(a => a.status === 'pending').length,
          registrations_pending: registrations.filter(r => r.status === 'pending').length
        },
        student_by_grade : studentByGrade,
        student_gender   : studentGender,
        personnel_by_dept: personnelByDept,
        attendance_30days: last30,
        finance_monthly  : monthlyArr
      }
    };

  } catch (e) {
    logError({ fn:'getReportsOverview', error:e.message });
    return { status:'error', message:e.message };
  }
}

/**
 * Export รายงานหลายรูปแบบ
 */
function generateReport(reportType, params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    params = params || {};
    let headers = [], rows = [], title = '';

    if (reportType === 'students_by_grade') {
      title = 'นักเรียนแยกตามชั้น';
      const students = readJsonSheet_('Students').filter(s => s.status === 'active');
      if (params.classroom) {
        const filtered = students.filter(s => s.classroom === params.classroom);
        headers = ['รหัสนักเรียน','คำนำหน้า','ชื่อ','นามสกุล','เพศ','วันเกิด','ผู้ปกครอง','โทรศัพท์'];
        rows = filtered
          .sort((a,b) => String(a.first_name||'').localeCompare(String(b.first_name||''),'th'))
          .map(s => [s.student_id, s.prefix, s.first_name, s.last_name, s.gender==='male'?'ชาย':s.gender==='female'?'หญิง':'-',
                     s.birth_date ? formatThaiDateServer_(s.birth_date) : '', s.parent_name, s.parent_phone]);
      } else {
        // สรุปจำนวนแต่ละชั้น
        const byGrade = {};
        students.forEach(s => {
          const c = s.classroom || 'ไม่ระบุ';
          if (!byGrade[c]) byGrade[c] = { total: 0, male: 0, female: 0 };
          byGrade[c].total++;
          if (s.gender === 'male')   byGrade[c].male++;
          if (s.gender === 'female') byGrade[c].female++;
        });
        headers = ['ชั้น','ชาย','หญิง','รวม'];
        rows = Object.keys(byGrade).sort().map(c => [c, byGrade[c].male, byGrade[c].female, byGrade[c].total]);
        rows.push(['รวมทั้งสิ้น',
          rows.reduce((s,r) => s+r[1], 0),
          rows.reduce((s,r) => s+r[2], 0),
          rows.reduce((s,r) => s+r[3], 0)]);
      }

    } else if (reportType === 'attendance_summary') {
      title = 'สรุปการเข้าเรียน';
      const students = readJsonSheet_('Students').filter(s => s.status === 'active');
      const attendance = readJsonSheet_('Attendance');
      let filtered = attendance;
      if (params.start) filtered = filtered.filter(a => a.date >= params.start);
      if (params.end)   filtered = filtered.filter(a => a.date <= params.end);

      headers = ['รหัส','ชื่อ-นามสกุล','ชั้น','มา','ขาด','ลา','มาสาย','รวม','%เข้าเรียน'];
      let students_list = students;
      if (params.classroom) students_list = students.filter(s => s.classroom === params.classroom);

      rows = students_list
        .sort((a,b) => String(a.classroom||'').localeCompare(String(b.classroom||''))
                    || String(a.first_name||'').localeCompare(String(b.first_name||''),'th'))
        .map(s => {
          const arr = filtered.filter(a => a.student_id === s.id);
          const p = arr.filter(a => a.status === 'present').length;
          const x = arr.filter(a => a.status === 'absent').length;
          const l = arr.filter(a => a.status === 'leave').length;
          const lt = arr.filter(a => a.status === 'late').length;
          const total = arr.length;
          const pct = total > 0 ? Math.round(((p + lt) / total) * 1000) / 10 : 0;
          return [s.student_id, (s.prefix||'')+(s.first_name||'')+' '+(s.last_name||''),
                  s.classroom, p, x, l, lt, total, pct + '%'];
        });

    } else if (reportType === 'finance_summary') {
      title = 'สรุปการเงิน';
      const finance = readJsonSheet_('Finance');
      let filtered = finance;
      if (params.start) filtered = filtered.filter(f => f.date >= params.start);
      if (params.end)   filtered = filtered.filter(f => f.date <= params.end);

      headers = ['วันที่','เลขที่','ประเภท','หมวด','รายการ','วิธีชำระ','จำนวนเงิน'];
      rows = filtered.sort((a,b) => String(a.date).localeCompare(String(b.date)))
        .map(f => [
          formatThaiDateServer_(f.date),
          f.receipt_number || f.transaction_id,
          f.type === 'income' ? 'รายรับ' : 'รายจ่าย',
          f.category, f.description,
          ({cash:'เงินสด',transfer:'โอน',cheque:'เช็ค'})[f.payment_method] || f.payment_method,
          (f.type==='income' ? '+' : '-') + Number(f.amount).toLocaleString()
        ]);
      // สรุปท้าย
      const income  = filtered.filter(f => f.type === 'income').reduce((s,f) => s + Number(f.amount||0), 0);
      const expense = filtered.filter(f => f.type === 'expense').reduce((s,f) => s + Number(f.amount||0), 0);
      rows.push(['','','','','','รายรับรวม', income.toLocaleString()]);
      rows.push(['','','','','','รายจ่ายรวม', expense.toLocaleString()]);
      rows.push(['','','','','','คงเหลือสุทธิ', (income - expense).toLocaleString()]);

    } else if (reportType === 'gpa_by_grade') {
      title = 'GPA นักเรียนแยกตามชั้น';
      const students = readJsonSheet_('Students').filter(s => s.status === 'active');
      const all = readJsonSheet_('Academic');
      const subjects = all.filter(x => x._kind === 'subject');
      const grades   = all.filter(x => x._kind === 'grade');
      const subMap = {};
      subjects.forEach(s => subMap[s.id] = s);

      let students_list = students;
      if (params.classroom) students_list = students.filter(s => s.classroom === params.classroom);

      headers = ['รหัส','ชื่อ-นามสกุล','ชั้น','หน่วยกิตรวม','GPA'];
      rows = students_list
        .sort((a,b) => String(a.classroom||'').localeCompare(String(b.classroom||''))
                    || String(a.first_name||'').localeCompare(String(b.first_name||''),'th'))
        .map(s => {
          let yearGrades = grades.filter(g => g.student_id === s.id);
          if (params.academic_year) yearGrades = yearGrades.filter(g => String(g.academic_year) === String(params.academic_year));
          let sumPoints = 0, sumCredits = 0;
          yearGrades.forEach(g => {
            const sub = subMap[g.subject_id];
            if (!sub) return;
            const cr = Number(sub.credit) || 0;
            if (g.grade_level != null && cr > 0) {
              sumPoints  += g.grade_level * cr;
              sumCredits += cr;
            }
          });
          const gpa = sumCredits > 0 ? (sumPoints / sumCredits).toFixed(2) : '-';
          return [s.student_id, (s.prefix||'')+(s.first_name||'')+' '+(s.last_name||''),
                  s.classroom, sumCredits, gpa];
        });

    } else if (reportType === 'personnel_list') {
      title = 'รายชื่อบุคลากร';
      const personnel = readJsonSheet_('Personnel').filter(p => p.status === 'active');
      headers = ['รหัส','คำนำหน้า','ชื่อ-นามสกุล','ตำแหน่ง','ฝ่าย/กลุ่มสาระ','ประเภท','โทรศัพท์','อีเมล','วันเริ่มงาน'];
      rows = personnel
        .sort((a,b) => String(a.department||'').localeCompare(String(b.department||''),'th'))
        .map(p => [p.personnel_id, p.prefix, (p.first_name||'')+' '+(p.last_name||''),
                   p.position, p.department,
                   ({teacher:'ครู',support:'สนับสนุน',admin:'บริหาร'})[p.type] || p.type,
                   p.phone, p.email,
                   p.start_date ? formatThaiDateServer_(p.start_date) : '']);

    } else {
      return { status:'error', message:'รายงานไม่ถูกต้อง' };
    }

    return { status:'success', title:title, headers:headers, rows:rows };

  } catch (e) {
    logError({ fn:'generateReport', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  CALENDAR — ปฏิทินและข่าวสาร
 * ============================================================ */
function getCalendarEvents(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Calendar');
    params = params || {};

    let filtered = all.slice();
    if (params.search) {
      const q = String(params.search).toLowerCase();
      filtered = filtered.filter(e => {
        const blob = [e.title, e.description, e.location].filter(Boolean).join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (params.type)    filtered = filtered.filter(e => e.type === params.type);
    if (params.month) {
      const ym = params.year + '-' + String(params.month).padStart(2, '0');
      filtered = filtered.filter(e => {
        const startMonth = (e.start_date || '').slice(0,7);
        const endMonth   = (e.end_date || e.start_date || '').slice(0,7);
        return startMonth <= ym && ym <= endMonth;
      });
    }

    filtered.sort((a, b) => String(a.start_date || '').localeCompare(String(b.start_date || '')));

    return { status:'success', data:filtered };

  } catch (e) {
    logError({ fn:'getCalendarEvents', error:e.message });
    return { status:'error', message:e.message };
  }
}

function saveCalendarEvent(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    if (!data || !data.title || !data.start_date) {
      return { status:'error', message:'กรุณากรอกหัวข้อและวันที่' };
    }

    const clean = {
      title       : sanitize(data.title),
      description : sanitize(data.description),
      type        : data.type || 'general',
      start_date  : data.start_date,
      end_date    : data.end_date || data.start_date,
      start_time  : data.start_time || '',
      end_time    : data.end_time || '',
      location    : sanitize(data.location),
      is_holiday  : !!data.is_holiday,
      is_pinned   : !!data.is_pinned,
      attachment  : data.attachment || ''
    };

    if (data.id) {
      let updated = null;
      const found = updateJsonById_('Calendar', data.id, e => {
        Object.assign(e, clean);
        e.updated_at = new Date().toISOString();
        updated = e;
        return e;
      });
      if (!found) return { status:'error', message:'ไม่พบเหตุการณ์' };
      return { status:'success', data:updated, message:'แก้ไขสำเร็จ' };
    } else {
      const now = new Date().toISOString();
      const obj = Object.assign({
        id: generateId(),
        created_by: auth.user.id
      }, clean, { created_at: now, updated_at: now });
      appendJsonRow_('Calendar', obj);
      // LINE OA แจ้งเตือนประกาศ (เฉพาะที่ปักหมุด)
      if (obj.is_pinned) { try { notifyAnnouncement_(obj); } catch(_) {} }
      return { status:'success', data:obj, message:'เพิ่มเหตุการณ์สำเร็จ' };
    }
  } catch (e) {
    logError({ fn:'saveCalendarEvent', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteCalendarEvent(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('delete')) return { status:'error', message:'no_permission' };
    const ok = deleteJsonById_('Calendar', id);
    return ok ? { status:'success', message:'ลบสำเร็จ' } : { status:'error', message:'ไม่พบ' };
  } catch (e) {
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  FILES — คลังไฟล์ (browse Drive)
 * ============================================================ */
function getFilesList(category, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const config = getConfig();
    if (!config.folder_id) {
      return { status:'success', data:[], message:'ยังไม่มีโฟลเดอร์หลัก' };
    }

    const folder = DriveApp.getFolderById(config.folder_id);

    // ถ้ามี category → ดูใน subfolder นั้น
    let target = folder;
    if (category) {
      const it = folder.getFoldersByName(category);
      if (it.hasNext()) target = it.next();
      else return { status:'success', data:[] };
    }

    const files = [];
    const fileIter = target.getFiles();
    let count = 0;
    while (fileIter.hasNext() && count < 200) {
      const f = fileIter.next();
      const fileId = f.getId();
      files.push({
        id        : fileId,
        name      : f.getName(),
        size      : f.getSize(),
        mime_type : f.getMimeType(),
        created_at: f.getDateCreated().toISOString(),
        updated_at: f.getLastUpdated().toISOString(),
        view_url  : 'https://drive.google.com/uc?export=view&id=' + fileId,
        thumb_url : 'https://drive.google.com/thumbnail?id=' + fileId,
        download_url: 'https://drive.google.com/uc?export=download&id=' + fileId
      });
      count++;
    }

    // List subfolders (เฉพาะตอน root)
    const folders = [];
    if (!category) {
      const folderIter = folder.getFolders();
      while (folderIter.hasNext()) {
        const sf = folderIter.next();
        let fileCount = 0;
        const it2 = sf.getFiles();
        while (it2.hasNext()) { it2.next(); fileCount++; if (fileCount > 200) break; }
        folders.push({
          name: sf.getName(),
          file_count: fileCount,
          updated_at: sf.getLastUpdated().toISOString()
        });
      }
    }

    files.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));

    return { status:'success', folders: folders, data: files, category: category || '' };

  } catch (e) {
    logError({ fn:'getFilesList', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteFileById(fileId, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('delete')) return { status:'error', message:'no_permission' };

    DriveApp.getFileById(fileId).setTrashed(true);
    return { status:'success', message:'ลบไฟล์สำเร็จ' };
  } catch (e) {
    logError({ fn:'deleteFileById', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  USERS — จัดการผู้ใช้งาน (Admin Only)
 * ============================================================ */
function _requireAdmin_(token) {
  const v = validateSession(token);
  if (!v.valid) return { ok:false, response:{ status:'error', message:'session_invalid' } };
  if (v.role !== 'admin') return { ok:false, response:{ status:'error', message:'admin_only', code:403 } };
  return { ok:true, user:v.user };
}

function getUsers(params, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;

    params = params || {};
    let all = readJsonSheet_('Users').map(u => {
      const safe = Object.assign({}, u);
      delete safe.password;
      return safe;
    });

    if (params.search) {
      const q = String(params.search).toLowerCase();
      all = all.filter(u => {
        const blob = [u.username, u.name, u.email, u.department].filter(Boolean).join(' ').toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (params.role)   all = all.filter(u => u.role === params.role);
    if (params.active !== '' && params.active !== undefined && params.active !== null) {
      all = all.filter(u => String(u.active) === String(params.active));
    }

    all.sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')));

    const paged = _paginate_(all, params.page, params.per_page);
    paged.status = 'success';
    return paged;

  } catch (e) {
    logError({ fn:'getUsers', error:e.message });
    return { status:'error', message:e.message };
  }
}

function saveUser(data, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;
    if (!data || !data.username || !data.name || !data.role) {
      return { status:'error', message:'กรุณากรอกข้อมูลให้ครบ' };
    }
    if (!CONFIG.USER_ROLES[data.role]) {
      return { status:'error', message:'role ไม่ถูกต้อง' };
    }

    const all = readJsonSheet_('Users');
    const dup = all.find(u => u.username.toLowerCase() === String(data.username).toLowerCase() && u.id !== data.id);
    if (dup) return { status:'error', message:'ชื่อผู้ใช้นี้มีในระบบแล้ว' };

    const clean = {
      username   : sanitize(data.username).toLowerCase(),
      name       : sanitize(data.name),
      role       : data.role,
      email      : sanitize(data.email),
      phone      : sanitize(data.phone),
      department : sanitize(data.department),
      avatar     : data.avatar || '',
      signature  : data.signature || '',
      permissions: CONFIG.USER_ROLES[data.role].permissions,
      active     : data.active !== false
    };

    if (data.id) {
      let updated = null;
      const found = updateJsonById_('Users', data.id, u => {
        Object.assign(u, clean);
        u.updated_at = new Date().toISOString();
        // ถ้ามี new_password → อัพเดตด้วย
        if (data.new_password) {
          if (data.new_password.length < 6) throw new Error('รหัสผ่านอย่างน้อย 6 ตัว');
          u.password = hashPassword(data.new_password);
        }
        updated = u;
        return u;
      });
      if (!found) return { status:'error', message:'ไม่พบผู้ใช้' };
      const safe = Object.assign({}, updated);
      delete safe.password;
      return { status:'success', data:safe, message:'แก้ไขผู้ใช้สำเร็จ' };

    } else {
      if (!data.new_password || data.new_password.length < 6) {
        return { status:'error', message:'รหัสผ่านอย่างน้อย 6 ตัว' };
      }
      const now = new Date().toISOString();
      const obj = Object.assign({
        id        : generateId(),
        password  : hashPassword(data.new_password),
        last_login: null
      }, clean, { created_at: now, updated_at: now });
      appendJsonRow_('Users', obj);
      const safe = Object.assign({}, obj);
      delete safe.password;
      return { status:'success', data:safe, message:'เพิ่มผู้ใช้สำเร็จ' };
    }

  } catch (e) {
    logError({ fn:'saveUser', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteUser(id, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;
    // ห้ามลบตัวเอง
    if (id === auth.user.id) return { status:'error', message:'ห้ามลบบัญชีของตัวเอง' };

    const all = readJsonSheet_('Users');
    const target = all.find(u => u.id === id);
    if (!target) return { status:'error', message:'ไม่พบผู้ใช้' };

    // กันลบ admin คนสุดท้าย
    if (target.role === 'admin') {
      const adminCount = all.filter(u => u.role === 'admin' && u.active !== false).length;
      if (adminCount <= 1) return { status:'error', message:'ไม่สามารถลบ Admin คนสุดท้ายได้' };
    }

    const ok = deleteJsonById_('Users', id);
    return ok ? { status:'success', message:'ลบผู้ใช้สำเร็จ' } : { status:'error', message:'ไม่พบผู้ใช้' };

  } catch (e) {
    logError({ fn:'deleteUser', error:e.message });
    return { status:'error', message:e.message };
  }
}

function toggleUserActive(id, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;
    if (id === auth.user.id) return { status:'error', message:'ห้ามปิดบัญชีของตัวเอง' };

    let result = null;
    updateJsonById_('Users', id, u => {
      u.active = !u.active;
      u.updated_at = new Date().toISOString();
      result = u.active;
      return u;
    });
    return { status:'success', message: result ? 'เปิดใช้งานบัญชีแล้ว' : 'ปิดใช้งานบัญชีแล้ว', active: result };
  } catch (e) {
    return { status:'error', message:e.message };
  }
}

function adminResetPassword(id, newPassword, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;
    if (!newPassword || newPassword.length < 6) {
      return { status:'error', message:'รหัสผ่านอย่างน้อย 6 ตัว' };
    }
    updateJsonById_('Users', id, u => {
      u.password = hashPassword(newPassword);
      u.updated_at = new Date().toISOString();
      return u;
    });
    return { status:'success', message:'รีเซ็ตรหัสผ่านสำเร็จ' };
  } catch (e) {
    logError({ fn:'adminResetPassword', error:e.message });
    return { status:'error', message:e.message };
  }
}


function createUsersFromPersonnel(role, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;

    const safeRole = (role === 'staff' || role === 'teacher') ? role : 'teacher';
    if (!CONFIG.USER_ROLES[safeRole]) return { status:'error', message:'role ไม่ถูกต้อง' };

    const personnel  = readJsonSheet_('Personnel');
    const existingUsers = readJsonSheet_('Users');
    const takenUsernames = new Set(existingUsers.map(u => String(u.username).toLowerCase()));

    let created = 0, skipped = 0;
    const now = new Date().toISOString();

    for (const p of personnel) {
      const username = String(p.personnel_id || '').toLowerCase();
      if (!username) { skipped++; continue; }
      if (takenUsernames.has(username)) { skipped++; continue; }

      const obj = {
        id          : generateId(),
        username    : username,
        name        : sanitize((p.prefix||'') + (p.first_name||'') + ' ' + (p.last_name||'')),
        role        : safeRole,
        email       : sanitize(p.email || ''),
        phone       : sanitize(p.phone || ''),
        department  : sanitize(p.department || ''),
        avatar      : p.photo || '',
        signature   : p.signature || '',
        permissions : CONFIG.USER_ROLES[safeRole].permissions,
        password    : hashPassword(username),
        active      : true,
        last_login  : null,
        created_at  : now,
        updated_at  : now
      };
      appendJsonRow_('Users', obj);
      takenUsernames.add(username);
      created++;
    }

    return { status:'success', created, skipped,
             message: 'สร้างบัญชีสำเร็จ ' + created + ' คน (ข้าม ' + skipped + ' คน)' };
  } catch(e) {
    logError({ fn:'createUsersFromPersonnel', error:e.message });
    return { status:'error', message:e.message };
  }
}

/* ============================================================
 *  SETTINGS — ตั้งค่าระบบ
 * ============================================================ */
function getSystemSettings(sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const config = getConfig();
    // ส่ง config ทั้งก้อน
    return { status:'success', data: config };
  } catch (e) {
    return { status:'error', message:e.message };
  }
}

function saveSystemSettings(settings, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;

    // กรองให้เก็บเฉพาะ field ที่อนุญาต (ไม่ให้ override id ฯลฯ)
    const allowed = [
      'school_name','school_address','school_district','school_province',
      'school_phone','school_email','school_logo','qr_code_contact','folder_id',
      'academic_year','semester',
      'notification_enabled','email_notifications','email_list',
      'session_timeout','maintenance_mode',
      'grade_thresholds','min_attendance_pct','min_gpa_promote',
      'character_criteria','activity_types'
    ];
    const clean = {};
    allowed.forEach(k => {
      if (settings.hasOwnProperty(k)) clean[k] = settings[k];
    });

    const result = saveConfig(clean);
    return result;

  } catch (e) {
    logError({ fn:'saveSystemSettings', error:e.message });
    return { status:'error', message:e.message };
  }
}

function getSystemInfo(sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const sheetInfo = sheets.map(s => ({
      name: s.getName(),
      rows: s.getLastRow(),
      cols: s.getLastColumn()
    }));

    return {
      status: 'success',
      data: {
        spreadsheet_id  : ss.getId(),
        spreadsheet_url : ss.getUrl(),
        spreadsheet_name: ss.getName(),
        timezone        : Session.getScriptTimeZone(),
        sheets          : sheetInfo,
        app_version     : CONFIG.APP_VERSION,
        user_count      : readJsonSheet_('Users').length,
        student_count   : readJsonSheet_('Students').length,
        personnel_count : readJsonSheet_('Personnel').length
      }
    };
  } catch (e) {
    return { status:'error', message:e.message };
  }
}

/* ============================================================
 *  END Part 4 Backend — ระบบสมบูรณ์ครบทุกส่วน
 * ============================================================ */


/* ==========================================================
 *  Part 5 — ตารางสอน มาตรฐาน สพฐ.
 ============================================================ */

/* ============================================================
 *  DEFAULT PERIODS — มาตรฐาน สพฐ.
 * ============================================================ */
var DEFAULT_PERIODS = [
  { no:0,  label:'กิจกรรมหน้าเสาธง', start:'08:00', end:'08:30', is_break:true,  is_homeroom:true  },
  { no:1,  label:'คาบที่ 1',         start:'08:30', end:'09:20', is_break:false, is_homeroom:false },
  { no:2,  label:'คาบที่ 2',         start:'09:20', end:'10:10', is_break:false, is_homeroom:false },
  { no:3,  label:'คาบที่ 3',         start:'10:10', end:'11:00', is_break:false, is_homeroom:false },
  { no:4,  label:'คาบที่ 4',         start:'11:00', end:'11:50', is_break:false, is_homeroom:false },
  { no:5,  label:'พักกลางวัน',       start:'11:50', end:'12:50', is_break:true,  is_homeroom:false },
  { no:6,  label:'คาบที่ 5',         start:'12:50', end:'13:40', is_break:false, is_homeroom:false },
  { no:7,  label:'คาบที่ 6',         start:'13:40', end:'14:30', is_break:false, is_homeroom:false },
  { no:8,  label:'คาบที่ 7',         start:'14:30', end:'15:20', is_break:false, is_homeroom:false }
];

var SUBJECT_GROUP_COLORS = {
  'ภาษาไทย'           : '#EF4444',
  'คณิตศาสตร์'         : '#3B82F6',
  'วิทยาศาสตร์'        : '#10B981',
  'สังคมศึกษาฯ'        : '#F59E0B',
  'สุขศึกษาและพลศึกษา' : '#EC4899',
  'ศิลปะ'              : '#8B5CF6',
  'การงานอาชีพ'         : '#06B6D4',
  'ภาษาต่างประเทศ'     : '#84CC16',
  'กิจกรรมพัฒนาผู้เรียน': '#6366F1',
  'อื่นๆ'              : '#64748B'
};

var DAY_LABELS_TH = { 1:'จันทร์', 2:'อังคาร', 3:'พุธ', 4:'พฤหัสบดี', 5:'ศุกร์' };


/* ============================================================
 *  PERIOD CONFIG
 * ============================================================ */
function getPeriodConfig(academicYear, semester, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Schedule');
    const found = all
      .filter(x => x._kind === 'period_config')
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    // filter ตาม year+semester ถ้าระบุ
    let cfg = found.find(x =>
      (!academicYear || String(x.academic_year) === String(academicYear)) &&
      (!semester     || String(x.semester)      === String(semester))
    );

    if (!cfg) {
      // ส่ง default กลับไปถ้ายังไม่เคยตั้งค่า
      cfg = {
        _kind        : 'period_config',
        academic_year: academicYear || (getConfig().academic_year || String(new Date().getFullYear() + 543)),
        semester     : semester || '1',
        periods      : DEFAULT_PERIODS,
        work_days    : [1,2,3,4,5],
        is_default   : true
      };
    }
    return { status:'success', data:cfg };

  } catch(e) {
    logError({ fn:'getPeriodConfig', error:e.message });
    return { status:'error', message:e.message };
  }
}

function savePeriodConfig(data, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;

    if (!data || !Array.isArray(data.periods) || data.periods.length === 0) {
      return { status:'error', message:'กรุณากำหนดคาบเรียนอย่างน้อย 1 คาบ' };
    }

    const all = readJsonSheet_('Schedule');
    // ลบ config เก่าของ year+semester นี้
    const others = all.filter(x => !(
      x._kind === 'period_config' &&
      String(x.academic_year) === String(data.academic_year) &&
      String(x.semester)      === String(data.semester)
    ));

    const now = new Date().toISOString();
    const obj = {
      id           : generateId(),
      _kind        : 'period_config',
      academic_year: sanitize(data.academic_year),
      semester     : sanitize(data.semester),
      periods      : data.periods,
      work_days    : Array.isArray(data.work_days) ? data.work_days : [1,2,3,4,5],
      created_at   : now,
      updated_at   : now
    };
    writeJsonSheet_('Schedule', others.concat([obj]));
    return { status:'success', data:obj, message:'บันทึกตั้งค่าคาบเรียนสำเร็จ' };

  } catch(e) {
    logError({ fn:'savePeriodConfig', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  ROOMS
 * ============================================================ */
function getRooms(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    let all = readJsonSheet_('Schedule').filter(x => x._kind === 'room');
    params = params || {};
    if (params.type)   all = all.filter(r => r.type === params.type);
    if (params.active) all = all.filter(r => r.active !== false);
    all.sort((a,b) => String(a.building||'').localeCompare(String(b.building||''),'th')
                   || String(a.name||'').localeCompare(String(b.name||''),'th'));

    return { status:'success', data:all };
  } catch(e) {
    logError({ fn:'getRooms', error:e.message });
    return { status:'error', message:e.message };
  }
}

function saveRoom(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    if (!data || !data.name) return { status:'error', message:'กรุณากรอกชื่อห้อง' };

    const clean = {
      _kind      : 'room',
      name       : sanitize(data.name),
      building   : sanitize(data.building),
      capacity   : Number(data.capacity) || 0,
      type       : data.type || 'classroom',
      facilities : Array.isArray(data.facilities) ? data.facilities : [],
      active     : data.active !== false,
      note       : sanitize(data.note)
    };

    if (data.id) {
      let updated = null;
      updateJsonById_('Schedule', data.id, r => {
        Object.assign(r, clean);
        r.updated_at = new Date().toISOString();
        updated = r;
        return r;
      });
      return { status:'success', data:updated, message:'แก้ไขห้องสำเร็จ' };
    } else {
      const now = new Date().toISOString();
      const obj = Object.assign({ id:generateId() }, clean, { created_at:now, updated_at:now });
      appendJsonRow_('Schedule', obj);
      return { status:'success', data:obj, message:'เพิ่มห้องสำเร็จ' };
    }
  } catch(e) {
    logError({ fn:'saveRoom', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteRoom(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const perms = (auth.user && auth.user.permissions) || [];
    if (!perms.includes('delete')) return { status:'error', message:'no_permission' };
    const ok = deleteJsonById_('Schedule', id);
    return ok ? { status:'success', message:'ลบห้องสำเร็จ' } : { status:'error', message:'ไม่พบห้อง' };
  } catch(e) {
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  SCHEDULE ENTRIES
 * ============================================================ */

/**
 * ดึงตารางสอน
 * view = 'class'   → params.classroom required
 * view = 'teacher' → params.teacher_id required
 * view = 'all'     → ดึงทุกห้อง
 */
function getSchedule(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    params = params || {};
    const ay  = params.academic_year || getConfig().academic_year;
    const sem = params.semester || '1';

    // entries
    let entries = readJsonSheet_('Schedule').filter(x =>
      x._kind === 'schedule_entry' &&
      String(x.academic_year) === String(ay) &&
      String(x.semester) === String(sem)
    );

    if (params.classroom  && params.view !== 'all') entries = entries.filter(e => e.classroom === params.classroom);
    if (params.teacher_id && params.view !== 'all') entries = entries.filter(e => e.teacher_id === params.teacher_id);

    // เสริมข้อมูล subject + teacher + room
    const subjects   = readJsonSheet_('Academic').filter(x => x._kind === 'subject');
    const personnel  = readJsonSheet_('Personnel');
    const rooms      = readJsonSheet_('Schedule').filter(x => x._kind === 'room');

    const subMap  = {}; subjects.forEach(s => subMap[s.id]   = s);
    const perMap  = {}; personnel.forEach(p => perMap[p.id]  = p);
    const roomMap = {}; rooms.forEach(r => roomMap[r.id]      = r);

    const enriched = entries.map(e => {
      const sub  = subMap[e.subject_id]  || {};
      const per  = perMap[e.teacher_id]  || {};
      const room = roomMap[e.room_id]    || {};
      const group = sub.subject_group || '';
      return Object.assign({}, e, {
        subject_name  : sub.subject_name  || '',
        subject_code  : sub.subject_code  || '',
        subject_group : group,
        teacher_name  : per.id ? ((per.prefix||'')+(per.first_name||'')+' '+(per.last_name||'')) : '',
        teacher_short : per.id ? ((per.prefix||'')+(per.first_name||'')) : '',
        room_name     : room.name || '',
        color         : e.color || SUBJECT_GROUP_COLORS[group] || '#64748B'
      });
    });

    // distinct classrooms จาก students
    const students = readJsonSheet_('Students').filter(s => s.status === 'active');
    const classrooms = Array.from(new Set(students.map(s => s.classroom).filter(Boolean))).sort();

    // distinct teachers ที่ active
    const teachers = personnel
      .filter(p => p.type === 'teacher' && p.status !== 'inactive')
      .map(p => ({ id:p.id, name:(p.prefix||'')+(p.first_name||'')+' '+(p.last_name||''), department:p.department, personnel_id:p.personnel_id }));

    return {
      status     : 'success',
      data       : enriched,
      classrooms : classrooms,
      teachers   : teachers,
      academic_year: ay,
      semester   : sem
    };

  } catch(e) {
    logError({ fn:'getSchedule', error:e.message });
    return { status:'error', message:e.message };
  }
}

/**
 * บันทึก Schedule Entry (1 slot)
 * ถ้าวัน+คาบ+ห้องเรียนเดิมมีข้อมูลอยู่แล้ว → อัพเดตทับ
 */
function saveScheduleEntry(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    if (!data || !data.classroom || data.day == null || data.period_no == null) {
      return { status:'error', message:'ข้อมูลไม่ครบ (classroom, day, period_no)' };
    }

    // Conflict Detection
    const conflicts = checkScheduleConflict_(data);
    // ส่ง conflict กลับเป็น warning ไม่บังคับห้ามบันทึก
    const conflict_warnings = conflicts;

    const all = readJsonSheet_('Schedule');
    const ay  = String(data.academic_year || getConfig().academic_year);
    const sem = String(data.semester || '1');

    // หาถ้ามี entry เดิมอยู่ (ห้อง+วัน+คาบ+ปี+เทอม)
    const existIdx = all.findIndex(x =>
      x._kind === 'schedule_entry' &&
      x.classroom === data.classroom &&
      Number(x.day) === Number(data.day) &&
      Number(x.period_no) === Number(data.period_no) &&
      String(x.academic_year) === ay &&
      String(x.semester) === sem
    );

    const now = new Date().toISOString();

    // ถ้าเป็น "ลบ" (subject_id ว่าง) → ลบ entry นั้น
    if (!data.subject_id && !data.is_homeroom_activity) {
      if (existIdx >= 0) {
        all.splice(existIdx, 1);
        writeJsonSheet_('Schedule', all);
      }
      return { status:'success', message:'ลบคาบสำเร็จ', conflict_warnings };
    }

    // ตรวจสอบ subject_id
    if (!data.subject_id && !data.activity_label) {
      return { status:'error', message:'กรุณาเลือกรายวิชา' };
    }

    // สร้างหรืออัพเดต
    const subjects  = readJsonSheet_('Academic').filter(x => x._kind === 'subject');
    const sub = subjects.find(s => s.id === data.subject_id) || {};
    const group = sub.subject_group || '';
    const autoColor = SUBJECT_GROUP_COLORS[group] || '#64748B';

    const entry = {
      id           : data.id || generateId(),
      _kind        : 'schedule_entry',
      academic_year: ay,
      semester     : sem,
      classroom    : data.classroom,
      day          : Number(data.day),
      period_no    : Number(data.period_no),
      subject_id   : data.subject_id   || '',
      teacher_id   : data.teacher_id   || '',
      room_id      : data.room_id      || '',
      activity_label: sanitize(data.activity_label || ''),
      note         : sanitize(data.note || ''),
      color        : data.color || autoColor,
      created_by   : auth.user.id,
      created_at   : existIdx >= 0 ? all[existIdx].created_at : now,
      updated_at   : now
    };

    if (existIdx >= 0) all[existIdx] = entry;
    else               all.push(entry);

    writeJsonSheet_('Schedule', all);
    return { status:'success', data:entry, message:'บันทึกตารางสอนสำเร็จ', conflict_warnings };

  } catch(e) {
    logError({ fn:'saveScheduleEntry', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteScheduleEntry(classroom, day, periodNo, academicYear, semester, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    const ay  = String(academicYear || getConfig().academic_year);
    const sem = String(semester || '1');

    const all = readJsonSheet_('Schedule');
    const next = all.filter(x => !(
      x._kind === 'schedule_entry' &&
      x.classroom === classroom &&
      Number(x.day) === Number(day) &&
      Number(x.period_no) === Number(periodNo) &&
      String(x.academic_year) === ay &&
      String(x.semester) === sem
    ));
    const removed = all.length - next.length;
    writeJsonSheet_('Schedule', next);
    return { status:'success', message:'ลบสำเร็จ', removed };

  } catch(e) {
    logError({ fn:'deleteScheduleEntry', error:e.message });
    return { status:'error', message:e.message };
  }
}

/**
 * ลบตารางสอนทั้งห้อง (เพื่อ reset แล้วกรอกใหม่)
 */
function clearClassroomSchedule(classroom, academicYear, semester, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;

    const ay  = String(academicYear || getConfig().academic_year);
    const sem = String(semester || '1');
    const all = readJsonSheet_('Schedule');
    const next = all.filter(x => !(
      x._kind === 'schedule_entry' &&
      x.classroom === classroom &&
      String(x.academic_year) === ay &&
      String(x.semester) === sem
    ));
    const removed = all.length - next.length;
    writeJsonSheet_('Schedule', next);
    return { status:'success', message:'ล้างตารางสอน ' + classroom + ' สำเร็จ (' + removed + ' รายการ)' };
  } catch(e) {
    logError({ fn:'clearClassroomSchedule', error:e.message });
    return { status:'error', message:e.message };
  }
}

/**
 * Copy ตารางสอนจากเทอมหนึ่งไปอีกเทอม
 */
function copyScheduleSemester(fromYear, fromSem, toYear, toSem, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;

    const all = readJsonSheet_('Schedule');
    const source = all.filter(x =>
      x._kind === 'schedule_entry' &&
      String(x.academic_year) === String(fromYear) &&
      String(x.semester) === String(fromSem)
    );
    if (source.length === 0) return { status:'error', message:'ไม่พบตารางสอนต้นทาง' };

    // ลบ target เดิม
    const base = all.filter(x => !(
      x._kind === 'schedule_entry' &&
      String(x.academic_year) === String(toYear) &&
      String(x.semester) === String(toSem)
    ));

    const now = new Date().toISOString();
    const copied = source.map(e => Object.assign({}, e, {
      id: generateId(),
      academic_year: String(toYear),
      semester: String(toSem),
      created_at: now,
      updated_at: now
    }));

    writeJsonSheet_('Schedule', base.concat(copied));
    return {
      status: 'success',
      message: 'Copy ตารางสอนสำเร็จ ' + copied.length + ' รายการ → ' + toYear + '/' + toSem
    };
  } catch(e) {
    logError({ fn:'copyScheduleSemester', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  CONFLICT DETECTION
 * ============================================================ */
function checkScheduleConflict_(newEntry) {
  const warnings = [];
  try {
    if (!newEntry.teacher_id) return warnings;

    const ay  = String(newEntry.academic_year || getConfig().academic_year);
    const sem = String(newEntry.semester || '1');

    const all = readJsonSheet_('Schedule').filter(x =>
      x._kind === 'schedule_entry' &&
      String(x.academic_year) === ay &&
      String(x.semester)      === sem &&
      Number(x.day)       === Number(newEntry.day) &&
      Number(x.period_no) === Number(newEntry.period_no)
    );

    // ครูติดตารางห้องอื่น
    const teacherConflict = all.filter(x =>
      x.teacher_id === newEntry.teacher_id &&
      x.classroom  !== newEntry.classroom
    );
    teacherConflict.forEach(x => {
      const per = (readJsonSheet_('Personnel').find(p => p.id === newEntry.teacher_id)) || {};
      warnings.push({
        type   : 'teacher',
        message: 'ครู ' + (per.first_name || newEntry.teacher_id) + ' มีตารางสอนห้อง ' + x.classroom + ' ในคาบเดียวกันอยู่แล้ว'
      });
    });

    // ห้องสอนถูกใช้
    if (newEntry.room_id) {
      const roomConflict = all.filter(x =>
        x.room_id   === newEntry.room_id &&
        x.classroom !== newEntry.classroom
      );
      roomConflict.forEach(x => {
        const room = (readJsonSheet_('Schedule').find(r => r.id === newEntry.room_id)) || {};
        warnings.push({
          type   : 'room',
          message: 'ห้อง ' + (room.name || newEntry.room_id) + ' ถูกใช้สอนห้อง ' + x.classroom + ' ในคาบเดียวกัน'
        });
      });
    }

    return warnings;
  } catch(e) {
    return warnings;
  }
}

/**
 * ตรวจ Conflict ทั้งหมดในตาราง (สำหรับแสดงสรุป)
 */
function getAllConflicts(academicYear, semester, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const ay  = String(academicYear || getConfig().academic_year);
    const sem = String(semester || '1');
    const entries = readJsonSheet_('Schedule').filter(x =>
      x._kind === 'schedule_entry' &&
      String(x.academic_year) === ay &&
      String(x.semester) === sem
    );

    const personnel = readJsonSheet_('Personnel');
    const perMap = {};
    personnel.forEach(p => perMap[p.id] = p);

    const conflicts = [];
    // group by day+period
    const groups = {};
    entries.forEach(e => {
      const key = e.day + '_' + e.period_no;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });

    Object.keys(groups).forEach(key => {
      const group = groups[key];
      // teacher conflicts
      const teacherCount = {};
      group.forEach(e => {
        if (!e.teacher_id) return;
        if (!teacherCount[e.teacher_id]) teacherCount[e.teacher_id] = [];
        teacherCount[e.teacher_id].push(e.classroom);
      });
      Object.keys(teacherCount).forEach(tid => {
        if (teacherCount[tid].length > 1) {
          const per = perMap[tid] || {};
          const [d, p] = key.split('_');
          conflicts.push({
            type: 'teacher',
            day: Number(d), period_no: Number(p),
            teacher_name: (per.prefix||'')+(per.first_name||'')+' '+(per.last_name||''),
            classrooms: teacherCount[tid],
            message: 'วัน' + (DAY_LABELS_TH[d]||d) + ' คาบ ' + p +
                     ' — ครู' + (per.first_name||tid) + ' ติดสอนพร้อมกัน: ' + teacherCount[tid].join(', ')
          });
        }
      });
    });

    return { status:'success', conflicts, total:conflicts.length };
  } catch(e) {
    logError({ fn:'getAllConflicts', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  TEACHER WORKLOAD — ภาระงานสอน
 * ============================================================ */
function getTeacherWorkload(academicYear, semester, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const ay  = String(academicYear || getConfig().academic_year);
    const sem = String(semester || '1');

    const entries  = readJsonSheet_('Schedule').filter(x =>
      x._kind === 'schedule_entry' && !x.is_homeroom_activity &&
      String(x.academic_year) === ay && String(x.semester) === sem
    );
    const personnel = readJsonSheet_('Personnel').filter(p => p.type === 'teacher');
    const subjects  = readJsonSheet_('Academic').filter(x => x._kind === 'subject');
    const subMap = {};
    subjects.forEach(s => subMap[s.id] = s);

    const result = personnel.map(p => {
      const myEntries = entries.filter(e => e.teacher_id === p.id);
      const classrooms = Array.from(new Set(myEntries.map(e => e.classroom)));
      const subjects_taught = Array.from(new Set(
        myEntries.map(e => subMap[e.subject_id] ? subMap[e.subject_id].subject_name : '').filter(Boolean)
      ));

      return {
        teacher_id   : p.id,
        teacher_name : (p.prefix||'')+(p.first_name||'')+' '+(p.last_name||''),
        department   : p.department || '-',
        periods_total: myEntries.length,     // จำนวนคาบ/สัปดาห์
        hours_total  : myEntries.length,     // 1 คาบ = ~50 นาที ≈ 1 ชั่วโมง
        classrooms   : classrooms.sort(),
        subjects_taught: subjects_taught
      };
    });

    // เรียงตาม periods มากไปน้อย
    result.sort((a,b) => b.periods_total - a.periods_total);

    return { status:'success', data:result, academic_year:ay, semester:sem };
  } catch(e) {
    logError({ fn:'getTeacherWorkload', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  PRINT HTML — ตารางสอนรายห้อง (A4 Landscape)
 * ============================================================ */
function generateSchedulePrintHTML(classroom, academicYear, semester, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const ay  = String(academicYear || getConfig().academic_year);
    const sem = String(semester || '1');

    // ดึงข้อมูล
    const schedRes = getSchedule({ classroom, academic_year:ay, semester:sem }, sessionToken);
    if (schedRes.status !== 'success') return schedRes;

    const cfgRes = getPeriodConfig(ay, sem, sessionToken);
    const periods = cfgRes.data.periods;
    const config  = getConfig();

    // Map: day → period → entry
    const grid = {};
    [1,2,3,4,5].forEach(d => { grid[d] = {}; });
    schedRes.data.forEach(e => { if (grid[e.day]) grid[e.day][e.period_no] = e; });

    // Build table rows
    const dayLabels = ['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์'];

    const rows = periods.map(p => {
      const rowCells = [1,2,3,4,5].map(d => {
        if (p.is_break) {
          return d === 1
            ? `<td colspan="5" style="background:#F1F5F9;text-align:center;font-weight:600;color:#64748B;padding:6px;">
                ${p.label} (${p.start} – ${p.end})
               </td>`
            : '';
        }
        const e = grid[d][p.no];
        if (!e) return '<td style="min-height:60px;"></td>';
        return `
          <td style="padding:0;">
            <div style="margin:3px; padding:5px 6px; border-radius:6px;
                        background:${e.color}22; border-left:3px solid ${e.color};
                        min-height:52px;">
              <div style="font-weight:700; font-size:11px; color:${e.color}; line-height:1.3;">
                ${escapeHTMLServer_(e.subject_name || e.activity_label || '')}
              </div>
              <div style="font-size:10px; color:#475569; margin-top:2px; line-height:1.3;">
                ${escapeHTMLServer_(e.teacher_short || e.teacher_name || '')}
              </div>
              ${e.room_name ? `<div style="font-size:9px; color:#94A3B8;">${escapeHTMLServer_(e.room_name)}</div>` : ''}
            </div>
          </td>`;
      });
      if (p.is_break) {
        return '<tr>' + rowCells[0] + '</tr>';
      }
      return `
        <tr>
          <td style="background:#F8FAFC; padding:4px 8px; border-right:1px solid #E2E8F0;
                     white-space:nowrap; font-size:10px; line-height:1.3;">
            <div style="font-weight:700; color:#0F172A;">${p.label}</div>
            <div style="color:#64748B;">${p.start}–${p.end}</div>
          </td>
          ${rowCells.join('')}
        </tr>`;
    });

    const html = `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8">
<title>ตารางสอน ${escapeHTMLServer_(classroom)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 1cm; }
  body {
    font-family: 'Sarabun', sans-serif;
    font-size: 12px; color: #0F172A; margin: 0;
  }
  .header {
    text-align: center; margin-bottom: 10px;
    padding-bottom: 8px; border-bottom: 2px solid #1E40AF;
  }
  .header .school { font-size: 14px; font-weight: 700; color: #1E40AF; }
  .header .title  { font-size: 18px; font-weight: 800; margin: 4px 0; }
  .header .sub    { font-size: 12px; color: #64748B; }
  table {
    width: 100%; border-collapse: collapse;
    border: 1px solid #CBD5E1;
  }
  th, td {
    border: 1px solid #E2E8F0;
    vertical-align: top;
  }
  th {
    background: #1E40AF; color: white; text-align: center;
    padding: 6px 8px; font-size: 12px;
  }
  td { vertical-align: middle; min-height: 60px; }
  .signature-row {
    display: flex; justify-content: space-around;
    margin-top: 30px; text-align: center; font-size: 11px;
  }
  .sig-line { border-bottom: 1px dotted #000; width: 180px; margin: 0 auto 4px; padding-bottom: 24px; }
  @media print {
    .no-print { display: none; }
    body { font-size: 11px; }
  }
  .no-print {
    position: fixed; top: 10px; right: 10px;
    background: #1E40AF; color: white; padding: 8px 16px;
    border-radius: 8px; cursor: pointer; border: none;
    font-family: inherit; font-weight: 700; font-size: 13px;
  }
</style></head><body>
<button class="no-print" onclick="window.print()">🖨 พิมพ์</button>
<div class="header">
  <div class="school">${escapeHTMLServer_(config.school_name || 'โรงเรียน...')}</div>
  <div class="title">ตารางเรียน ชั้น ${escapeHTMLServer_(classroom)}</div>
  <div class="sub">ภาคเรียนที่ ${escapeHTMLServer_(sem)} ปีการศึกษา ${escapeHTMLServer_(ay)}</div>
</div>
<table>
  <thead>
    <tr>
      <th style="width:90px;">คาบ / เวลา</th>
      <th>วันจันทร์</th><th>วันอังคาร</th><th>วันพุธ</th><th>วันพฤหัสบดี</th><th>วันศุกร์</th>
    </tr>
  </thead>
  <tbody>${rows.join('')}</tbody>
</table>
<div class="signature-row">
  <div>
    <div class="sig-line"></div>
    <div>ครูที่ปรึกษา</div>
  </div>
  <div>
    <div class="sig-line"></div>
    <div>หัวหน้างานวิชาการ</div>
  </div>
  <div>
    <div class="sig-line"></div>
    <div>(............................................)</div>
    <div>ผู้อำนวยการโรงเรียน</div>
  </div>
</div>
</body></html>`;

    return { status:'success', html };
  } catch(e) {
    logError({ fn:'generateSchedulePrintHTML', error:e.message });
    return { status:'error', message:e.message };
  }
}

/**
 * Print ตารางสอนรายครู
 */
function generateTeacherScheduleHTML(teacherId, academicYear, semester, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const ay  = String(academicYear || getConfig().academic_year);
    const sem = String(semester || '1');

    const schedRes = getSchedule({ teacher_id:teacherId, view:'teacher', academic_year:ay, semester:sem }, sessionToken);
    if (schedRes.status !== 'success') return schedRes;

    const cfgRes = getPeriodConfig(ay, sem, sessionToken);
    const periods = cfgRes.data.periods;
    const config  = getConfig();

    const per = (readJsonSheet_('Personnel').find(p => p.id === teacherId)) || {};
    const teacherName = per.id ? ((per.prefix||'')+(per.first_name||'')+' '+(per.last_name||'')) : '-';
    const teacherPos  = per.position || '';

    const grid = {};
    [1,2,3,4,5].forEach(d => { grid[d] = {}; });
    schedRes.data.forEach(e => { if (grid[e.day]) grid[e.day][e.period_no] = e; });

    // นับภาระงาน
    const totalPeriods = schedRes.data.filter(e => !e.is_homeroom_activity).length;

    const rows = periods.map(p => {
      if (p.is_break) {
        return `<tr><td colspan="6" style="background:#F1F5F9;text-align:center;font-weight:600;color:#64748B;padding:5px;">${p.label} (${p.start}–${p.end})</td></tr>`;
      }
      const cells = [1,2,3,4,5].map(d => {
        const e = grid[d][p.no];
        if (!e) return '<td></td>';
        return `
          <td style="padding:0;">
            <div style="margin:3px;padding:5px 6px;border-radius:6px;
                        background:${e.color}22;border-left:3px solid ${e.color};min-height:52px;">
              <div style="font-weight:700;font-size:11px;color:${e.color};">${escapeHTMLServer_(e.subject_name||e.activity_label||'')}</div>
              <div style="font-size:10px;color:#475569;margin-top:2px;">ห้อง ${escapeHTMLServer_(e.classroom)}</div>
              ${e.room_name ? `<div style="font-size:9px;color:#94A3B8;">${escapeHTMLServer_(e.room_name)}</div>` : ''}
            </div>
          </td>`;
      });
      return `<tr>
        <td style="background:#F8FAFC;padding:4px 8px;border-right:1px solid #E2E8F0;white-space:nowrap;font-size:10px;">
          <div style="font-weight:700;">${p.label}</div>
          <div style="color:#64748B;">${p.start}–${p.end}</div>
        </td>
        ${cells.join('')}
      </tr>`;
    });

    const html = `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><title>ตารางสอน ${escapeHTMLServer_(teacherName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 1cm; }
  body { font-family:'Sarabun',sans-serif; font-size:12px; color:#0F172A; margin:0; }
  .header { text-align:center; margin-bottom:10px; padding-bottom:8px; border-bottom:2px solid #1E40AF; }
  .header .school { font-size:14px; font-weight:700; color:#1E40AF; }
  .header .title  { font-size:18px; font-weight:800; margin:4px 0; }
  .header .sub    { font-size:12px; color:#64748B; }
  .workload { text-align:right; font-size:11px; color:#64748B; margin-bottom:6px; }
  table { width:100%; border-collapse:collapse; border:1px solid #CBD5E1; }
  th,td { border:1px solid #E2E8F0; vertical-align:middle; }
  th { background:#1E40AF; color:white; text-align:center; padding:6px 8px; font-size:12px; }
  .sig-row { display:flex; justify-content:space-around; margin-top:30px; text-align:center; font-size:11px; }
  .sig-line { border-bottom:1px dotted #000; width:180px; margin:0 auto 4px; padding-bottom:24px; }
  @media print { .no-print { display:none; } }
  .no-print { position:fixed; top:10px; right:10px; background:#1E40AF; color:white; padding:8px 16px; border-radius:8px; cursor:pointer; border:none; font-family:inherit; font-weight:700; }
</style></head><body>
<button class="no-print" onclick="window.print()">🖨 พิมพ์</button>
<div class="header">
  <div class="school">${escapeHTMLServer_(config.school_name || 'โรงเรียน...')}</div>
  <div class="title">ตารางสอน ${escapeHTMLServer_(teacherName)}</div>
  <div class="sub">${escapeHTMLServer_(teacherPos)} | ภาคเรียนที่ ${sem} ปีการศึกษา ${ay}</div>
</div>
<div class="workload">ภาระงานสอน: <b>${totalPeriods}</b> คาบ/สัปดาห์</div>
<table>
  <thead>
    <tr>
      <th style="width:90px;">คาบ / เวลา</th>
      <th>วันจันทร์</th><th>วันอังคาร</th><th>วันพุธ</th><th>วันพฤหัสบดี</th><th>วันศุกร์</th>
    </tr>
  </thead>
  <tbody>${rows.join('')}</tbody>
</table>
<div class="sig-row">
  <div>
    <div class="sig-line">${per.signature ? `<img src="${escapeHTMLServer_(per.signature)}" style="max-height:40px;">` : ''}</div>
    <div>(${escapeHTMLServer_(teacherName)})</div>
    <div>ครูผู้สอน</div>
  </div>
  <div>
    <div class="sig-line"></div>
    <div>(.............................................)</div>
    <div>ผู้อำนวยการโรงเรียน</div>
  </div>
</div>
</body></html>`;

    return { status:'success', html };
  } catch(e) {
    logError({ fn:'generateTeacherScheduleHTML', error:e.message });
    return { status:'error', message:e.message };
  }
}

/* ============================================================
 *  SUMMARY สำหรับ initializeSheets (เพิ่ม Sheet 'Schedule')
 *
 *  วิธีใช้: ใน code.gs ส่วน CONFIG.REQUIRED_SHEETS เพิ่ม:
 *    'Schedule'
 *  แล้วรัน initializeSheets() ใหม่ 1 ครั้ง
 * ============================================================ */


/* ==========================================================
 *  Part 6 — LINE OA Messaging API
 ============================================================ */

/* ============================================================
 *  CORE — ส่งข้อความ LINE Push Message
 * ============================================================ */

/**
 * ส่งข้อความหา Target เดียว (User ID หรือ Group ID)
 * @param {string} targetId  - Group ID (C...) หรือ User ID (U...)
 * @param {string|object} messages - string หรือ LINE message object array
 * @param {string} token     - Channel Access Token (จาก Config)
 */
function lineaPushMessage_(targetId, messages, token) {
  if (!targetId || !token) return { ok: false, reason: 'missing_config' };

  const body = {
    to: targetId,
    messages: Array.isArray(messages)
      ? messages
      : [{ type: 'text', text: String(messages) }]
  };

  try {
    const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method     : 'POST',
      contentType: 'application/json',
      headers    : { Authorization: 'Bearer ' + token },
      payload    : JSON.stringify(body),
      muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    const json = JSON.parse(res.getContentText() || '{}');

    if (code !== 200) {
      logError({ fn:'lineaPushMessage_', code: code, body: json, target: targetId });
      return { ok: false, code: code, error: json.message };
    }
    return { ok: true };

  } catch (e) {
    logError({ fn:'lineaPushMessage_', error: e.message });
    return { ok: false, error: e.message };
  }
}

/**
 * ส่งพร้อมกันหลาย Target (Multicast ≤ 500 targets)
 */
function lineaMulticast_(targetIds, messages, token) {
  if (!targetIds || targetIds.length === 0 || !token) return;

  const body = {
    to: targetIds.slice(0, 500),
    messages: Array.isArray(messages)
      ? messages
      : [{ type: 'text', text: String(messages) }]
  };

  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/multicast', {
      method     : 'POST',
      contentType: 'application/json',
      headers    : { Authorization: 'Bearer ' + token },
      payload    : JSON.stringify(body),
      muteHttpExceptions: true
    });
  } catch (e) {
    logError({ fn:'lineaMulticast_', error: e.message });
  }
}

/**
 * ดึง Config LINE จาก Sheet Config
 */
function getLineConfig_() {
  const cfg = getConfig();
  return {
    token          : cfg.line_channel_token   || '',
    school_group_id: cfg.line_school_group_id || '',
    admin_user_ids : Array.isArray(cfg.line_admin_user_ids)
                     ? cfg.line_admin_user_ids
                     : (cfg.line_admin_user_ids ? [cfg.line_admin_user_ids] : []),
    classroom_groups: cfg.line_classroom_groups || {},  // { "ม.1/1": "C...", ... }
    notify_absent  : cfg.line_notify_absent    !== false,
    notify_late    : cfg.line_notify_late      !== false,
    notify_approval: cfg.line_notify_approval  !== false,
    notify_announce: cfg.line_notify_announce  !== false,
    notify_finance : cfg.line_notify_finance   !== false
  };
}

/**
 * Format วันที่ภาษาไทย (server-side)
 */
function lineThaiDate_(d) {
  if (!d) return '';
  const dt = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.',
             'ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return dt.getDate() + ' ' + m[dt.getMonth()] + ' ' + (dt.getFullYear() + 543);
}


/* ============================================================
 *  1. แจ้งเตือนนักเรียนขาด / มาสาย → Group รายห้อง
 *  เรียกจาก saveAttendanceBulk() ใน code_part2.gs
 * ============================================================ */
function notifyAttendance_(payload, classroom) {
  try {
    const lineCfg = getLineConfig_();
    if (!lineCfg.token) return;

    const date = payload.date;
    const records = payload.records || [];

    // แยกขาด / มาสาย
    const absent = records.filter(r => r.status === 'absent');
    const late   = records.filter(r => r.status === 'late');

    if (!lineCfg.notify_absent && !lineCfg.notify_late) return;
    if (absent.length === 0 && late.length === 0) return;

    // ดึงชื่อนักเรียน
    const students = readJsonSheet_('Students');
    const sMap = {};
    students.forEach(s => sMap[s.id] = s);

    const nameList = (arr, sMap) =>
      arr.map(r => {
        const s = sMap[r.student_id] || {};
        return '• ' + (s.prefix||'') + (s.first_name||'') + ' ' + (s.last_name||'');
      }).join('\n');

    // สร้างข้อความ
    let lines = [];
    lines.push('🏫 แจ้งเตือนการเข้าเรียน');
    lines.push('📅 วันที่: ' + lineThaiDate_(date));
    lines.push('🏛 ชั้น: ' + classroom);
    lines.push('');

    if (lineCfg.notify_absent && absent.length > 0) {
      lines.push('❌ ขาดเรียน (' + absent.length + ' คน)');
      lines.push(nameList(absent, sMap));
    }
    if (lineCfg.notify_late && late.length > 0) {
      if (absent.length > 0) lines.push('');
      lines.push('🕐 มาสาย (' + late.length + ' คน)');
      lines.push(nameList(late, sMap));
    }
    lines.push('');
    lines.push('— Smart School Office');

    const text = lines.join('\n');

    // ส่งไป Group ของห้องนั้น (ถ้ามี config)
    const classGroupId = lineCfg.classroom_groups[classroom];
    if (classGroupId) {
      lineaPushMessage_(classGroupId, text, lineCfg.token);
    }

    // ส่งไป School Group ด้วยถ้าต้องการ (optional — uncomment ถ้าต้องการ)
    // if (lineCfg.school_group_id) {
    //   lineaPushMessage_(lineCfg.school_group_id, text, lineCfg.token);
    // }

  } catch (e) {
    logError({ fn:'notifyAttendance_', error: e.message });
  }
}


/* ============================================================
 *  2. แจ้งเตือนคำขออนุมัติใหม่ → Group โรงเรียน + Admin
 *  เรียกจาก saveApproval() ใน code_part3.gs
 * ============================================================ */
function notifyNewApproval_(approval) {
  try {
    const lineCfg = getLineConfig_();
    if (!lineCfg.token || !lineCfg.notify_approval) return;

    // ดึงชื่อผู้ขอ
    const users = readJsonSheet_('Users');
    const requester = users.find(u => u.id === approval.requested_by) || {};

    const typeLabel = {
      leave:'ใบลา', budget:'งบประมาณ', purchase:'จัดซื้อ',
      trip:'ไปราชการ', other:'อื่นๆ'
    };

    const lines = [
      '📋 มีคำขออนุมัติใหม่',
      '',
      '🆔 เลขที่: ' + (approval.request_id || '-'),
      '📌 ประเภท: ' + (typeLabel[approval.type] || approval.type),
      '📝 เรื่อง: ' + (approval.subject || '-'),
      '👤 ผู้ขอ: ' + (requester.name || requester.username || '-'),
      '📅 วันที่: ' + lineThaiDate_(new Date()),
      (approval.amount > 0 ? '💰 จำนวนเงิน: ' + Number(approval.amount).toLocaleString() + ' บาท' : ''),
      '',
      '⏳ กรุณาเข้าระบบเพื่อพิจารณา',
      '— Smart School Office'
    ].filter(l => l !== undefined).join('\n');

    // ส่งไป School Group
    if (lineCfg.school_group_id) {
      lineaPushMessage_(lineCfg.school_group_id, lines, lineCfg.token);
    }

    // ส่งไปหา Admin รายคน (ถ้ามี User ID)
    if (lineCfg.admin_user_ids.length > 0) {
      lineaMulticast_(lineCfg.admin_user_ids, lines, lineCfg.token);
    }

  } catch (e) {
    logError({ fn:'notifyNewApproval_', error: e.message });
  }
}


/* ============================================================
 *  3. แจ้งเตือนประกาศ / ข่าวสาร → Group โรงเรียน
 *  เรียกจาก saveCalendarEvent() ใน code_part4.gs (เฉพาะ is_pinned)
 * ============================================================ */
function notifyAnnouncement_(event) {
  try {
    const lineCfg = getLineConfig_();
    if (!lineCfg.token || !lineCfg.notify_announce) return;
    if (!lineCfg.school_group_id) return;

    const typeEmoji = {
      academic:'📚', activity:'🎉', meeting:'📌',
      holiday:'🏖', general:'📣'
    };
    const emoji = typeEmoji[event.type] || '📣';

    const lines = [
      emoji + ' ประกาศจากโรงเรียน',
      '',
      '📢 ' + (event.title || ''),
      (event.start_date ? '📅 วันที่: ' + lineThaiDate_(event.start_date)
                         + (event.end_date && event.end_date !== event.start_date
                            ? ' – ' + lineThaiDate_(event.end_date) : '') : ''),
      (event.start_time ? '⏰ เวลา: ' + event.start_time + (event.end_time ? ' – ' + event.end_time : '') : ''),
      (event.location   ? '📍 สถานที่: ' + event.location : ''),
      (event.description ? '\n' + event.description : ''),
      '',
      '— Smart School Office'
    ].filter(Boolean).join('\n');

    lineaPushMessage_(lineCfg.school_group_id, lines, lineCfg.token);

  } catch (e) {
    logError({ fn:'notifyAnnouncement_', error: e.message });
  }
}


/* ============================================================
 *  4. แจ้งเตือนบันทึกรายรับ-รายจ่าย → Group โรงเรียน (Admin)
 *  เรียกจาก saveTransaction() ใน code_part3.gs
 * ============================================================ */
function notifyFinance_(tx) {
  try {
    const lineCfg = getLineConfig_();
    if (!lineCfg.token || !lineCfg.notify_finance) return;
    if (!lineCfg.school_group_id && lineCfg.admin_user_ids.length === 0) return;

    const isIncome = tx.type === 'income';
    const emoji    = isIncome ? '💚' : '🔴';
    const typeLabel = isIncome ? 'รายรับ' : 'รายจ่าย';
    const sign      = isIncome ? '+' : '-';

    const lines = [
      emoji + ' บันทึก' + typeLabel + 'ใหม่',
      '',
      '🗂 หมวด: ' + (tx.category || '-'),
      '📝 รายการ: ' + (tx.description || '-'),
      '💰 จำนวน: ' + sign + Number(tx.amount).toLocaleString('en-US') + ' บาท',
      '📅 วันที่: ' + lineThaiDate_(tx.date),
      '🧾 เลขที่: ' + (tx.receipt_number || tx.transaction_id || '-'),
      '',
      '— Smart School Office'
    ].join('\n');

    // ส่งไป School Group
    if (lineCfg.school_group_id) {
      lineaPushMessage_(lineCfg.school_group_id, lines, lineCfg.token);
    }
    // หรือส่งหา Admin เท่านั้น (ไม่ส่งทั้ง Group)
    // if (lineCfg.admin_user_ids.length > 0) {
    //   lineaMulticast_(lineCfg.admin_user_ids, lines, lineCfg.token);
    // }

  } catch (e) {
    logError({ fn:'notifyFinance_', error: e.message });
  }
}


/* ============================================================
 *  TEST — ทดสอบส่งข้อความ (เรียกจาก Frontend)
 * ============================================================ */
function testLineNotify(targetType, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;

    const lineCfg = getLineConfig_();
    if (!lineCfg.token) {
      return { status:'error', message:'กรุณาใส่ Channel Access Token ในตั้งค่าระบบ' };
    }

    const config = getConfig();
    const testMsg = '✅ ทดสอบการส่งข้อความ LINE OA\n\n🏫 ' + (config.school_name || 'โรงเรียน') +
                    '\n📅 ' + lineThaiDate_(new Date()) +
                    '\n\nระบบ Smart School Office พร้อมแจ้งเตือนแล้ว 🎉';

    let targetId = '';
    if (targetType === 'school') {
      targetId = lineCfg.school_group_id;
      if (!targetId) return { status:'error', message:'ยังไม่ได้ตั้งค่า Group ID โรงเรียน' };
    } else {
      // targetType = classroom name
      targetId = lineCfg.classroom_groups[targetType];
      if (!targetId) return { status:'error', message:'ยังไม่ได้ตั้งค่า Group ID ของห้อง ' + targetType };
    }

    const result = lineaPushMessage_(targetId, testMsg, lineCfg.token);
    if (result.ok) {
      return { status:'success', message:'ส่งข้อความทดสอบสำเร็จ! ตรวจสอบใน LINE ได้เลย' };
    } else {
      return { status:'error', message:'ส่งไม่สำเร็จ: ' + (result.error || 'code ' + result.code) };
    }

  } catch (e) {
    logError({ fn:'testLineNotify', error: e.message });
    return { status:'error', message: e.message };
  }
}


/* ============================================================
 *  SETTINGS — บันทึก / ดึง Config LINE
 * ============================================================ */
function getLineSettings(sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;

    const cfg = getConfig();
    return {
      status: 'success',
      data: {
        line_channel_token    : cfg.line_channel_token    || '',
        line_school_group_id  : cfg.line_school_group_id  || '',
        line_admin_user_ids   : cfg.line_admin_user_ids   || [],
        line_classroom_groups : cfg.line_classroom_groups || {},
        line_notify_absent    : cfg.line_notify_absent    !== false,
        line_notify_late      : cfg.line_notify_late      !== false,
        line_notify_approval  : cfg.line_notify_approval  !== false,
        line_notify_announce  : cfg.line_notify_announce  !== false,
        line_notify_finance   : cfg.line_notify_finance   !== false
      }
    };
  } catch (e) {
    return { status:'error', message: e.message };
  }
}

function saveLineSettings(data, sessionToken) {
  try {
    const auth = _requireAdmin_(sessionToken);
    if (!auth.ok) return auth.response;

    const allowed = {
      line_channel_token   : data.line_channel_token    || '',
      line_school_group_id : data.line_school_group_id  || '',
      line_admin_user_ids  : Array.isArray(data.line_admin_user_ids)
                             ? data.line_admin_user_ids
                             : (data.line_admin_user_ids ? [data.line_admin_user_ids] : []),
      line_classroom_groups: data.line_classroom_groups || {},
      line_notify_absent   : !!data.line_notify_absent,
      line_notify_late     : !!data.line_notify_late,
      line_notify_approval : !!data.line_notify_approval,
      line_notify_announce : !!data.line_notify_announce,
      line_notify_finance  : !!data.line_notify_finance
    };

    return saveConfig(allowed);
  } catch (e) {
    logError({ fn:'saveLineSettings', error: e.message });
    return { status:'error', message: e.message };
  }
}


/* ============================================================
 *  PATCH — ใส่ trigger call ใน function เดิม
 *  (วาง comment เป็น guide สำหรับแก้ไข)
 * ============================================================ */

/*
  ---- code_part2.gs: saveAttendanceBulk() ----
  หลัง writeJsonSheet_('Attendance', kept.concat(inserted)); เพิ่ม:

    // LINE OA แจ้งเตือนนักเรียนขาด/มาสาย
    try { notifyAttendance_(payload, payload.classroom || ''); } catch(_) {}

  ---- code_part3.gs: saveApproval() ---- (ตอน insert ใหม่)
  หลัง appendJsonRow_('Approvals', obj); เพิ่ม:

    // LINE OA แจ้งเตือนคำขออนุมัติใหม่
    try { notifyNewApproval_(obj); } catch(_) {}

  ---- code_part3.gs: saveTransaction() ---- (ตอน insert ใหม่)
  หลัง appendJsonRow_('Finance', obj); เพิ่ม:

    // LINE OA แจ้งเตือนรายรับ-รายจ่าย
    try { notifyFinance_(obj); } catch(_) {}

  ---- code_part4.gs: saveCalendarEvent() ---- (เฉพาะ is_pinned)
  หลัง appendJsonRow_('Calendar', obj); เพิ่ม:

    // LINE OA แจ้งเตือนประกาศ
    if (obj.is_pinned) { try { notifyAnnouncement_(obj); } catch(_) {} }
*/


/* ============================================================
 *  CLASSROOM MANAGEMENT — จัดการห้องเรียน
 * ============================================================ */
function getClassroomList(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    params = params || {};
    const ay = params.academic_year || getConfig().academic_year;
    let rooms = readJsonSheet_('Classrooms');
    if (ay) rooms = rooms.filter(r => String(r.academic_year) === String(ay));
    const personnel = readJsonSheet_('Personnel');
    const students  = readJsonSheet_('Students');
    const perMap = {};
    personnel.forEach(p => perMap[p.id] = p);
    const enriched = rooms.map(r => {
      const per   = perMap[r.homeroom_teacher_id] || {};
      const count = students.filter(s =>
        s.classroom === r.name && String(s.academic_year) === String(r.academic_year) && s.status === 'active'
      ).length;
      return Object.assign({}, r, {
        teacher_name : per.id ? (per.prefix||'')+(per.first_name||'')+' '+(per.last_name||'') : '-',
        student_count: count
      });
    });
    enriched.sort((a, b) => String(a.name||'').localeCompare(String(b.name||''), 'th'));
    return { status:'success', data:enriched, academic_year:ay };
  } catch(e) {
    logError({ fn:'getClassroomList', error:e.message });
    return { status:'error', message:e.message };
  }
}

function saveClassroom(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    if (!data || !data.grade_level || !data.room_number || !data.academic_year)
      return { status:'error', message:'กรุณากรอกข้อมูลให้ครบ' };
    const name  = data.grade_level.trim() + '/' + data.room_number.trim();
    const clean = {
      name, grade_level: sanitize(data.grade_level), room_number: sanitize(data.room_number),
      academic_year: sanitize(data.academic_year), capacity: Number(data.capacity) || 40,
      homeroom_teacher_id: data.homeroom_teacher_id || '', status: data.status || 'active'
    };
    if (data.id) {
      let updated = null;
      const found = updateJsonById_('Classrooms', data.id, r => {
        Object.assign(r, clean); r.updated_at = new Date().toISOString(); updated = r; return r;
      });
      if (!found) return { status:'error', message:'ไม่พบห้องเรียน' };
      return { status:'success', data:updated, message:'แก้ไขห้องเรียนสำเร็จ' };
    } else {
      const all = readJsonSheet_('Classrooms');
      const dup = all.find(r => r.name === name && String(r.academic_year) === String(clean.academic_year));
      if (dup) return { status:'error', message:'ห้องเรียนนี้มีอยู่แล้ว' };
      const now = new Date().toISOString();
      const obj = Object.assign({ id:generateId() }, clean, { created_at:now, updated_at:now });
      appendJsonRow_('Classrooms', obj);
      return { status:'success', data:obj, message:'เพิ่มห้องเรียนสำเร็จ' };
    }
  } catch(e) {
    logError({ fn:'saveClassroom', error:e.message });
    return { status:'error', message:e.message };
  }
}

function deleteClassroom(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const found = deleteJsonById_('Classrooms', id);
    return found ? { status:'success', message:'ลบห้องเรียนสำเร็จ' }
                 : { status:'error', message:'ไม่พบห้องเรียน' };
  } catch(e) { return { status:'error', message:e.message }; }
}

function getClassroomStudents(classroomName, academicYear, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const ay = academicYear || getConfig().academic_year;
    const students = readJsonSheet_('Students').filter(s =>
      s.classroom === classroomName && String(s.academic_year) === String(ay) && s.status === 'active'
    );
    students.sort((a, b) => String(a.first_name||'').localeCompare(String(b.first_name||''), 'th'));
    return { status:'success', data:students, total:students.length };
  } catch(e) { return { status:'error', message:e.message }; }
}

function transferStudents(studentIds, targetClassroom, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    if (!studentIds || !studentIds.length || !targetClassroom)
      return { status:'error', message:'ข้อมูลไม่ครบ' };
    const idSet = new Set(studentIds);
    const now   = new Date().toISOString();
    const all   = readJsonSheet_('Students');
    let count   = 0;
    all.forEach(s => { if (idSet.has(s.id)) { s.classroom = targetClassroom; s.updated_at = now; count++; } });
    writeJsonSheet_('Students', all);
    return { status:'success', message:'ย้าย ' + count + ' คน → ' + targetClassroom + ' สำเร็จ' };
  } catch(e) {
    logError({ fn:'transferStudents', error:e.message });
    return { status:'error', message:e.message };
  }
}

function getClassroomsForDropdown(sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const ay    = getConfig().academic_year;
    const rooms = readJsonSheet_('Classrooms')
      .filter(r => String(r.academic_year) === String(ay) && r.status === 'active')
      .map(r => r.name);
    const fromStudents = readJsonSheet_('Students').map(s => s.classroom).filter(Boolean);
    const merged = Array.from(new Set([...rooms, ...fromStudents])).sort();
    return { status:'success', data:merged };
  } catch(e) { return { status:'error', message:e.message }; }
}


/* ============================================================
 *  BEHAVIOR — บันทึกคะแนนพฤติกรรม
 * ============================================================ */
var BEHAVIOR_PRESETS = {
  positive: [
    { code:'B01', label:'ช่วยเหลือผู้อื่น',       score: 5  },
    { code:'B02', label:'มาเรียนตรงเวลา',          score: 2  },
    { code:'B03', label:'ทำความดีเด่น',            score:10  },
    { code:'B04', label:'ผ่านการแข่งขัน',          score:15  },
    { code:'B05', label:'เป็นแบบอย่างที่ดี',       score: 8  },
    { code:'B06', label:'รับผิดชอบงานดี',          score: 5  }
  ],
  negative: [
    { code:'N01', label:'มาสาย',                   score: -3  },
    { code:'N02', label:'ขาดเรียนไม่มีเหตุ',       score: -5  },
    { code:'N03', label:'ทะเลาะวิวาท',             score:-15  },
    { code:'N04', label:'ทำลายทรัพย์สิน',          score:-20  },
    { code:'N05', label:'พูดจาไม่สุภาพ',           score: -5  },
    { code:'N06', label:'ไม่ส่งงาน',               score: -3  },
    { code:'N07', label:'ลักขโมย',                 score:-30  },
    { code:'N08', label:'ใช้โทรศัพท์ในชั้นเรียน',  score: -5  }
  ]
};

function getBehaviorPresets(sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    return { status:'success', data:BEHAVIOR_PRESETS };
  } catch(e) { return { status:'error', message:e.message }; }
}

function saveBehaviorRecord(data, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    if (!data.student_id || !data.label || data.score == null)
      return { status:'error', message:'ข้อมูลไม่ครบ' };
    const now = new Date().toISOString();
    const obj = {
      id:generateId(), student_id:data.student_id,
      date:data.date || now.slice(0,10),
      type:Number(data.score) >= 0 ? 'positive' : 'negative',
      code:data.code || '', label:sanitize(data.label),
      score:Number(data.score), note:sanitize(data.note || ''),
      recorded_by:auth.user.id, created_at:now
    };
    appendJsonRow_('Behavior', obj);
    return { status:'success', data:obj, message:'บันทึกพฤติกรรมสำเร็จ' };
  } catch(e) {
    logError({ fn:'saveBehaviorRecord', error:e.message });
    return { status:'error', message:e.message };
  }
}

function getBehaviorRecords(params, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    params = params || {};
    let all = readJsonSheet_('Behavior');
    if (params.student_id) all = all.filter(b => b.student_id === params.student_id);
    if (params.type)       all = all.filter(b => b.type === params.type);
    if (params.date_from)  all = all.filter(b => b.date >= params.date_from);
    if (params.date_to)    all = all.filter(b => b.date <= params.date_to);
    all.sort((a, b) => String(b.date||'').localeCompare(String(a.date||'')));
    return { status:'success', data:all, total:all.length };
  } catch(e) { return { status:'error', message:e.message }; }
}

function getBehaviorSummary(sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const records  = readJsonSheet_('Behavior');
    const students = readJsonSheet_('Students').filter(s => s.status === 'active');
    const summary  = students.map(s => {
      const mine  = records.filter(b => b.student_id === s.id);
      const total = mine.reduce((sum, b) => sum + Number(b.score||0), 0);
      const pos   = mine.filter(b => b.type === 'positive').length;
      const neg   = mine.filter(b => b.type === 'negative').length;
      const risk  = total < -20 ? 'high' : total < 0 ? 'medium' : 'low';
      return {
        student_id:s.id, student_code:s.student_id,
        name:(s.prefix||'')+s.first_name+' '+s.last_name,
        photo:s.photo||'', classroom:s.classroom||'',
        total_score:total, positive_count:pos, negative_count:neg,
        risk_level:risk, events:mine.length
      };
    });
    summary.sort((a, b) => a.total_score - b.total_score);
    return { status:'success', data:summary, total:summary.length };
  } catch(e) { return { status:'error', message:e.message }; }
}

function deleteBehaviorRecord(id, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const ok = deleteJsonById_('Behavior', id);
    return ok ? { status:'success', message:'ลบสำเร็จ' } : { status:'error', message:'ไม่พบรายการ' };
  } catch(e) { return { status:'error', message:e.message }; }
}


/* ============================================================
 *  QR ATTENDANCE — เช็คชื่อผ่าน QR Code
 * ============================================================ */
function recordQRAttendance(studentCode, date, sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken, true);
    if (!auth.ok) return auth.response;
    const student = readJsonSheet_('Students').find(s =>
      s.student_id === studentCode && s.status === 'active'
    );
    if (!student) return { status:'error', message:'ไม่พบรหัสนักเรียน: ' + studentCode };
    const today = date || new Date().toISOString().slice(0,10);
    const all   = readJsonSheet_('Attendance');
    const exist = all.find(a => a.student_id === student.id && a.date === today);
    if (exist) return {
      status:'already', message:'เช็คชื่อไปแล้ว',
      student:{ name:(student.prefix||'')+student.first_name+' '+student.last_name,
                classroom:student.classroom, photo:student.photo, status:exist.status }
    };
    const now = new Date().toISOString();
    const obj = {
      id:generateId(), student_id:student.id, date:today,
      status:'present', note:'QR', recorded_by:auth.user.id, created_at:now
    };
    appendJsonRow_('Attendance', obj);
    return {
      status:'success', message:'เช็คชื่อสำเร็จ',
      student:{ name:(student.prefix||'')+student.first_name+' '+student.last_name,
                classroom:student.classroom, photo:student.photo, status:'present' }
    };
  } catch(e) {
    logError({ fn:'recordQRAttendance', error:e.message });
    return { status:'error', message:e.message };
  }
}


/* ============================================================
 *  getUsersAndTeachers — สำหรับ dropdown "ถึง" ของเอกสาร
 * ============================================================ */
function getUsersAndTeachers(sessionToken) {
  try {
    const auth = _requireAuth_(sessionToken);
    if (!auth.ok) return auth.response;
    const users = readJsonSheet_('Users').filter(u => u.active !== false)
      .map(u => ({ id:u.id, name:u.name||u.username, username:u.username, role:u.role }));
    const teachers = readJsonSheet_('Personnel').filter(p => p.status === 'active' && p.type === 'teacher')
      .map(p => ({ id:p.id, prefix:p.prefix, first_name:p.first_name, last_name:p.last_name }));
    return { status:'success', users:users, teachers:teachers };
  } catch(e) { return { status:'error', message:e.message }; }
}