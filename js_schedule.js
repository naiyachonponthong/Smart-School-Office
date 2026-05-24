/* ============================================================
 *  Smart School Office — js_schedule
 *  ระบบตารางสอน มาตรฐาน สพฐ.
 * ============================================================ */

/* ---------- State ---------- */
const SchedState = {
  tab         : 'class',
  academic_year: '',
  semester    : '1',
  classroom   : '',
  teacher_id  : '',
  classrooms  : [],
  teachers    : [],
  entries     : [],
  periods     : [],
  rooms       : [],
  subjects    : []
};

/* ---------- สีตามกลุ่มสาระ ---------- */
const SUBJECT_COLORS = {
  'ภาษาไทย'           :'#EF4444',
  'คณิตศาสตร์'         :'#3B82F6',
  'วิทยาศาสตร์'        :'#10B981',
  'สังคมศึกษาฯ'        :'#F59E0B',
  'สุขศึกษาและพลศึกษา' :'#EC4899',
  'ศิลปะ'              :'#8B5CF6',
  'การงานอาชีพ'         :'#06B6D4',
  'ภาษาต่างประเทศ'     :'#84CC16',
  'กิจกรรมพัฒนาผู้เรียน':'#6366F1'
};
const DAYS = [
  { no:1, label:'จันทร์',    short:'จ.' },
  { no:2, label:'อังคาร',   short:'อ.' },
  { no:3, label:'พุธ',      short:'พ.' },
  { no:4, label:'พฤหัสบดี', short:'พฤ.' },
  { no:5, label:'ศุกร์',    short:'ศ.' }
];


/* ============================================================
 *  ENTRY POINT
 * ============================================================ */
function renderSchedule(container) {
  const config = (APP.dashboardData && APP.dashboardData.config) || {};
  SchedState.academic_year = config.academic_year || String(new Date().getFullYear() + 543);
  SchedState.semester = config.semester || '1';

  container.innerHTML = `
    ${pageHeader('ตารางสอน', 'bxs-calendar-check', '')}

    <!-- Top Control Bar -->
    <div class="page-card mb-3">
      <div class="page-card-body" style="padding:12px 18px;">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-600">ปีการศึกษา\x3c/span>
            <select id="schedYear" class="sched-select" onchange="onSchedYearSemChange()">
              ${[0,1,2].map(i => {
                const y = String(new Date().getFullYear() + 543 - i);
                return `<option value="${y}" ${SchedState.academic_year===y?'selected':''}>${y}\x3c/option>`;
              }).join('')}
            \x3c/select>
          \x3c/div>
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-600">ภาคเรียน\x3c/span>
            <select id="schedSem" class="sched-select" onchange="onSchedYearSemChange()">
              <option value="1" ${SchedState.semester==='1'?'selected':''}>1\x3c/option>
              <option value="2" ${SchedState.semester==='2'?'selected':''}>2\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="flex-1">\x3c/div>
          ${APP.role !== 'teacher' ? `
          <button class="btn btn-light" onclick="openCopyScheduleDlg()" title="คัดลอกตารางสอน"><i class='bx bx-copy'><\/i> Copy ตารางสอน<\/button>
          <button class="btn btn-light" onclick="openConflictReport()" title="ตรวจสอบ Conflict"><i class='bx bx-error-alt' style="color:#F59E0B;"><\/i> ตรวจ Conflict<\/button>
          ` : ''}
        \x3c/div>
      \x3c/div>
    \x3c/div>

    <!-- Tabs -->
    <div class="page-card">
      <div class="page-card-body">
        <div style="display:flex; gap:2px; flex-wrap:wrap; margin-bottom:18px; background:#F1F5F9; border-radius:12px; padding:4px;">
          ${[
            { id:'class',   icon:'bxs-building',         label:'รายห้องเรียน',   teacherHide: true },
            { id:'teacher', icon:'bxs-user-detail',      label:'ตารางของฉัน' },
            { id:'all',     icon:'bxs-grid-alt',         label:'ภาพรวมทุกห้อง' },
            { id:'rooms',   icon:'bxs-door-open',        label:'ห้องสอน',            teacherHide: true },
            { id:'periods', icon:'bx-time-five',         label:'ตั้งค่าคาบเรียน', teacherHide: true }
          ].filter(t => APP.role !== 'teacher' || !t.teacherHide).map(t => `
            <button id="stab_${t.id}" class="sched-tab ${SchedState.tab===t.id?'active':''}"
                    onclick="switchSchedTab('${t.id}')">
              <i class='bx ${t.icon}'>\x3c/i> ${t.label}
            \x3c/button>
          `).join('')}
        \x3c/div>

        <div id="schedContent">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>

    <style>
      .sched-select {
        padding:6px 10px; border:1.5px solid #E2E8F0; border-radius:8px;
        font-family:inherit; font-size:13px; background:#F8FAFC; font-weight:600;
      }
      .sched-select:focus { outline:none; border-color:#3B82F6; }
      .sched-tab {
        flex:1; min-width:130px; padding:9px 14px; border-radius:8px;
        border:none; background:transparent; font-family:inherit;
        font-size:13px; font-weight:600; color:#64748B; cursor:pointer;
        display:inline-flex; align-items:center; justify-content:center; gap:6px;
        transition:all .15s;
      }
      .sched-tab:hover { background:rgba(255,255,255,.7); color:#1E40AF; }
      .sched-tab.active { background:white; color:#1E40AF; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    \x3c/style>
  `;

  loadSchedData();
}

function onSchedYearSemChange() {
  SchedState.academic_year = document.getElementById('schedYear').value;
  SchedState.semester      = document.getElementById('schedSem').value;
  loadSchedData();
}

function switchSchedTab(tab) {
  SchedState.tab = tab;
  document.querySelectorAll('.sched-tab').forEach(el => {
    el.classList.toggle('active', el.id === 'stab_' + tab);
  });
  renderSchedTab();
}

function loadSchedData() {
  document.getElementById('schedContent').innerHTML =
    '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลดข้อมูล...\x3c/div>';

  // เปลี่ยน tab ไป teacher อัตโนมัติถ้าเป็นครู
  if (APP.role === 'teacher') SchedState.tab = 'teacher';

  // โหลดพร้อมกัน 3 ชุด
  let done = 0;
  const check = () => {
    if (++done < 3) return;
    // ถ้าเป็นครู → เลือกตัวเองอัตโนมัติ
    if (APP.role === 'teacher') {
      const own = SchedState.teachers.find(t =>
        t.personnel_id && APP.user.username &&
        String(t.personnel_id).toLowerCase() === String(APP.user.username).toLowerCase()
      );
      if (own) SchedState.teacher_id = own.id;
    }
    renderSchedTab();
  };

  apiCall('getSchedule', { academic_year:SchedState.academic_year, semester:SchedState.semester, view:'all' })
    .then(res => {
      if (res.status === 'success') {
        SchedState.entries    = res.data;
        SchedState.classrooms = res.classrooms;
        SchedState.teachers   = res.teachers;
      }
      check();
    })
    .catch(() => check());

  apiCall('getPeriodConfig', SchedState.academic_year, SchedState.semester)
    .then(res => {
      if (res.status === 'success') {
        SchedState.periods = res.data.periods || [];
      }
      check();
    })
    .catch(() => check());

  apiCall('getRooms')
    .then(res => {
      if (res.status === 'success') SchedState.rooms = res.data;
      check();
    })
    .catch(() => check());
}

function renderSchedTab() {
  const tab = SchedState.tab;
  if (tab === 'class')   renderClassView();
  else if (tab === 'teacher') renderTeacherView();
  else if (tab === 'all')     renderAllView();
  else if (tab === 'rooms')   renderRoomsTab();
  else if (tab === 'periods') renderPeriodsTab();
}


/* ============================================================
 *  TAB 1 — รายห้องเรียน
 * ============================================================ */
function renderClassView() {
  const area = document.getElementById('schedContent');
  area.innerHTML = `
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-slate-600 whitespace-nowrap">ชั้นเรียน\x3c/span>
        <select id="schedClassroom" class="sched-select" onchange="onClassroomChange()">
          <option value="">เลือกชั้นเรียน\x3c/option>
          ${SchedState.classrooms.map(c => `<option value="${escapeHTML(c)}" ${SchedState.classroom===c?'selected':''}>${escapeHTML(c)}\x3c/option>`).join('')}
        \x3c/select>
      \x3c/div>
      <div class="flex-1">\x3c/div>
      ${SchedState.classroom ? `
        <button class="btn btn-light" onclick="printClassSchedule()">
          <i class='bx bx-printer'>\x3c/i> พิมพ์ตารางสอน
        \x3c/button>
        <button class="btn btn-light" onclick="exportClassScheduleXLS()">
          <i class='bx bx-download'>\x3c/i> Excel
        \x3c/button>
        <button class="btn btn-light" style="color:#EF4444;" onclick="clearClassScheduleConfirm()">
          <i class='bx bx-trash'>\x3c/i> ล้างตาราง
        \x3c/button>
      ` : ''}
    \x3c/div>

    <div id="classGridArea">
      ${SchedState.classroom ? buildScheduleGrid('class') : `
        <div class="empty-state">
          <i class='bx bxs-calendar-check'>\x3c/i>
          เลือกชั้นเรียนเพื่อดูและแก้ไขตารางสอน
        \x3c/div>`}
    \x3c/div>
    ${schedLegend()}
  `;
}

function onClassroomChange() {
  SchedState.classroom = document.getElementById('schedClassroom').value;
  renderClassView();
}


/* ============================================================
 *  TAB 2 — รายครูผู้สอน
 * ============================================================ */
function renderTeacherView() {
  const area = document.getElementById('schedContent');
  area.innerHTML = `
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-slate-600 whitespace-nowrap">ครูผู้สอน\x3c/span>
        <select id="schedTeacher" class="sched-select" onchange="onTeacherChange()" style="min-width:240px;">
          <option value="">เลือกครู\x3c/option>
          ${SchedState.teachers.map(t => `<option value="${t.id}" ${SchedState.teacher_id===t.id?'selected':''}>${escapeHTML(t.name)}\x3c/option>`).join('')}
        \x3c/select>
      \x3c/div>
      <div class="flex-1">\x3c/div>
      ${SchedState.teacher_id ? `
        <button class="btn btn-light" onclick="printTeacherSchedule()">
          <i class='bx bx-printer'>\x3c/i> พิมพ์ตารางสอน
        \x3c/button>
      ` : ''}
    \x3c/div>

    <div id="teacherGridArea">
      ${SchedState.teacher_id ? buildScheduleGrid('teacher') : `
        <div class="empty-state">
          <i class='bx bxs-user-detail'>\x3c/i>
          เลือกครูเพื่อดูตารางสอนรายบุคคล
        \x3c/div>`}
    \x3c/div>
    ${schedLegend()}
  `;
}

function onTeacherChange() {
  SchedState.teacher_id = document.getElementById('schedTeacher').value;
  renderTeacherView();
}


/* ============================================================
 *  TAB 3 — ภาพรวมทุกห้อง
 * ============================================================ */
function renderAllView() {
  const area = document.getElementById('schedContent');
  if (SchedState.classrooms.length === 0) {
    area.innerHTML = '<div class="empty-state"><i class="bx bx-info-circle">\x3c/i>ยังไม่มีห้องเรียน — เพิ่มนักเรียนก่อน\x3c/div>';
    return;
  }
  area.innerHTML = `
    <div class="mb-3 flex items-center gap-3">
      <div class="text-sm font-semibold text-slate-700">
        <i class='bx bxs-grid-alt' style="color:#3B82F6;">\x3c/i> ภาพรวมตารางสอนทุกห้อง
      \x3c/div>
      <div class="flex-1">\x3c/div>
      <button class="btn btn-blue" onclick="exportAllWorkload()">
        <i class='bx bx-download'>\x3c/i> Export ภาระงานครู
      \x3c/button>
    \x3c/div>
    ${buildAllView()}
    ${schedLegend()}
  `;
}

function buildAllView() {
  const periods = SchedState.periods.filter(p => !p.is_break && !p.is_homeroom);
  if (periods.length === 0) return '<div class="empty-state">ยังไม่มีคาบเรียน\x3c/div>';

  const rows = SchedState.classrooms.map(cls => {
    const cells = DAYS.map(d => {
      const dayEntries = SchedState.entries.filter(e => e.classroom === cls && e.day === d.no && !SchedState.periods.find(p=>p.no===e.period_no&&p.is_break));
      const count = dayEntries.length;
      const subjects = [...new Set(dayEntries.map(e => e.subject_group).filter(Boolean))];
      return `
        <td style="text-align:center; padding:6px 4px;">
          <div style="font-size:12px; font-weight:700; color:${count>0?'#1E40AF':'#94A3B8'};">${count > 0 ? count+'คาบ' : '—'}\x3c/div>
          <div style="font-size:10px; color:#64748B; line-height:1.3;">${subjects.slice(0,2).join(', ')}\x3c/div>
        \x3c/td>`;
    });
    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50">
        <td style="padding:8px 12px; font-weight:700; color:#0F172A; white-space:nowrap; width:80px;">
          <button onclick="SchedState.classroom='${cls}'; SchedState.tab='class'; document.getElementById('stab_class').click();"
                  style="color:#3B82F6; background:none; border:none; cursor:pointer; font-family:inherit; font-weight:700; font-size:13px; text-decoration:underline;">
            ${escapeHTML(cls)}
          \x3c/button>
        \x3c/td>
        ${cells.join('')}
        <td style="text-align:center; padding:6px; font-weight:700; font-size:12px; color:#1E40AF;">
          ${SchedState.entries.filter(e => e.classroom === cls && !SchedState.periods.find(p=>p.no===e.period_no&&p.is_break)).length}
        \x3c/td>
      \x3c/tr>`;
  });

  return `
    <div style="overflow-x:auto;">
      <table class="min-w-full" style="border-collapse:collapse; font-size:13px;">
        <thead>
          <tr style="background:#1E40AF; color:white;">
            <th style="padding:10px 12px; text-align:left; border-radius:8px 0 0 0;">ห้องเรียน\x3c/th>
            ${DAYS.map(d => `<th style="padding:10px 12px; text-align:center;">${d.label}\x3c/th>`).join('')}
            <th style="padding:10px 12px; text-align:center; border-radius:0 8px 0 0;">รวม\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>${rows.join('')}\x3c/tbody>
      \x3c/table>
    \x3c/div>
  `;
}


/* ============================================================
 *  GRID BUILDER — ใช้ร่วมกัน (class + teacher view)
 * ============================================================ */
function buildScheduleGrid(view) {
  const periods = SchedState.periods;
  if (!periods || periods.length === 0) {
    return '<div class="empty-state"><i class="bx bxs-time-five">\x3c/i>ยังไม่ได้ตั้งค่าคาบเรียน — ไปที่แท็บ "ตั้งค่าคาบเรียน" ก่อน\x3c/div>';
  }

  // สร้าง Map: day → period_no → entry
  const grid = {};
  DAYS.forEach(d => { grid[d.no] = {}; });

  const filtered = view === 'class'
    ? SchedState.entries.filter(e => e.classroom === SchedState.classroom)
    : SchedState.entries.filter(e => e.teacher_id === SchedState.teacher_id);

  filtered.forEach(e => { if (grid[e.day]) grid[e.day][e.period_no] = e; });

  // Header row
  const headerCells = DAYS.map(d => `
    <th style="width:${100/DAYS.length}%;">
      <div class="font-bold" style="font-size:14px;">วัน${d.label}\x3c/div>
    \x3c/th>`).join('');

  // Body rows
  const bodyRows = periods.map(p => {
    if (p.is_break) {
      return `
        <tr class="break-row">
          <td class="period-label" style="background:#F1F5F9;">
            <div style="font-size:11px; color:#64748B; font-weight:600;">${p.label}\x3c/div>
            <div style="font-size:10px; color:#94A3B8;">${p.start}–${p.end}\x3c/div>
          \x3c/td>
          <td colspan="${DAYS.length}" style="background:#F8FAFC; text-align:center; color:#94A3B8; font-size:12px; font-style:italic;">
            ${p.label}
          \x3c/td>
        \x3c/tr>`;
    }

    const cells = DAYS.map(d => {
      const e = grid[d.no][p.no];
      const isEmpty = !e;
      if (isEmpty) {
        // ช่องว่าง — คลิกเพื่อเพิ่มในแบบรายห้อง
        const canEdit = view === 'class';
        return `
          <td class="sched-cell empty" ${canEdit ? `onclick="openEntryForm(${d.no},${p.no})"` : ''}>
            ${canEdit ? `<div class="add-hint"><i class='bx bx-plus'>\x3c/i>\x3c/div>` : ''}
          \x3c/td>`;
      }
      const cellContent = view === 'class'
        ? `<div class="entry-subject">${escapeHTML(e.subject_name || e.activity_label || '')}\x3c/div>
           <div class="entry-teacher">${escapeHTML(e.teacher_short || e.teacher_name || '')}\x3c/div>
           ${e.room_name ? `<div class="entry-room"><i class='bx bx-door-open'>\x3c/i>${escapeHTML(e.room_name)}\x3c/div>` : ''}`
        : `<div class="entry-subject">${escapeHTML(e.subject_name || e.activity_label || '')}\x3c/div>
           <div class="entry-teacher">ห้อง ${escapeHTML(e.classroom)}\x3c/div>
           ${e.room_name ? `<div class="entry-room"><i class='bx bx-door-open'>\x3c/i>${escapeHTML(e.room_name)}\x3c/div>` : ''}`;

      return `
        <td class="sched-cell filled" onclick="${view==='class'?`openEntryForm(${d.no},${p.no})`:`viewEntryDetail('${e.id}')`}">
          <div class="entry-card" style="border-color:${e.color}; background:${e.color}18;">
            <div class="entry-bar" style="background:${e.color};">\x3c/div>
            <div class="entry-body">
              ${cellContent}
            \x3c/div>
          \x3c/div>
        \x3c/td>`;
    }).join('');

    return `
      <tr class="sched-row">
        <td class="period-label">
          <div style="font-size:11px; font-weight:700; color:#0F172A;">${p.label}\x3c/div>
          <div style="font-size:10px; color:#94A3B8;">${p.start}\x3c/div>
          <div style="font-size:10px; color:#94A3B8;">${p.end}\x3c/div>
        \x3c/td>
        ${cells}
      \x3c/tr>`;
  }).join('');

  return `
    <div style="overflow-x:auto;">
      <table class="sched-grid">
        <thead>
          <tr class="sched-header-row">
            <th class="period-label-header">คาบ / เวลา\x3c/th>
            ${headerCells}
          \x3c/tr>
        \x3c/thead>
        <tbody>${bodyRows}\x3c/tbody>
      \x3c/table>
    \x3c/div>

    <style>
      .sched-grid {
        width:100%; border-collapse:separate; border-spacing:3px;
        table-layout:fixed;
      }
      .sched-header-row th {
        background:#1E40AF; color:white; padding:10px 8px;
        border-radius:8px; font-size:13px;
      }
      .period-label-header { width:80px; font-size:11px; }
      .period-label {
        width:80px; background:#F8FAFC; padding:6px 8px;
        border:1px solid #E2E8F0; border-radius:8px;
        vertical-align:middle; text-align:center;
      }
      .break-row td { height:36px; }

      .sched-cell {
        border:2px dashed #E2E8F0; border-radius:10px; padding:4px;
        vertical-align:top; min-height:72px; cursor:pointer; transition:all .12s;
        position:relative;
      }
      .sched-cell.empty:hover {
        border-color:#3B82F6; background:#EFF6FF;
      }
      .sched-cell.filled { border:none; padding:0; }
      .sched-cell.filled:hover { transform:translateY(-1px); filter:brightness(.96); }

      .add-hint {
        position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        color:#CBD5E1; font-size:22px; transition:color .12s;
      }
      .sched-cell.empty:hover .add-hint { color:#3B82F6; }

      .entry-card {
        border:2px solid; border-radius:8px; overflow:hidden;
        min-height:70px; display:flex; position:relative;
        cursor:pointer; height:100%;
      }
      .entry-bar { width:4px; flex-shrink:0; }
      .entry-body { flex:1; padding:5px 6px; }
      .entry-subject { font-size:11px; font-weight:700; color:#0F172A; line-height:1.3; }
      .entry-teacher { font-size:10px; color:#475569; margin-top:2px; line-height:1.3; }
      .entry-room    { font-size:9px;  color:#94A3B8;  margin-top:1px; display:flex; align-items:center; gap:2px; }

      .sched-row:hover .sched-cell.empty { border-color:#CBD5E1; }
    \x3c/style>
  `;
}

function schedLegend() {
  return `
    <div class="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
      ${Object.keys(SUBJECT_COLORS).map(k => `
        <div class="flex items-center gap-2">
          <span style="width:12px;height:12px;border-radius:3px;background:${SUBJECT_COLORS[k]};flex-shrink:0;">\x3c/span>
          <span class="text-slate-600">${k}\x3c/span>
        \x3c/div>
      `).join('')}
    \x3c/div>
  `;
}


/* ============================================================
 *  ENTRY FORM — เพิ่ม/แก้ไขคาบสอน
 * ============================================================ */
function openEntryForm(day, periodNo) {
  if (!SchedState.classroom) return showToast('warning', 'กรุณาเลือกชั้นเรียนก่อน');

  const period = SchedState.periods.find(p => p.no === periodNo);
  const existing = SchedState.entries.find(e =>
    e.classroom === SchedState.classroom &&
    e.day === Number(day) &&
    e.period_no === Number(periodNo)
  );
  const e = existing || {};
  const dayLabel = DAYS.find(d => d.no === Number(day)) || {};
  const isHomeroom = period && period.is_homeroom;

  // Dropdown subjects ที่เหมาะกับชั้น
  const subjects = SchedState.entries.length >= 0
    ? []
    : [];

  apiCall('getSubjects', { page:1, per_page:500 })
    .then(res => {
      const allSubjects = res.status === 'success' ? res.data : [];
      const relevantSubjects = allSubjects.filter(s => !s.grade_level || s.grade_level === SchedState.classroom);
      showEntryForm(day, periodNo, period, dayLabel, e, relevantSubjects, isHomeroom);
    })
    .catch(() => showEntryForm(day, periodNo, period, dayLabel, e, [], isHomeroom));
}

function showEntryForm(day, periodNo, period, dayLabel, e, subjects, isHomeroom) {
  const isEdit = !!e.id;
  const periodLabel = period ? (period.label + ' (' + period.start + '–' + period.end + ')') : 'คาบ ' + periodNo;

  Swal.fire({
    title: (isEdit ? 'แก้ไข' : 'เพิ่ม') + ' — วัน' + dayLabel.label + ' ' + periodLabel,
    width: 640,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText : isEdit ? 'ยกเลิก' : 'ยกเลิก',
    showDenyButton   : isEdit,
    denyButtonText   : '<i class="bx bx-trash">\x3c/i> ลบคาบนี้',
    denyButtonColor  : '#EF4444',
    html: `
      <div style="text-align:left; font-size:14px;">

        ${isHomeroom ? `
          <div class="mb-3 p-3 rounded-lg" style="background:#EFF6FF;border:1px solid #BFDBFE;">
            <div class="text-xs font-semibold text-blue-700">คาบกิจกรรมหน้าเสาธง / โฮมรูม\x3c/div>
            <div class="text-xs text-slate-600 mt-1">กรอกชื่อกิจกรรมในช่อง "กิจกรรม" หรือเลือกวิชา\x3c/div>
          \x3c/div>
        ` : ''}

        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-12">
            <label class="form-label">รายวิชา <span class="text-xs text-slate-400">(เว้นว่างถ้าเป็นกิจกรรม)\x3c/span>\x3c/label>
            <select id="ef_subject_id" class="form-input" onchange="onSubjectSelect()">
              <option value="">— ไม่มีวิชา / กิจกรรม —\x3c/option>
              ${subjects.map(s => `
                <option value="${s.id}"
                        data-color="${SUBJECT_COLORS[s.subject_group]||'#64748B'}"
                        data-group="${escapeHTML(s.subject_group||'')}"
                        ${e.subject_id===s.id?'selected':''}>
                  ${escapeHTML(s.subject_code||'')} ${escapeHTML(s.subject_name||'')}
                  ${s.grade_level ? `· ${escapeHTML(s.grade_level)}` : ''}
                \x3c/option>
              `).join('')}
            \x3c/select>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">ชื่อกิจกรรม <span class="text-xs text-slate-400">(ถ้าไม่เลือกวิชา)\x3c/span>\x3c/label>
            <input type="text" id="ef_activity_label" class="form-input"
                   placeholder="เช่น กิจกรรมแนะแนว, ชุมนุม, LHR"
                   value="${escapeHTML(e.activity_label||'')}">
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">ครูผู้สอน\x3c/label>
            <select id="ef_teacher_id" class="form-input">
              <option value="">— ไม่ระบุ —\x3c/option>
              ${SchedState.teachers.map(t => `<option value="${t.id}" ${e.teacher_id===t.id?'selected':''}>${escapeHTML(t.name)}${t.department?` (${escapeHTML(t.department)})`:''}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>

          <div class="col-span-8">
            <label class="form-label">ห้องที่ใช้สอน <span class="text-xs text-slate-400">(ถ้าไม่ใช่ห้องเรียนปกติ)\x3c/span>\x3c/label>
            <select id="ef_room_id" class="form-input">
              <option value="">— ห้องเรียนปกติ —\x3c/option>
              ${SchedState.rooms.map(r => `<option value="${r.id}" ${e.room_id===r.id?'selected':''}>${escapeHTML(r.name)} ${r.building?`(${escapeHTML(r.building)})`:''}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>

          <div class="col-span-4">
            <label class="form-label">สีการ์ด\x3c/label>
            <div class="flex gap-2 mt-1 flex-wrap">
              ${Object.values(SUBJECT_COLORS).map(c => `
                <button type="button" class="color-dot" data-color="${c}"
                        style="width:28px;height:28px;border-radius:50%;background:${c};border:3px solid ${e.color===c?'#0F172A':'transparent'};"
                        onclick="selectSchedColor('${c}')">\x3c/button>
              `).join('')}
              <input type="hidden" id="ef_color" value="${e.color||'#3B82F6'}">
            \x3c/div>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">หมายเหตุ\x3c/label>
            <input type="text" id="ef_note" class="form-input" value="${escapeHTML(e.note||'')}">
          \x3c/div>
        \x3c/div>
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
        .form-input:focus { outline:none; border-color:#3B82F6; background:white; }
        .color-dot { cursor:pointer; transition:transform .1s; border-width:3px !important; }
        .color-dot:hover { transform:scale(1.2); }
      \x3c/style>
    `,
    preConfirm: () => ({
      classroom     : SchedState.classroom,
      day           : Number(day),
      period_no     : Number(periodNo),
      academic_year : SchedState.academic_year,
      semester      : SchedState.semester,
      subject_id    : document.getElementById('ef_subject_id').value,
      activity_label: document.getElementById('ef_activity_label').value,
      teacher_id    : document.getElementById('ef_teacher_id').value,
      room_id       : document.getElementById('ef_room_id').value,
      color         : document.getElementById('ef_color').value || '#3B82F6',
      note          : document.getElementById('ef_note').value
    })
  }).then(r => {
    if (r.isDenied) {
      // ลบคาบ
      showLoading('กำลังลบ...');
      apiCall('saveScheduleEntry', r.value)
    .then(res => {
          hideLoading();
          if (res.status === 'success') {
            showToast('success', 'ลบคาบสำเร็จ');
            SchedState.entries = SchedState.entries.filter(x => !(
              x.classroom === SchedState.classroom &&
              x.day === Number(day) &&
              x.period_no === Number(periodNo)
            ));
            renderClassView();
          } else showToast('error', res.message);
        })
        .deleteScheduleEntry(SchedState.classroom, day, periodNo,
          SchedState.academic_year, SchedState.semester, APP.token);
      return;
    }
    if (!r.isConfirmed) return;

    showLoading('กำลังบันทึก...');
    apiCall('join', ''),
            confirmButtonText: 'รับทราบ'
          });
        } else {
          showToast('success', 'บันทึกตารางสอนสำเร็จ');
        }

        // อัพเดต local state
        const idx = SchedState.entries.findIndex(x =>
          x.classroom === SchedState.classroom &&
          x.day === Number(day) &&
          x.period_no === Number(periodNo)
        );
        if (idx >= 0) SchedState.entries[idx] = res.data;
        else          SchedState.entries.push(res.data);

        renderClassView();
      })
    .catch(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); });
  });
}

function onSubjectSelect() {
  const sel = document.getElementById('ef_subject_id');
  const opt = sel.options[sel.selectedIndex];
  const color = opt.dataset.color;
  if (color) {
    document.getElementById('ef_color').value = color;
    document.querySelectorAll('.color-dot').forEach(el => {
      el.style.borderColor = el.dataset.color === color ? '#0F172A' : 'transparent';
    });
  }
}

function selectSchedColor(color) {
  document.getElementById('ef_color').value = color;
  document.querySelectorAll('.color-dot').forEach(el => {
    el.style.borderColor = el.dataset.color === color ? '#0F172A' : 'transparent';
  });
}

function viewEntryDetail(id) {
  const e = SchedState.entries.find(x => x.id === id);
  if (!e) return;
  Swal.fire({
    title: (DAYS.find(d=>d.no===e.day)||{}).label || '',
    html: `
      <div style="text-align:left; font-size:14px;">
        <div style="background:${e.color}18;border-left:3px solid ${e.color};padding:10px 14px;border-radius:8px;margin-bottom:12px;">
          <div style="font-size:16px;font-weight:700;color:${e.color};">${escapeHTML(e.subject_name||e.activity_label||'-')}\x3c/div>
          <div style="font-size:12px;color:#64748B;">${escapeHTML(e.subject_group||'')}\x3c/div>
        \x3c/div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:13px;">
          <span class="text-slate-500">ห้องเรียน:\x3c/span> <span>${escapeHTML(e.classroom)}\x3c/span>
          <span class="text-slate-500">ครูผู้สอน:\x3c/span> <span>${escapeHTML(e.teacher_name||'-')}\x3c/span>
          ${e.room_name ? `<span class="text-slate-500">ห้องสอน:\x3c/span> <span>${escapeHTML(e.room_name)}\x3c/span>` : ''}
          <span class="text-slate-500">คาบที่:\x3c/span> <span>${e.period_no}\x3c/span>
          ${e.note ? `<span class="text-slate-500">หมายเหตุ:\x3c/span> <span>${escapeHTML(e.note)}\x3c/span>` : ''}
        \x3c/div>
      \x3c/div>
    `,
    showCloseButton: true,
    showConfirmButton: false
  });
}


/* ============================================================
 *  TAB 4 — ห้องสอน (Rooms)
 * ============================================================ */
function renderRoomsTab() {
  const area = document.getElementById('schedContent');
  area.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="text-sm font-semibold text-slate-700">
        <i class='bx bxs-door-open' style="color:#3B82F6;">\x3c/i> ห้องเรียน / ห้องปฏิบัติการ
      \x3c/div>
      <button class="btn btn-blue" onclick="openRoomForm()">
        <i class='bx bx-plus'>\x3c/i> เพิ่มห้อง
      \x3c/button>
    \x3c/div>

    <div id="roomsTableArea">
      ${renderRoomsTable()}
    \x3c/div>
  `;
}

function renderRoomsTable() {
  if (SchedState.rooms.length === 0) {
    return '<div class="empty-state"><i class="bx bxs-door-open">\x3c/i>ยังไม่มีห้องสอน — กดเพิ่มห้องใหม่\x3c/div>';
  }
  const typeLabel = { classroom:'ห้องเรียน', lab:'ห้องปฏิบัติการ', special:'ห้องพิเศษ' };
  return `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">ชื่อห้อง\x3c/th>
            <th class="px-3 py-2.5 text-left">อาคาร\x3c/th>
            <th class="px-3 py-2.5 text-center">ความจุ\x3c/th>
            <th class="px-3 py-2.5 text-left">ประเภท\x3c/th>
            <th class="px-3 py-2.5 text-left">สิ่งอำนวยความสะดวก\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">จัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${SchedState.rooms.map(r => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-3 py-2.5 font-semibold text-slate-800">${escapeHTML(r.name)}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(r.building||'-')}\x3c/td>
              <td class="px-3 py-2.5 text-center">${r.capacity||'-'}\x3c/td>
              <td class="px-3 py-2.5">${typeLabel[r.type]||r.type}\x3c/td>
              <td class="px-3 py-2.5 text-xs text-slate-500">${Array.isArray(r.facilities)?r.facilities.join(', '):'-'}\x3c/td>
              <td class="px-3 py-2.5 text-center">
                <div class="flex justify-center gap-1">
                  <button class="btn btn-light btn-icon" onclick="openRoomForm('${r.id}')" style="color:#3B82F6;">
                    <i class='bx bx-edit'>\x3c/i>
                  \x3c/button>
                  <button class="btn btn-light btn-icon" onclick="deleteRoomConfirm('${r.id}')" style="color:#EF4444;">
                    <i class='bx bx-trash'>\x3c/i>
                  \x3c/button>
                \x3c/div>
              \x3c/td>
            \x3c/tr>
          `).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
  `;
}

function openRoomForm(id) {
  const r = id ? (SchedState.rooms.find(x => x.id === id) || {}) : {};
  const facOptions = ['โปรเจคเตอร์','TV/จอแสดงผล','แอร์','อุปกรณ์วิทยาศาสตร์','คอมพิวเตอร์','อินเทอร์เน็ต','เปียโน/ดนตรี','อุปกรณ์กีฬา'];

  Swal.fire({
    title: id ? 'แก้ไขห้อง' : 'เพิ่มห้องใหม่',
    width: 560,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="rf_id" value="${escapeHTML(id||'')}">
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-8">
            <label class="form-label">ชื่อห้อง <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="rf_name" class="form-input" placeholder="ห้อง 201, Lab วิทย์ ..." value="${escapeHTML(r.name||'')}">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">ประเภท\x3c/label>
            <select id="rf_type" class="form-input">
              <option value="classroom" ${(r.type||'classroom')==='classroom'?'selected':''}>ห้องเรียน\x3c/option>
              <option value="lab"       ${r.type==='lab'?'selected':''}>ห้องปฏิบัติการ\x3c/option>
              <option value="special"   ${r.type==='special'?'selected':''}>ห้องพิเศษ\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">อาคาร\x3c/label>
            <input type="text" id="rf_building" class="form-input" placeholder="อาคาร 1, อาคารวิทย์ ..." value="${escapeHTML(r.building||'')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ความจุ (คน)\x3c/label>
            <input type="number" id="rf_capacity" class="form-input" value="${r.capacity||40}">
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">สิ่งอำนวยความสะดวก\x3c/label>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;">
              ${facOptions.map(f => `
                <label style="display:flex; align-items:center; gap:6px; font-size:13px; cursor:pointer;">
                  <input type="checkbox" class="rf_fac" value="${f}"
                         ${Array.isArray(r.facilities)&&r.facilities.includes(f)?'checked':''}>
                  ${f}
                \x3c/label>
              `).join('')}
            \x3c/div>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">หมายเหตุ\x3c/label>
            <input type="text" id="rf_note" class="form-input" value="${escapeHTML(r.note||'')}">
          \x3c/div>
        \x3c/div>
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
        .form-input:focus { outline:none; border-color:#3B82F6; background:white; }
      \x3c/style>
    `,
    preConfirm: () => {
      const name = document.getElementById('rf_name').value.trim();
      if (!name) { Swal.showValidationMessage('กรุณากรอกชื่อห้อง'); return false; }
      const facs = Array.from(document.querySelectorAll('.rf_fac:checked')).map(el => el.value);
      return {
        id      : document.getElementById('rf_id').value || null,
        name, building: document.getElementById('rf_building').value,
        type    : document.getElementById('rf_type').value,
        capacity: document.getElementById('rf_capacity').value,
        facilities: facs,
        note    : document.getElementById('rf_note').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('savePeriodConfig', {
      academic_year: SchedState.academic_year,
      semester     : SchedState.semester,
      periods      : periods,
      work_days    : [1,2,3,4,5]
    })
    .then(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message);
          // อัพเดต state
          if (id) {
            const idx = SchedState.rooms.findIndex(x => x.id === id);
            if (idx >= 0) SchedState.rooms[idx] = res.data;
          } else {
            SchedState.rooms.push(res.data);
          }
          renderRoomsTab();
        } else Swal.fire({ icon:'error', text:res.message });
      })
      .saveRoom(r.value)
    .then(res => {
        hideLoading();
        if (res.status !== 'success') return Swal.fire({ icon:'error', text:res.message });

        // แจ้งเตือน conflict
        if (res.conflict_warnings && res.conflict_warnings.length > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'บันทึกแล้ว — แต่มีข้อควรระวัง',
            html: res.conflict_warnings.map(w => `<div style="font-size:13px; margin-bottom:6px;">⚠️ ${escapeHTML(w.message)}\x3c/div>`)
    .catch(() => {});
  });
}

function deleteRoomConfirm(id) {
  Swal.fire({
    title:'ยืนยันการลบห้อง?', icon:'warning',
    showCancelButton:true, confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก', confirmButtonColor:'#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    apiCall('deleteRoom', id)
    .then(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message);
          SchedState.rooms = SchedState.rooms.filter(x => x.id !== id);
          renderRoomsTab();
        } else showToast('error', res.message);
      })
    .catch(() => {});
  });
}


/* ============================================================
 *  TAB 5 — ตั้งค่าคาบเรียน
 * ============================================================ */
function renderPeriodsTab() {
  const area = document.getElementById('schedContent');
  const periods = SchedState.periods.length > 0 ? SchedState.periods : [];

  area.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="text-sm font-semibold text-slate-700">
        <i class='bx bx-time-five' style="color:#3B82F6;">\x3c/i> ตั้งค่าคาบเรียน — ปีการศึกษา ${escapeHTML(SchedState.academic_year)} ภาคเรียน ${SchedState.semester}
      \x3c/div>
      <div class="flex gap-2">
        <button class="btn btn-light" onclick="resetDefaultPeriods()">
          <i class='bx bx-reset'>\x3c/i> รีเซ็ตเป็นค่ามาตรฐาน สพฐ.
        \x3c/button>
        <button class="btn btn-blue" onclick="savePeriodConfig()">
          <i class='bx bx-save'>\x3c/i> บันทึกคาบเรียน
        \x3c/button>
      \x3c/div>
    \x3c/div>

    <div class="page-card mb-3">
      <div class="page-card-body">
        <div class="text-xs text-slate-500 mb-3">
          <i class='bx bx-info-circle text-blue-500'>\x3c/i>
          คาบที่ติ๊ก "พัก/กิจกรรม" จะไม่แสดงในตารางสอนหลัก แต่แสดงเป็นแถวคั่น
        \x3c/div>
        <div style="overflow-x:auto;">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
                <th class="px-3 py-2 text-center" style="width:50px;">ลำดับ\x3c/th>
                <th class="px-3 py-2 text-left">ชื่อคาบ\x3c/th>
                <th class="px-3 py-2 text-center" style="width:110px;">เริ่ม\x3c/th>
                <th class="px-3 py-2 text-center" style="width:110px;">สิ้นสุด\x3c/th>
                <th class="px-3 py-2 text-center" style="width:100px;">พัก/กิจกรรม\x3c/th>
                <th class="px-3 py-2 text-center" style="width:50px;">\x3c/th>
              \x3c/tr>
            \x3c/thead>
            <tbody id="periodsTableBody">
              ${periods.map((p, i) => buildPeriodRow(p, i)).join('')}
            \x3c/tbody>
          \x3c/table>
        \x3c/div>
        <button class="btn btn-light mt-3" onclick="addPeriodRow()">
          <i class='bx bx-plus'>\x3c/i> เพิ่มคาบ
        \x3c/button>
      \x3c/div>
    \x3c/div>

    <style>
      .prd-input { padding:5px 8px; border:1.5px solid #E2E8F0; border-radius:6px; font-family:inherit; font-size:12px; background:#F8FAFC; box-sizing:border-box; width:100%; }
      .prd-input:focus { outline:none; border-color:#3B82F6; }
    \x3c/style>
  `;
}

function buildPeriodRow(p, i) {
  return `
    <tr data-pi="${i}" class="border-b border-slate-100">
      <td class="px-2 py-1.5 text-center text-slate-500">
        <input type="number" class="prd-input prd-no" value="${p.no}" style="width:50px; text-align:center;">
      \x3c/td>
      <td class="px-2 py-1.5">
        <input type="text" class="prd-input prd-label" value="${escapeHTML(p.label||'')}">
      \x3c/td>
      <td class="px-2 py-1.5">
        <input type="time" class="prd-input prd-start" value="${p.start||''}">
      \x3c/td>
      <td class="px-2 py-1.5">
        <input type="time" class="prd-input prd-end" value="${p.end||''}">
      \x3c/td>
      <td class="px-2 py-1.5 text-center">
        <input type="checkbox" class="prd-break" ${p.is_break?'checked':''}>
      \x3c/td>
      <td class="px-2 py-1.5 text-center">
        <button class="btn btn-light btn-icon" onclick="removePeriodRow(this)" title="ลบ" style="color:#EF4444; width:28px; height:28px;">
          <i class='bx bx-minus' style="font-size:14px;">\x3c/i>
        \x3c/button>
      \x3c/td>
    \x3c/tr>
  `;
}

function addPeriodRow() {
  const tbody = document.getElementById('periodsTableBody');
  const i = tbody.querySelectorAll('tr').length;
  const tr = document.createElement('tr');
  tr.dataset.pi = i;
  tr.className = 'border-b border-slate-100';
  tr.innerHTML = buildPeriodRow({ no: i+1, label: 'คาบที่ '+(i+1), start:'', end:'', is_break:false }, i).replace(/<tr[^>]*>|<\/tr>/g,'');
  tbody.appendChild(tr);
}

function removePeriodRow(btn) {
  btn.closest('tr').remove();
}

function resetDefaultPeriods() {
  Swal.fire({
    title:'รีเซ็ตเป็นค่ามาตรฐาน สพฐ.?',
    text: '7 คาบ + หน้าเสาธง + พักกลางวัน',
    icon:'question',
    showCancelButton: true,
    confirmButtonText:'รีเซ็ต',
    cancelButtonText:'ยกเลิก'
  }).then(r => {
    if (!r.isConfirmed) return;
    SchedState.periods = [
      { no:0, label:'กิจกรรมหน้าเสาธง', start:'08:00', end:'08:30', is_break:true  },
      { no:1, label:'คาบที่ 1',          start:'08:30', end:'09:20', is_break:false },
      { no:2, label:'คาบที่ 2',          start:'09:20', end:'10:10', is_break:false },
      { no:3, label:'คาบที่ 3',          start:'10:10', end:'11:00', is_break:false },
      { no:4, label:'คาบที่ 4',          start:'11:00', end:'11:50', is_break:false },
      { no:5, label:'พักกลางวัน',        start:'11:50', end:'12:50', is_break:true  },
      { no:6, label:'คาบที่ 5',          start:'12:50', end:'13:40', is_break:false },
      { no:7, label:'คาบที่ 6',          start:'13:40', end:'14:30', is_break:false },
      { no:8, label:'คาบที่ 7',          start:'14:30', end:'15:20', is_break:false }
    ];
    renderPeriodsTab();
    showToast('success', 'รีเซ็ตแล้ว — กด "บันทึกคาบเรียน" เพื่อบันทึก');
  });
}

function savePeriodConfig() {
  const rows = document.querySelectorAll('#periodsTableBody tr');
  const periods = Array.from(rows).map(tr => ({
    no      : Number(tr.querySelector('.prd-no').value)    || 0,
    label   : tr.querySelector('.prd-label').value.trim(),
    start   : tr.querySelector('.prd-start').value,
    end     : tr.querySelector('.prd-end').value,
    is_break: tr.querySelector('.prd-break').checked
  })).filter(p => p.label);

  if (periods.length === 0) return showToast('warning', 'กรุณาเพิ่มคาบเรียนอย่างน้อย 1 คาบ');

  showLoading('กำลังบันทึก...');
  apiCall('catch', err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); });
}


/* ============================================================
 *  PRINT
 * ============================================================ */
function printClassSchedule() {
  if (!SchedState.classroom) return showToast('warning', 'เลือกห้องเรียนก่อน');
  showLoading('กำลังเตรียมเอกสาร...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html);
    })
    .generateSchedulePrintHTML(SchedState.classroom, SchedState.academic_year, SchedState.semester)
    .then(res => {
      hideLoading();
      if (res.status === 'success') {
        SchedState.periods = res.data.periods;
        showToast('success', res.message);
      } else Swal.fire({ icon:'error', text:res.message });
    })
    .catch(() => {});
}

function printTeacherSchedule() {
  if (!SchedState.teacher_id) return showToast('warning', 'เลือกครูก่อน');
  showLoading('กำลังเตรียมเอกสาร...');
  apiCall('generateTeacherScheduleHTML', SchedState.teacher_id, SchedState.academic_year, SchedState.semester)
    .then(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html);
    })
    .catch(() => {});
}


/* ============================================================
 *  EXPORT / WORKLOAD
 * ============================================================ */
function exportClassScheduleXLS() {
  if (!SchedState.classroom) return;
  const cls = SchedState.classroom;
  const periods = SchedState.periods.filter(p => !p.is_break);

  const headers = ['คาบ / เวลา', ...DAYS.map(d => 'วัน' + d.label)];
  const rows = periods.map(p => {
    const cells = DAYS.map(d => {
      const e = SchedState.entries.find(x => x.classroom===cls && x.day===d.no && x.period_no===p.no);
      if (!e) return '';
      return (e.subject_name || e.activity_label || '') + (e.teacher_name ? ' (' + e.teacher_name + ')' : '');
    });
    return [p.label + ' ' + p.start + '–' + p.end, ...cells];
  });
  exportToExcel(headers, rows, 'ตารางสอน_' + cls + '_' + SchedState.academic_year + '_' + SchedState.semester + '.xls');
  showToast('success', 'ดาวน์โหลดสำเร็จ');
}

function exportAllWorkload() {
  showLoading('กำลังคำนวณภาระงาน...');
  apiCall('getTeacherWorkload', SchedState.academic_year, SchedState.semester)
    .then(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      const headers = ['ชื่อ-นามสกุล','ฝ่าย/กลุ่มสาระ','จำนวนคาบ/สัปดาห์','ห้องที่สอน','วิชาที่สอน'];
      const rows = res.data.map(t => [
        t.teacher_name, t.department, t.periods_total,
        t.classrooms.join(', '), t.subjects_taught.join(', ')
      ]);
      exportToExcel(headers, rows, 'ภาระงานสอน_' + SchedState.academic_year + '_' + SchedState.semester + '.xls');
      showToast('success', 'ดาวน์โหลดสำเร็จ');
    })
    .catch(() => {});
}


/* ============================================================
 *  CONFLICT CHECK
 * ============================================================ */
function openConflictReport() {
  showLoading('กำลังตรวจสอบ...');
  apiCall('join', '')}
          \x3c/div>
        `
      });
    })
    .getAllConflicts(SchedState.academic_year, SchedState.semester)
    .then(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);

      if (res.total === 0) {
        return Swal.fire({ icon:'success', title:'ไม่พบ Conflict!', text:'ตารางสอนไม่มีความขัดแย้ง', timer:2000 });
      }

      Swal.fire({
        title: 'พบ Conflict ' + res.total + ' รายการ',
        width: 680,
        icon: 'warning',
        showCloseButton: true,
        showConfirmButton: false,
        html: `
          <div style="text-align:left; max-height:400px; overflow-y:auto;">
            ${res.conflicts.map(c => `
              <div style="background:#FEF3C7; border-left:3px solid #F59E0B; padding:10px 14px; border-radius:0 8px 8px 0; margin-bottom:10px;">
                <div style="font-weight:700; color:#92400E; font-size:13px;">
                  ${c.type === 'teacher' ? '<i class="bx bxs-user">\x3c/i>' : '<i class="bx bxs-door-open">\x3c/i>'}
                  วัน${(DAYS.find(d=>d.no===c.day)||{}).label||c.day} คาบที่ ${c.period_no}
                \x3c/div>
                <div style="font-size:13px; color:#78350F; margin-top:4px;">${escapeHTML(c.message)}\x3c/div>
              \x3c/div>
            `)
    .catch(() => {});
}


/* ============================================================
 *  COPY SCHEDULE
 * ============================================================ */
function openCopyScheduleDlg() {
  const year = SchedState.academic_year;
  const nextYear = String(Number(year) + 1);
  Swal.fire({
    title: 'คัดลอกตารางสอน',
    width: 540,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-copy">\x3c/i> คัดลอก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <div class="text-xs text-slate-500 mb-3">คัดลอกตารางสอนทั้งหมดจากเทอมหนึ่งไปอีกเทอม\x3c/div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm font-semibold text-slate-700 mb-2">ต้นทาง\x3c/div>
            <div>
              <label class="form-label">ปีการศึกษา\x3c/label>
              <select id="cp_from_year" class="form-input">
                ${[year, String(Number(year)-1)].map(y => `<option value="${y}">${y}\x3c/option>`).join('')}
              \x3c/select>
            \x3c/div>
            <div class="mt-2">
              <label class="form-label">ภาคเรียน\x3c/label>
              <select id="cp_from_sem" class="form-input">
                <option value="1">1\x3c/option><option value="2">2\x3c/option>
              \x3c/select>
            \x3c/div>
          \x3c/div>
          <div>
            <div class="text-sm font-semibold text-slate-700 mb-2">ปลายทาง\x3c/div>
            <div>
              <label class="form-label">ปีการศึกษา\x3c/label>
              <select id="cp_to_year" class="form-input">
                ${[year, nextYear].map(y => `<option value="${y}" ${y===nextYear?'selected':''}>${y}\x3c/option>`).join('')}
              \x3c/select>
            \x3c/div>
            <div class="mt-2">
              <label class="form-label">ภาคเรียน\x3c/label>
              <select id="cp_to_sem" class="form-input">
                <option value="1">1\x3c/option><option value="2">2\x3c/option>
              \x3c/select>
            \x3c/div>
          \x3c/div>
        \x3c/div>
        <div class="mt-3 p-3 rounded-lg" style="background:#FEF3C7; border:1px solid #F59E0B;">
          <div class="text-xs text-amber-800"><i class='bx bx-error'>\x3c/i> ระบบจะลบตารางสอนเดิมของปลายทางก่อน แล้ว copy ใหม่ทั้งหมด\x3c/div>
        \x3c/div>
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
      \x3c/style>
    `,
    preConfirm: () => ({
      fromYear: document.getElementById('cp_from_year').value,
      fromSem : document.getElementById('cp_from_sem').value,
      toYear  : document.getElementById('cp_to_year').value,
      toSem   : document.getElementById('cp_to_sem').value
    })
  }).then(r => {
    if (!r.isConfirmed) return;
    const d = r.value;
    if (d.fromYear === d.toYear && d.fromSem === d.toSem) {
      return showToast('warning', 'ต้นทางและปลายทางต้องไม่เหมือนกัน');
    }
    showLoading('กำลัง Copy...');
    apiCall('copyScheduleSemester', d.fromYear, d.fromSem, d.toYear, d.toSem)
    .then(res => {
        hideLoading();
        if (res.status === 'success') Swal.fire({ icon:'success', title:'สำเร็จ', text:res.message });
        else Swal.fire({ icon:'error', text:res.message });
      })
    .catch(() => {});
  });
}


/* ============================================================
 *  CLEAR CLASSROOM
 * ============================================================ */
function clearClassScheduleConfirm() {
  if (!SchedState.classroom) return;
  Swal.fire({
    title: 'ล้างตารางสอน ' + SchedState.classroom + '?',
    text : 'ข้อมูลทั้งหมดของห้องนี้จะถูกลบ',
    icon:'warning',
    showCancelButton:true,
    confirmButtonText:'ล้างทั้งหมด',
    cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังล้าง...');
    apiCall('clearClassroomSchedule', SchedState.classroom, SchedState.academic_year, SchedState.semester)
    .then(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message);
          SchedState.entries = SchedState.entries.filter(e => e.classroom !== SchedState.classroom);
          renderClassView();
        } else showToast('error', res.message);
      })
    .catch(() => {});
  });
}