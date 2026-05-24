/* ============================================================
 *  Smart School Office — js4 (FINAL)
 *  Part 4: Reports | Calendar | Files | Users | Settings
 * ============================================================ */


/* ============================================================
 *  REPORTS
 * ============================================================ */
function renderReports(container) {
  container.innerHTML = `
    ${pageHeader('รายงาน', 'bxs-bar-chart-alt-2', '')}

    <!-- Stat counts -->
    <div id="repCounts" class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">\x3c/div>

    <!-- Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      <div class="page-card">
        <div class="page-card-header"><h2><i class='bx bx-line-chart' style="color:#3B82F6;">\x3c/i> การเข้าเรียน 30 วันย้อนหลัง\x3c/h2>\x3c/div>
        <div class="page-card-body">
          <div style="height:240px; position:relative;"><canvas id="repChartAttendance">\x3c/canvas>\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="page-card">
        <div class="page-card-header"><h2><i class='bx bx-bar-chart' style="color:#10B981;">\x3c/i> การเงินรายเดือน\x3c/h2>\x3c/div>
        <div class="page-card-body">
          <div style="height:240px; position:relative;"><canvas id="repChartFinance">\x3c/canvas>\x3c/div>
        \x3c/div>
      \x3c/div>

      <div class="page-card">
        <div class="page-card-header"><h2><i class='bx bx-pie-chart-alt-2' style="color:#F59E0B;">\x3c/i> นักเรียนแยกตามชั้น\x3c/h2>\x3c/div>
        <div class="page-card-body">
          <div style="height:240px; position:relative;"><canvas id="repChartGrade">\x3c/canvas>\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="page-card">
        <div class="page-card-header"><h2><i class='bx bx-user-circle' style="color:#8B5CF6;">\x3c/i> บุคลากรแยกตามฝ่าย\x3c/h2>\x3c/div>
        <div class="page-card-body">
          <div style="height:240px; position:relative;"><canvas id="repChartDept">\x3c/canvas>\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>

    <!-- Export Section -->
    <div class="page-card">
      <div class="page-card-header"><h2><i class='bx bx-download' style="color:#3B82F6;">\x3c/i> ดาวน์โหลดรายงาน\x3c/h2>\x3c/div>
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${[
            { id:'students_by_grade',   title:'รายชื่อนักเรียนแยกตามชั้น', icon:'bxs-user-detail', color:'#3B82F6' },
            { id:'attendance_summary',  title:'สรุปการเข้าเรียน',         icon:'bxs-check-square', color:'#10B981' },
            { id:'finance_summary',     title:'สรุปการเงิน',              icon:'bxs-wallet',      color:'#F59E0B' },
            { id:'gpa_by_grade',        title:'GPA นักเรียน',             icon:'bxs-trophy',      color:'#8B5CF6' },
            { id:'personnel_list',      title:'รายชื่อบุคลากร',           icon:'bxs-group',       color:'#06B6D4' }
          ].map(r => `
            <div class="report-card" onclick="openReportDialog('${r.id}', '${r.title}')">
              <div class="ic" style="background:${r.color}1A; color:${r.color};">
                <i class='bx ${r.icon}'>\x3c/i>
              \x3c/div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-slate-800">${r.title}\x3c/div>
                <div class="text-xs text-slate-500 mt-1">กดเพื่อ Export Excel\x3c/div>
              \x3c/div>
              <i class='bx bx-chevron-right text-slate-400'>\x3c/i>
            \x3c/div>
          `).join('')}
        \x3c/div>
      \x3c/div>
    \x3c/div>

    <style>
      .report-card {
        background:white; border:1px solid #F1F5F9; border-radius:14px;
        padding:14px; display:flex; align-items:center; gap:12px;
        cursor:pointer; transition:all .15s;
      }
      .report-card:hover { border-color:#3B82F6; transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,.06); }
      .report-card .ic {
        width:46px; height:46px; border-radius:12px;
        display:flex; align-items:center; justify-content:center;
        font-size:22px; flex-shrink:0;
      }
    \x3c/style>
  `;

  loadReportsOverview();
}

function loadReportsOverview() {
  apiCall('getReportsOverview', APP.token);
}

function renderReportsOverview(d) {
  // counts
  document.getElementById('repCounts').innerHTML = `
    <div class="stat-card s1">
      <div class="icon-wrap"><i class='bx bxs-user-detail'>\x3c/i>\x3c/div>
      <div class="label">นักเรียน\x3c/div>
      <div class="value">${formatNumber(d.counts.students_active)}\x3c/div>
    \x3c/div>
    <div class="stat-card s2">
      <div class="icon-wrap"><i class='bx bxs-group'>\x3c/i>\x3c/div>
      <div class="label">บุคลากร\x3c/div>
      <div class="value">${formatNumber(d.counts.personnel_active)}\x3c/div>
    \x3c/div>
    <div class="stat-card s3">
      <div class="icon-wrap"><i class='bx bxs-book-content'>\x3c/i>\x3c/div>
      <div class="label">รายวิชา\x3c/div>
      <div class="value">${formatNumber(d.counts.subjects)}\x3c/div>
    \x3c/div>
    <div class="stat-card s4">
      <div class="icon-wrap"><i class='bx bxs-bell-ring'>\x3c/i>\x3c/div>
      <div class="label">รออนุมัติ\x3c/div>
      <div class="value">${formatNumber(d.counts.approvals_pending + d.counts.registrations_pending)}\x3c/div>
    \x3c/div>
  `;

  // Chart: Attendance 30 days
  const ctxA = document.getElementById('repChartAttendance');
  if (ctxA) {
    APP.charts.repAttendance = new Chart(ctxA, {
      type: 'line',
      data: {
        labels: d.attendance_30days.map(x => x.date.slice(8,10)),
        datasets: [{
          label: '% เข้าเรียน',
          data: d.attendance_30days.map(x => x.pct),
          borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,.15)',
          fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min:0, max:100, ticks:{ stepSize:25, callback:v => v+'%' }, grid:{ color:'#F1F5F9' } },
          x: { grid:{ display:false }, ticks:{ maxRotation:0, autoSkip:true, maxTicksLimit:10 } }
        }
      }
    });
  }

  // Chart: Finance Monthly
  const ctxF = document.getElementById('repChartFinance');
  if (ctxF) {
    APP.charts.repFinance = new Chart(ctxF, {
      type: 'bar',
      data: {
        labels: d.finance_monthly.map(x => x.ym.slice(2)),
        datasets: [
          { label:'รายรับ', data:d.finance_monthly.map(x => x.income),  backgroundColor:'#10B981', borderRadius:6 },
          { label:'รายจ่าย',data:d.finance_monthly.map(x => x.expense), backgroundColor:'#EF4444', borderRadius:6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position:'bottom', labels:{ font:{ family:'Sarabun', size:12 }, padding:10, boxWidth:12 } } },
        scales: {
          y: { grid:{ color:'#F1F5F9' }, ticks:{ callback:v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v } },
          x: { grid:{ display:false } }
        }
      }
    });
  }

  // Chart: Students by Grade (doughnut)
  const ctxG = document.getElementById('repChartGrade');
  if (ctxG) {
    const labels = Object.keys(d.student_by_grade).sort();
    APP.charts.repGrade = new Chart(ctxG, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: labels.map(l => d.student_by_grade[l]),
          backgroundColor: ['#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#EF4444','#84CC16','#F97316','#6366F1'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '60%',
        plugins: { legend: { position:'right', labels:{ font:{ family:'Sarabun', size:11 }, boxWidth:10, padding:8 } } }
      }
    });
  }

  // Chart: Personnel by Department
  const ctxD = document.getElementById('repChartDept');
  if (ctxD) {
    const labels = Object.keys(d.personnel_by_dept);
    APP.charts.repDept = new Chart(ctxD, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: labels.map(l => d.personnel_by_dept[l]),
          backgroundColor: '#8B5CF6', borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid:{ display:false } },
          x: { grid:{ color:'#F1F5F9' }, ticks:{ stepSize:1, precision:0 } }
        }
      }
    });
  }
}

function openReportDialog(reportType, title) {
  // ฟอร์มเลือก parameters
  const today = new Date().toISOString().slice(0,10);
  const monthAgo = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0,10); })();

  let extraHtml = '';
  if (reportType === 'students_by_grade' || reportType === 'attendance_summary' || reportType === 'gpa_by_grade') {
    extraHtml = `
      <div>
        <label class="form-label">ชั้นเรียน (เว้นว่าง = ทุกชั้น)\x3c/label>
        <input type="text" id="rep_classroom" class="form-input" placeholder="เช่น ม.1/1">
      \x3c/div>`;
  }
  if (reportType === 'attendance_summary' || reportType === 'finance_summary') {
    extraHtml += `
      <div class="grid grid-cols-2 gap-2 mt-2">
        <div>
          <label class="form-label">ตั้งแต่วันที่\x3c/label>
          <input type="date" id="rep_start" class="form-input" value="${monthAgo}">
        \x3c/div>
        <div>
          <label class="form-label">ถึงวันที่\x3c/label>
          <input type="date" id="rep_end" class="form-input" value="${today}">
        \x3c/div>
      \x3c/div>`;
  }
  if (reportType === 'gpa_by_grade') {
    extraHtml += `
      <div class="mt-2">
        <label class="form-label">ปีการศึกษา (เว้นว่าง = ทุกปี)\x3c/label>
        <input type="text" id="rep_year" class="form-input" placeholder="2569">
      \x3c/div>`;
  }

  Swal.fire({
    title: title,
    width: 500,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-download">\x3c/i> ดาวน์โหลด Excel',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left;">
        ${extraHtml || '<div class="text-sm text-slate-600">กด "ดาวน์โหลด" เพื่อสร้างรายงาน\x3c/div>'}
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
      \x3c/style>
    `,
    preConfirm: () => ({
      classroom    : (document.getElementById('rep_classroom') || {}).value || '',
      start        : (document.getElementById('rep_start')     || {}).value || '',
      end          : (document.getElementById('rep_end')       || {}).value || '',
      academic_year: (document.getElementById('rep_year')      || {}).value || ''
    })
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังสร้างรายงาน...');
    apiCall('toISOString', ).slice(0,10) + '.xls');
        showToast('success', 'ดาวน์โหลดสำเร็จ');
      })
      .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
      .generateReport(reportType, r.value)
    .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      renderReportsOverview(res.data);
    })
    .catch(err => showToast('error', err.message || err));
  });
}


/* ============================================================
 *  CALENDAR
 * ============================================================ */
const CalendarState = {
  year : new Date().getFullYear(),
  month: new Date().getMonth() + 1,   // 1-12
  events: []
};

const EVENT_TYPES = {
  academic: { label:'วิชาการ',  color:'#3B82F6' },
  activity: { label:'กิจกรรม',  color:'#10B981' },
  meeting : { label:'ประชุม',   color:'#F59E0B' },
  holiday : { label:'วันหยุด',  color:'#EF4444' },
  general : { label:'ทั่วไป',    color:'#64748B' }
};

function renderCalendar(container) {
  container.innerHTML = `
    ${pageHeader('ปฏิทินและข่าวสาร', 'bxs-calendar-event', `
      ${APP.role !== 'teacher' ? `<button class="btn btn-blue" onclick="openCalendarForm()"><i class='bx bx-plus'>\x3c/i> เพิ่มเหตุการณ์<\/button>` : ''}
    `)}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- Calendar Grid -->
      <div class="lg:col-span-2">
        <div class="page-card">
          <div class="page-card-body">
            <div class="flex items-center justify-between mb-4">
              <button class="btn btn-light btn-icon" onclick="calNav(-1)">
                <i class='bx bx-chevron-left'>\x3c/i>
              \x3c/button>
              <div class="text-center">
                <div id="calMonthLabel" class="text-lg font-bold text-slate-800">\x3c/div>
                <button class="text-xs text-blue-600 hover:underline" onclick="calToday()">วันนี้\x3c/button>
              \x3c/div>
              <button class="btn btn-light btn-icon" onclick="calNav(1)">
                <i class='bx bx-chevron-right'>\x3c/i>
              \x3c/button>
            \x3c/div>

            <div id="calGrid">\x3c/div>

            <div class="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
              ${Object.keys(EVENT_TYPES).map(k => `
                <div class="flex items-center gap-2">
                  <span style="width:12px; height:12px; border-radius:3px; background:${EVENT_TYPES[k].color};">\x3c/span>
                  <span class="text-slate-600">${EVENT_TYPES[k].label}\x3c/span>
                \x3c/div>
              `).join('')}
            \x3c/div>
          \x3c/div>
        \x3c/div>
      \x3c/div>

      <!-- Event List -->
      <div>
        <div class="page-card">
          <div class="page-card-header">
            <h2><i class='bx bx-list-ul' style="color:#3B82F6;">\x3c/i> เหตุการณ์ในเดือนนี้\x3c/h2>
          \x3c/div>
          <div class="page-card-body">
            <div id="calEventList"><div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>\x3c/div>
          \x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;

  loadCalendarEvents();
}

function calNav(delta) {
  CalendarState.month += delta;
  if (CalendarState.month < 1)  { CalendarState.month = 12; CalendarState.year--; }
  if (CalendarState.month > 12) { CalendarState.month = 1;  CalendarState.year++; }
  loadCalendarEvents();
}
function calToday() {
  CalendarState.year  = new Date().getFullYear();
  CalendarState.month = new Date().getMonth() + 1;
  loadCalendarEvents();
}

function loadCalendarEvents() {
  apiCall('getCalendarEvents', { year: CalendarState.year, month: CalendarState.month })
    .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      CalendarState.events = res.data || [];
      renderCalendarGrid();
      renderCalendarEventList();
    })
    .catch(err => showToast('error', err.message || err));
}

function renderCalendarGrid() {
  const y = CalendarState.year, m = CalendarState.month;
  const thaiMonths = ['','มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                     'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  document.getElementById('calMonthLabel').textContent = thaiMonths[m] + ' ' + (y + 543);

  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startDay = first.getDay(); // 0 = Sun

  let html = '<div class="cal-grid-header">';
  ['อา','จ','อ','พ','พฤ','ศ','ส'].forEach(d => html += `<div class="cal-dow">${d}\x3c/div>`);
  html += '\x3c/div><div class="cal-grid">';

  // ช่องว่างก่อนวันที่ 1
  for (let i = 0; i < startDay; i++) html += '<div class="cal-cell empty">\x3c/div>';

  const todayStr = new Date().toISOString().slice(0,10);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = y + '-' + String(m).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const eventsOnDay = CalendarState.events.filter(e => {
      const s = e.start_date, en = e.end_date || s;
      return s <= ds && ds <= en;
    });
    const isToday = ds === todayStr;
    const isSunday = ((startDay + d - 1) % 7) === 0;
    const isSaturday = ((startDay + d - 1) % 7) === 6;

    html += `
      <div class="cal-cell ${isToday ? 'today' : ''}" onclick="showDayEvents('${ds}')">
        <div class="cal-date ${isSunday ? 'sun' : ''} ${isSaturday ? 'sat' : ''}">${d}\x3c/div>
        <div class="cal-events">
          ${eventsOnDay.slice(0,3).map(e => {
            const t = EVENT_TYPES[e.type] || EVENT_TYPES.general;
            return `<div class="cal-event-pill" style="background:${t.color}1A; color:${t.color}; border-left:3px solid ${t.color};" title="${escapeHTML(e.title)}">${escapeHTML(e.title)}\x3c/div>`;
          }).join('')}
          ${eventsOnDay.length > 3 ? `<div class="cal-event-more">+${eventsOnDay.length - 3} อื่นๆ\x3c/div>` : ''}
        \x3c/div>
      \x3c/div>`;
  }
  html += '\x3c/div>';

  html += `
    <style>
      .cal-grid-header, .cal-grid { display:grid; grid-template-columns:repeat(7, 1fr); gap:4px; }
      .cal-dow { padding:6px 0; text-align:center; font-size:11px; font-weight:600; color:#64748B; }
      .cal-cell {
        min-height:80px; background:#F8FAFC; border:1px solid transparent; border-radius:8px;
        padding:5px; cursor:pointer; transition:all .12s;
        display:flex; flex-direction:column;
      }
      .cal-cell:hover { background:#EFF6FF; border-color:#3B82F6; }
      .cal-cell.empty { background:transparent; cursor:default; }
      .cal-cell.empty:hover { background:transparent; border-color:transparent; }
      .cal-cell.today { background:#DBEAFE; border-color:#3B82F6; }
      .cal-date { font-size:13px; font-weight:600; color:#0F172A; margin-bottom:2px; }
      .cal-date.sun { color:#EF4444; }
      .cal-date.sat { color:#F59E0B; }
      .cal-cell.today .cal-date { color:#1E40AF; }
      .cal-events { flex:1; display:flex; flex-direction:column; gap:2px; overflow:hidden; }
      .cal-event-pill {
        font-size:10px; padding:1px 6px; border-radius:4px;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.4;
      }
      .cal-event-more { font-size:10px; color:#64748B; padding:1px 6px; }
      @media (max-width:768px) {
        .cal-cell { min-height:60px; }
        .cal-event-pill { font-size:9px; padding:0 4px; }
      }
    \x3c/style>
  `;

  document.getElementById('calGrid').innerHTML = html;
}

function renderCalendarEventList() {
  const area = document.getElementById('calEventList');
  if (!CalendarState.events || CalendarState.events.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-calendar-x'>\x3c/i>ไม่มีเหตุการณ์ในเดือนนี้\x3c/div>`;
    return;
  }
  area.innerHTML = `
    <div style="max-height:480px; overflow-y:auto; display:flex; flex-direction:column; gap:10px;">
      ${CalendarState.events.map(e => {
        const t = EVENT_TYPES[e.type] || EVENT_TYPES.general;
        return `
          <div class="ev-item" style="border-left:3px solid ${t.color};">
            <div class="ev-date">
              <div class="ev-d">${new Date(e.start_date).getDate()}\x3c/div>
              <div class="ev-m">${['','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][new Date(e.start_date).getMonth()+1]}\x3c/div>
            \x3c/div>
            <div class="ev-body">
              <div class="ev-title">${escapeHTML(e.title)}\x3c/div>
              <div class="ev-type" style="color:${t.color};">${t.label}${e.location ? ' · ' + escapeHTML(e.location) : ''}\x3c/div>
              ${e.description ? `<div class="ev-desc">${escapeHTML(e.description).slice(0,80)}${e.description.length > 80 ? '...' : ''}\x3c/div>` : ''}
            \x3c/div>
            <div class="flex flex-col gap-1">
              <button class="btn btn-light btn-icon" onclick="openCalendarForm('${e.id}')" title="แก้ไข" style="color:#3B82F6; width:28px; height:28px;">
                <i class='bx bx-edit' style="font-size:14px;">\x3c/i>
              \x3c/button>
              <button class="btn btn-light btn-icon" onclick="deleteCalendarEventConfirm('${e.id}')" title="ลบ" style="color:#EF4444; width:28px; height:28px;">
                <i class='bx bx-trash' style="font-size:14px;">\x3c/i>
              \x3c/button>
            \x3c/div>
          \x3c/div>`;
      }).join('')}
    \x3c/div>
    <style>
      .ev-item {
        background:#F8FAFC; border-radius:10px; padding:10px;
        display:flex; gap:10px; align-items:flex-start;
      }
      .ev-date {
        background:white; border-radius:8px; padding:6px 10px; text-align:center;
        flex-shrink:0; width:46px;
      }
      .ev-d { font-size:18px; font-weight:700; color:#0F172A; line-height:1; }
      .ev-m { font-size:11px; color:#64748B; }
      .ev-body { flex:1; min-width:0; }
      .ev-title { font-weight:600; color:#0F172A; font-size:14px; }
      .ev-type  { font-size:11px; font-weight:600; margin-top:2px; }
      .ev-desc  { font-size:12px; color:#64748B; margin-top:4px; line-height:1.4; }
    \x3c/style>
  `;
}

function showDayEvents(dateStr) {
  const evs = CalendarState.events.filter(e => {
    const s = e.start_date, en = e.end_date || s;
    return s <= dateStr && dateStr <= en;
  });

  if (evs.length === 0) {
    // เปิดฟอร์มเพิ่มเหตุการณ์ในวันนั้น
    openCalendarForm(null, dateStr);
    return;
  }

  Swal.fire({
    title: formatThaiDate(dateStr),
    width: 600,
    showCloseButton: true,
    showConfirmButton: false,
    html: `
      <div style="text-align:left;">
        ${evs.map(e => {
          const t = EVENT_TYPES[e.type] || EVENT_TYPES.general;
          return `
            <div style="background:#F8FAFC; border-left:3px solid ${t.color}; padding:10px; border-radius:8px; margin-bottom:10px;">
              <div style="font-weight:600; color:#0F172A;">${escapeHTML(e.title)}\x3c/div>
              <div style="font-size:12px; color:${t.color}; font-weight:600; margin-top:2px;">${t.label}\x3c/div>
              ${e.location ? `<div style="font-size:13px; color:#64748B; margin-top:4px;"><i class="bx bx-map">\x3c/i> ${escapeHTML(e.location)}\x3c/div>` : ''}
              ${e.description ? `<div style="font-size:13px; color:#475569; margin-top:6px;">${escapeHTML(e.description)}\x3c/div>` : ''}
            \x3c/div>`;
        }).join('')}
        <button class="btn btn-outline w-full mt-2" onclick="Swal.close(); openCalendarForm(null,'${dateStr}');">
          <i class='bx bx-plus'>\x3c/i> เพิ่มเหตุการณ์ในวันนี้
        \x3c/button>
      \x3c/div>
    `
  });
}

function openCalendarForm(id, defaultDate) {
  let e = {};
  if (id) {
    e = CalendarState.events.find(x => x.id === id) || {};
  } else if (defaultDate) {
    e = { start_date: defaultDate, end_date: defaultDate };
  }

  Swal.fire({
    title: id ? 'แก้ไขเหตุการณ์' : 'เพิ่มเหตุการณ์',
    width: 640,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="cf_id" value="${escapeHTML(e.id || '')}">

        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-12">
            <label class="form-label">หัวข้อ <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="cf_title" class="form-input" value="${escapeHTML(e.title||'')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ประเภท\x3c/label>
            <select id="cf_type" class="form-input">
              ${Object.keys(EVENT_TYPES).map(k => `<option value="${k}" ${(e.type||'general')===k?'selected':''}>${EVENT_TYPES[k].label}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">สถานที่\x3c/label>
            <input type="text" id="cf_location" class="form-input" value="${escapeHTML(e.location||'')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">วันที่เริ่ม <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="date" id="cf_start_date" class="form-input" value="${escapeHTML((e.start_date||new Date().toISOString().slice(0,10)).slice(0,10))}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">วันที่สิ้นสุด\x3c/label>
            <input type="date" id="cf_end_date" class="form-input" value="${escapeHTML((e.end_date||e.start_date||'').slice(0,10))}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">เวลาเริ่ม\x3c/label>
            <input type="time" id="cf_start_time" class="form-input" value="${escapeHTML(e.start_time||'')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">เวลาสิ้นสุด\x3c/label>
            <input type="time" id="cf_end_time" class="form-input" value="${escapeHTML(e.end_time||'')}">
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">รายละเอียด\x3c/label>
            <textarea id="cf_description" class="form-input" rows="3">${escapeHTML(e.description||'')}\x3c/textarea>
          \x3c/div>
          <div class="col-span-12 flex gap-4">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" id="cf_is_pinned" ${e.is_pinned?'checked':''}>
              ปักหมุดในหน้าหลัก
            \x3c/label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" id="cf_is_holiday" ${e.is_holiday?'checked':''}>
              วันหยุด
            \x3c/label>
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
      const title = document.getElementById('cf_title').value.trim();
      const sd    = document.getElementById('cf_start_date').value;
      if (!title) { Swal.showValidationMessage('กรุณากรอกหัวข้อ'); return false; }
      if (!sd)    { Swal.showValidationMessage('กรุณาเลือกวันที่เริ่ม'); return false; }
      return {
        id         : document.getElementById('cf_id').value || null,
        title      : title,
        type       : document.getElementById('cf_type').value,
        location   : document.getElementById('cf_location').value,
        start_date : sd,
        end_date   : document.getElementById('cf_end_date').value || sd,
        start_time : document.getElementById('cf_start_time').value,
        end_time   : document.getElementById('cf_end_time').value,
        description: document.getElementById('cf_description').value,
        is_pinned  : document.getElementById('cf_is_pinned').checked,
        is_holiday : document.getElementById('cf_is_holiday').checked
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('saveCalendarEvent', r.value)
    .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadCalendarEvents(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
    .catch(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); });
  });
}

function deleteCalendarEventConfirm(id) {
  Swal.fire({
    title:'ยืนยันการลบเหตุการณ์?', icon:'warning',
    showCancelButton: true, confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    apiCall('getFilesList', category)
    .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadCalendarEvents(); }
        else showToast('error', res.message);
      })
      .deleteCalendarEvent(id)
    .then(res => {
        hideLoading();
        if (res.status !== 'success') return showToast('error', res.message);
        exportToExcel(res.headers, res.rows, res.title + '_' + new Date()
    .catch(() => {});
  });
}


/* ============================================================
 *  FILES
 * ============================================================ */
const FilesState = { category: '', folders: [], files: [] };

function renderFiles(container) {
  container.innerHTML = `
    ${pageHeader('คลังไฟล์', 'bxs-folder', `
      <button class="btn btn-blue" onclick="document.getElementById('fileUploadInput').click()">
        <i class='bx bx-cloud-upload'>\x3c/i> อัพโหลดไฟล์
      \x3c/button>
      <input type="file" id="fileUploadInput" style="display:none;" multiple onchange="handleFilesUpload(this)">
    `)}

    <div class="page-card">
      <div class="page-card-body">
        <div id="filesBreadcrumb" class="mb-3">\x3c/div>

        <div id="foldersSection">\x3c/div>

        <div id="filesSection" class="mt-4">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;
  loadFilesList('');
}

function loadFilesList(category) {
  FilesState.category = category || '';
  document.getElementById('filesSection').innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  apiCall('catch', err => showToast('error', err.message || err));
}

function renderFilesView() {
  // Breadcrumb
  document.getElementById('filesBreadcrumb').innerHTML = `
    <div class="flex items-center gap-2 text-sm">
      <button onclick="loadFilesList('')" class="text-blue-600 hover:underline font-semibold">
        <i class='bx bxs-folder'>\x3c/i> คลังไฟล์
      \x3c/button>
      ${FilesState.category ? `
        <i class='bx bx-chevron-right text-slate-400'>\x3c/i>
        <span class="text-slate-700 font-semibold">${escapeHTML(FilesState.category)}\x3c/span>
      ` : ''}
    \x3c/div>
  `;

  // Folders (เฉพาะตอน root)
  const folderArea = document.getElementById('foldersSection');
  if (FilesState.folders && FilesState.folders.length > 0) {
    folderArea.innerHTML = `
      <div class="text-xs font-semibold text-slate-500 uppercase mb-2">โฟลเดอร์\x3c/div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
        ${FilesState.folders.map(f => `
          <div class="folder-card" onclick="loadFilesList('${escapeHTML(f.name)}')">
            <i class='bx bxs-folder' style="font-size:32px; color:#3B82F6;">\x3c/i>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-800 truncate">${escapeHTML(f.name)}\x3c/div>
              <div class="text-xs text-slate-500">${f.file_count} ไฟล์\x3c/div>
            \x3c/div>
          \x3c/div>
        `).join('')}
      \x3c/div>
      <style>
        .folder-card {
          background:white; border:1px solid #F1F5F9; border-radius:12px;
          padding:12px; display:flex; align-items:center; gap:10px;
          cursor:pointer; transition:all .15s;
        }
        .folder-card:hover { border-color:#3B82F6; transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.06); }
      \x3c/style>
    `;
  } else {
    folderArea.innerHTML = '';
  }

  // Files
  const filesArea = document.getElementById('filesSection');
  if (!FilesState.files || FilesState.files.length === 0) {
    filesArea.innerHTML = `<div class="empty-state"><i class='bx bx-file'>\x3c/i>ยังไม่มีไฟล์${FilesState.category ? ' ในโฟลเดอร์นี้' : ''}\x3c/div>`;
    return;
  }

  filesArea.innerHTML = `
    <div class="text-xs font-semibold text-slate-500 uppercase mb-2">ไฟล์\x3c/div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      ${FilesState.files.map(f => {
        const isImg = (f.mime_type || '').startsWith('image/');
        const ext = (f.name || '').split('.').pop().toLowerCase();
        const sizeText = formatFileSize(f.size);
        return `
          <div class="file-card">
            <div class="file-preview" onclick="window.open('${f.view_url}','_blank')">
              ${isImg
                ? `<img src="${f.thumb_url}" alt="" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                   <div class="file-icon-fallback" style="display:none;"><i class='bx bxs-image'>\x3c/i>\x3c/div>`
                : `<div class="file-icon-fallback"><i class='bx ${fileIconByExt(ext)}'>\x3c/i><div class="ext">${escapeHTML(ext.toUpperCase())}\x3c/div>\x3c/div>`
              }
            \x3c/div>
            <div class="file-info">
              <div class="file-name" title="${escapeHTML(f.name)}">${escapeHTML(f.name)}\x3c/div>
              <div class="file-meta">${sizeText}\x3c/div>
            \x3c/div>
            <div class="file-actions">
              <a href="${f.view_url}" target="_blank" class="btn btn-light btn-icon" title="ดู" style="width:28px; height:28px;">
                <i class='bx bx-show' style="font-size:14px;">\x3c/i>
              \x3c/a>
              <a href="${f.download_url}" class="btn btn-light btn-icon" title="ดาวน์โหลด" style="width:28px; height:28px; color:#10B981;">
                <i class='bx bx-download' style="font-size:14px;">\x3c/i>
              \x3c/a>
              <button class="btn btn-light btn-icon" onclick="deleteFileConfirm('${f.id}','${escapeHTML(f.name)}')" title="ลบ" style="width:28px; height:28px; color:#EF4444;">
                <i class='bx bx-trash' style="font-size:14px;">\x3c/i>
              \x3c/button>
            \x3c/div>
          \x3c/div>
        `;
      }).join('')}
    \x3c/div>

    <style>
      .file-card {
        background:white; border:1px solid #F1F5F9; border-radius:12px;
        overflow:hidden; transition:all .15s;
        display:flex; flex-direction:column;
      }
      .file-card:hover { border-color:#3B82F6; transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.06); }
      .file-preview {
        height:130px; background:#F1F5F9; cursor:pointer;
        display:flex; align-items:center; justify-content:center;
        position:relative; overflow:hidden;
      }
      .file-preview img { width:100%; height:100%; object-fit:cover; }
      .file-icon-fallback {
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        color:#94A3B8; gap:4px;
      }
      .file-icon-fallback i { font-size:42px; }
      .file-icon-fallback .ext { font-size:11px; font-weight:700; }
      .file-info { padding:10px; }
      .file-name {
        font-size:12px; font-weight:600; color:#0F172A;
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
      }
      .file-meta { font-size:11px; color:#64748B; margin-top:2px; }
      .file-actions {
        padding:6px 10px; border-top:1px solid #F1F5F9;
        display:flex; gap:4px; justify-content:flex-end;
      }
    \x3c/style>
  `;
}

function fileIconByExt(ext) {
  const map = {
    pdf: 'bxs-file-pdf', doc: 'bxs-file-doc', docx: 'bxs-file-doc',
    xls: 'bxs-spreadsheet', xlsx: 'bxs-spreadsheet',
    ppt: 'bxs-file', pptx: 'bxs-file',
    zip: 'bxs-file-archive', rar: 'bxs-file-archive',
    mp4: 'bxs-videos', mov: 'bxs-videos', avi: 'bxs-videos',
    mp3: 'bxs-music', wav: 'bxs-music',
    txt: 'bxs-file-txt', json: 'bxs-file-json'
  };
  return map[ext] || 'bxs-file';
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function handleFilesUpload(input) {
  const files = Array.from(input.files);
  if (files.length === 0) return;

  showLoading(`กำลังอัพโหลด 0/${files.length}...`);
  let okCount = 0, failCount = 0;

  for (let i = 0; i < files.length; i++) {
    document.getElementById('loadingText').textContent = `กำลังอัพโหลด ${i+1}/${files.length}: ${files[i].name}`;
    try {
      await uploadFileToGAS(files[i], FilesState.category || 'general');
      okCount++;
    } catch (e) {
      failCount++;
    }
  }
  hideLoading();
  input.value = '';

  if (failCount === 0) showToast('success', `อัพโหลดสำเร็จ ${okCount} ไฟล์`);
  else                 showToast('warning', `สำเร็จ ${okCount} · ผิดพลาด ${failCount}`);

  loadFilesList(FilesState.category);
}

function deleteFileConfirm(fileId, fileName) {
  Swal.fire({
    title: 'ยืนยันการลบไฟล์?',
    text: fileName,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    apiCall('saveUser', r.value)
    .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadFilesList(FilesState.category); }
        else showToast('error', res.message);
      })
      .deleteFileById(fileId)
    .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      FilesState.folders = res.folders || [];
      FilesState.files   = res.data || [];
      renderFilesView();
    })
    .catch(() => {});
  });
}


/* ============================================================
 *  USERS (Admin only)
 * ============================================================ */
const UsersState = { page:1, search:'', role:'', active:'', data:null };

function renderUsers(container) {
  if (APP.role !== 'admin') {
    container.innerHTML = `<div class="empty-state"><i class='bx bx-lock'>\x3c/i><h3>เฉพาะผู้ดูแลระบบเท่านั้น\x3c/h3>\x3c/div>`;
    return;
  }
  container.innerHTML = `
    ${pageHeader('จัดการผู้ใช้งาน', 'bxs-user-account', `
      <button class="btn btn-blue" onclick="openUserForm()">
        <i class='bx bx-plus'>\x3c/i> เพิ่มผู้ใช้
      \x3c/button>
    `)}

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="userSearch" placeholder="ค้นหา ชื่อ / username"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onUserSearch()">
          \x3c/div>
          <select id="userRole" onchange="onUserFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกบทบาท\x3c/option>
            <option value="admin">ผู้ดูแลระบบ\x3c/option>
            <option value="staff">เจ้าหน้าที่\x3c/option>
            <option value="teacher">ครู\x3c/option>
          \x3c/select>
          <select id="userActive" onchange="onUserFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกสถานะ\x3c/option>
            <option value="true">เปิดใช้งาน\x3c/option>
            <option value="false">ปิดใช้งาน\x3c/option>
          \x3c/select>
        \x3c/div>

        <div id="userTable">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;
  loadUsers();
}

let _userSearchTimer = null;
function onUserSearch() {
  UsersState.search = document.getElementById('userSearch').value;
  UsersState.page = 1;
  clearTimeout(_userSearchTimer);
  _userSearchTimer = setTimeout(loadUsers, 300);
}
function onUserFilter() {
  UsersState.role   = document.getElementById('userRole').value;
  UsersState.active = document.getElementById('userActive').value;
  UsersState.page = 1;
  loadUsers();
}
function usersGoToPage(p) { UsersState.page = p; loadUsers(); }

function loadUsers() {
  const area = document.getElementById('userTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  apiCall('getUsers', {
      page: UsersState.page, search: UsersState.search,
      role: UsersState.role, active: UsersState.active
    })
    .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      UsersState.data = res;
      renderUsersTable(res);
    })
    .catch(() => {});
}

function renderUsersTable(res) {
  const area = document.getElementById('userTable');
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-user-x'>\x3c/i>ไม่พบผู้ใช้\x3c/div>`;
    return;
  }
  const roleLabel = { admin:'ผู้ดูแลระบบ', staff:'เจ้าหน้าที่', teacher:'ครู' };
  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">ผู้ใช้\x3c/th>
            <th class="px-3 py-2.5 text-left">Username\x3c/th>
            <th class="px-3 py-2.5 text-left">บทบาท\x3c/th>
            <th class="px-3 py-2.5 text-left">การติดต่อ\x3c/th>
            <th class="px-3 py-2.5 text-left">เข้าใช้ล่าสุด\x3c/th>
            <th class="px-3 py-2.5 text-center">สถานะ\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(u => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-3 py-2.5">
                <div class="flex items-center gap-3">
                  ${avatarHTML(u.avatar, u.name, 36)}
                  <div>
                    <div class="font-semibold text-slate-800">${escapeHTML(u.name || '-')}\x3c/div>
                    <div class="text-xs text-slate-500">${escapeHTML(u.department || '-')}\x3c/div>
                  \x3c/div>
                \x3c/div>
              \x3c/td>
              <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(u.username)}\x3c/td>
              <td class="px-3 py-2.5">
                <span class="status-badge ${u.role==='admin'?'status-active':u.role==='teacher'?'status-pending':'status-active'}">${roleLabel[u.role] || u.role}\x3c/span>
              \x3c/td>
              <td class="px-3 py-2.5">
                <div class="text-xs">${escapeHTML(u.email || '-')}\x3c/div>
                <div class="text-xs text-slate-500">${escapeHTML(u.phone || '')}\x3c/div>
              \x3c/td>
              <td class="px-3 py-2.5 text-xs whitespace-nowrap">${u.last_login ? formatThaiDateShort(u.last_login) : 'ยังไม่เคย'}\x3c/td>
              <td class="px-3 py-2.5 text-center">
                <button onclick="toggleUserActiveConfirm('${u.id}', ${u.active})"
                        class="status-badge ${u.active===false?'status-inactive':'status-active'}"
                        style="border:none; cursor:pointer;"
                        title="กดเพื่อเปลี่ยน">
                  ${u.active === false ? 'ปิด' : 'เปิด'}
                \x3c/button>
              \x3c/td>
              <td class="px-3 py-2.5 text-center">
                <div class="flex justify-center gap-1">
                  <button class="btn btn-light btn-icon" onclick="openUserForm('${u.id}')" title="แก้ไข" style="color:#3B82F6;">
                    <i class='bx bx-edit'>\x3c/i>
                  \x3c/button>
                  <button class="btn btn-light btn-icon" onclick="resetUserPasswordDlg('${u.id}','${escapeHTML(u.username)}')" title="รีเซ็ตรหัสผ่าน" style="color:#F59E0B;">
                    <i class='bx bx-key'>\x3c/i>
                  \x3c/button>
                  <button class="btn btn-light btn-icon" onclick="deleteUserConfirm('${u.id}','${escapeHTML(u.username)}')" title="ลบ" style="color:#EF4444;">
                    <i class='bx bx-trash'>\x3c/i>
                  \x3c/button>
                \x3c/div>
              \x3c/td>
            \x3c/tr>
          `).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'usersGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} ผู้ใช้\x3c/div>
  `;
}

function openUserForm(id) {
  let u = {};
  if (id) {
    u = UsersState.data.data.find(x => x.id === id) || {};
  }

  Swal.fire({
    title: id ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่',
    width: 640,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="uf_id" value="${escapeHTML(u.id || '')}">

        <!-- Avatar -->
        <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
          <div id="uPhotoBox" class="avatar-circle"
               style="width:60px;height:60px;border-radius:50%;font-size:22px; ${u.avatar ? `background-image:url('${escapeHTML(u.avatar)}');` : ''}">
            ${u.avatar ? '' : (u.name || u.username || 'U').charAt(0).toUpperCase()}
          \x3c/div>
          <div>
            <button type="button" class="btn btn-outline" style="padding:6px 12px;font-size:12px;" onclick="document.getElementById('uPhotoInput').click()">
              <i class='bx bx-upload'>\x3c/i> รูปโปรไฟล์
            \x3c/button>
            <input type="file" id="uPhotoInput" accept="image/*" style="display:none;"
                   onchange="handleImageUpload(this,'users',(url)=>{
                     document.getElementById('uf_avatar').value=url;
                     document.getElementById('uPhotoBox').style.backgroundImage='url('+url+')';
                     document.getElementById('uPhotoBox').textContent='';
                   })">
            <input type="hidden" id="uf_avatar" value="${escapeHTML(u.avatar||'')}">
          \x3c/div>
        \x3c/div>

        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-6">
            <label class="form-label">Username <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="uf_username" class="form-input" value="${escapeHTML(u.username||'')}" ${id?'readonly style="background:#F1F5F9;"':''}>
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">บทบาท <span class="text-red-500">*\x3c/span>\x3c/label>
            <select id="uf_role" class="form-input">
              <option value="staff"   ${(u.role||'staff')==='staff'?'selected':''}>เจ้าหน้าที่\x3c/option>
              <option value="teacher" ${u.role==='teacher'?'selected':''}>ครู\x3c/option>
              <option value="admin"   ${u.role==='admin'?'selected':''}>ผู้ดูแลระบบ\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">ชื่อ-นามสกุล <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="uf_name" class="form-input" value="${escapeHTML(u.name||'')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">อีเมล\x3c/label>
            <input type="email" id="uf_email" class="form-input" value="${escapeHTML(u.email||'')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">โทรศัพท์\x3c/label>
            <input type="tel" id="uf_phone" class="form-input" value="${escapeHTML(u.phone||'')}">
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">ฝ่าย/แผนก\x3c/label>
            <input type="text" id="uf_department" class="form-input" value="${escapeHTML(u.department||'')}">
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">รหัสผ่าน ${id ? '(เว้นว่างถ้าไม่เปลี่ยน)' : '<span class="text-red-500">*\x3c/span>'}\x3c/label>
            <input type="password" id="uf_password" class="form-input" placeholder="${id?'••••••••':'อย่างน้อย 6 ตัว'}">
          \x3c/div>
          <div class="col-span-12">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" id="uf_active" ${u.active===false?'':'checked'}>
              เปิดใช้งานบัญชี
            \x3c/label>
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
      const username = document.getElementById('uf_username').value.trim();
      const name     = document.getElementById('uf_name').value.trim();
      const password = document.getElementById('uf_password').value;
      if (!username) { Swal.showValidationMessage('กรุณากรอก Username'); return false; }
      if (!name) { Swal.showValidationMessage('กรุณากรอกชื่อ-นามสกุล'); return false; }
      if (!id && (!password || password.length < 6)) { Swal.showValidationMessage('รหัสผ่านอย่างน้อย 6 ตัว'); return false; }
      if (id && password && password.length < 6) { Swal.showValidationMessage('รหัสผ่านอย่างน้อย 6 ตัว'); return false; }

      return {
        id          : document.getElementById('uf_id').value || null,
        username    : username,
        name        : name,
        role        : document.getElementById('uf_role').value,
        email       : document.getElementById('uf_email').value,
        phone       : document.getElementById('uf_phone').value,
        department  : document.getElementById('uf_department').value,
        avatar      : document.getElementById('uf_avatar').value,
        active      : document.getElementById('uf_active').checked,
        new_password: password || null
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('catch', err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); });
  });
}

function toggleUserActiveConfirm(id, currentActive) {
  Swal.fire({
    title: currentActive === false ? 'เปิดใช้งานบัญชี?' : 'ปิดใช้งานบัญชี?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('getSystemSettings')
    .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadUsers(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
    .catch(() => {});
}

function renderSettingsForm(c) {
  document.getElementById('settingsContent').innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- โรงเรียน -->
      <div class="page-card">
        <div class="page-card-header"><h2><i class='bx bxs-school' style="color:#3B82F6;">\x3c/i> ข้อมูลโรงเรียน\x3c/h2>\x3c/div>
        <div class="page-card-body">
          <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
            <div id="logoPreview" style="width:80px; height:80px; border-radius:14px; background:#F1F5F9; background-size:cover; background-position:center; ${c.school_logo ? `background-image:url('${escapeHTML(c.school_logo)}');` : ''}">
              ${!c.school_logo ? `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94A3B8;"><i class='bx bxs-graduation' style="font-size:36px;">\x3c/i>\x3c/div>` : ''}
            \x3c/div>
            <div>
              <button type="button" class="btn btn-outline" onclick="document.getElementById('logoInput').click()">
                <i class='bx bx-image'>\x3c/i> อัพโหลดโลโก้
              \x3c/button>
              <input type="file" id="logoInput" accept="image/*" style="display:none;"
                     onchange="handleImageUpload(this,'logo',(url)=>{
                       document.getElementById('set_school_logo').value=url;
                       document.getElementById('logoPreview').style.backgroundImage='url('+url+')';
                       document.getElementById('logoPreview').innerHTML='';
                     })">
              <input type="hidden" id="set_school_logo" value="${escapeHTML(c.school_logo||'')}">
              <div class="text-xs text-slate-500 mt-1">JPG/PNG ขนาด square\x3c/div>
            \x3c/div>
          \x3c/div>

          <div class="grid grid-cols-12 gap-2">
            <div class="col-span-12">
              <label class="set-label">ชื่อโรงเรียน\x3c/label>
              <input type="text" id="set_school_name" class="set-input" value="${escapeHTML(c.school_name||'')}">
            \x3c/div>
            <div class="col-span-12">
              <label class="set-label">ที่อยู่\x3c/label>
              <input type="text" id="set_school_address" class="set-input" value="${escapeHTML(c.school_address||'')}">
            \x3c/div>
            <div class="col-span-6">
              <label class="set-label">อำเภอ/เขต\x3c/label>
              <input type="text" id="set_school_district" class="set-input" value="${escapeHTML(c.school_district||'')}">
            \x3c/div>
            <div class="col-span-6">
              <label class="set-label">จังหวัด\x3c/label>
              <input type="text" id="set_school_province" class="set-input" value="${escapeHTML(c.school_province||'')}">
            \x3c/div>
            <div class="col-span-6">
              <label class="set-label">โทรศัพท์\x3c/label>
              <input type="tel" id="set_school_phone" class="set-input" value="${escapeHTML(c.school_phone||'')}">
            \x3c/div>
            <div class="col-span-6">
              <label class="set-label">อีเมล\x3c/label>
              <input type="email" id="set_school_email" class="set-input" value="${escapeHTML(c.school_email||'')}">
            \x3c/div>
          \x3c/div>
        \x3c/div>
      \x3c/div>

      <!-- ปีการศึกษา / เกณฑ์ -->
      <div class="page-card">
        <div class="page-card-header"><h2><i class='bx bxs-calendar' style="color:#10B981;">\x3c/i> ปีการศึกษา / เกณฑ์\x3c/h2>\x3c/div>
        <div class="page-card-body">
          <div class="grid grid-cols-12 gap-2">
            <div class="col-span-6">
              <label class="set-label">ปีการศึกษาปัจจุบัน\x3c/label>
              <input type="text" id="set_academic_year" class="set-input" value="${escapeHTML(c.academic_year||'')}">
            \x3c/div>
            <div class="col-span-6">
              <label class="set-label">ภาคเรียนปัจจุบัน\x3c/label>
              <select id="set_semester" class="set-input">
                <option value="1" ${String(c.semester||'1')==='1'?'selected':''}>เทอม 1\x3c/option>
                <option value="2" ${String(c.semester)==='2'?'selected':''}>เทอม 2\x3c/option>
              \x3c/select>
            \x3c/div>
            <div class="col-span-6">
              <label class="set-label">% เข้าเรียนขั้นต่ำ\x3c/label>
              <input type="number" min="0" max="100" id="set_min_attendance_pct" class="set-input" value="${c.min_attendance_pct||80}">
            \x3c/div>
            <div class="col-span-6">
              <label class="set-label">GPA ขั้นต่ำผ่านชั้น\x3c/label>
              <input type="number" step="0.01" id="set_min_gpa_promote" class="set-input" value="${c.min_gpa_promote||1.0}">
            \x3c/div>

            <div class="col-span-12 mt-2">
              <label class="set-label">เกณฑ์ตัดเกรด (คะแนน → เกรด)\x3c/label>
              <div id="gradeThresholds" class="space-y-1">\x3c/div>
            \x3c/div>
          \x3c/div>
        \x3c/div>
      \x3c/div>

      <!-- Drive / Folder -->
      <div class="page-card">
        <div class="page-card-header"><h2><i class='bx bxs-folder' style="color:#F59E0B;">\x3c/i> Google Drive\x3c/h2>\x3c/div>
        <div class="page-card-body">
          <div>
            <label class="set-label">Folder ID (สำหรับเก็บไฟล์)\x3c/label>
            <input type="text" id="set_folder_id" class="set-input" value="${escapeHTML(c.folder_id||'')}" placeholder="ใส่ Folder ID หรือเว้นว่างเพื่อให้ระบบสร้างให้">
            <div class="text-xs text-slate-500 mt-1">
              เปิด Google Drive > คลิกขวาที่โฟลเดอร์ > Get link > คัดลอก ID จาก URL
            \x3c/div>
          \x3c/div>
        \x3c/div>
      \x3c/div>

      <!-- ระบบ -->
      <div class="page-card">
        <div class="page-card-header"><h2><i class='bx bxs-shield' style="color:#8B5CF6;">\x3c/i> ความปลอดภัย / ระบบ\x3c/h2>\x3c/div>
        <div class="page-card-body">
          <div class="grid grid-cols-12 gap-2">
            <div class="col-span-12">
              <label class="set-label">Session timeout (วินาที)\x3c/label>
              <input type="number" min="300" id="set_session_timeout" class="set-input" value="${c.session_timeout||3600}">
              <div class="text-xs text-slate-500 mt-1">ค่าเริ่มต้น 3600 (1 ชั่วโมง)\x3c/div>
            \x3c/div>
            <div class="col-span-12">
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" id="set_maintenance_mode" ${c.maintenance_mode?'checked':''}>
                <span>โหมดบำรุงรักษา (ปิดระบบชั่วคราว)\x3c/span>
              \x3c/label>
            \x3c/div>
            <div class="col-span-12">
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" id="set_notification_enabled" ${c.notification_enabled!==false?'checked':''}>
                <span>เปิดการแจ้งเตือนในระบบ\x3c/span>
              \x3c/label>
            \x3c/div>
          \x3c/div>

          <div class="mt-4 pt-4 border-t border-slate-200">
            <button class="btn btn-light w-full" onclick="showSystemInfo()">
              <i class='bx bx-info-circle'>\x3c/i> ดูข้อมูลระบบ
            \x3c/button>
          \x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>

    <style>
      .set-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
      .set-input {
        width:100%; padding:8px 12px; border:1.5px solid #E2E8F0; border-radius:8px;
        font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box;
      }
      .set-input:focus { outline:none; border-color:#3B82F6; background:white; }
      .grade-threshold-row {
        display:grid; grid-template-columns:1fr auto 1fr; gap:6px; align-items:center;
      }
    \x3c/style>
  `;

  renderGradeThresholds(c.grade_thresholds || []);
}

function renderGradeThresholds(thresholds) {
  const area = document.getElementById('gradeThresholds');
  if (!area) return;
  const defaults = [
    {min:80,grade:4},{min:75,grade:3.5},{min:70,grade:3},
    {min:65,grade:2.5},{min:60,grade:2},{min:55,grade:1.5},
    {min:50,grade:1},{min:0,grade:0}
  ];
  const t = thresholds && thresholds.length ? thresholds : defaults;
  area.innerHTML = t.map((row, i) => `
    <div class="grade-threshold-row">
      <div class="flex items-center gap-2">
        <input type="number" class="set-input gth-min" data-i="${i}" value="${row.min}" style="width:80px;">
        <span class="text-xs text-slate-500">คะแนนขึ้นไป\x3c/span>
      \x3c/div>
      <i class='bx bx-right-arrow-alt text-slate-400'>\x3c/i>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500">เกรด\x3c/span>
        <input type="number" step="0.5" class="set-input gth-grade" data-i="${i}" value="${row.grade}" style="width:80px;">
      \x3c/div>
    \x3c/div>
  `).join('');
}

function saveSettings() {
  const thresholds = [];
  document.querySelectorAll('.gth-min').forEach((el, i) => {
    const min   = parseFloat(el.value);
    const grade = parseFloat(document.querySelector(`.gth-grade[data-i="${el.dataset.i}"]`).value);
    if (!isNaN(min) && !isNaN(grade)) thresholds.push({ min: min, grade: grade });
  });
  thresholds.sort((a, b) => b.min - a.min);

  const settings = {
    school_name        : document.getElementById('set_school_name').value,
    school_address     : document.getElementById('set_school_address').value,
    school_district    : document.getElementById('set_school_district').value,
    school_province    : document.getElementById('set_school_province').value,
    school_phone       : document.getElementById('set_school_phone').value,
    school_email       : document.getElementById('set_school_email').value,
    school_logo        : document.getElementById('set_school_logo').value,
    folder_id          : document.getElementById('set_folder_id').value,
    academic_year      : document.getElementById('set_academic_year').value,
    semester           : document.getElementById('set_semester').value,
    min_attendance_pct : parseFloat(document.getElementById('set_min_attendance_pct').value) || 80,
    min_gpa_promote    : parseFloat(document.getElementById('set_min_gpa_promote').value) || 1.0,
    grade_thresholds   : thresholds,
    session_timeout    : parseInt(document.getElementById('set_session_timeout').value) || 3600,
    maintenance_mode   : document.getElementById('set_maintenance_mode').checked,
    notification_enabled: document.getElementById('set_notification_enabled').checked
  };

  showLoading('กำลังบันทึก...');
  apiCall('withFailureHandler', err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); })
    .saveSystemSettings(settings)
    .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadUsers(); }
        else showToast('error', res.message);
      })
      .toggleUserActive(id)
    .then(res => {
      hideLoading();
      if (res.status === 'success') {
        Swal.fire({ icon:'success', title:'บันทึกสำเร็จ', text:'การตั้งค่ามีผลทันที', timer:2000 });
      } else {
        Swal.fire({ icon:'error', text:res.message });
      }
    })
    .catch(() => {});
  });
}

function resetUserPasswordDlg(id, username) {
  Swal.fire({
    title: 'รีเซ็ตรหัสผ่าน',
    html: `ผู้ใช้: <b>${username}\x3c/b>`,
    input: 'password',
    inputLabel: 'รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)',
    showCancelButton: true,
    confirmButtonText: 'รีเซ็ต',
    cancelButtonText: 'ยกเลิก',
    inputValidator: v => {
      if (!v || v.length < 6) return 'รหัสผ่านอย่างน้อย 6 ตัว';
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังรีเซ็ต...');
    apiCall('adminResetPassword', id, r.value)
    .then(res => {
        hideLoading();
        if (res.status === 'success') Swal.fire({ icon:'success', title:'สำเร็จ', text:res.message });
        else showToast('error', res.message);
      })
    .catch(() => {});
  });
}

function deleteUserConfirm(id, username) {
  Swal.fire({
    title: 'ยืนยันการลบผู้ใช้?',
    html: `<b>${username}\x3c/b><br><span class="text-sm text-slate-500">การกระทำนี้ไม่สามารถยกเลิกได้\x3c/span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    apiCall('deleteUser', id)
    .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadUsers(); }
        else showToast('error', res.message);
      })
    .catch(() => {});
  });
}


/* ============================================================
 *  SETTINGS
 * ============================================================ */
function renderSettings(container) {
  if (APP.role !== 'admin') {
    container.innerHTML = `<div class="empty-state"><i class='bx bx-lock'>\x3c/i><h3>เฉพาะผู้ดูแลระบบเท่านั้น\x3c/h3>\x3c/div>`;
    return;
  }

  container.innerHTML = `
    ${pageHeader('ตั้งค่าระบบ', 'bxs-cog', `
      <button class="btn btn-blue" onclick="saveSettings()" id="saveSettingsBtn">
        <i class='bx bx-save'>\x3c/i> บันทึกการตั้งค่า
      \x3c/button>
    `)}

    <div id="settingsContent">
      <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
    \x3c/div>
  `;

  loadSettings();
}

function loadSettings() {
  google.script.run
    .withSuccessHandler(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      renderSettingsForm(res.data);
    })
    .catch(err => showToast('error', err.message || err));
}

function showSystemInfo() {
  showLoading('กำลังโหลด...');
  google.script.run
    .withSuccessHandler(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      const d = res.data;
      Swal.fire({
        title: 'ข้อมูลระบบ',
        width: 640,
        showCloseButton: true,
        showConfirmButton: false,
        html: `
          <div style="text-align:left; font-size:13px;">
            <div style="display:grid; grid-template-columns:auto 1fr; gap:6px 16px; margin-bottom:14px;">
              <span class="text-slate-500">เวอร์ชั่นระบบ:\x3c/span>     <span><b>${d.app_version}\x3c/b>\x3c/span>
              <span class="text-slate-500">Spreadsheet:\x3c/span>      <span><a href="${d.spreadsheet_url}" target="_blank" class="text-blue-600 hover:underline">${escapeHTML(d.spreadsheet_name)}\x3c/a>\x3c/span>
              <span class="text-slate-500">Timezone:\x3c/span>          <span>${escapeHTML(d.timezone)}\x3c/span>
              <span class="text-slate-500">จำนวนผู้ใช้:\x3c/span>       <span>${formatNumber(d.user_count)}\x3c/span>
              <span class="text-slate-500">จำนวนนักเรียน:\x3c/span>     <span>${formatNumber(d.student_count)}\x3c/span>
              <span class="text-slate-500">จำนวนบุคลากร:\x3c/span>     <span>${formatNumber(d.personnel_count)}\x3c/span>
            \x3c/div>
            <div class="text-xs text-slate-500 font-semibold mb-2 uppercase">Sheets ในระบบ\x3c/div>
            <div style="max-height:280px; overflow-y:auto;">
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-slate-50">
                    <th class="px-3 py-2 text-left">ชื่อ Sheet\x3c/th>
                    <th class="px-3 py-2 text-right">แถว\x3c/th>
                    <th class="px-3 py-2 text-right">คอลัมน์\x3c/th>
                  \x3c/tr>
                \x3c/thead>
                <tbody>
                  ${d.sheets.map(s => `
                    <tr class="border-b border-slate-100">
                      <td class="px-3 py-1.5 font-mono">${escapeHTML(s.name)}\x3c/td>
                      <td class="px-3 py-1.5 text-right">${s.rows}\x3c/td>
                      <td class="px-3 py-1.5 text-right">${s.cols}\x3c/td>
                    \x3c/tr>
                  `).join('')}
                \x3c/tbody>
              \x3c/table>
            \x3c/div>
          \x3c/div>
        `
      });
    })
    .withFailureHandler(err => { hideLoading(); showToast('error', err.message || err); })
    .getSystemInfo(APP.token);
}