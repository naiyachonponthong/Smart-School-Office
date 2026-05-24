<script>
/* ============================================================
 *  BEHAVIOR — บันทึกคะแนนพฤติกรรม
 * ============================================================ */
const BHV = {
  tab: 'summary',   // 'summary' | 'record' | 'history'
  presets: { positive:[], negative:[] },
  students: [],
  records: [],
  summary: []
};

function renderBehavior(container) {
  container.innerHTML = `
    ${pageHeader('พฤติกรรมนักเรียน', 'bxs-heart', `
      <button class="btn btn-blue" onclick="openBehaviorForm()">
        <i class='bx bx-plus'></i> บันทึกพฤติกรรม
      </button>
    `)}

    <div class="page-card">
      <div class="page-card-body">
        <div class="tab-pill" style="max-width:480px;margin-bottom:20px;">
          <button id="bhvTabSummary" class="active" onclick="switchBhvTab('summary')">
            <i class='bx bx-bar-chart-alt-2'></i> ภาพรวม
          </button>
          <button id="bhvTabHistory" onclick="switchBhvTab('history')">
            <i class='bx bx-history'></i> ประวัติ
          </button>
        </div>

        <div id="bhvSummary"></div>
        <div id="bhvHistory" style="display:none;"></div>
      </div>
    </div>

    <style>
      .risk-card { background:white;border:1.5px solid #E2E8F0;border-radius:14px;padding:14px 16px;
                   display:flex;align-items:center;gap:12px;transition:box-shadow .2s; }
      .risk-card:hover { box-shadow:0 4px 16px rgba(0,0,0,.08); }
      .risk-high   { border-left:4px solid #EF4444; }
      .risk-medium { border-left:4px solid #F59E0B; }
      .risk-low    { border-left:4px solid #10B981; }
      .score-pill  { padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700; }
      .score-pos   { background:#DCFCE7;color:#15803D; }
      .score-neg   { background:#FEE2E2;color:#B91C1C; }
      .score-zero  { background:#F1F5F9;color:#64748B; }
      .bhv-event   { border-radius:10px;padding:10px 14px;margin-bottom:8px;
                     display:flex;align-items:center;gap:10px;background:#F8FAFC;
                     border:1px solid #E2E8F0; }
      .bhv-badge-pos { background:#DCFCE7;color:#15803D;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:700; }
      .bhv-badge-neg { background:#FEE2E2;color:#B91C1C;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:700; }
    </style>
  `;
  loadBehaviorData();
}

function loadBehaviorData() {
  showLoading('กำลังโหลด...');
  let done = 0;
  const check = () => { if (++done >= 2) { hideLoading(); renderBhvSummary(); } };

  apiCall('getBehaviorSummary')
    .then(res => { if (res.status==='success') BHV.summary = res.data; check(); })
    .catch(() => check());

  apiCall('getBehaviorPresets')
    .then(res => { if (res.status==='success') BHV.presets = res.data; check(); })
    .catch(() => check());
}

function switchBhvTab(tab) {
  BHV.tab = tab;
  document.getElementById('bhvTabSummary').classList.toggle('active', tab==='summary');
  document.getElementById('bhvTabHistory').classList.toggle('active', tab==='history');
  document.getElementById('bhvSummary').style.display  = tab==='summary' ? '' : 'none';
  document.getElementById('bhvHistory').style.display   = tab==='history' ? '' : 'none';
  if (tab === 'history') renderBhvHistory();
}

/* ---------- Summary Tab ---------- */
function renderBhvSummary() {
  const el = document.getElementById('bhvSummary');
  if (!el) return;
  const data   = BHV.summary;
  const atRisk = data.filter(s => s.risk_level !== 'low');
  const high   = data.filter(s => s.risk_level === 'high').length;
  const med    = data.filter(s => s.risk_level === 'medium').length;

  el.innerHTML = `
    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
      ${bhvStat('bxs-group','#3B82F6',data.length,'นักเรียนทั้งหมด')}
      ${bhvStat('bx-shield-x','#EF4444',high,'เสี่ยงสูง')}
      ${bhvStat('bx-error','#F59E0B',med,'เสี่ยงปานกลาง')}
      ${bhvStat('bx-shield','#10B981',data.length-high-med,'พฤติกรรมดี')}
    </div>

    ${atRisk.length ? `
      <div style="font-size:13px;font-weight:700;color:#EF4444;margin-bottom:10px;">
        <i class='bx bxs-error'></i> นักเรียนกลุ่มเสี่ยง (${atRisk.length} คน)
      </div>
      <div style="display:grid;gap:8px;margin-bottom:20px;">
        ${atRisk.map(s => `
          <div class="risk-card risk-${s.risk_level}" onclick="openBehaviorHistory(${JSON.stringify(s.student_id)},${JSON.stringify(s.name)})" style="cursor:pointer;">
            ${avatarHTML(s.photo, s.name, 40)}
            <div style="flex:1;">
              <div style="font-weight:700;font-size:14px;">${escapeHTML(s.name)}</div>
              <div style="font-size:12px;color:#94A3B8;">${escapeHTML(s.classroom||'-')} • ${s.events} เหตุการณ์</div>
            </div>
            <div style="text-align:right;">
              <div class="score-pill ${s.total_score>0?'score-pos':s.total_score<0?'score-neg':'score-zero'}">
                ${s.total_score > 0 ? '+' : ''}${s.total_score} คะแนน
              </div>
              <div style="font-size:11px;color:#94A3B8;margin-top:3px;">
                +${s.positive_count} / -${s.negative_count}
              </div>
            </div>
            <i class='bx bx-chevron-right' style="color:#CBD5E1;"></i>
          </div>`).join('')}
      </div>` : ''}

    <!-- All students table -->
    <div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:10px;">
      <i class='bx bx-list-ul'></i> นักเรียนทั้งหมด (${data.length} คน)
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;">
            <th style="padding:10px 12px;text-align:left;font-weight:700;color:#475569;">นักเรียน</th>
            <th style="padding:10px 12px;text-align:center;">ชั้น</th>
            <th style="padding:10px 12px;text-align:center;">คะแนนรวม</th>
            <th style="padding:10px 12px;text-align:center;">เหตุการณ์</th>
            <th style="padding:10px 12px;text-align:center;">ระดับ</th>
            <th style="padding:10px 12px;text-align:center;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(s => `
            <tr style="border-bottom:1px solid #F1F5F9;transition:background .15s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background=''">
              <td style="padding:10px 12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  ${avatarHTML(s.photo, s.name, 32)}
                  <span style="font-weight:600;">${escapeHTML(s.name)}</span>
                </div>
              </td>
              <td style="padding:10px 12px;text-align:center;color:#64748B;">${escapeHTML(s.classroom||'-')}</td>
              <td style="padding:10px 12px;text-align:center;">
                <span class="score-pill ${s.total_score>0?'score-pos':s.total_score<0?'score-neg':'score-zero'}">
                  ${s.total_score>0?'+':''}${s.total_score}
                </span>
              </td>
              <td style="padding:10px 12px;text-align:center;color:#64748B;">${s.events}</td>
              <td style="padding:10px 12px;text-align:center;">
                <span style="padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700;
                  background:${s.risk_level==='high'?'#FEE2E2':s.risk_level==='medium'?'#FEF3C7':'#DCFCE7'};
                  color:${s.risk_level==='high'?'#B91C1C':s.risk_level==='medium'?'#B45309':'#15803D'};">
                  ${s.risk_level==='high'?'เสี่ยงสูง':s.risk_level==='medium'?'เสี่ยง':'ดี'}
                </span>
              </td>
              <td style="padding:10px 12px;text-align:center;">
                <div style="display:flex;justify-content:center;gap:4px;">
                  <button class="btn btn-light btn-icon" onclick="openBehaviorHistory('${escapeHTML(s.student_id)}','${escapeHTML(s.name)}')" title="ประวัติ">
                    <i class='bx bx-history'></i>
                  </button>
                  <button class="btn btn-blue btn-icon" onclick="openBehaviorForm('${escapeHTML(s.student_id)}')" title="บันทึก">
                    <i class='bx bx-plus'></i>
                  </button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function bhvStat(icon, color, count, label) {
  return `
    <div style="background:white;border:1.5px solid #E2E8F0;border-radius:14px;padding:16px;text-align:center;">
      <i class='bx ${icon}' style="font-size:28px;color:${color};"></i>
      <div style="font-size:24px;font-weight:800;color:#0F172A;margin-top:4px;">${count}</div>
      <div style="font-size:12px;color:#94A3B8;">${label}</div>
    </div>`;
}

/* ---------- History Tab ---------- */
function renderBhvHistory() {
  const el = document.getElementById('bhvHistory');
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      <input type="text" id="bhvSearchInput" class="form-input" placeholder="ค้นหาชื่อนักเรียน..."
             style="max-width:240px;" oninput="loadBhvHistory()">
      <select id="bhvTypeFilter" class="form-input" style="width:140px;" onchange="loadBhvHistory()">
        <option value="">ทุกประเภท</option>
        <option value="positive">ดี</option>
        <option value="negative">ไม่ดี</option>
      </select>
      <input type="date" id="bhvDateFrom" class="form-input" style="width:150px;" onchange="loadBhvHistory()" value="${new Date().getFullYear()}-01-01">
      <span style="align-self:center;color:#94A3B8;">ถึง</span>
      <input type="date" id="bhvDateTo" class="form-input" style="width:150px;" onchange="loadBhvHistory()" value="${new Date().toISOString().slice(0,10)}">
    </div>
    <div id="bhvHistoryList"><div class="empty-state"><i class="bx bx-loader-alt bx-spin"></i></div></div>
    <style>
      .form-input{padding:7px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:13px;background:#F8FAFC;}
      .form-input:focus{outline:none;border-color:#3B82F6;background:white;}
    </style>
  `;
  loadBhvHistory();
}

function loadBhvHistory() {
  const area = document.getElementById('bhvHistoryList');
  if (!area) return;
  area.innerHTML = '<div class="empty-state"><i class="bx bx-loader-alt bx-spin"></i></div>';

  const params = {
    type     : document.getElementById('bhvTypeFilter')?.value || '',
    date_from: document.getElementById('bhvDateFrom')?.value || '',
    date_to  : document.getElementById('bhvDateTo')?.value   || ''
  };

  apiCall('getBehaviorRecords', params)
    .then(res => {
      if (res.status !== 'success') { area.innerHTML = '<div class="empty-state">โหลดข้อมูลไม่สำเร็จ</div>'; return; }
      const q = (document.getElementById('bhvSearchInput')?.value || '').toLowerCase();
      // match student name from BHV.summary
      let list = res.data;
      if (q) {
        const ids = BHV.summary.filter(s => s.name.toLowerCase().includes(q)).map(s => s.student_id);
        list = list.filter(b => ids.includes(b.student_id));
      }
      if (!list.length) { area.innerHTML = '<div class="empty-state"><i class="bx bx-inbox"></i> ไม่พบข้อมูล</div>'; return; }

      area.innerHTML = list.map(b => {
        const st = BHV.summary.find(s => s.student_id === b.student_id) || {};
        return `
          <div class="bhv-event">
            ${avatarHTML(st.photo, st.name, 36)}
            <div style="flex:1;">
              <div style="font-weight:700;font-size:13px;">${escapeHTML(st.name || b.student_id)}</div>
              <div style="font-size:12px;color:#64748B;">${escapeHTML(b.label)} — ${escapeHTML(b.date)}</div>
              ${b.note ? `<div style="font-size:11px;color:#94A3B8;font-style:italic;">${escapeHTML(b.note)}</div>` : ''}
            </div>
            <span class="${b.type==='positive'?'bhv-badge-pos':'bhv-badge-neg'}">
              ${b.score > 0 ? '+' : ''}${b.score}
            </span>
            <button class="btn btn-light btn-icon" onclick="deleteBhvRecord('${escapeHTML(b.id)}')"
                    style="color:#EF4444;" title="ลบ">
              <i class='bx bx-trash'></i>
            </button>
          </div>`;
      }).join('');
    })
    .catch(err => { area.innerHTML = '<div class="empty-state">เกิดข้อผิดพลาด</div>'; });
}

/* ---------- Form ---------- */
function openBehaviorForm(preStudentId) {
  const students = BHV.summary;

  window._bhvStudents = students.map(s => ({ id: s.student_id, name: s.name, cls: s.classroom || '' }));
  window.bhvFilterStudents = function(q) {
    const list = document.getElementById('bf_std_list');
    if (!list) return;
    const filtered = q
      ? window._bhvStudents.filter(s =>
          s.name.toLowerCase().includes(q.toLowerCase()) ||
          s.id.toLowerCase().includes(q.toLowerCase()) ||
          s.cls.toLowerCase().includes(q.toLowerCase()))
      : window._bhvStudents.slice(0, 50);
    list.style.display = filtered.length ? '' : 'none';
    list.innerHTML = filtered.map(s =>
      `<div onclick="bhvSelectStudent('${s.id.replace(/'/g,"\\'")}','${s.name.replace(/'/g,"\\'")}') "
            style="padding:9px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid #F1F5F9;"
            onmouseover="this.style.background='#F0F9FF'" onmouseout="this.style.background=''">
         <span style="font-weight:600;">${escapeHTML(s.name)}</span>
         <span style="color:#94A3B8;font-size:11px;margin-left:6px;">${escapeHTML(s.cls)}</span>
       </div>`).join('');
  };
  window.bhvSelectStudent = function(id, name) {
    const h = document.getElementById('bf_student');
    const t = document.getElementById('bf_student_search');
    const l = document.getElementById('bf_std_list');
    if (h) h.value = id;
    if (t) t.value = name;
    if (l) l.style.display = 'none';
  };

  Swal.fire({
    title: 'บันทึกพฤติกรรม',
    width: 620,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save"></i> บันทึก',
    cancelButtonText: 'ยกเลิก',
    html: `
      <div style="text-align:left;font-size:14px;">
        <div style="margin-bottom:12px;position:relative;">
          <label class="bl">นักเรียน *</label>
          <input type="hidden" id="bf_student" value="${preStudentId||''}">
          <input type="text" id="bf_student_search" class="bi" autocomplete="off"
                 placeholder="พิมพ์ชื่อหรือรหัสนักเรียน..."
                 value="${preStudentId ? escapeHTML((students.find(s=>s.student_id===preStudentId)||{}).name||'') : ''}"
                 oninput="bhvFilterStudents(this.value)"
                 onfocus="bhvFilterStudents(this.value)"
                 onblur="setTimeout(()=>{const d=document.getElementById('bf_std_list');if(d)d.style.display='none';},200)">
          <div id="bf_std_list" style="display:none;position:absolute;z-index:9999;background:white;
               border:1.5px solid #E2E8F0;border-radius:10px;max-height:180px;overflow-y:auto;
               width:100%;box-shadow:0 8px 24px rgba(0,0,0,.12);top:100%;left:0;"></div>
        </div>
        <div style="margin-bottom:12px;">
          <label class="bl">วันที่</label>
          <input type="date" id="bf_date" class="bi" value="${new Date().toISOString().slice(0,10)}">
        </div>
        <div style="margin-bottom:12px;">
          <label class="bl">ประเภทเหตุการณ์</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <!-- Positive -->
            <div>
              <div style="font-size:11px;font-weight:700;color:#15803D;margin-bottom:6px;">✅ พฤติกรรมดี</div>
              ${(BHV.presets.positive||[]).map(p => `
                <div onclick="selectBhvPreset('${escapeHTML(p.code)}','${escapeHTML(p.label)}',${p.score})"
                     style="padding:6px 10px;margin-bottom:4px;border-radius:8px;cursor:pointer;
                            border:1.5px solid #E2E8F0;font-size:12px;transition:all .15s;"
                     onmouseover="this.style.background='#DCFCE7';this.style.borderColor='#10B981'"
                     onmouseout="if(this.dataset.sel!='1'){this.style.background='';this.style.borderColor='#E2E8F0'}"
                     id="preset_${escapeHTML(p.code)}" data-sel="0">
                  ${escapeHTML(p.label)} <span style="float:right;color:#10B981;font-weight:700;">+${p.score}</span>
                </div>`).join('')}
            </div>
            <!-- Negative -->
            <div>
              <div style="font-size:11px;font-weight:700;color:#B91C1C;margin-bottom:6px;">❌ พฤติกรรมไม่ดี</div>
              ${(BHV.presets.negative||[]).map(p => `
                <div onclick="selectBhvPreset('${escapeHTML(p.code)}','${escapeHTML(p.label)}',${p.score})"
                     style="padding:6px 10px;margin-bottom:4px;border-radius:8px;cursor:pointer;
                            border:1.5px solid #E2E8F0;font-size:12px;transition:all .15s;"
                     onmouseover="this.style.background='#FEE2E2';this.style.borderColor='#EF4444'"
                     onmouseout="if(this.dataset.sel!='1'){this.style.background='';this.style.borderColor='#E2E8F0'}"
                     id="preset_${escapeHTML(p.code)}" data-sel="0">
                  ${escapeHTML(p.label)} <span style="float:right;color:#EF4444;font-weight:700;">${p.score}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div>
            <label class="bl">เหตุการณ์ (กรอกเองได้)</label>
            <input type="text" id="bf_label" class="bi" placeholder="ระบุพฤติกรรม...">
          </div>
          <div>
            <label class="bl">คะแนน</label>
            <input type="number" id="bf_score" class="bi" placeholder="เช่น +5 หรือ -3">
          </div>
        </div>
        <div>
          <label class="bl">หมายเหตุ</label>
          <input type="text" id="bf_note" class="bi" placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)">
        </div>
        <input type="hidden" id="bf_code" value="">
      </div>
      <style>
        .bl{display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:3px;}
        .bi{width:100%;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;
            font-family:inherit;font-size:13px;background:#F8FAFC;box-sizing:border-box;}
        .bi:focus{outline:none;border-color:#3B82F6;background:white;}
      </style>
    `,
    preConfirm: () => {
      const studentId = document.getElementById('bf_student').value;
      const label     = document.getElementById('bf_label').value.trim();
      const score     = parseFloat(document.getElementById('bf_score').value);
      if (!studentId) { Swal.showValidationMessage('กรุณาเลือกนักเรียน'); return false; }
      if (!label)     { Swal.showValidationMessage('กรุณาระบุเหตุการณ์'); return false; }
      if (isNaN(score)){ Swal.showValidationMessage('กรุณาระบุคะแนน'); return false; }
      return {
        student_id: studentId,
        date  : document.getElementById('bf_date').value,
        code  : document.getElementById('bf_code').value,
        label, score,
        note  : document.getElementById('bf_note').value
      };
    }
  }).then(res => {
    if (!res.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    apiCall('saveBehaviorRecord', res.value)
    .then(r => {
        hideLoading();
        if (r.status === 'success') {
          if (!Swal.isVisible()) _Toast.fire({ icon:'success', title:r.message });
          loadBehaviorData();
        } else Swal.fire({ icon:'error', text:r.message });
      })
    .catch(err => { hideLoading(); showToast('error', err.message||err); });
  });
}

function selectBhvPreset(code, label, score) {
  // reset ทุก preset
  document.querySelectorAll('[id^="preset_"]').forEach(el => {
    el.style.background = ''; el.style.borderColor = '#E2E8F0'; el.dataset.sel = '0';
  });
  const el = document.getElementById('preset_' + code);
  if (el) {
    const isPos = score >= 0;
    el.style.background    = isPos ? '#DCFCE7' : '#FEE2E2';
    el.style.borderColor   = isPos ? '#10B981' : '#EF4444';
    el.dataset.sel = '1';
  }
  document.getElementById('bf_label').value = label;
  document.getElementById('bf_score').value = score;
  document.getElementById('bf_code').value  = code;
}

function openBehaviorHistory(studentId, name) {
  switchBhvTab('history');
  setTimeout(() => {
    const s = document.getElementById('bhvSearchInput');
    if (s) { s.value = name; loadBhvHistory(); }
  }, 100);
}

function deleteBhvRecord(id) {
  Swal.fire({ title:'ลบรายการนี้?', icon:'warning', showCancelButton:true,
    confirmButtonText:'ลบ', cancelButtonText:'ยกเลิก', confirmButtonColor:'#EF4444'
  }).then(r => {
    if (!r.isConfirmed) return;
    apiCall('deleteBehaviorRecord', id)
    .then(res => { if (res.status==='success') { showToast('success','ลบสำเร็จ'); loadBhvHistory(); loadBehaviorData(); } })
    .catch(() => {});
  });
}
</script>