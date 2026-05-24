/* ============================================================
 *  STUDENT CARD — บัตรนักเรียนพร้อม QR Code
 *  ใช้ Google Charts API สำหรับ QR (ไม่ต้องโหลด library)
 *  ใช้ print overlay แทน window.open (ไม่ถูก GAS block)
 * ============================================================ */
const CARD = { students:[], config:{}, selected:[] };

function renderStudentCard(container) {
  CARD.config = (APP.dashboardData && APP.dashboardData.config) || {};
  container.innerHTML = `
    ${pageHeader('บัตรนักเรียน', 'bxs-id-card', `
      <button class="btn btn-light" onclick="printSelectedCards()" id="btnPrintCards" style="display:none;">
        <i class='bx bx-printer'></i> พิมพ์ที่เลือก (<span id="cardSelCount">0</span>)
      </button>
      <button class="btn btn-blue" onclick="printAllCards()">
        <i class='bx bx-printer'></i> พิมพ์ทั้งหมด
      </button>
    `)}
    <div class="page-card">
      <div class="page-card-body">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center;">
          <input type="text" id="cardSearch" placeholder="ค้นหาชื่อ/รหัส..."
                 style="padding:8px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:13px;max-width:220px;"
                 oninput="filterCards()">
          <select id="cardClassFilter"
                  style="padding:8px 12px;border:1.5px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:13px;width:160px;"
                  onchange="filterCards()">
            <option value="">ทุกชั้น</option>
          </select>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;margin-left:auto;">
            <input type="checkbox" id="cardSelectAll" onchange="toggleSelectAllCards(this)"> เลือกทั้งหมด
          </label>
        </div>
        <div id="cardGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;">
          <div class="empty-state"><i class="bx bx-loader-alt bx-spin"></i></div>
        </div>
      </div>
    </div>

    <!-- Print Overlay -->
    <div id="cardPrintOverlay" style="display:none;position:fixed;inset:0;z-index:9999;background:white;overflow:auto;padding:20px;">
      <div style="max-width:900px;margin:0 auto;">
        <div style="display:flex;gap:10px;margin-bottom:16px;">
          <button onclick="window.print()" style="padding:10px 20px;background:#1E40AF;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;">
            <i class='bx bx-printer'></i> พิมพ์
          </button>
          <button onclick="closePrintOverlay()" style="padding:10px 20px;background:#F1F5F9;border:none;border-radius:8px;cursor:pointer;font-size:14px;">
            ✕ ปิด
          </button>
        </div>
        <div id="cardPrintArea" style="display:flex;flex-wrap:wrap;gap:10px;"></div>
      </div>
    </div>

    <style>
      .scard-preview {
        background:white;border:2px solid #E2E8F0;border-radius:12px;
        padding:12px;text-align:center;cursor:pointer;position:relative;transition:all .2s;
      }
      .scard-preview:hover { border-color:#3B82F6;box-shadow:0 4px 14px rgba(59,130,246,.15); }
      .scard-preview.selected { border-color:#3B82F6;background:#EFF6FF; }
      .scard-chk { position:absolute;top:8px;left:8px; }
      .scard-print-btn { position:absolute;top:6px;right:6px;background:none;border:none;cursor:pointer;color:#94A3B8;font-size:18px; }
      .scard-print-btn:hover { color:#3B82F6; }
      .barcode-svg { display:block; }
      @media print {
        body > *:not(#cardPrintOverlay) { display:none !important; }
        #cardPrintOverlay { position:static !important;padding:0 !important;background:white !important; }
        #cardPrintOverlay > div { max-width:none !important;margin:0 !important; }
        #cardPrintOverlay > div > div:first-child { display:none !important; }
        #cardPrintArea {
          display:grid !important;
          grid-template-columns:repeat(2, 85.6mm) !important;
          gap:6mm !important;
          justify-content:center !important;
          align-items:start !important;
        }
        #cardPrintArea > div {
          page-break-inside:avoid !important;
          break-inside:avoid !important;
          overflow:hidden !important;
        }
        @page { size:A4 portrait;margin:10mm 12mm; }
      }
    </style>
  `;
  loadCardStudents();
}

function loadCardStudents() {
  apiCall('getStudents', { per_page:500, status:'active' })
    .then(res => {
      if (res.status !== 'success') return showToast('error', res.message);
      CARD.students = res.data || [];
      const classes = [...new Set(CARD.students.map(s => s.classroom).filter(Boolean))].sort();
      const sel = document.getElementById('cardClassFilter');
      if (sel) classes.forEach(c => {
        const o = document.createElement('option');
        o.value = c; o.textContent = c;
        sel.appendChild(o);
      });
      filterCards();
    })
    .catch(err => showToast('error', err.message||err));
}

function getFilteredStudents() {
  const q   = (document.getElementById('cardSearch')?.value||'').toLowerCase();
  const cls = document.getElementById('cardClassFilter')?.value||'';
  return CARD.students.filter(s => {
    const name = ((s.prefix||'')+(s.first_name||'')+(s.last_name||'')+(s.student_id||'')).toLowerCase();
    return (!q || name.includes(q)) && (!cls || s.classroom === cls);
  });
}

function filterCards() {
  const list = getFilteredStudents();
  const grid = document.getElementById('cardGrid');
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="bx bx-inbox"></i> ไม่พบข้อมูล</div>';
    return;
  }
  grid.innerHTML = list.map(s => {
    const name = escapeHTML((s.prefix||'') + s.first_name + ' ' + s.last_name);
    const sel  = CARD.selected.includes(s.id);
    return `
      <div class="scard-preview ${sel ? 'selected' : ''}" onclick="toggleCardSelect('${escapeHTML(s.id)}',this)">
        <input type="checkbox" class="scard-chk" ${sel?'checked':''} onclick="event.stopPropagation();"
               onchange="toggleCardSelect('${escapeHTML(s.id)}',this.closest('.scard-preview'))">
        <button class="scard-print-btn" title="พิมพ์บัตรนี้"
                onclick="event.stopPropagation();printCards([CARD.students.find(x=>x.id==='${escapeHTML(s.id)}')])">
          <i class='bx bx-printer'></i>
        </button>
        <div style="width:56px;height:56px;border-radius:50%;margin:0 auto 8px;overflow:hidden;
                    background:linear-gradient(135deg,#1E40AF,#3B82F6);display:flex;align-items:center;justify-content:center;">
          ${s.photo
            ? `<img src="${escapeHTML(s.photo)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
            : `<span style="color:white;font-size:20px;font-weight:800;">${escapeHTML((s.first_name||'N').charAt(0))}</span>`}
        </div>
        <div style="font-weight:700;font-size:12px;">${name}</div>
        <div style="font-size:11px;color:#94A3B8;margin-top:2px;">${escapeHTML(s.student_id||'')} • ${escapeHTML(s.classroom||'')}</div>
      </div>`;
  }).join('');
}

function toggleCardSelect(id, el) {
  const idx = CARD.selected.indexOf(id);
  if (idx >= 0) CARD.selected.splice(idx, 1); else CARD.selected.push(id);
  el.classList.toggle('selected', CARD.selected.includes(id));
  const chk = el.querySelector('.scard-chk');
  if (chk) chk.checked = CARD.selected.includes(id);
  const n = CARD.selected.length;
  const btn = document.getElementById('btnPrintCards');
  const cnt = document.getElementById('cardSelCount');
  if (btn) btn.style.display = n ? '' : 'none';
  if (cnt) cnt.textContent = n;
}

function toggleSelectAllCards(chk) {
  const list = getFilteredStudents();
  CARD.selected = chk.checked ? list.map(s => s.id) : [];
  filterCards();
  const n = CARD.selected.length;
  const btn = document.getElementById('btnPrintCards');
  const cnt = document.getElementById('cardSelCount');
  if (btn) btn.style.display = n ? '' : 'none';
  if (cnt) cnt.textContent = n;
}

function printAllCards()      { printCards(getFilteredStudents()); }
function printSelectedCards() { printCards(CARD.students.filter(s => CARD.selected.includes(s.id))); }

function printCards(students) {
  if (!students || !students.length) return showToast('warning', 'ไม่มีบัตรที่จะพิมพ์');
  const cfg    = CARD.config;
  const school = escapeHTML(cfg.school_name || 'โรงเรียน');
  const year   = escapeHTML(String(cfg.academic_year || ''));
  const _td    = new Date();
  const issueDate = `${String(_td.getDate()).padStart(2,'0')}/${String(_td.getMonth()+1).padStart(2,'0')}/${_td.getFullYear()+543}`;

  const area    = document.getElementById('cardPrintArea');
  const overlay = document.getElementById('cardPrintOverlay');
  if (!area || !overlay) return;

  // render cards
  area.innerHTML = students.map(s => {
    const name  = escapeHTML((s.prefix||'') + s.first_name + ' ' + s.last_name);
    const sid   = s.student_id || '';
    const cls   = escapeHTML(s.classroom || '');
    const photoHtml = s.photo
      ? `<img src="${escapeHTML(s.photo)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#1E3A8A;background:#EFF6FF;">${escapeHTML((s.first_name||'N').charAt(0))}</div>`;

    return `
      <div style="width:85.6mm;height:54mm;background:white;border-radius:6px;overflow:hidden;
                  flex-shrink:0;box-sizing:border-box;box-shadow:0 2px 8px rgba(0,0,0,.2);
                  font-family:'Sarabun',sans-serif;-webkit-print-color-adjust:exact;
                  print-color-adjust:exact;display:flex;flex-direction:column;">
        <div style="background:linear-gradient(90deg,#1E3A8A,#2563EB);flex:0 0 11mm;
                    box-sizing:border-box;padding:2px 8px;overflow:hidden;
                    display:flex;flex-direction:column;justify-content:center;text-align:center;">
          <div style="color:white;font-size:9px;font-weight:800;line-height:1.3;">${school}</div>
          <div style="color:rgba(255,255,255,.7);font-size:6px;">บัตรนักเรียน · ปีการศึกษา ${year}</div>
        </div>
        <div style="display:flex;flex:1;padding:3px 5px;gap:5px;overflow:hidden;box-sizing:border-box;">
          <div style="width:20mm;flex-shrink:0;border:1.5px solid #CBD5E1;border-radius:3px;
                      overflow:hidden;background:#F8FAFC;align-self:stretch;">${photoHtml}</div>
          <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding-top:1px;">
            <div style="font-size:5.5px;color:#94A3B8;line-height:1.2;">ชื่อ-สกุล / Name</div>
            <div style="font-weight:800;font-size:9.5px;line-height:1.2;color:#1E3A8A;margin-bottom:2px;">${name}</div>
            <div style="font-size:5.5px;color:#94A3B8;line-height:1.2;">รหัสนักเรียน / Student ID</div>
            <div style="font-size:8px;font-weight:700;margin-bottom:2px;">${escapeHTML(sid)}</div>
            <div style="font-size:5.5px;color:#94A3B8;line-height:1.2;">ระดับชั้น / Class Level</div>
            <div style="font-size:8px;margin-bottom:2px;">${cls}</div>
            <div style="margin-top:auto;font-size:5.5px;color:#94A3B8;">วันออกบัตร: <span style="color:#334155;font-weight:600;">${issueDate}</span></div>
          </div>
        </div>
        <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;flex:0 0 14mm;
                    box-sizing:border-box;padding:1px 6px;overflow:hidden;
                    display:flex;flex-direction:column;align-items:center;justify-content:center;">
          <svg class="barcode-svg" data-code="${escapeHTML(sid)}" style="max-width:100%;display:block;"></svg>
          <div style="font-size:6.5px;color:#475569;letter-spacing:1.5px;">${escapeHTML(sid)}</div>
        </div>
      </div>`;
  }).join('');

  // ย้าย overlay ไปติด body โดยตรง เพื่อให้ @media print display:none ทำงานถูกต้อง
  document.body.appendChild(overlay);
  overlay.style.display = 'block';

  // JsBarcode — วาด barcode ใน svg
  setTimeout(function() {
    document.querySelectorAll('.barcode-svg').forEach(function(svg) {
      const code = svg.dataset.code;
      if (!code) return;
      if (window.JsBarcode) {
        try {
          JsBarcode(svg, code, {
            format: 'CODE128',
            width: 1.5,
            height: 30,
            displayValue: false,
            margin: 2,
            background: '#F8FAFC'
          });
          svg.style.maxWidth = '100%';
        } catch(e) {
          svg.parentElement.textContent = code;
        }
      } else {
        svg.parentElement.textContent = code;
      }
    });
  }, 200);
}

function closePrintOverlay() {
  const o = document.getElementById('cardPrintOverlay');
  if (o) o.style.display = 'none';
}