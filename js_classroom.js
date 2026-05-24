<script>
/* ============================================================
 *  CLASSROOM MANAGEMENT — จัดการห้องเรียน
 * ============================================================ */

const CLS = {
  rooms: [],
  teachers: [],
  academicYear: ''
};

function renderClassroomMgmt(container) {
  CLS.academicYear = (APP.dashboardData && APP.dashboardData.config && APP.dashboardData.config.academic_year) || '';

  container.innerHTML = `
    ${pageHeader('จัดการห้องเรียน', 'bxs-school', `
      ${APP.role !== 'teacher' ? `<button class="btn btn-blue" onclick="openClassroomForm()"><i class='bx bx-plus'></i> เพิ่มห้องเรียน</button>` : ''}
    `)}
    <div class="page-card">
      <div class="page-card-body">
        <div id="clsGrid" class="cls-grid">
          <div class="empty-state"><i class="bx bx-loader-alt bx-spin"></i> กำลังโหลด...</div>
        </div>
      </div>
    </div>

    <style>
      .cls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }
      .cls-card {
        background: white;
        border: 1.5px solid #E2E8F0;
        border-radius: 16px;
        padding: 20px;
        position: relative;
        transition: box-shadow .2s, transform .2s;
      }
      .cls-card:hover { box-shadow: 0 8px 24px rgba(30,64,175,.1); transform: translateY(-2px); }
      .cls-icon {
        width: 48px; height: 48px; border-radius: 12px;
        background: linear-gradient(135deg,#EFF6FF,#DBEAFE);
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 12px;
      }
      .cls-icon i { font-size: 26px; color: #2563EB; }
      .cls-name { font-size: 22px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
      .cls-year { font-size: 12px; color: #94A3B8; margin-bottom: 12px; }
      .cls-meta { font-size: 13px; color: #475569; margin-bottom: 4px; }
      .cls-meta span { font-weight: 600; color: #1E40AF; }
      .cls-bar-bg { height: 6px; background:#F1F5F9; border-radius:9px; margin: 8px 0 14px; overflow:hidden; }
      .cls-bar    { height: 6px; background: linear-gradient(90deg,#3B82F6,#60A5FA); border-radius:9px; transition:width .5s; }
      .cls-actions { display: flex; gap: 6px; }
      .cls-badge {
        position: absolute; top: 14px; right: 14px;
        font-size: 11px; font-weight: 700; padding: 3px 10px;
        border-radius: 99px;
        background: #DCFCE7; color: #15803D;
      }
      .cls-badge.inactive { background:#FEE2E2; color:#B91C1C; }
    </style>
  `;

  loadClassroomList();
}

function loadClassroomList() {
  apiCall('getClassroomList', { academic_year: CLS.academicYear })
    .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      CLS.rooms = res.data;
      renderCLS();
    })
    .catch(err => showToast('error', err.message || err));
}

function renderCLS() {
  const grid = document.getElementById('clsGrid');
  if (!grid) return;

  if (!CLS.rooms.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <i class='bx bxs-school'></i>
        ยังไม่มีห้องเรียน — กดปุ่ม "เพิ่มห้องเรียน" เพื่อเริ่มต้น
      </div>`;
    return;
  }

  grid.innerHTML = CLS.rooms.map(r => {
    const pct = r.capacity ? Math.min(100, Math.round(r.student_count / r.capacity * 100)) : 0;
    return `
    <div class="cls-card">
      <span class="cls-badge ${r.status !== 'active' ? 'inactive' : ''}">${r.status === 'active' ? 'เปิดใช้งาน' : 'ปิด'}</span>
      <div class="cls-icon"><i class='bx bxs-school'></i></div>
      <div class="cls-name">${escapeHTML(r.name)}</div>
      <div class="cls-year">ปีการศึกษา ${escapeHTML(String(r.academic_year))}</div>
      <div class="cls-meta">ครูประจำชั้น: <span>${escapeHTML(r.teacher_name)}</span></div>
      <div class="cls-meta">นักเรียน: <span>${r.student_count} / ${r.capacity}</span></div>
      <div class="cls-bar-bg"><div class="cls-bar" style="width:${pct}%;"></div></div>
      <div style="font-size:11px;color:#94A3B8;text-align:right;margin-bottom:12px;">${pct}%</div>
      <div class="cls-actions">
        ${APP.role !== 'teacher' ? `<button class="btn btn-light" style="flex:1;" onclick="openClassroomForm('${escapeHTML(r.id)}')" ><i class='bx bx-edit'></i> แก้ไข</button>` : ''}
        <button class="btn btn-blue" style="flex:1;" onclick="openClassroomStudents('${escapeHTML(r.id)}','${escapeHTML(r.name)}','${escapeHTML(String(r.academic_year))}')">
          <i class='bx bxs-user-detail'></i> นักเรียน
        </button>
        ${APP.role !== 'teacher' ? `<button class="btn btn-light" style="color:#EF4444;padding:8px 10px;" onclick="deleteClassroomConfirm('${escapeHTML(r.id)}','${escapeHTML(r.name)}')" ><i class='bx bx-trash'></i></button>` : ''}
      </div>
    </div>`;
  }).join('');
}

/* ---------- FORM เพิ่ม/แก้ไขห้องเรียน ---------- */
function openClassroomForm(id) {
  const r = id ? CLS.rooms.find(x => x.id === id) : null;
  const config = (APP.dashboardData && APP.dashboardData.config) || {};
  const currentYear = CLS.academicYear || config.academic_year || (new Date().getFullYear() + 543);

  // โหลดครูสำหรับ dropdown
  apiCall('saveClassroom', res.value)
    .then(res => {
      const teachers = (res.status === 'success') ? res.data : [];
      CLS.teachers = teachers;

      const GRADES = ['ป.1','ป.2','ป.3','ป.4','ป.5','ป.6','ม.1','ม.2','ม.3','ม.4','ม.5','ม.6'];

      Swal.fire({
        title: r ? 'แก้ไขห้องเรียน' : 'เพิ่มห้องเรียนใหม่',
        width: 540,
        showCancelButton: true,
        confirmButtonText: '<i class="bx bx-save"></i> บันทึก',
        cancelButtonText: 'ยกเลิก',
        showCloseButton: true,
        html: `
          <div style="text-align:left;font-size:14px;">
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
              <div>
                <label class="form-label">ระดับชั้น <span style="color:#EF4444">*</span></label>
                <select id="cf_grade" class="form-input">
                  <option value="">-- กรุณาเลือก --</option>
                  ${GRADES.map(g => `<option value="${g}" ${(r&&r.grade_level===g)?'selected':''}>${g}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="form-label">ห้อง <span style="color:#EF4444">*</span></label>
                <input type="text" id="cf_room" class="form-input" placeholder="1" maxlength="5"
                       value="${escapeHTML(r ? r.room_number : '')}">
              </div>
              <div>
                <label class="form-label">ปีการศึกษา <span style="color:#EF4444">*</span></label>
                <input type="text" id="cf_year" class="form-input" value="${escapeHTML(r ? String(r.academic_year) : String(currentYear))}">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
              <div>
                <label class="form-label">ความจุ <span style="color:#EF4444">*</span></label>
                <input type="number" id="cf_cap" class="form-input" value="${r ? r.capacity : 40}" min="1" max="200">
              </div>
              <div>
                <label class="form-label">สถานะ</label>
                <select id="cf_status" class="form-input">
                  <option value="active" ${(!r||r.status==='active')?'selected':''}>เปิดใช้งาน</option>
                  <option value="inactive" ${(r&&r.status==='inactive')?'selected':''}>ปิด</option>
                </select>
              </div>
            </div>
            <div>
              <label class="form-label">ครูประจำชั้น</label>
              <input type="text" id="cf_teacher_search" class="form-input" placeholder="ค้นหาครูประจำชั้น..."
                     value="${escapeHTML(r && r.homeroom_teacher_id ? (teachers.find(t=>t.id===r.homeroom_teacher_id)||{}).name||'' : '')}"
                     autocomplete="off" oninput="filterTeacherDropdown(this.value)">
              <input type="hidden" id="cf_teacher_id" value="${escapeHTML(r ? r.homeroom_teacher_id||'' : '')}">
              <div id="cf_teacher_list" style="display:none;position:absolute;z-index:9999;background:white;
                   border:1.5px solid #E2E8F0;border-radius:10px;max-height:160px;overflow-y:auto;
                   width:calc(100% - 80px);box-shadow:0 8px 24px rgba(0,0,0,.12);"></div>
            </div>
          </div>
          <style>
            .form-label{display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:3px;}
            .form-input{width:100%;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;
              font-family:inherit;font-size:13px;background:#F8FAFC;box-sizing:border-box;}
            .form-input:focus{outline:none;border-color:#3B82F6;background:white;}
            .teacher-opt{padding:8px 12px;cursor:pointer;font-size:13px;}
            .teacher-opt:hover{background:#EFF6FF;color:#1E40AF;}
          </style>
        `,
        preConfirm: () => {
          const grade = document.getElementById('cf_grade').value;
          const room  = document.getElementById('cf_room').value.trim();
          const year  = document.getElementById('cf_year').value.trim();
          if (!grade || !room || !year) {
            Swal.showValidationMessage('กรุณากรอกระดับชั้น ห้อง และปีการศึกษา');
            return false;
          }
          return {
            id                 : r ? r.id : null,
            grade_level        : grade,
            room_number        : room,
            academic_year      : year,
            capacity           : parseInt(document.getElementById('cf_cap').value) || 40,
            homeroom_teacher_id: document.getElementById('cf_teacher_id').value,
            status             : document.getElementById('cf_status').value
          };
        }
      }).then(res => {
        if (!res.isConfirmed) return;
        showLoading('กำลังบันทึก...');
        apiCall('catch', err => { hideLoading(); showToast('error', err.message||err); });
      });
    })
    .withFailureHandler(() => CLS.teachers = [])
    .getPersonnel({ type:'teacher', per_page:200 })
    .then(r => {
            hideLoading();
            if (r.status === 'success') { showToast('success', r.message); loadClassroomList(); }
            else Swal.fire({ icon:'error', title:'ผิดพลาด', text: r.message });
          })
    .catch(() => {});
}

function filterTeacherDropdown(q) {
  const box = document.getElementById('cf_teacher_list');
  if (!box) return;
  const filtered = q.length < 1 ? [] : CLS.teachers.filter(t =>
    (t.name||'').includes(q) || (t.first_name||'').includes(q)
  ).slice(0, 8);

  if (!filtered.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = filtered.map(t => `
    <div class="teacher-opt" onclick="selectTeacher('${escapeHTML(t.id)}','${escapeHTML(t.name||t.first_name||'')}')">
      ${escapeHTML(t.name||t.first_name||'')}
    </div>`).join('');
}

function selectTeacher(id, name) {
  const el = document.getElementById('cf_teacher_id');
  const search = document.getElementById('cf_teacher_search');
  const box = document.getElementById('cf_teacher_list');
  if (el) el.value = id;
  if (search) search.value = name;
  if (box) box.style.display = 'none';
}

/* ---------- รายชื่อนักเรียนในห้อง ---------- */
function openClassroomStudents(roomId, roomName, ay) {
  showLoading('กำลังโหลด...');
  apiCall('getClassroomStudents', roomName, ay)
    .then(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      showClassroomStudentDialog(roomId, roomName, ay, res.data);
    })
    .catch(err => { hideLoading(); showToast('error', err.message||err); });
}

function showClassroomStudentDialog(roomId, roomName, ay, students) {
  let selected = new Set(students.map(s => s.id));

  Swal.fire({
    title: `นักเรียน ${escapeHTML(roomName)}`,
    width: 680,
    showCancelButton: false,
    showConfirmButton: false,
    showCloseButton: true,
    html: `
      <div style="font-size:13px;color:#64748B;margin-bottom:12px;">
        จำนวน ${students.length} คน (ปีการศึกษา ${escapeHTML(String(ay))})
      </div>
      ${students.length ? `
        <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;
             background:#F8FAFC;border-radius:10px;margin-bottom:8px;cursor:pointer;"
             onclick="toggleSelectAll(this, ${students.length})">
          <input type="checkbox" id="chkAll" checked style="width:16px;height:16px;cursor:pointer;">
          <span style="font-weight:600;font-size:13px;">เลือกทั้งหมด</span>
          <span style="margin-left:auto;font-size:12px;color:#94A3B8;">${students.length} รายการ</span>
        </div>
        <div style="max-height:340px;overflow-y:auto;">
          ${students.map((s, i) => `
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;
                 border-radius:10px;cursor:pointer;transition:background .15s;"
                 onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background=''"
                 onclick="toggleStudent('${escapeHTML(s.id)}',this)">
              <input type="checkbox" id="chk_${escapeHTML(s.id)}" checked
                     style="width:16px;height:16px;cursor:pointer;" onclick="event.stopPropagation();"
                     onchange="toggleStudent('${escapeHTML(s.id)}',this.closest('div'))">
              ${avatarHTML(s.photo, s.first_name, 36)}
              <div style="flex:1;text-align:left;">
                <div style="font-weight:600;">${escapeHTML((s.prefix||'')+s.first_name+' '+s.last_name)}</div>
                <div style="font-size:11px;color:#94A3B8;">รหัส: ${escapeHTML(s.student_id||'')} (เลขที่ ${i+1})</div>
              </div>
              <button class="btn btn-light" style="padding:5px 8px;font-size:11px;"
                      onclick="event.stopPropagation();viewStudent('${escapeHTML(s.id)}')">
                <i class='bx bx-show'></i>
              </button>
              <button class="btn btn-light" style="padding:5px 8px;font-size:11px;color:#3B82F6;"
                      onclick="event.stopPropagation();openStudentForm('${escapeHTML(s.id)}')">
                <i class='bx bx-edit'></i>
              </button>
            </div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid #E2E8F0;">
          <button class="btn btn-light" onclick="Swal.close()">
            <i class='bx bx-x'></i> ปิด
          </button>
          <button class="btn btn-blue" onclick="openTransferDialog('${escapeHTML(roomName)}','${escapeHTML(String(ay))}')">
            <i class='bx bx-transfer'></i> ย้ายนักเรียนที่เลือก...
          </button>
        </div>
      ` : `
        <div class="empty-state" style="padding:40px 0;">
          <i class='bx bxs-user-x'></i>
          ยังไม่มีนักเรียนในห้องนี้
        </div>
        <button class="btn btn-light" onclick="Swal.close()">ปิด</button>
      `}
    `
  });

  window._clsSelected = selected;
}

function toggleStudent(id, row) {
  const chk = document.getElementById('chk_' + id);
  if (!chk) return;
  chk.checked = !chk.checked;
  if (chk.checked) window._clsSelected.add(id);
  else window._clsSelected.delete(id);
}

function toggleSelectAll(container, total) {
  const chkAll = document.getElementById('chkAll');
  chkAll.checked = !chkAll.checked;
  document.querySelectorAll('[id^="chk_"]').forEach(chk => {
    chk.checked = chkAll.checked;
    const id = chk.id.replace('chk_','');
    if (chkAll.checked) window._clsSelected.add(id);
    else window._clsSelected.delete(id);
  });
}

/* ---------- ย้ายห้อง ---------- */
function openTransferDialog(fromRoom, ay) {
  const selectedIds = Array.from(window._clsSelected || []);
  if (!selectedIds.length) return showToast('warning', 'กรุณาเลือกนักเรียนก่อน');

  const options = CLS.rooms
    .filter(r => r.name !== fromRoom && r.status === 'active')
    .map(r => `<option value="${escapeHTML(r.name)}">${escapeHTML(r.name)} (ปี ${r.academic_year})</option>`)
    .join('');

  Swal.fire({
    title: `ย้ายนักเรียน (${selectedIds.length} คน)`,
    html: `
      <div style="text-align:left;font-size:14px;">
        <p style="color:#64748B;margin-bottom:12px;">เลือกห้องเรียนปลายทางที่ต้องการย้ายนักเรียนไป</p>
        <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:4px;">ห้องเรียนปลายทาง</label>
        <select id="transfer_target" class="form-input" style="width:100%;padding:9px 12px;border:1.5px solid #E2E8F0;border-radius:10px;font-family:inherit;font-size:14px;">
          <option value="">-- เลือกห้องเรียน --</option>
          ${options}
        </select>
      </div>
    `,
    width: 440,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-transfer"></i> ย้ายเลย',
    cancelButtonText: 'ยกเลิก',
    preConfirm: () => {
      const target = document.getElementById('transfer_target').value;
      if (!target) { Swal.showValidationMessage('กรุณาเลือกห้องเรียนปลายทาง'); return false; }
      return target;
    }
  }).then(res => {
    if (!res.isConfirmed) return;
    showLoading('กำลังย้าย...');
    apiCall('transferStudents', selectedIds, res.value)
    .then(r => {
        hideLoading();
        if (r.status === 'success') {
          Swal.close();
          showToast('success', r.message);
          loadClassroomList();
        } else {
          Swal.fire({ icon:'error', text: r.message });
        }
      })
    .catch(err => { hideLoading(); showToast('error', err.message||err); });
  });
}

function deleteClassroomConfirm(id, name) {
  Swal.fire({
    title: `ลบห้อง "${name}"?`,
    text: 'ข้อมูลห้องเรียนจะถูกลบ (นักเรียนในห้องจะยังคงอยู่)',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังลบ...');
    apiCall('deleteClassroom', id)
    .then(res => {
        hideLoading();
        if (res.status === 'success') { showToast('success', res.message); loadClassroomList(); }
        else showToast('error', res.message);
      })
    .catch(err => { hideLoading(); showToast('error', err.message||err); });
  });
}
</script>