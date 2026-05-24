/* ============================================================
 *  Smart School Office — js3
 *  Part 3: Academic | Finance | Documents | Approvals | Registration
 * ============================================================ */


/* ============================================================
 *  Shared: เปิด HTML ที่ได้จาก backend ในหน้าต่างใหม่
 * ============================================================ */
function openHTMLDocument(html) {
  const w = window.open('', '_blank');
  if (!w) {
    return Swal.fire({
      icon: 'warning',
      title: 'Popup ถูกปิด',
      text: 'กรุณาอนุญาตให้เปิด pop-up จาก URL นี้'
    });
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}


/* ============================================================
 *  ACADEMIC
 * ============================================================ */
const AcademicState = {
  tab: 'subjects',     // 'subjects' | 'grades' | 'gpa'
  page: 1,
  search: '',
  subject_group: '',
  grade_level: '',
  data: null,
  teachers: [],
  currentSubject: null,
  gradeRows: [],
  academic_year: '',
  semester: '',
  allSubjects: []
};

function renderAcademic(container) {
  container.innerHTML = `
    ${pageHeader('งานวิชาการ', 'bxs-book-content', '')}

    <div class="page-card">
      <div class="page-card-body">
        <div class="tab-pill" style="max-width:520px;">
          <button id="acTabSubjects" class="active" onclick="switchAcademicTab('subjects')">
            <i class='bx bx-book-open'>\x3c/i> รายวิชา
          \x3c/button>
          <button id="acTabGrades" onclick="switchAcademicTab('grades')">
            <i class='bx bx-edit'>\x3c/i> บันทึก ปพ.5
          \x3c/button>
          <button id="acTabGPA" onclick="switchAcademicTab('gpa')">
            <i class='bx bx-trophy'>\x3c/i> GPA / ปพ.6
          \x3c/button>
        \x3c/div>

        <div id="acSubjects" class="mt-4">\x3c/div>
        <div id="acGrades"   class="mt-4" style="display:none;">\x3c/div>
        <div id="acGPA"      class="mt-4" style="display:none;">\x3c/div>
      \x3c/div>
    \x3c/div>
  `;

  // โหลด teachers สำหรับ dropdown
  apiCall('getTeachersForDropdown')
      .then(res => {
      if (res.status === 'success') AcademicState.teachers = res.data;
    })
      .catch(() => {});

  renderAcademicSubjects();
}

function switchAcademicTab(tab) {
  AcademicState.tab = tab;
  ['Subjects','Grades','GPA'].forEach(t => {
    document.getElementById('acTab' + t).classList.toggle('active', t.toLowerCase() === tab);
    document.getElementById('ac' + t).style.display = (t.toLowerCase() === tab) ? '' : 'none';
  });
  if (tab === 'subjects' && !document.getElementById('subjectsTable')) renderAcademicSubjects();
  if (tab === 'grades'   && !document.getElementById('gradesArea'))    renderAcademicGrades();
  if (tab === 'gpa'      && !document.getElementById('gpaArea'))       renderAcademicGPA();
}


/* ----- Subjects ----- */
function renderAcademicSubjects() {
  document.getElementById('acSubjects').innerHTML = `
    <div class="flex justify-between items-center flex-wrap gap-2 mb-3">
      <div class="text-base font-semibold text-slate-700">
        <i class='bx bx-book-open mr-1' style="color:#3B82F6;">\x3c/i> รายวิชาที่เปิดสอน
      \x3c/div>
      ${APP.role !== 'teacher' ? `<button class="btn btn-blue" onclick="openSubjectForm()"><i class='bx bx-plus'><\/i> เพิ่มรายวิชา<\/button>` : ''}
    \x3c/div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
      <div class="md:col-span-2 relative">
        <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
        <input type="text" id="subSearch" placeholder="ค้นหา รหัสวิชา / ชื่อวิชา"
               class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
               oninput="onSubjectSearch()" value="${escapeHTML(AcademicState.search)}">
      \x3c/div>
      <select id="subGroup" onchange="onSubjectFilter()"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">ทุกกลุ่มสาระ\x3c/option>
      \x3c/select>
      <select id="subGrade" onchange="onSubjectFilter()"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">ทุกชั้น\x3c/option>
      \x3c/select>
    \x3c/div>

    <div id="subjectsTable">
      <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
    \x3c/div>
  `;
  loadSubjects();
}

let _subSearchTimer = null;
function onSubjectSearch() {
  AcademicState.search = document.getElementById('subSearch').value;
  AcademicState.page = 1;
  clearTimeout(_subSearchTimer);
  _subSearchTimer = setTimeout(loadSubjects, 300);
}
function onSubjectFilter() {
  AcademicState.subject_group = document.getElementById('subGroup').value;
  AcademicState.grade_level   = document.getElementById('subGrade').value;
  AcademicState.page = 1;
  loadSubjects();
}
function subjectsGoToPage(p) { AcademicState.page = p; loadSubjects(); }

function loadSubjects() {
  const area = document.getElementById('subjectsTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  apiCall('getSubjects', {
      page: AcademicState.page,
      search: AcademicState.search,
      subject_group: AcademicState.subject_group,
      grade_level: AcademicState.grade_level
    })
      .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      AcademicState.data = res;
      renderSubjectsTable(res);
    })
      .catch(err => showToast('error', err.message || err));
}

function renderSubjectsTable(res) {
  const gp = document.getElementById('subGroup');
  if (gp && res.distinct) {
    const cur = AcademicState.subject_group;
    gp.innerHTML = '<option value="">ทุกกลุ่มสาระ\x3c/option>' +
      res.distinct.groups.map(g => `<option value="${escapeHTML(g)}" ${cur===g?'selected':''}>${escapeHTML(g)}\x3c/option>`).join('');
  }
  const gr = document.getElementById('subGrade');
  if (gr && res.distinct) {
    const cur = AcademicState.grade_level;
    gr.innerHTML = '<option value="">ทุกชั้น\x3c/option>' +
      res.distinct.grades.map(g => `<option value="${escapeHTML(g)}" ${cur===g?'selected':''}>${escapeHTML(g)}\x3c/option>`).join('');
  }

  const area = document.getElementById('subjectsTable');
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-folder-open'>\x3c/i>ยังไม่มีรายวิชา\x3c/div>`;
    return;
  }
  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">รหัส\x3c/th>
            <th class="px-3 py-2.5 text-left">ชื่อวิชา\x3c/th>
            <th class="px-3 py-2.5 text-left">กลุ่มสาระ\x3c/th>
            <th class="px-3 py-2.5 text-left">ชั้น\x3c/th>
            <th class="px-3 py-2.5 text-center">หน่วยกิต\x3c/th>
            <th class="px-3 py-2.5 text-left">ครูผู้สอน\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(s => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(s.subject_code || '-')}\x3c/td>
              <td class="px-3 py-2.5 font-semibold text-slate-800">${escapeHTML(s.subject_name || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(s.subject_group || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(s.grade_level || '-')} · เทอม ${escapeHTML(s.semester || '-')}\x3c/td>
              <td class="px-3 py-2.5 text-center font-semibold">${s.credit || 0}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(s.teacher_name || '-')}\x3c/td>
              <td class="px-3 py-2.5 text-center">
                <div class="flex justify-center gap-1">
                  ${APP.role !== 'teacher' ? `
                  <button class="btn btn-light btn-icon" onclick="openSubjectForm('${s.id}')" title="แก้ไข" style="color:#3B82F6;"><i class='bx bx-edit'><\/i><\/button>
                  <button class="btn btn-light btn-icon" onclick="deleteSubjectConfirm('${s.id}')" title="ลบ" style="color:#EF4444;"><i class='bx bx-trash'><\/i><\/button>
                  ` : '<span class="text-xs text-slate-400">วิชาของคุณ<\/span>'}
                \x3c/div>
              \x3c/td>
            \x3c/tr>
          `).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'subjectsGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} รายวิชา\x3c/div>
  `;
}

function openSubjectForm(id) {
  if (id) {
    showLoading('กำลังโหลด...');
    apiCall('getSubjectById', id)
        .then(res => {
        hideLoading();
        if (res.status !== 'success') return showToast('error', res.message);
        showSubjectForm(res.data);
      })
        .catch(err => { hideLoading(); showToast('error', err.message || err); });
  } else {
    showSubjectForm(null);
  }
}

function showSubjectForm(data) {
  const s = data || {};
  const isEdit = !!s.id;
  const groups = ['ภาษาไทย','คณิตศาสตร์','วิทยาศาสตร์','สังคมศึกษาฯ','สุขศึกษาและพลศึกษา','ศิลปะ','การงานอาชีพ','ภาษาต่างประเทศ'];

  Swal.fire({
    title: isEdit ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่',
    width: 680,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="sf_id" value="${escapeHTML(s.id || '')}">

        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-4">
            <label class="form-label">รหัสวิชา\x3c/label>
            <input type="text" id="sf_subject_code" class="form-input" value="${escapeHTML(s.subject_code||'')}" placeholder="ค21101">
          \x3c/div>
          <div class="col-span-8">
            <label class="form-label">ชื่อวิชา <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="sf_subject_name" class="form-input" value="${escapeHTML(s.subject_name||'')}">
          \x3c/div>

          <div class="col-span-6">
            <label class="form-label">กลุ่มสาระ\x3c/label>
            <select id="sf_subject_group" class="form-input">
              <option value="">เลือก\x3c/option>
              ${groups.map(g => `<option value="${g}" ${s.subject_group===g?'selected':''}>${g}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ประเภทวิชา\x3c/label>
            <select id="sf_subject_type" class="form-input">
              <option value="basic"     ${(s.subject_type||'basic')==='basic'?'selected':''}>พื้นฐาน\x3c/option>
              <option value="additional"${s.subject_type==='additional'?'selected':''}>เพิ่มเติม\x3c/option>
              <option value="activity"  ${s.subject_type==='activity'?'selected':''}>กิจกรรม\x3c/option>
            \x3c/select>
          \x3c/div>

          <div class="col-span-4">
            <label class="form-label">ชั้น\x3c/label>
            <input type="text" id="sf_grade_level" class="form-input" placeholder="ม.1/1" value="${escapeHTML(s.grade_level||'')}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">เทอม\x3c/label>
            <select id="sf_semester" class="form-input">
              <option value="1" ${String(s.semester||'1')==='1'?'selected':''}>1\x3c/option>
              <option value="2" ${String(s.semester)==='2'?'selected':''}>2\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-5">
            <label class="form-label">ปีการศึกษา\x3c/label>
            <input type="text" id="sf_academic_year" class="form-input" value="${escapeHTML(s.academic_year||'')}">
          \x3c/div>

          <div class="col-span-3">
            <label class="form-label">หน่วยกิต\x3c/label>
            <input type="number" step="0.5" id="sf_credit" class="form-input" value="${s.credit||1}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">ชม./สัปดาห์\x3c/label>
            <input type="number" id="sf_hours_per_week" class="form-input" value="${s.hours_per_week||2}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">น.หนัก ระหว่างภาค\x3c/label>
            <input type="number" id="sf_midterm_weight" class="form-input" value="${s.midterm_weight||70}">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">น.หนัก ปลายภาค\x3c/label>
            <input type="number" id="sf_final_weight" class="form-input" value="${s.final_weight||30}">
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">ครูผู้สอน\x3c/label>
            <select id="sf_teacher_id" class="form-input">
              <option value="">เลือก\x3c/option>
              ${AcademicState.teachers.map(t =>
                `<option value="${t.id}" ${s.teacher_id===t.id?'selected':''}>${escapeHTML(t.name)} ${t.department?`(${escapeHTML(t.department)})`:''}\x3c/option>`
              ).join('')}
            \x3c/select>
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
      const name = document.getElementById('sf_subject_name').value.trim();
      if (!name) { Swal.showValidationMessage('กรุณากรอกชื่อวิชา'); return false; }
      return {
        id: document.getElementById('sf_id').value || null,
        subject_code  : document.getElementById('sf_subject_code').value,
        subject_name  : name,
        subject_group : document.getElementById('sf_subject_group').value,
        subject_type  : document.getElementById('sf_subject_type').value,
        grade_level   : document.getElementById('sf_grade_level').value,
        semester      : document.getElementById('sf_semester').value,
        academic_year : document.getElementById('sf_academic_year').value,
        credit        : document.getElementById('sf_credit').value,
        hours_per_week: document.getElementById('sf_hours_per_week').value,
        midterm_weight: document.getElementById('sf_midterm_weight').value,
        final_weight  : document.getElementById('sf_final_weight').value,
        teacher_id    : document.getElementById('sf_teacher_id').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('saveSubject', r.value)
        .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadSubjects(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
        .catch(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); });
  });
}

function deleteSubjectConfirm(id) {
  Swal.fire({
    title:'ยืนยันการลบ?', text:'รวมถึงคะแนนทั้งหมดของวิชานี้',
    icon:'warning', showCancelButton:true,
    confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    apiCall('deleteSubject', id)
        .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadSubjects(); }
        else showToast('error', res.message);
      })
        .catch(() => {});
  });
}


/* ----- Grades (ปพ.5) ----- */
function renderAcademicGrades() {
  document.getElementById('acGrades').innerHTML = `
    <div class="text-base font-semibold text-slate-700 mb-3">
      <i class='bx bx-edit mr-1' style="color:#3B82F6;">\x3c/i> บันทึกคะแนน ปพ.5
    \x3c/div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
      <select id="grYear" onchange="onGradesFilterChange()"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">เลือกปีการศึกษา\x3c/option>
      \x3c/select>
      <select id="grSem" onchange="onGradesFilterChange()"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">เลือกเทอม\x3c/option>
        <option value="1">เทอม 1\x3c/option>
        <option value="2">เทอม 2\x3c/option>
      \x3c/select>
      <select id="grSubject"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-2">
        <option value="">เลือกรายวิชา\x3c/option>
      \x3c/select>
    \x3c/div>
    <div class="flex justify-end mb-3">
      <button class="btn btn-blue" onclick="loadGradeSheet()">
        <i class='bx bx-show'>\x3c/i> เปิดตารางคะแนน
      \x3c/button>
    \x3c/div>

    <div id="gradesArea">
      <div class="empty-state">
        <i class='bx bx-bookmark'>\x3c/i>
        เลือกปีการศึกษา → เทอม → รายวิชา เพื่อเริ่มบันทึก ปพ.5
      \x3c/div>
    \x3c/div>
  `;

  // ดึงรายวิชามาใส่ dropdown
  apiCall('getSubjects', { page:1, per_page:200 })
      .then(res => {
      if (res.status !== 'success') return;
      AcademicState.allSubjects = res.data || [];
      // สร้าง distinct years
      const years = Array.from(new Set(AcademicState.allSubjects.map(s => s.academic_year).filter(Boolean))).sort().reverse();
      const yrSel = document.getElementById('grYear');
      yrSel.innerHTML = '<option value="">เลือกปีการศึกษา\x3c/option>' +
        years.map(y => `<option value="${escapeHTML(y)}">${escapeHTML(y)}\x3c/option>`).join('');
      // default ปี/เทอมปัจจุบัน
      const curYear = APP.dashboardData?.config?.academic_year || '';
      const curSem  = APP.dashboardData?.config?.semester || '1';
      if (curYear && years.includes(curYear)) yrSel.value = curYear;
      const semSel = document.getElementById('grSem');
      if (curSem) semSel.value = curSem;
      onGradesFilterChange();
    })
      .catch(() => {});
}

function onGradesFilterChange() {
  const year = document.getElementById('grYear').value;
  const sem  = document.getElementById('grSem').value;
  const sel  = document.getElementById('grSubject');
  const subjects = (AcademicState.allSubjects || []).filter(s => {
    const yMatch = !year || String(s.academic_year) === String(year);
    const sMatch = !sem  || String(s.semester) === String(sem);
    return yMatch && sMatch;
  });
  sel.innerHTML = '<option value="">เลือกรายวิชา\x3c/option>' +
    subjects.map(s =>
      `<option value="${s.id}">${escapeHTML(s.subject_code||'')} ${escapeHTML(s.subject_name||'')} · ${escapeHTML(s.grade_level||'')} เทอม${escapeHTML(s.semester||'')}\x3c/option>`
    ).join('');
}

function loadGradeSheet() {
  const subjectId = document.getElementById('grSubject').value;
  if (!subjectId) return showToast('warning', 'กรุณาเลือกวิชา');

  const area = document.getElementById('gradesArea');
  area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  apiCall('getGradeSheet', subjectId)
      .then(res => {
      if (res.status !== 'success') {
        area.innerHTML = `<div class="empty-state"><i class='bx bx-error'>\x3c/i>${escapeHTML(res.message)}\x3c/div>`;
        return;
      }
      AcademicState.currentSubject = res.subject;
      AcademicState.gradeRows = res.data;
      renderGradeSheetTable();
    })
      .catch(err => { area.innerHTML = `<div class="empty-state"><i class='bx bx-error'>\x3c/i>${escapeHTML(err.message||err)}\x3c/div>`; });
}

function renderGradeSheetTable() {
  const area = document.getElementById('gradesArea');
  const subj = AcademicState.currentSubject;
  const rows = AcademicState.gradeRows;

  if (!rows || rows.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-user-x'>\x3c/i>ไม่มีนักเรียนในชั้น ${escapeHTML(subj.grade_level||'')}\x3c/div>`;
    return;
  }

  area.innerHTML = `
    <div class="p-3 rounded-lg mb-3" style="background:#EFF6FF;border:1px solid #BFDBFE;">
      <div class="font-semibold text-slate-800">
        ${escapeHTML(subj.subject_code||'')} · ${escapeHTML(subj.subject_name||'')}
      \x3c/div>
      <div class="text-xs text-slate-600 mt-1">
        ชั้น ${escapeHTML(subj.grade_level||'-')} · เทอม ${escapeHTML(subj.semester||'-')} · ปีการศึกษา ${escapeHTML(subj.academic_year||'-')}
        · ระหว่างภาค <b>${subj.midterm_weight||70}\x3c/b> · ปลายภาค <b>${subj.final_weight||30}\x3c/b>
      \x3c/div>
    \x3c/div>

    <div class="flex flex-wrap gap-2 justify-end mb-2">
      <button class="btn btn-light" onclick="printPP5()">
        <i class='bx bx-printer'>\x3c/i> พิมพ์ ปพ.5
      \x3c/button>
      <button class="btn btn-blue" onclick="saveGradeSheet()">
        <i class='bx bx-save'>\x3c/i> บันทึกคะแนน
      \x3c/button>
    \x3c/div>

    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm" id="gradeTable">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-2 py-2.5 text-center rounded-l-lg" style="width:40px;">ที่\x3c/th>
            <th class="px-2 py-2.5 text-left">นักเรียน\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:90px;">ระหว่างภาค\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:90px;">ปลายภาค\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:70px;">รวม\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:75px;">ชม.เรียน\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:65px;">ชม.รวม\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:65px;">%\x3c/th>
            <th class="px-2 py-2.5 text-center" style="width:65px;">เกรด\x3c/th>
            <th class="px-2 py-2.5 text-center rounded-r-lg" style="width:85px;">พิเศษ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${rows.map((r, i) => `
            <tr class="border-b border-slate-100" data-row="${i}">
              <td class="px-2 py-2 text-center text-slate-500">${i+1}\x3c/td>
              <td class="px-2 py-2">
                <div class="flex items-center gap-2">
                  ${avatarHTML(r.photo, r.first_name, 28)}
                  <div>
                    <div class="font-semibold text-slate-800 text-xs">${escapeHTML((r.prefix||'')+(r.first_name||'')+' '+(r.last_name||''))}\x3c/div>
                    <div class="text-xs text-slate-400 font-mono">${escapeHTML(r.student_code||'')}\x3c/div>
                  \x3c/div>
                \x3c/div>
              \x3c/td>
              <td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-midterm" data-row="${i}" value="${r.score_midterm===''||r.score_midterm==null?'':r.score_midterm}">\x3c/td>
              <td class="px-1 py-1"><input type="number" min="0" max="100" step="0.5" class="grade-input g-final"   data-row="${i}" value="${r.score_final===''||r.score_final==null?'':r.score_final}">\x3c/td>
              <td class="px-1 py-1"><div class="grade-output g-total" data-row="${i}">-\x3c/div>\x3c/td>
              <td class="px-1 py-1"><input type="number" min="0" class="grade-input g-att" data-row="${i}" value="${r.attendance_hours===''||r.attendance_hours==null?'':r.attendance_hours}">\x3c/td>
              <td class="px-1 py-1"><input type="number" min="0" class="grade-input g-tot" data-row="${i}" value="${r.total_hours===''||r.total_hours==null?'':r.total_hours}">\x3c/td>
              <td class="px-1 py-1"><div class="grade-output g-pct" data-row="${i}">-\x3c/div>\x3c/td>
              <td class="px-1 py-1"><div class="grade-output g-grade" data-row="${i}">-\x3c/div>\x3c/td>
              <td class="px-1 py-1">
                <select class="grade-input g-special" data-row="${i}">
                  <option value="">-\x3c/option>
                  <option value="มส" ${r.grade_special==='มส'?'selected':''}>มส\x3c/option>
                  <option value="มผ" ${r.grade_special==='มผ'?'selected':''}>มผ\x3c/option>
                  <option value="ร"  ${r.grade_special==='ร'?'selected':''}>ร\x3c/option>
                \x3c/select>
              \x3c/td>
            \x3c/tr>
          `).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>

    <style>
      .grade-input {
        width:100%; padding:5px 6px; border:1.5px solid #E2E8F0;
        border-radius:6px; font-family:inherit; font-size:12px;
        background:#F8FAFC; text-align:center; box-sizing:border-box;
      }
      .grade-input:focus { outline:none; border-color:#3B82F6; background:white; }
      .grade-output {
        padding:5px; text-align:center; font-size:12px; font-weight:600;
        background:#F1F5F9; border-radius:6px; color:#1E40AF; min-height:26px;
      }
      .grade-output.grade-fail { background:#FEE2E2; color:#B91C1C; }
      .grade-output.grade-pass { background:#DCFCE7; color:#15803D; }
    \x3c/style>
  `;

  // bind events
  document.querySelectorAll('#gradeTable .grade-input').forEach(inp => {
    inp.addEventListener('input', e => recalcGradeRow(+e.target.dataset.row));
    inp.addEventListener('change', e => recalcGradeRow(+e.target.dataset.row));
  });

  // คำนวณรอบแรก
  rows.forEach((_, i) => recalcGradeRow(i));
}

function recalcGradeRow(i) {
  const get = sel => document.querySelector(`#gradeTable .g-${sel}[data-row="${i}"]`);
  const mid = parseFloat(get('midterm').value);
  const fin = parseFloat(get('final').value);
  const att = parseFloat(get('att').value);
  const tot = parseFloat(get('tot').value);
  const special = get('special').value;

  let total = null;
  if (!isNaN(mid) && !isNaN(fin)) total = mid + fin;
  else if (!isNaN(mid)) total = mid;
  else if (!isNaN(fin)) total = fin;
  get('total').textContent = (total === null) ? '-' : Number(total).toFixed(total % 1 ? 1 : 0);

  let pct = null;
  if (!isNaN(att) && !isNaN(tot) && tot > 0) pct = Math.round((att / tot) * 1000) / 10;
  const pctEl = get('pct');
  if (!pctEl) return;
  pctEl.textContent = (pct === null) ? '-' : pct + '%';
  pctEl.className = 'grade-output g-pct ' + (pct === null ? '' : (pct < 80 ? 'grade-fail' : 'grade-pass'));

  let grade = '-';
  if (special) {
    grade = special;
    get('grade').className = 'grade-output g-grade grade-fail';
  } else if (pct !== null && pct < 80) {
    grade = 'มส';
    get('grade').className = 'grade-output g-grade grade-fail';
  } else if (total !== null) {
    if (total >= 80) grade = '4';
    else if (total >= 75) grade = '3.5';
    else if (total >= 70) grade = '3';
    else if (total >= 65) grade = '2.5';
    else if (total >= 60) grade = '2';
    else if (total >= 55) grade = '1.5';
    else if (total >= 50) grade = '1';
    else                  grade = '0';
    get('grade').className = 'grade-output g-grade ' + (Number(grade) >= 1 ? 'grade-pass' : 'grade-fail');
  } else {
    get('grade').className = 'grade-output g-grade';
  }
  get('grade').textContent = grade;

  // sync state
  AcademicState.gradeRows[i].score_midterm    = isNaN(mid) ? '' : mid;
  AcademicState.gradeRows[i].score_final      = isNaN(fin) ? '' : fin;
  AcademicState.gradeRows[i].attendance_hours = isNaN(att) ? '' : att;
  AcademicState.gradeRows[i].total_hours      = isNaN(tot) ? '' : tot;
  AcademicState.gradeRows[i].grade_special    = special;
}

function saveGradeSheet() {
  if (!AcademicState.currentSubject || !AcademicState.gradeRows) return;
  showLoading('กำลังบันทึก...');
  apiCall('saveGradeBulk', AcademicState.currentSubject.id, AcademicState.gradeRows)
      .then(res => {
      hideLoading();
      if (res.status === 'success') Swal.fire({ icon:'success', title:'สำเร็จ', text:res.message, timer:1800 });
      else showToast('error', res.message);
    })
      .catch(err => { hideLoading(); showToast('error', err.message || err); });
}

function printPP5() {
  if (!AcademicState.currentSubject) return showToast('warning', 'เลือกวิชาก่อน');
  showLoading('กำลังเตรียมเอกสาร...');
  apiCall('generatePP5HTML', AcademicState.currentSubject.id)
      .then(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html);
    })
      .catch(err => { hideLoading(); showToast('error', err.message || err); });
}


/* ----- GPA / ปพ.6 ----- */
function renderAcademicGPA() {
  document.getElementById('acGPA').innerHTML = `
    <div class="text-base font-semibold text-slate-700 mb-3">
      <i class='bx bx-trophy mr-1' style="color:#3B82F6;">\x3c/i> ดู GPA และพิมพ์ ปพ.6
    \x3c/div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
      <div class="md:col-span-2 relative">
        <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
        <input type="text" id="gpaSearch" placeholder="ค้นหานักเรียน (ชื่อ / รหัส)"
               class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
               oninput="onGpaSearch()">
      \x3c/div>
      <select id="gpaYear" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">ทุกปีการศึกษา\x3c/option>
      \x3c/select>
      <select id="gpaSem" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        <option value="">ทุกเทอม\x3c/option>
        <option value="1">เทอม 1\x3c/option>
        <option value="2">เทอม 2\x3c/option>
      \x3c/select>
    \x3c/div>

    <div id="gpaArea">
      <div class="empty-state"><i class='bx bx-user'>\x3c/i>ค้นหานักเรียนเพื่อดู GPA\x3c/div>
    \x3c/div>
  `;
  loadGpaStudents();
}

let _gpaTimer = null;
function onGpaSearch() {
  clearTimeout(_gpaTimer);
  _gpaTimer = setTimeout(loadGpaStudents, 300);
}

function loadGpaStudents() {
  const q = document.getElementById('gpaSearch').value;
  const area = document.getElementById('gpaArea');
  area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  apiCall('getStudents', { page:1, per_page:50, search: q, status:'active' })
      .then(res => {
      if (res.status !== 'success') return;
      const yr = document.getElementById('gpaYear');
      if (res.distinct && yr.options.length <= 1) {
        yr.innerHTML = '<option value="">ทุกปีการศึกษา\x3c/option>' +
          res.distinct.academic_years.map(y => `<option value="${escapeHTML(y)}">${escapeHTML(y)}\x3c/option>`).join('');
      }
      renderGpaList(res.data);
    })
      .catch(() => {});
}

function renderGpaList(students) {
  const area = document.getElementById('gpaArea');
  if (!students || students.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-user-x'>\x3c/i>ไม่พบนักเรียน\x3c/div>`;
    return;
  }
  area.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      ${students.map(s => `
        <div class="gpa-card">
          <div class="flex items-center gap-3 mb-3">
            ${avatarHTML(s.photo, s.first_name, 50)}
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-800 truncate">${escapeHTML((s.prefix||'')+(s.first_name||'')+' '+(s.last_name||''))}\x3c/div>
              <div class="text-xs text-slate-500">${escapeHTML(s.student_id||'')} · ${escapeHTML(s.classroom||'')}\x3c/div>
            \x3c/div>
          \x3c/div>
          <div class="flex gap-2">
            <button class="btn btn-light flex-1" style="font-size:12px;padding:7px 10px;" onclick="viewGPA('${s.id}')">
              <i class='bx bx-bar-chart-alt-2'>\x3c/i> ดู GPA
            \x3c/button>
            <button class="btn btn-outline" style="font-size:12px;padding:7px 10px;" onclick="printPP6('${s.id}')">
              <i class='bx bx-printer'>\x3c/i> ปพ.6
            \x3c/button>
          \x3c/div>
        \x3c/div>
      `).join('')}
    \x3c/div>
    <style>
      .gpa-card {
        background:white; border:1px solid #F1F5F9; padding:14px;
        border-radius:14px; box-shadow:0 1px 2px rgba(0,0,0,.02);
      }
    \x3c/style>
  `;
}

function viewGPA(studentId) {
  const year = document.getElementById('gpaYear').value || null;
  showLoading('กำลังคำนวณ...');
  apiCall('calculateGPA', { studentId, year })
    .then(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      Swal.fire({
        title: 'ผลการเรียน',
        width: 720,
        showCloseButton: true,
        showConfirmButton: false,
        html: `
          <div style="text-align:left;">
            <div class="text-center mb-4 p-4 rounded-xl" style="background:linear-gradient(135deg,#1E40AF,#3B82F6); color:white;">
              <div class="text-xs opacity-80">เกรดเฉลี่ยสะสม (GPA)\x3c/div>
              <div style="font-size:42px; font-weight:800; line-height:1;">${res.gpa.toFixed(2)}\x3c/div>
              <div class="text-xs opacity-80 mt-2">หน่วยกิตรวม ${res.total_credits} หน่วยกิต\x3c/div>
            \x3c/div>
            <div style="max-height:380px; overflow-y:auto;">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
                    <th class="px-3 py-2 text-left">วิชา\x3c/th>
                    <th class="px-3 py-2 text-center">เทอม\x3c/th>
                    <th class="px-3 py-2 text-center">หน่วย\x3c/th>
                    <th class="px-3 py-2 text-center">คะแนน\x3c/th>
                    <th class="px-3 py-2 text-center">เกรด\x3c/th>
                  \x3c/tr>
                \x3c/thead>
                <tbody>
                  ${res.details.length === 0 ? `<tr><td colspan="5" class="text-center text-slate-400 py-4">ยังไม่มีคะแนน\x3c/td>\x3c/tr>` :
                    res.details.map(d => `
                      <tr class="border-b border-slate-100">
                        <td class="px-3 py-2">
                          <div class="font-mono text-xs text-slate-500">${escapeHTML(d.subject_code||'')}\x3c/div>
                          <div>${escapeHTML(d.subject_name||'')}\x3c/div>
                        \x3c/td>
                        <td class="px-3 py-2 text-center text-xs">${d.semester}/${d.academic_year}\x3c/td>
                        <td class="px-3 py-2 text-center">${d.credit}\x3c/td>
                        <td class="px-3 py-2 text-center">${d.score_total != null ? d.score_total : '-'}\x3c/td>
                        <td class="px-3 py-2 text-center font-semibold">${d.grade_special || (d.grade_level != null ? d.grade_level : '-')}\x3c/td>
                      \x3c/tr>`).join('')}
                \x3c/tbody>
              \x3c/table>
            \x3c/div>
          \x3c/div>
        `
      });
    })
        .catch(err => { hideLoading(); showToast('error', err.message || err); });
}

function printPP6(studentId) {
  const year = document.getElementById('gpaYear').value || '';
  const sem  = document.getElementById('gpaSem').value || '';
  showLoading('กำลังเตรียมเอกสาร...');
  apiCall('generatePP6HTML', { studentId, sem, year })
    .then(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html);
    })
    .catch(err => { hideLoading(); showToast('error', err.message || err); });
}


/* ============================================================
 *  FINANCE
 * ============================================================ */
const FinanceState = { page:1, search:'', type:'', start:'', end:'', data:null };

function renderFinance(container) {
  container.innerHTML = `
    ${pageHeader('งานการเงิน', 'bxs-wallet', `
      <button class="btn btn-light" onclick="openTransactionForm('expense')">
        <i class='bx bx-minus-circle' style="color:#EF4444;">\x3c/i> รายจ่าย
      \x3c/button>
      <button class="btn btn-blue" onclick="openTransactionForm('income')">
        <i class='bx bx-plus-circle'>\x3c/i> รายรับ
      \x3c/button>
    `)}

    <div class="page-card mb-3">
      <div class="page-card-body">
        <div id="financeStats">\x3c/div>
      \x3c/div>
    \x3c/div>

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="finSearch" placeholder="ค้นหา เลขใบเสร็จ / รายการ"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onFinanceSearch()">
          \x3c/div>
          <select id="finType" onchange="onFinanceFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทั้งหมด\x3c/option>
            <option value="income">รายรับ\x3c/option>
            <option value="expense">รายจ่าย\x3c/option>
          \x3c/select>
          <input type="date" id="finStart" onchange="onFinanceFilter()" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <input type="date" id="finEnd"   onchange="onFinanceFilter()" class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        \x3c/div>

        <div id="finTable">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;

  loadFinanceSummary();
  loadFinanceTable();
}

function loadFinanceSummary() {
  apiCall('getFinanceSummary', null, null)
      .then(res => {
      if (res.status !== 'success') return;
      document.getElementById('financeStats').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="rpt-card-mini" style="background:#DCFCE7;color:#15803D;">
            <div><i class='bx bx-trending-up' style="font-size:24px;">\x3c/i>\x3c/div>
            <div>
              <div class="lbl">รายรับรวม\x3c/div>
              <div class="val">${formatMoney(res.income)}\x3c/div>
            \x3c/div>
          \x3c/div>
          <div class="rpt-card-mini" style="background:#FEE2E2;color:#B91C1C;">
            <div><i class='bx bx-trending-down' style="font-size:24px;">\x3c/i>\x3c/div>
            <div>
              <div class="lbl">รายจ่ายรวม\x3c/div>
              <div class="val">${formatMoney(res.expense)}\x3c/div>
            \x3c/div>
          \x3c/div>
          <div class="rpt-card-mini" style="background:#DBEAFE;color:#1E40AF;">
            <div><i class='bx bx-wallet' style="font-size:24px;">\x3c/i>\x3c/div>
            <div>
              <div class="lbl">คงเหลือสุทธิ\x3c/div>
              <div class="val">${formatMoney(res.balance)}\x3c/div>
            \x3c/div>
          \x3c/div>
        \x3c/div>
        <style>
          .rpt-card-mini {
            padding:14px 18px; border-radius:14px;
            display:flex; align-items:center; gap:14px;
          }
          .rpt-card-mini .lbl { font-size:12px; font-weight:600; opacity:.85; }
          .rpt-card-mini .val { font-size:20px; font-weight:700; line-height:1.1; margin-top:2px; }
        \x3c/style>
      `;
    })
      .catch(() => {});
}

let _finSearchTimer = null;
function onFinanceSearch() {
  FinanceState.search = document.getElementById('finSearch').value;
  FinanceState.page = 1;
  clearTimeout(_finSearchTimer);
  _finSearchTimer = setTimeout(loadFinanceTable, 300);
}
function onFinanceFilter() {
  FinanceState.type  = document.getElementById('finType').value;
  FinanceState.start = document.getElementById('finStart').value;
  FinanceState.end   = document.getElementById('finEnd').value;
  FinanceState.page = 1;
  loadFinanceTable();
}
function financeGoToPage(p) { FinanceState.page = p; loadFinanceTable(); }

function loadFinanceTable() {
  const area = document.getElementById('finTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  apiCall('getTransactions', {
      page: FinanceState.page, search: FinanceState.search,
      type: FinanceState.type, start: FinanceState.start, end: FinanceState.end
    })
      .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      FinanceState.data = res;
      renderFinanceTable(res);
    })
      .catch(() => {});
}

function renderFinanceTable(res) {
  const area = document.getElementById('finTable');
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-receipt'>\x3c/i>ยังไม่มีรายการ\x3c/div>`;
    return;
  }
  const methodLabel = { cash:'เงินสด', transfer:'โอน', cheque:'เช็ค' };
  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">วันที่\x3c/th>
            <th class="px-3 py-2.5 text-left">เลขที่\x3c/th>
            <th class="px-3 py-2.5 text-left">รายการ\x3c/th>
            <th class="px-3 py-2.5 text-left">หมวด\x3c/th>
            <th class="px-3 py-2.5 text-left">วิธีชำระ\x3c/th>
            <th class="px-3 py-2.5 text-right">จำนวนเงิน\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(t => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-3 py-2.5 whitespace-nowrap">${formatThaiDateShort(t.date)}\x3c/td>
              <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(t.receipt_number || t.transaction_id || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(t.description || '-')}\x3c/td>
              <td class="px-3 py-2.5">${escapeHTML(t.category || '-')}\x3c/td>
              <td class="px-3 py-2.5">${methodLabel[t.payment_method] || t.payment_method}\x3c/td>
              <td class="px-3 py-2.5 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                ${t.type === 'income' ? '+' : '-'} ${formatMoney(t.amount).replace('฿','')}
              \x3c/td>
              <td class="px-3 py-2.5 text-center">
                <div class="flex justify-center gap-1">
                  ${t.type === 'income' && t.receipt_number ? `
                    <button class="btn btn-light btn-icon" onclick="printReceipt('${t.id}')" title="พิมพ์ใบเสร็จ" style="color:#10B981;">
                      <i class='bx bx-printer'>\x3c/i>
                    \x3c/button>` : ''}
                  <button class="btn btn-light btn-icon" onclick="openTransactionForm('${t.type}','${t.id}')" title="แก้ไข" style="color:#3B82F6;">
                    <i class='bx bx-edit'>\x3c/i>
                  \x3c/button>
                  <button class="btn btn-light btn-icon" onclick="deleteTransactionConfirm('${t.id}')" title="ลบ" style="color:#EF4444;">
                    <i class='bx bx-trash'>\x3c/i>
                  \x3c/button>
                \x3c/div>
              \x3c/td>
            \x3c/tr>
          `).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'financeGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} รายการ\x3c/div>
  `;
}

function openTransactionForm(type, id) {
  // ดึง student list สำหรับ reference
  apiCall('getStudents', { page:1, per_page:500, status:'active' })
      .then(sRes => {
      const students = (sRes.status === 'success') ? sRes.data : [];
      if (id) {
        // load tx existing
        const tx = FinanceState.data.data.find(x => x.id === id);
        showTransactionForm(tx || { type }, students);
      } else {
        showTransactionForm({ type, date: new Date().toISOString().slice(0,10), payment_method:'cash' }, students);
      }
    })
      .catch(() => showTransactionForm({ type, date: new Date().toISOString().slice(0,10), payment_method:'cash' }, []));
}

function showTransactionForm(data, students) {
  const t = data || {};
  const isIncome = t.type === 'income';
  const cats = isIncome
    ? ['ค่าเทอม','ค่าบำรุง','ค่ากิจกรรม','เงินบริจาค','อื่นๆ']
    : ['ค่าวัสดุ','ค่าน้ำค่าไฟ','ค่าจ้าง','ค่าซ่อมบำรุง','อื่นๆ'];

  Swal.fire({
    title: (t.id ? 'แก้ไข' : 'เพิ่ม') + (isIncome ? 'รายรับ' : 'รายจ่าย'),
    width: 600,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="tf_id" value="${escapeHTML(t.id || '')}">
        <input type="hidden" id="tf_type" value="${t.type}">

        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-6">
            <label class="form-label">วันที่\x3c/label>
            <input type="date" id="tf_date" class="form-input" value="${escapeHTML((t.date||'').slice(0,10))}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">วิธีชำระ\x3c/label>
            <select id="tf_payment_method" class="form-input">
              <option value="cash"     ${(t.payment_method||'cash')==='cash'?'selected':''}>เงินสด\x3c/option>
              <option value="transfer" ${t.payment_method==='transfer'?'selected':''}>โอนเงิน\x3c/option>
              <option value="cheque"   ${t.payment_method==='cheque'?'selected':''}>เช็ค\x3c/option>
            \x3c/select>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">หมวดหมู่\x3c/label>
            <select id="tf_category" class="form-input">
              <option value="">เลือก\x3c/option>
              ${cats.map(c => `<option value="${c}" ${t.category===c?'selected':''}>${c}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>

          ${isIncome ? `
            <div class="col-span-12">
              <label class="form-label">นักเรียน (ถ้ามี)\x3c/label>
              <select id="tf_reference_id" class="form-input">
                <option value="">— ไม่ระบุ —\x3c/option>
                ${students.map(s =>
                  `<option value="${s.id}" ${t.reference_id===s.id?'selected':''}>${escapeHTML((s.prefix||'')+(s.first_name||'')+' '+(s.last_name||''))} (${escapeHTML(s.classroom||'-')})\x3c/option>`
                ).join('')}
              \x3c/select>
            \x3c/div>` : ''}

          <div class="col-span-12">
            <label class="form-label">รายการ / รายละเอียด\x3c/label>
            <textarea id="tf_description" class="form-input" rows="2">${escapeHTML(t.description||'')}\x3c/textarea>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">จำนวนเงิน (บาท) <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="number" min="0" step="0.01" id="tf_amount" class="form-input"
                   style="font-size:18px; font-weight:700; text-align:right;"
                   value="${t.amount||''}">
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
      const amt = parseFloat(document.getElementById('tf_amount').value);
      if (!amt || amt <= 0) { Swal.showValidationMessage('กรุณากรอกจำนวนเงิน'); return false; }
      return {
        id            : document.getElementById('tf_id').value || null,
        type          : document.getElementById('tf_type').value,
        date          : document.getElementById('tf_date').value,
        payment_method: document.getElementById('tf_payment_method').value,
        category      : document.getElementById('tf_category').value,
        reference_id  : isIncome ? (document.getElementById('tf_reference_id')||{}).value : '',
        description   : document.getElementById('tf_description').value,
        amount        : amt
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('saveTransaction', r.value)
        .then(res => {
        hideLoading();
        if (res.status === 'success') {
          showToast('success', res.message);
          loadFinanceSummary();
          loadFinanceTable();
          if (isIncome && res.data && res.data.receipt_number) {
            // ถาม pop print receipt
            setTimeout(() => {
              Swal.fire({
                icon:'success', title:'บันทึกแล้ว',
                text:'พิมพ์ใบเสร็จเลยไหม?',
                showCancelButton: true,
                confirmButtonText:'<i class="bx bx-printer">\x3c/i> พิมพ์',
                cancelButtonText:'ทีหลัง'
              }).then(rp => {
                if (rp.isConfirmed) printReceipt(res.data.id);
              });
            }, 300);
          }
        } else Swal.fire({ icon:'error', text:res.message });
      })
        .catch(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); });
  });
}

function deleteTransactionConfirm(id) {
  Swal.fire({
    title:'ยืนยันการลบ?', icon:'warning',
    showCancelButton: true, confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    apiCall('deleteTransaction', id)
        .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadFinanceSummary(); loadFinanceTable(); }
        else showToast('error', res.message);
      })
        .catch(() => {});
  });
}

function printReceipt(transactionId) {
  showLoading('กำลังเตรียมใบเสร็จ...');
  apiCall('generateReceiptHTML', transactionId)
      .then(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      openHTMLDocument(res.html);
    })
      .catch(err => { hideLoading(); showToast('error', err.message || err); });
}


/* ============================================================
 *  DOCUMENTS (สารบรรณ)
 * ============================================================ */
const DocsState = { page:1, search:'', doc_type:'', status:'', data:null };

const DOC_TYPES = {
  receive : { label:'หนังสือรับ',     color:'#10B981', icon:'bx-envelope-open' },
  send    : { label:'หนังสือส่ง',     color:'#3B82F6', icon:'bx-send' },
  order   : { label:'คำสั่ง',         color:'#8B5CF6', icon:'bx-clipboard' },
  memo    : { label:'บันทึกข้อความ',  color:'#F59E0B', icon:'bx-note' },
  announce: { label:'ประกาศ',         color:'#EF4444', icon:'bx-megaphone' },
  form    : { label:'แบบฟอร์มเอกสาร', color:'#06B6D4', icon:'bx-file' }
};

function renderDocuments(container) {
  container.innerHTML = `
    ${pageHeader('สารบรรณโรงเรียน', 'bxs-envelope', `
      <button class="btn btn-blue" onclick="openDocumentForm()">
        <i class='bx bx-plus'>\x3c/i> เพิ่มเอกสาร
      \x3c/button>
    `)}

    <div class="page-card mb-3">
      <div class="page-card-body">
        <div class="grid grid-cols-2 md:grid-cols-6 gap-2" id="docTypeCards">\x3c/div>
      \x3c/div>
    \x3c/div>

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="docSearch" placeholder="ค้นหา เลขที่ / เรื่อง"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onDocSearch()">
          \x3c/div>
          <select id="docType" onchange="onDocFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกประเภท\x3c/option>
            ${Object.keys(DOC_TYPES).map(k => `<option value="${k}">${DOC_TYPES[k].label}\x3c/option>`).join('')}
          \x3c/select>
          <select id="docStatus" onchange="onDocFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกสถานะ\x3c/option>
            <option value="draft">ร่าง\x3c/option>
            <option value="active">ใช้งาน\x3c/option>
            <option value="archived">เก็บถาวร\x3c/option>
          \x3c/select>
        \x3c/div>

        <div id="docTable">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;

  renderDocTypeCards();
  loadDocuments();
}

function renderDocTypeCards() {
  document.getElementById('docTypeCards').innerHTML = Object.keys(DOC_TYPES).map(k => {
    const t = DOC_TYPES[k];
    return `
      <div class="doc-type-card" onclick="DocsState.doc_type='${k}'; DocsState.page=1; document.getElementById('docType').value='${k}'; loadDocuments();"
           style="cursor:pointer; padding:14px; border-radius:12px; background:white; border:1px solid #F1F5F9; text-align:center; transition:all .15s;">
        <div style="width:46px; height:46px; margin:0 auto 8px; border-radius:12px; background:${t.color}1A; color:${t.color}; display:flex; align-items:center; justify-content:center; font-size:24px;">
          <i class='bx ${t.icon}'>\x3c/i>
        \x3c/div>
        <div class="text-xs font-semibold text-slate-700">${t.label}\x3c/div>
      \x3c/div>`;
  }).join('') + `
    <style>
      .doc-type-card:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,.06); }
    \x3c/style>
  `;
}

let _docSearchTimer = null;
function onDocSearch() {
  DocsState.search = document.getElementById('docSearch').value;
  DocsState.page = 1;
  clearTimeout(_docSearchTimer);
  _docSearchTimer = setTimeout(loadDocuments, 300);
}
function onDocFilter() {
  DocsState.doc_type = document.getElementById('docType').value;
  DocsState.status   = document.getElementById('docStatus').value;
  DocsState.page = 1;
  loadDocuments();
}
function docsGoToPage(p) { DocsState.page = p; loadDocuments(); }

function loadDocuments() {
  const area = document.getElementById('docTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  apiCall('getDocuments', {
      page: DocsState.page, search: DocsState.search,
      doc_type: DocsState.doc_type, status: DocsState.status
    })
      .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      DocsState.data = res;
      renderDocumentsTable(res);
    })
      .catch(() => {});
}

function renderDocumentsTable(res) {
  const area = document.getElementById('docTable');
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-folder-open'>\x3c/i>ไม่มีเอกสาร\x3c/div>`;
    return;
  }
  const statusLabel = { draft:'ร่าง', active:'ใช้งาน', archived:'เก็บถาวร' };
  const statusClass = { draft:'status-pending', active:'status-active', archived:'status-inactive' };

  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">เลขที่\x3c/th>
            <th class="px-3 py-2.5 text-left">ประเภท\x3c/th>
            <th class="px-3 py-2.5 text-left">เรื่อง\x3c/th>
            <th class="px-3 py-2.5 text-left">จาก/ถึง\x3c/th>
            <th class="px-3 py-2.5 text-left">วันที่\x3c/th>
            <th class="px-3 py-2.5 text-center">สถานะ\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(d => {
            const t = DOC_TYPES[d.doc_type] || { label:d.doc_type, color:'#64748B', icon:'bx-file' };
            return `
              <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(d.doc_number || '-')}\x3c/td>
                <td class="px-3 py-2.5">
                  <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:${t.color};font-weight:600;">
                    <i class='bx ${t.icon}'>\x3c/i> ${t.label}
                  \x3c/span>
                \x3c/td>
                <td class="px-3 py-2.5 font-semibold text-slate-800">${escapeHTML(d.subject || '-')}\x3c/td>
                <td class="px-3 py-2.5">
                  <div class="text-xs text-slate-600">จาก: ${escapeHTML(d.from || '-')}\x3c/div>
                  <div class="text-xs text-slate-600">ถึง: ${escapeHTML(d.to || '-')}\x3c/div>
                \x3c/td>
                <td class="px-3 py-2.5 whitespace-nowrap">${formatThaiDateShort(d.date)}\x3c/td>
                <td class="px-3 py-2.5 text-center">
                  <span class="status-badge ${statusClass[d.status]||'status-pending'}">${statusLabel[d.status]||d.status}\x3c/span>
                \x3c/td>
                <td class="px-3 py-2.5 text-center">
                  <div class="flex justify-center gap-1">
                    <button class="btn btn-light btn-icon" onclick="viewDocument('${d.id}')" title="ดู">
                      <i class='bx bx-show'>\x3c/i>
                    \x3c/button>
                    <button class="btn btn-light btn-icon" onclick="openDocumentForm('${d.id}')" title="แก้ไข" style="color:#3B82F6;">
                      <i class='bx bx-edit'>\x3c/i>
                    \x3c/button>
                    <button class="btn btn-light btn-icon" onclick="deleteDocumentConfirm('${d.id}')" title="ลบ" style="color:#EF4444;">
                      <i class='bx bx-trash'>\x3c/i>
                    \x3c/button>
                  \x3c/div>
                \x3c/td>
              \x3c/tr>`;
          }).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'docsGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} เอกสาร\x3c/div>
  `;
}

function openDocumentForm(id) {
  if (id) {
    const d = DocsState.data && DocsState.data.data.find(x => x.id === id);
    if (d) showDocumentForm(d);
    else showToast('error', 'ไม่พบเอกสาร');
  } else {
    showDocumentForm(null);
  }
}

function showDocumentForm(data) {
  const d = data || {};

  Swal.fire({
    title: d.id ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสารใหม่',
    width: 720,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <input type="hidden" id="df_id" value="${escapeHTML(d.id || '')}">

        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-4">
            <label class="form-label">ประเภท <span class="text-red-500">*\x3c/span>\x3c/label>
            <select id="df_doc_type" class="form-input">
              ${Object.keys(DOC_TYPES).map(k => `<option value="${k}" ${d.doc_type===k?'selected':''}>${DOC_TYPES[k].label}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">วันที่\x3c/label>
            <input type="date" id="df_date" class="form-input" value="${escapeHTML((d.date||new Date().toISOString().slice(0,10)).slice(0,10))}">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">สถานะ\x3c/label>
            <select id="df_status" class="form-input">
              <option value="draft"   ${(d.status||'draft')==='draft'?'selected':''}>ร่าง\x3c/option>
              <option value="active"  ${d.status==='active'?'selected':''}>ใช้งาน\x3c/option>
              <option value="archived"${d.status==='archived'?'selected':''}>เก็บถาวร\x3c/option>
            \x3c/select>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">เรื่อง <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="df_subject" class="form-input" value="${escapeHTML(d.subject||'')}">
          \x3c/div>

          <div class="col-span-6">
            <label class="form-label">จาก\x3c/label>
            <input type="text" id="df_from" class="form-input" value="${escapeHTML(d.from||'')}">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ถึง\x3c/label>
            <input type="text" id="df_to" class="form-input" value="${escapeHTML(d.to||'')}">
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">เนื้อหา\x3c/label>
            <textarea id="df_content" class="form-input" rows="5">${escapeHTML(d.content||'')}\x3c/textarea>
          \x3c/div>

          <div class="col-span-12">
            <label class="form-label">ไฟล์แนบ\x3c/label>
            <div class="flex items-center gap-2">
              <input type="file" id="df_file_input" style="display:none;"
                     onchange="handleImageUpload(this,'documents',(url)=>{
                       document.getElementById('df_attachment').value=url;
                       document.getElementById('df_attachment_label').textContent='แนบไฟล์แล้ว';
                     })">
              <button type="button" class="btn btn-outline" style="padding:6px 12px;font-size:12px;"
                      onclick="document.getElementById('df_file_input').click()">
                <i class='bx bx-paperclip'>\x3c/i> เลือกไฟล์
              \x3c/button>
              <span id="df_attachment_label" class="text-xs text-slate-500">
                ${d.attachment ? 'แนบไฟล์แล้ว' : 'ยังไม่ได้แนบ'}
              \x3c/span>
              ${d.attachment ? `<a href="${escapeHTML(d.attachment)}" target="_blank" class="text-xs text-blue-600 hover:underline ml-2">ดูไฟล์\x3c/a>` : ''}
              <input type="hidden" id="df_attachment" value="${escapeHTML(d.attachment||'')}">
            \x3c/div>
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
      const subject = document.getElementById('df_subject').value.trim();
      if (!subject) { Swal.showValidationMessage('กรุณากรอกเรื่อง'); return false; }
      return {
        id        : document.getElementById('df_id').value || null,
        doc_type  : document.getElementById('df_doc_type').value,
        date      : document.getElementById('df_date').value,
        status    : document.getElementById('df_status').value,
        subject   : subject,
        from      : document.getElementById('df_from').value,
        to        : document.getElementById('df_to').value,
        content   : document.getElementById('df_content').value,
        attachment: document.getElementById('df_attachment').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('saveDocument', r.value)
        .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadDocuments(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
        .catch(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); });
  });
}

function viewDocument(id) {
  const d = DocsState.data && DocsState.data.data.find(x => x.id === id);
  if (!d) return showToast('error', 'ไม่พบเอกสาร');
  const t = DOC_TYPES[d.doc_type] || { label:d.doc_type, color:'#64748B' };

  Swal.fire({
    title: t.label,
    width: 640,
    showCloseButton: true,
    showConfirmButton: false,
    html: `
      <div style="text-align:left;">
        <div style="background:${t.color}1A; color:${t.color}; padding:10px 16px; border-radius:10px; margin-bottom:14px;">
          <div class="text-xs font-semibold opacity-80">เลขที่\x3c/div>
          <div class="font-mono text-lg font-bold">${escapeHTML(d.doc_number || '-')}\x3c/div>
        \x3c/div>
        <h3 style="color:#0F172A; font-size:17px; margin:0 0 12px;">${escapeHTML(d.subject || '-')}\x3c/h3>
        <div style="display:grid; grid-template-columns:auto 1fr; gap:6px 16px; font-size:13px; margin-bottom:14px;">
          <span class="text-slate-500">วันที่:\x3c/span>  <span>${formatThaiDate(d.date)}\x3c/span>
          <span class="text-slate-500">จาก:\x3c/span>     <span>${escapeHTML(d.from || '-')}\x3c/span>
          <span class="text-slate-500">ถึง:\x3c/span>     <span>${escapeHTML(d.to || '-')}\x3c/span>
        \x3c/div>
        ${d.content ? `<div style="background:#F8FAFC; padding:12px; border-radius:8px; white-space:pre-wrap; font-size:13px;">${escapeHTML(d.content)}\x3c/div>` : ''}
        ${d.attachment ? `<div class="mt-3"><a href="${escapeHTML(d.attachment)}" target="_blank" class="btn btn-outline" style="font-size:12px;"><i class='bx bx-paperclip'>\x3c/i> เปิดไฟล์แนบ\x3c/a>\x3c/div>` : ''}
      \x3c/div>
    `
  });
}

function deleteDocumentConfirm(id) {
  Swal.fire({
    title:'ยืนยันการลบ?', icon:'warning',
    showCancelButton: true, confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก',
    confirmButtonColor:'#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    apiCall('deleteDocument', id)
        .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadDocuments(); }
        else showToast('error', res.message);
      })
        .catch(() => {});
  });
}


/* ============================================================
 *  APPROVALS
 * ============================================================ */
const ApprovalsState = { page:1, search:'', type:'', status:'', data:null };

const APPROVAL_TYPES = {
  leave   : { label:'ใบลา',           icon:'bx-calendar-x' },
  budget  : { label:'งบประมาณ',       icon:'bx-money' },
  purchase: { label:'จัดซื้อ',         icon:'bx-cart' },
  trip    : { label:'ไปราชการ',       icon:'bx-trip' },
  other   : { label:'อื่นๆ',           icon:'bx-file' }
};

function renderApprovals(container) {
  container.innerHTML = `
    ${pageHeader('ระบบอนุมัติ', 'bxs-badge-check', `
      <button class="btn btn-blue" onclick="openApprovalForm()">
        <i class='bx bx-plus'>\x3c/i> ส่งคำขออนุมัติ
      \x3c/button>
    `)}

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="aprSearch" placeholder="ค้นหา"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onAprSearch()">
          \x3c/div>
          <select id="aprType" onchange="onAprFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกประเภท\x3c/option>
            ${Object.keys(APPROVAL_TYPES).map(k => `<option value="${k}">${APPROVAL_TYPES[k].label}\x3c/option>`).join('')}
          \x3c/select>
          <select id="aprStatus" onchange="onAprFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกสถานะ\x3c/option>
            <option value="pending"  selected>รอพิจารณา\x3c/option>
            <option value="approved">อนุมัติแล้ว\x3c/option>
            <option value="rejected">ปฏิเสธ\x3c/option>
          \x3c/select>
        \x3c/div>

        <div id="aprTable">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;
  ApprovalsState.status = 'pending';
  loadApprovals();
}

let _aprSearchTimer = null;
function onAprSearch() {
  ApprovalsState.search = document.getElementById('aprSearch').value;
  ApprovalsState.page = 1;
  clearTimeout(_aprSearchTimer);
  _aprSearchTimer = setTimeout(loadApprovals, 300);
}
function onAprFilter() {
  ApprovalsState.type   = document.getElementById('aprType').value;
  ApprovalsState.status = document.getElementById('aprStatus').value;
  ApprovalsState.page = 1;
  loadApprovals();
}
function aprGoToPage(p) { ApprovalsState.page = p; loadApprovals(); }

function loadApprovals() {
  const area = document.getElementById('aprTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  apiCall('getApprovals', {
      page: ApprovalsState.page, search: ApprovalsState.search,
      type: ApprovalsState.type, status: ApprovalsState.status
    })
      .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      ApprovalsState.data = res;
      renderApprovalsTable(res);
      refreshBadges();
    })
      .catch(() => {});
}

function renderApprovalsTable(res) {
  const area = document.getElementById('aprTable');
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-task'>\x3c/i>ไม่มีคำขอ\x3c/div>`;
    return;
  }
  const canApprove = (APP.user.permissions || []).includes('approve');
  const statusBadge = (s) => {
    if (s === 'approved') return '<span class="status-badge status-active">อนุมัติแล้ว\x3c/span>';
    if (s === 'rejected') return '<span class="status-badge status-inactive">ปฏิเสธ\x3c/span>';
    return '<span class="status-badge status-pending">รอพิจารณา\x3c/span>';
  };

  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">เลขที่\x3c/th>
            <th class="px-3 py-2.5 text-left">ประเภท\x3c/th>
            <th class="px-3 py-2.5 text-left">เรื่อง\x3c/th>
            <th class="px-3 py-2.5 text-left">ผู้ขอ\x3c/th>
            <th class="px-3 py-2.5 text-left">วันที่ขอ\x3c/th>
            <th class="px-3 py-2.5 text-right">จำนวนเงิน\x3c/th>
            <th class="px-3 py-2.5 text-center">สถานะ\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(a => {
            const t = APPROVAL_TYPES[a.type] || { label:a.type, icon:'bx-file' };
            return `
              <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(a.request_id || '-')}\x3c/td>
                <td class="px-3 py-2.5"><i class='bx ${t.icon} mr-1' style="color:#3B82F6;">\x3c/i> ${t.label}\x3c/td>
                <td class="px-3 py-2.5 font-semibold">${escapeHTML(a.subject || '-')}\x3c/td>
                <td class="px-3 py-2.5">${escapeHTML(a.requester_name || '-')}\x3c/td>
                <td class="px-3 py-2.5 whitespace-nowrap text-xs">${formatThaiDateShort(a.requested_at)}\x3c/td>
                <td class="px-3 py-2.5 text-right font-semibold">${a.amount > 0 ? formatMoney(a.amount).replace('฿','') : '-'}\x3c/td>
                <td class="px-3 py-2.5 text-center">${statusBadge(a.status)}\x3c/td>
                <td class="px-3 py-2.5 text-center">
                  <div class="flex justify-center gap-1">
                    <button class="btn btn-light btn-icon" onclick="viewApproval('${a.id}')" title="ดู">
                      <i class='bx bx-show'>\x3c/i>
                    \x3c/button>
                    ${canApprove && a.status === 'pending' ? `
                      <button class="btn btn-light btn-icon" onclick="reviewApprovalDlg('${a.id}','approve')" title="อนุมัติ" style="color:#10B981;">
                        <i class='bx bx-check'>\x3c/i>
                      \x3c/button>
                      <button class="btn btn-light btn-icon" onclick="reviewApprovalDlg('${a.id}','reject')" title="ปฏิเสธ" style="color:#EF4444;">
                        <i class='bx bx-x'>\x3c/i>
                      \x3c/button>` : ''}
                  \x3c/div>
                \x3c/td>
              \x3c/tr>`;
          }).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'aprGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} คำขอ\x3c/div>
  `;
}

function openApprovalForm() {
  Swal.fire({
    title: 'ส่งคำขออนุมัติ',
    width: 600,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-send">\x3c/i> ส่งคำขอ',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left; font-size:14px;">
        <div class="grid grid-cols-12 gap-2 mb-3">
          <div class="col-span-12">
            <label class="form-label">ประเภทคำขอ <span class="text-red-500">*\x3c/span>\x3c/label>
            <select id="af_type" class="form-input">
              ${Object.keys(APPROVAL_TYPES).map(k => `<option value="${k}">${APPROVAL_TYPES[k].label}\x3c/option>`).join('')}
            \x3c/select>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">เรื่อง <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="af_subject" class="form-input">
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">รายละเอียด\x3c/label>
            <textarea id="af_detail" class="form-input" rows="4">\x3c/textarea>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">จำนวนเงิน (ถ้ามี)\x3c/label>
            <input type="number" min="0" step="0.01" id="af_amount" class="form-input" placeholder="0.00">
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">ไฟล์แนบ\x3c/label>
            <div class="flex items-center gap-2">
              <input type="file" id="af_file_input" style="display:none;"
                     onchange="handleImageUpload(this,'approvals',(url)=>{
                       document.getElementById('af_attachment').value=url;
                       document.getElementById('af_attachment_label').textContent='แนบไฟล์แล้ว';
                     })">
              <button type="button" class="btn btn-outline" style="padding:6px 12px;font-size:12px;"
                      onclick="document.getElementById('af_file_input').click()">
                <i class='bx bx-paperclip'>\x3c/i> เลือกไฟล์
              \x3c/button>
              <span id="af_attachment_label" class="text-xs text-slate-500">ยังไม่ได้แนบ\x3c/span>
              <input type="hidden" id="af_attachment">
            \x3c/div>
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
      const subject = document.getElementById('af_subject').value.trim();
      if (!subject) { Swal.showValidationMessage('กรุณากรอกเรื่อง'); return false; }
      return {
        type      : document.getElementById('af_type').value,
        subject   : subject,
        detail    : document.getElementById('af_detail').value,
        amount    : document.getElementById('af_amount').value,
        attachment: document.getElementById('af_attachment').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังส่งคำขอ...');
    apiCall('saveApproval', r.value)
        .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadApprovals(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
        .catch(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); });
  });
}

function viewApproval(id) {
  const a = ApprovalsState.data && ApprovalsState.data.data.find(x => x.id === id);
  if (!a) return showToast('error', 'ไม่พบคำขอ');
  const t = APPROVAL_TYPES[a.type] || { label:a.type };

  Swal.fire({
    title: t.label,
    width: 640,
    showCloseButton: true,
    showConfirmButton: false,
    html: `
      <div style="text-align:left;">
        <div style="background:#EFF6FF; padding:14px; border-radius:10px; margin-bottom:14px;">
          <div class="text-xs text-slate-500">เลขที่\x3c/div>
          <div class="font-mono text-lg font-bold">${escapeHTML(a.request_id || '-')}\x3c/div>
        \x3c/div>
        <h3 style="font-size:16px; margin:0 0 12px;">${escapeHTML(a.subject || '-')}\x3c/h3>
        <div style="display:grid; grid-template-columns:auto 1fr; gap:6px 16px; font-size:13px; margin-bottom:14px;">
          <span class="text-slate-500">ผู้ขอ:\x3c/span>      <span>${escapeHTML(a.requester_name || '-')}\x3c/span>
          <span class="text-slate-500">วันที่ขอ:\x3c/span>   <span>${formatThaiDate(a.requested_at)}\x3c/span>
          ${a.amount > 0 ? `<span class="text-slate-500">จำนวนเงิน:\x3c/span> <span style="font-weight:700;color:#1E40AF;">${formatMoney(a.amount)}\x3c/span>` : ''}
          <span class="text-slate-500">สถานะ:\x3c/span>      <span>${a.status==='approved'?'<span class="status-badge status-active">อนุมัติแล้ว\x3c/span>':a.status==='rejected'?'<span class="status-badge status-inactive">ปฏิเสธ\x3c/span>':'<span class="status-badge status-pending">รอพิจารณา\x3c/span>'}\x3c/span>
          ${a.reviewer_name ? `<span class="text-slate-500">ผู้พิจารณา:\x3c/span> <span>${escapeHTML(a.reviewer_name)}\x3c/span>` : ''}
          ${a.reviewed_at   ? `<span class="text-slate-500">วันที่:\x3c/span>    <span>${formatThaiDate(a.reviewed_at)}\x3c/span>` : ''}
        \x3c/div>
        ${a.detail ? `<div style="background:#F8FAFC; padding:12px; border-radius:8px; white-space:pre-wrap; font-size:13px;">${escapeHTML(a.detail)}\x3c/div>` : ''}
        ${a.comment ? `<div class="mt-3"><div class="text-xs text-slate-500 mb-1">ความเห็นผู้พิจารณา:\x3c/div><div style="background:#FEF3C7; padding:10px; border-radius:8px; font-size:13px;">${escapeHTML(a.comment)}\x3c/div>\x3c/div>` : ''}
        ${a.attachment ? `<div class="mt-3"><a href="${escapeHTML(a.attachment)}" target="_blank" class="btn btn-outline" style="font-size:12px;"><i class='bx bx-paperclip'>\x3c/i> เปิดไฟล์แนบ\x3c/a>\x3c/div>` : ''}
      \x3c/div>
    `
  });
}

function reviewApprovalDlg(id, action) {
  Swal.fire({
    title: action === 'approve' ? 'อนุมัติคำขอ' : 'ปฏิเสธคำขอ',
    icon: action === 'approve' ? 'success' : 'warning',
    input: 'textarea',
    inputLabel: 'ความเห็น (ถ้ามี)',
    inputPlaceholder: '...',
    showCancelButton: true,
    confirmButtonText: action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: action === 'approve' ? '#10B981' : '#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('reviewApproval', id, action, r.value || '')
        .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadApprovals(); }
        else showToast('error', res.message);
      })
        .catch(() => {});
  });
}


/* ============================================================
 *  REGISTRATION
 * ============================================================ */
const RegState = { page:1, search:'', status:'', data:null };

function renderRegistration(container) {
  container.innerHTML = `
    ${pageHeader('งานทะเบียน', 'bxs-id-card', `
      <button class="btn btn-blue" onclick="openRegistrationForm()">
        <i class='bx bx-plus'>\x3c/i> รับสมัครใหม่
      \x3c/button>
    `)}

    <div class="page-card">
      <div class="page-card-body">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
          <div class="md:col-span-2 relative">
            <i class='bx bx-search absolute' style="left:12px; top:50%; transform:translateY(-50%); color:#94A3B8;">\x3c/i>
            <input type="text" id="regSearch" placeholder="ค้นหา รหัสใบสมัคร / ชื่อ"
                   class="w-full rounded-lg border border-slate-200 px-9 py-2 text-sm focus:outline-none focus:border-blue-400"
                   oninput="onRegSearch()">
          \x3c/div>
          <select id="regStatus" onchange="onRegFilter()"
                  class="rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">ทุกสถานะ\x3c/option>
            <option value="pending"  selected>รอพิจารณา\x3c/option>
            <option value="approved">อนุมัติแล้ว\x3c/option>
            <option value="rejected">ปฏิเสธ\x3c/option>
          \x3c/select>
        \x3c/div>

        <div id="regTable">
          <div class="empty-state"><i class='bx bx-loader-alt bx-spin'>\x3c/i>กำลังโหลด...\x3c/div>
        \x3c/div>
      \x3c/div>
    \x3c/div>
  `;
  RegState.status = 'pending';
  loadRegistrations();
}

let _regSearchTimer = null;
function onRegSearch() {
  RegState.search = document.getElementById('regSearch').value;
  RegState.page = 1;
  clearTimeout(_regSearchTimer);
  _regSearchTimer = setTimeout(loadRegistrations, 300);
}
function onRegFilter() {
  RegState.status = document.getElementById('regStatus').value;
  RegState.page = 1;
  loadRegistrations();
}
function regGoToPage(p) { RegState.page = p; loadRegistrations(); }

function loadRegistrations() {
  const area = document.getElementById('regTable');
  if (area) area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin">\x3c/i>กำลังโหลด...\x3c/div>';

  apiCall('getRegistrations', { page: RegState.page, search: RegState.search, status: RegState.status })
      .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      RegState.data = res;
      renderRegistrationsTable(res);
    })
      .catch(() => {});
}

function renderRegistrationsTable(res) {
  const area = document.getElementById('regTable');
  if (res.data.length === 0) {
    area.innerHTML = `<div class="empty-state"><i class='bx bx-clipboard'>\x3c/i>ไม่มีใบสมัคร\x3c/div>`;
    return;
  }
  const canApprove = (APP.user.permissions || []).includes('approve');
  const statusBadge = (s) => {
    if (s === 'approved') return '<span class="status-badge status-active">อนุมัติแล้ว\x3c/span>';
    if (s === 'rejected') return '<span class="status-badge status-inactive">ปฏิเสธ\x3c/span>';
    return '<span class="status-badge status-pending">รอพิจารณา\x3c/span>';
  };

  area.innerHTML = `
    <div style="overflow-x:auto;">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="bg-slate-50 text-slate-600 text-xs uppercase">
            <th class="px-3 py-2.5 text-left rounded-l-lg">เลขที่ใบสมัคร\x3c/th>
            <th class="px-3 py-2.5 text-left">ชื่อนักเรียน\x3c/th>
            <th class="px-3 py-2.5 text-left">ชั้นที่สมัคร\x3c/th>
            <th class="px-3 py-2.5 text-left">ปีการศึกษา\x3c/th>
            <th class="px-3 py-2.5 text-left">วันที่สมัคร\x3c/th>
            <th class="px-3 py-2.5 text-center">สถานะ\x3c/th>
            <th class="px-3 py-2.5 text-center rounded-r-lg">การจัดการ\x3c/th>
          \x3c/tr>
        \x3c/thead>
        <tbody>
          ${res.data.map(r => {
            const sd = r.student_data || {};
            return `
              <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="px-3 py-2.5 font-mono text-xs">${escapeHTML(r.application_id || '-')}\x3c/td>
                <td class="px-3 py-2.5">
                  <div class="flex items-center gap-2">
                    ${avatarHTML(sd.photo, sd.first_name, 32)}
                    <div>
                      <div class="font-semibold text-slate-800">${escapeHTML((sd.prefix||'')+(sd.first_name||'')+' '+(sd.last_name||''))}\x3c/div>
                      <div class="text-xs text-slate-500">${escapeHTML(sd.national_id || '-')}\x3c/div>
                    \x3c/div>
                  \x3c/div>
                \x3c/td>
                <td class="px-3 py-2.5">${escapeHTML(r.grade_applying || '-')}\x3c/td>
                <td class="px-3 py-2.5">${escapeHTML(r.academic_year || '-')}\x3c/td>
                <td class="px-3 py-2.5 whitespace-nowrap text-xs">${formatThaiDateShort(r.created_at)}\x3c/td>
                <td class="px-3 py-2.5 text-center">${statusBadge(r.status)}\x3c/td>
                <td class="px-3 py-2.5 text-center">
                  <div class="flex justify-center gap-1">
                    <button class="btn btn-light btn-icon" onclick="viewRegistration('${r.id}')" title="ดู">
                      <i class='bx bx-show'>\x3c/i>
                    \x3c/button>
                    ${canApprove && r.status === 'pending' ? `
                      <button class="btn btn-light btn-icon" onclick="approveRegConfirm('${r.id}')" title="อนุมัติ" style="color:#10B981;">
                        <i class='bx bx-check'>\x3c/i>
                      \x3c/button>
                      <button class="btn btn-light btn-icon" onclick="rejectRegConfirm('${r.id}')" title="ปฏิเสธ" style="color:#EF4444;">
                        <i class='bx bx-x'>\x3c/i>
                      \x3c/button>` : ''}
                  \x3c/div>
                \x3c/td>
              \x3c/tr>`;
          }).join('')}
        \x3c/tbody>
      \x3c/table>
    \x3c/div>
    ${paginationHTML(res.page, res.total_pages, 'regGoToPage')}
    <div class="text-xs text-slate-400 text-right mt-1">รวม ${res.total} ใบสมัคร\x3c/div>
  `;
}

function openRegistrationForm() {
  Swal.fire({
    title: 'รับสมัครนักเรียนใหม่',
    width: 760,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    showCloseButton: true,
    html: `
      <div style="text-align:left; font-size:14px;">

        <!-- Photo -->
        <div class="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
          <div id="regPhotoBox" class="avatar-circle" style="width:70px;height:70px;border-radius:50%;font-size:24px;">?\x3c/div>
          <div>
            <button type="button" class="btn btn-outline" onclick="document.getElementById('regPhotoInput').click()">
              <i class='bx bx-upload'>\x3c/i> รูปนักเรียน
            \x3c/button>
            <input type="file" id="regPhotoInput" accept="image/*" style="display:none;"
                   onchange="handleImageUpload(this,'students',(url)=>{
                     document.getElementById('rf_photo').value=url;
                     document.getElementById('regPhotoBox').style.backgroundImage='url('+url+')';
                     document.getElementById('regPhotoBox').textContent='';
                   })">
            <input type="hidden" id="rf_photo">
          \x3c/div>
        \x3c/div>

        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ข้อมูลใบสมัคร\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-6">
            <label class="form-label">ชั้นที่สมัคร <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="rf_grade_applying" class="form-input" placeholder="ม.1/1">
          \x3c/div>
          <div class="col-span-6">
            <label class="form-label">ปีการศึกษา\x3c/label>
            <input type="text" id="rf_academic_year" class="form-input" value="${escapeHTML(APP.dashboardData?.config?.academic_year || (new Date().getFullYear()+543))}">
          \x3c/div>
        \x3c/div>

        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ข้อมูลนักเรียน\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-3">
            <label class="form-label">คำนำหน้า\x3c/label>
            <select id="rf_prefix" class="form-input">
              <option value="">เลือก\x3c/option>
              <option value="เด็กชาย">เด็กชาย\x3c/option>
              <option value="เด็กหญิง">เด็กหญิง\x3c/option>
              <option value="นาย">นาย\x3c/option>
              <option value="นางสาว">นางสาว\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">ชื่อ <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="rf_first_name" class="form-input">
          \x3c/div>
          <div class="col-span-5">
            <label class="form-label">นามสกุล <span class="text-red-500">*\x3c/span>\x3c/label>
            <input type="text" id="rf_last_name" class="form-input">
          \x3c/div>

          <div class="col-span-4">
            <label class="form-label">เลขบัตรประชาชน\x3c/label>
            <input type="text" id="rf_national_id" class="form-input" maxlength="13">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">วันเกิด\x3c/label>
            <input type="date" id="rf_birth_date" class="form-input">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">เพศ\x3c/label>
            <select id="rf_gender" class="form-input">
              <option value="">เลือก\x3c/option>
              <option value="male">ชาย\x3c/option>
              <option value="female">หญิง\x3c/option>
            \x3c/select>
          \x3c/div>
        \x3c/div>

        <div class="text-xs font-semibold text-blue-600 mb-2 uppercase">ผู้ปกครอง\x3c/div>
        <div class="grid grid-cols-12 gap-2 mb-4">
          <div class="col-span-5">
            <label class="form-label">ชื่อผู้ปกครอง\x3c/label>
            <input type="text" id="rf_parent_name" class="form-input">
          \x3c/div>
          <div class="col-span-4">
            <label class="form-label">เบอร์โทร\x3c/label>
            <input type="tel" id="rf_parent_phone" class="form-input">
          \x3c/div>
          <div class="col-span-3">
            <label class="form-label">ความสัมพันธ์\x3c/label>
            <select id="rf_parent_relation" class="form-input">
              <option value="">เลือก\x3c/option>
              <option value="บิดา">บิดา\x3c/option>
              <option value="มารดา">มารดา\x3c/option>
              <option value="ผู้ปกครอง">ผู้ปกครอง\x3c/option>
            \x3c/select>
          \x3c/div>
          <div class="col-span-12">
            <label class="form-label">ที่อยู่\x3c/label>
            <textarea id="rf_address" class="form-input" rows="2">\x3c/textarea>
          \x3c/div>
        \x3c/div>

        <div>
          <label class="form-label">หมายเหตุ\x3c/label>
          <textarea id="rf_note" class="form-input" rows="2" placeholder="เอกสารที่ยื่น, ข้อสังเกต ...">\x3c/textarea>
        \x3c/div>
      \x3c/div>
      <style>
        .form-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:3px; }
        .form-input { width:100%; padding:7px 10px; border:1.5px solid #E2E8F0; border-radius:8px; font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box; }
        .form-input:focus { outline:none; border-color:#3B82F6; background:white; }
      \x3c/style>
    `,
    preConfirm: () => {
      const fn = document.getElementById('rf_first_name').value.trim();
      const ln = document.getElementById('rf_last_name').value.trim();
      const gd = document.getElementById('rf_grade_applying').value.trim();
      if (!fn || !ln) { Swal.showValidationMessage('กรุณากรอกชื่อและนามสกุล'); return false; }
      if (!gd) { Swal.showValidationMessage('กรุณากรอกชั้นที่สมัคร'); return false; }

      return {
        academic_year : document.getElementById('rf_academic_year').value,
        grade_applying: gd,
        student_data: {
          prefix         : document.getElementById('rf_prefix').value,
          first_name     : fn,
          last_name      : ln,
          national_id    : document.getElementById('rf_national_id').value,
          birth_date     : document.getElementById('rf_birth_date').value,
          gender         : document.getElementById('rf_gender').value,
          parent_name    : document.getElementById('rf_parent_name').value,
          parent_phone   : document.getElementById('rf_parent_phone').value,
          parent_relation: document.getElementById('rf_parent_relation').value,
          address        : document.getElementById('rf_address').value,
          photo          : document.getElementById('rf_photo').value
        },
        note: document.getElementById('rf_note').value
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('saveRegistration', r.value)
        .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadRegistrations(); }
        else Swal.fire({ icon:'error', text:res.message });
      })
        .catch(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message||err }); });
  });
}

function viewRegistration(id) {
  const r = RegState.data && RegState.data.data.find(x => x.id === id);
  if (!r) return showToast('error', 'ไม่พบ');
  const sd = r.student_data || {};

  Swal.fire({
    title: 'ใบสมัคร',
    width: 640,
    showCloseButton: true,
    showConfirmButton: false,
    html: `
      <div style="text-align:left;">
        <div class="text-center mb-4 pb-4 border-b border-slate-200">
          ${avatarHTML(sd.photo, sd.first_name, 80)}
          <div style="font-size:17px; font-weight:700; margin-top:8px;">
            ${escapeHTML((sd.prefix||'')+(sd.first_name||'')+' '+(sd.last_name||''))}
          \x3c/div>
          <div class="text-xs text-slate-500">${escapeHTML(r.application_id || '')}\x3c/div>
        \x3c/div>
        <div style="display:grid; grid-template-columns:auto 1fr; gap:6px 16px; font-size:13px;">
          <span class="text-slate-500">ชั้นที่สมัคร:\x3c/span>  <span>${escapeHTML(r.grade_applying || '-')}\x3c/span>
          <span class="text-slate-500">ปีการศึกษา:\x3c/span>    <span>${escapeHTML(r.academic_year || '-')}\x3c/span>
          <span class="text-slate-500">เลขบัตร:\x3c/span>       <span>${escapeHTML(sd.national_id || '-')}\x3c/span>
          <span class="text-slate-500">วันเกิด:\x3c/span>       <span>${sd.birth_date ? formatThaiDate(sd.birth_date) : '-'}\x3c/span>
          <span class="text-slate-500">เพศ:\x3c/span>           <span>${sd.gender==='male'?'ชาย':sd.gender==='female'?'หญิง':'-'}\x3c/span>
          <span class="text-slate-500">ผู้ปกครอง:\x3c/span>     <span>${escapeHTML(sd.parent_name || '-')} (${escapeHTML(sd.parent_relation || '-')})\x3c/span>
          <span class="text-slate-500">โทร:\x3c/span>           <span>${escapeHTML(sd.parent_phone || '-')}\x3c/span>
          <span class="text-slate-500">ที่อยู่:\x3c/span>        <span>${escapeHTML(sd.address || '-')}\x3c/span>
          <span class="text-slate-500">วันที่สมัคร:\x3c/span>   <span>${formatThaiDate(r.created_at)}\x3c/span>
          <span class="text-slate-500">สถานะ:\x3c/span>         <span>${r.status==='approved'?'<span class="status-badge status-active">อนุมัติแล้ว\x3c/span>':r.status==='rejected'?'<span class="status-badge status-inactive">ปฏิเสธ\x3c/span>':'<span class="status-badge status-pending">รอพิจารณา\x3c/span>'}\x3c/span>
        \x3c/div>
        ${r.note ? `<div class="mt-3 p-3 rounded-lg bg-slate-50 text-sm">${escapeHTML(r.note)}\x3c/div>` : ''}
      \x3c/div>
    `
  });
}

function approveRegConfirm(id) {
  Swal.fire({
    title: 'อนุมัติใบสมัครและสร้างข้อมูลนักเรียน?',
    text: 'ระบบจะสร้างข้อมูลในรายการนักเรียนทันที',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'อนุมัติ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#10B981'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังประมวลผล...');
    apiCall('approveRegistration', id)
        .then(res => {
        hideLoading();
        if (res.status === 'success') { Swal.fire({ icon:'success', title:'สำเร็จ', text:res.message, timer:2000 }); loadRegistrations(); }
        else showToast('error', res.message);
      })
        .catch(() => {});
  });
}

function rejectRegConfirm(id) {
  Swal.fire({
    title: 'ปฏิเสธใบสมัคร?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ปฏิเสธ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('rejectRegistration', id)
        .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadRegistrations(); }
        else showToast('error', res.message);
      })
        .catch(() => {});
  });
}