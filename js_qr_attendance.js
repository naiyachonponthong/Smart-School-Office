/* QR ATTENDANCE */
var QRA = { scanning:false, scanner:null, date:'', results:[] };

function renderQRAttendance(container) {
  QRA.results  = [];
  QRA.scanning = false;
  QRA.date     = new Date().toISOString().slice(0, 10);

  var html = '';
  html += pageHeader('เช็คชื่อ QR / บาร์โค้ด', 'bx-qr-scan', '');
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:900px;margin:0 auto;">';

  /* scanner panel */
  html += '<div class="page-card"><div class="page-card-body">';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">';
  html += '<i class="bx bx-calendar" style="color:#3B82F6;"></i>';
  html += '<span style="font-size:13px;font-weight:600;">วันที่</span>';
  html += '<input type="date" id="qraDate" value="' + QRA.date + '"';
  html += ' style="margin-left:auto;padding:6px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:13px;"';
  html += ' onchange="QRA.date=this.value">';
  html += '</div>';

  html += '<div id="qraReader" style="width:100%;min-height:200px;border-radius:12px;overflow:hidden;background:#0F172A;display:flex;align-items:center;justify-content:center;position:relative;">';
  html += '<div id="qraPlaceholder" style="text-align:center;color:rgba(255,255,255,.5);padding:32px 20px;">';
  html += '<i class="bx bx-qr-scan" style="font-size:54px;display:block;margin-bottom:10px;"></i>';
  html += '<div style="font-size:13px;">กดเปิดกล้องเพื่อสแกน QR หรือบาร์โค้ดบนบัตรนักเรียน</div>';
  html += '</div></div>';

  html += '<div style="display:flex;gap:8px;margin-top:10px;">';
  html += '<button id="btnQraStart" class="btn btn-blue" style="flex:1;" onclick="qraStart()"><i class="bx bx-camera"></i> เปิดกล้อง</button>';
  html += '<button id="btnQraStop" class="btn btn-light" style="flex:1;display:none;" onclick="qraStop()"><i class="bx bx-stop-circle"></i> หยุด</button>';
  html += '</div>';

  html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #E2E8F0;">';
  html += '<div style="font-size:12px;color:#94A3B8;margin-bottom:4px;">หรือกรอกรหัสนักเรียนด้วยตนเอง</div>';
  html += '<div style="display:flex;gap:6px;">';
  html += '<input type="text" id="qraManual" placeholder="รหัสนักเรียน..."';
  html += ' style="flex:1;padding:8px 10px;border:1.5px solid #E2E8F0;border-radius:8px;font-family:inherit;font-size:13px;"';
  html += ' onkeydown="if(event.key==\'Enter\')qraManual()">';
  html += '<button class="btn btn-blue" onclick="qraManual()">เช็คชื่อ</button>';
  html += '</div></div>';
  html += '</div></div>';

  /* result panel */
  html += '<div class="page-card"><div class="page-card-body">';
  html += '<div id="qraFeedback" style="min-height:120px;border-radius:12px;background:#F8FAFC;border:1.5px dashed #E2E8F0;display:flex;align-items:center;justify-content:center;margin-bottom:14px;text-align:center;padding:16px;">';
  html += '<div style="color:#CBD5E1;"><i class="bx bx-scan" style="font-size:36px;display:block;margin-bottom:8px;"></i><div style="font-size:13px;">ผลจะแสดงที่นี่</div></div>';
  html += '</div>';
  html += '<div style="font-size:13px;font-weight:700;margin-bottom:8px;"><i class="bx bx-list-check" style="color:#3B82F6;"></i> บันทึกวันนี้ (<span id="qraCount">0</span> คน)</div>';
  html += '<div id="qraLog" style="max-height:300px;overflow-y:auto;"><div style="color:#CBD5E1;font-size:13px;text-align:center;padding:20px;">ยังไม่มี</div></div>';
  html += '</div></div>';

  html += '</div>';
  html += '<style>#qraReader video{width:100%!important;border-radius:12px;}.qra-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;margin-bottom:6px;font-size:13px;}.qra-ok{background:#DCFCE7;}.qra-dup{background:#FEF3C7;}.qra-err{background:#FEE2E2;}</style>';

  container.innerHTML = html;
}

function qraStart() {
  if (!window.Html5Qrcode) { return showToast('error', 'ไม่พบ Html5Qrcode library กรุณา reload หน้า'); }
  var ph = document.getElementById('qraPlaceholder');
  var bs = document.getElementById('btnQraStart');
  var bt = document.getElementById('btnQraStop');
  if (ph) ph.style.display = 'none';
  if (bs) bs.style.display = 'none';
  if (bt) bt.style.display = '';
  QRA.scanning = true;
  QRA.scanner  = new Html5Qrcode('qraReader');
  QRA.scanner.start(
    { facingMode:'environment' },
    { fps:8, qrbox:200 },
    function(text) { if (QRA.scanning) qraProcess(text.trim()); },
    function() {}
  ).catch(function(e) { showToast('error', 'ไม่สามารถเปิดกล้องได้: ' + e); qraStop(); });
}

function qraStop() {
  QRA.scanning = false;
  if (QRA.scanner) { QRA.scanner.stop().catch(function(){}); QRA.scanner = null; }
  var ph = document.getElementById('qraPlaceholder');
  var bs = document.getElementById('btnQraStart');
  var bt = document.getElementById('btnQraStop');
  if (ph) ph.style.display = '';
  if (bs) bs.style.display = '';
  if (bt) bt.style.display = 'none';
}

function qraManual() {
  var el = document.getElementById('qraManual');
  if (!el || !el.value.trim()) return showToast('warning', 'กรุณากรอกรหัสนักเรียน');
  qraProcess(el.value.trim());
  el.value = '';
  el.focus();
}

var _qraLast = '', _qraTime = 0;

function qraProcess(code) {
  var now = Date.now();
  if (code === _qraLast && now - _qraTime < 3000) return;
  _qraLast = code; _qraTime = now;
  try { var ctx = new AudioContext(); var o = ctx.createOscillator(); o.connect(ctx.destination); o.frequency.value = 880; o.start(); o.stop(ctx.currentTime + 0.08); } catch(e) {}
  apiCall('recordQRAttendance', { studentCode: code, date: QRA.date })
    .then(function(res) { qraResult(res, code); })
    .catch(function(e)   { qraResult({ status:'error', message: e.message||String(e) }, code); });
}

function qraResult(res, code) {
  var fb = document.getElementById('qraFeedback');
  if (!fb) return;
  var s    = res.student || {};
  var isOk = res.status === 'success';
  var isDup = res.status === 'already';
  var bg   = isOk ? '#DCFCE7' : isDup ? '#FEF3C7' : '#FEE2E2';
  var icon = isOk ? '&#x2705;' : isDup ? '&#x26A0;&#xFE0F;' : '&#x274C;';
  var clr  = isOk ? '#15803D' : isDup ? '#B45309' : '#B91C1C';
  fb.style.background = bg; fb.style.borderColor = 'transparent';
  fb.innerHTML = '<div style="width:100%;">'
    + '<div style="font-size:32px;margin-bottom:8px;">' + icon + '</div>'
    + (s.name ? '<div style="font-size:15px;font-weight:800;">' + escapeHTML(s.name) + '</div>'
              + '<div style="font-size:12px;color:#64748B;">ชั้น ' + escapeHTML(s.classroom||'-') + '</div>' : '')
    + '<div style="font-size:14px;font-weight:700;color:' + clr + ';margin-top:6px;">' + escapeHTML(res.message||'') + '</div>'
    + '</div>';

  QRA.results.unshift({ code:code, name:s.name||code, cls:s.classroom||'', st:res.status, t:new Date().toLocaleTimeString('th-TH') });
  var cnt = document.getElementById('qraCount');
  if (cnt) cnt.textContent = QRA.results.filter(function(r){ return r.st==='success'; }).length;
  var log = document.getElementById('qraLog');
  if (log) {
    log.innerHTML = QRA.results.map(function(r) {
      var cls = r.st==='success' ? 'qra-ok' : r.st==='already' ? 'qra-dup' : 'qra-err';
      var ico = r.st==='success' ? 'bx-check-circle' : r.st==='already' ? 'bx-time-five' : 'bx-x-circle';
      return '<div class="qra-item ' + cls + '">'
        + '<i class="bx ' + ico + '" style="font-size:18px;flex-shrink:0;"></i>'
        + '<div style="flex:1;"><div style="font-weight:700;">' + escapeHTML(r.name) + '</div>'
        + '<div style="font-size:11px;color:#64748B;">' + escapeHTML(r.cls) + ' &bull; ' + r.t + '</div></div></div>';
    }).join('');
  }
  setTimeout(function() {
    var f = document.getElementById('qraFeedback');
    if (f) { f.style.background = '#F8FAFC'; f.style.borderColor = '#E2E8F0';
      f.innerHTML = '<div style="color:#CBD5E1;"><i class="bx bx-scan" style="font-size:36px;display:block;margin-bottom:8px;"></i><div style="font-size:13px;">ผลจะแสดงที่นี่</div></div>'; }
  }, 4000);
}