/* ============================================================
 *  Smart School Office — js_line_oa
 *  LINE OA Settings UI + Test Send
 * ============================================================ */

/**
 * เรียกจาก renderSettings() ใน js4.html — เพิ่ม Tab LINE OA
 * แต่ก็ใช้เป็นหน้าแยกได้ผ่าน renderLineOASettings()
 */

/* ---------- inject แท็บ LINE OA เข้าหน้า Settings ---------- */
const _origRenderSettings = window.renderSettings;
window.renderSettings = function(container) {
  _origRenderSettings(container);

  // เพิ่มปุ่ม "LINE OA" ท้าย topbar ของ settings
  const btn = document.getElementById('saveSettingsBtn');
  if (btn && btn.parentElement) {
    const lineBtn = document.createElement('button');
    lineBtn.className = 'btn btn-light';
    lineBtn.style.cssText = 'background:#06C755; color:white; border:none;';
    lineBtn.innerHTML = `<i class='bx bxl-whatsapp'>\x3c/i> ตั้งค่า LINE OA`;
    lineBtn.onclick = () => showLineOAPanel();
    btn.parentElement.insertBefore(lineBtn, btn);
  }
};


/* ============================================================
 *  LINE OA Panel (SweetAlert)
 * ============================================================ */
function showLineOAPanel() {
  showLoading('กำลังโหลดการตั้งค่า LINE OA...');

  apiCall('getLineSettings', APP.token);
}

function _renderLineOAPanel(d) {
  // ดึงรายชื่อห้องจาก students state ที่โหลดไว้ (หรือ fallback)
  const classrooms = (window.StudentsState && StudentsState.data && StudentsState.data.distinct)
    ? StudentsState.data.distinct.classrooms || []
    : [];

  const classGroupsRows = classrooms.map(cls => {
    const gid = (d.line_classroom_groups || {})[cls] || '';
    return `
      <tr>
        <td style="padding:6px 8px; font-weight:600; font-size:13px;">${escapeHTML(cls)}\x3c/td>
        <td style="padding:6px 8px;">
          <input type="text" class="line-input cls-gid" data-classroom="${escapeHTML(cls)}"
                 placeholder="C xxxxxxxxxxxxxxxxxxxxxxxxx"
                 value="${escapeHTML(gid)}"
                 style="width:100%; padding:5px 8px; border:1.5px solid #E2E8F0; border-radius:6px; font-family:monospace; font-size:12px;">
        \x3c/td>
        <td style="padding:6px 8px; text-align:center;">
          <button class="btn btn-light" style="padding:5px 10px; font-size:11px;"
                  onclick="testLineOA('${escapeHTML(cls)}')">
            <i class='bx bx-send'>\x3c/i> ทดสอบ
          \x3c/button>
        \x3c/td>
      \x3c/tr>`;
  }).join('');

  Swal.fire({
    title: '<i class="bx bxl-whatsapp" style="color:#06C755;">\x3c/i> ตั้งค่า LINE OA',
    width: 800,
    showCancelButton: true,
    confirmButtonText: '<i class="bx bx-save">\x3c/i> บันทึก',
    cancelButtonText: 'ปิด',
    showCloseButton: true,
    html: `
      <div style="text-align:left; font-size:14px;">

        <!-- วิธีติดตั้ง -->
        <div style="background:#F0FFF4; border:1px solid #86EFAC; border-radius:10px; padding:12px 16px; margin-bottom:16px; font-size:13px; color:#166534;">
          <b>📋 วิธีติดตั้ง LINE OA (ทำครั้งเดียว)\x3c/b><br>
          1. สร้าง <a href="https://manager.line.biz/" target="_blank" style="color:#15803D; font-weight:600;">LINE Official Account\x3c/a> (ฟรี)<br>
          2. ไปที่ LINE Developers Console → สร้าง Messaging API Channel<br>
          3. คัดลอก <b>Channel Access Token\x3c/b> (Long-lived)<br>
          4. <b>Invite LINE OA\x3c/b> เข้า Group LINE → ส่งข้อความใดก็ได้ → คัดลอก Group ID<br>
          5. วาง Token + Group ID ด้านล่างแล้วกด "บันทึก"
        \x3c/div>

        <!-- Token -->
        <div style="margin-bottom:14px;">
          <label class="line-label">🔑 Channel Access Token <span style="color:#EF4444;">*\x3c/span>\x3c/label>
          <input type="text" id="la_token" class="line-input"
                 placeholder="ey... (Long-lived token จาก LINE Developers Console)"
                 value="${escapeHTML(d.line_channel_token || '')}">
          <div style="font-size:11px; color:#64748B; margin-top:3px;">
            LINE Developers → ชื่อ Channel → Messaging API → Channel access token → Issue
          \x3c/div>
        \x3c/div>

        <!-- School Group -->
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px; margin-bottom:14px;">
          <div style="font-weight:700; color:#0F172A; margin-bottom:10px; font-size:14px;">
            🏫 Group โรงเรียน <span style="font-size:12px; font-weight:400; color:#64748B;">(รับแจ้งเตือนประกาศ / อนุมัติ / การเงิน)\x3c/span>
          \x3c/div>
          <div class="grid grid-cols-1 gap-2">
            <div>
              <label class="line-label">Group ID โรงเรียน\x3c/label>
              <div style="display:flex; gap:8px; align-items:center;">
                <input type="text" id="la_school_group" class="line-input" style="flex:1; font-family:monospace;"
                       placeholder="C xxxxxxxxxxxxxxxxxxxxxxxxx"
                       value="${escapeHTML(d.line_school_group_id || '')}">
                <button class="btn btn-light" style="padding:7px 12px; white-space:nowrap; background:#06C755; color:white; border:none;"
                        onclick="testLineOA('school')">
                  <i class='bx bx-send'>\x3c/i> ทดสอบ
                \x3c/button>
              \x3c/div>
              <div style="font-size:11px; color:#64748B; margin-top:3px;">
                Invite OA เข้ากลุ่ม → พิมพ์ /id หรือใช้ webhook ดู Group ID (ขึ้นต้นด้วย C)
              \x3c/div>
            \x3c/div>
          \x3c/div>
        \x3c/div>

        <!-- Classroom Groups -->
        ${classrooms.length > 0 ? `
          <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px; margin-bottom:14px;">
            <div style="font-weight:700; color:#0F172A; margin-bottom:10px; font-size:14px;">
              🏛 Group รายห้องเรียน <span style="font-size:12px; font-weight:400; color:#64748B;">(รับแจ้งเตือนนักเรียนขาด / มาสาย)\x3c/span>
            \x3c/div>
            <div style="overflow-x:auto; max-height:280px; overflow-y:auto;">
              <table style="width:100%; border-collapse:collapse; font-size:13px;">
                <thead>
                  <tr style="background:#E2E8F0; position:sticky; top:0;">
                    <th style="padding:8px; text-align:left; width:80px;">ชั้น\x3c/th>
                    <th style="padding:8px; text-align:left;">Group ID (ขึ้นต้น C...)\x3c/th>
                    <th style="padding:8px; width:80px;">\x3c/th>
                  \x3c/tr>
                \x3c/thead>
                <tbody id="classGroupsTable">
                  ${classGroupsRows}
                \x3c/tbody>
              \x3c/table>
            \x3c/div>
            <div style="font-size:11px; color:#64748B; margin-top:6px;">
              💡 ถ้ายังไม่มี Group ของห้องนั้น เว้นว่างไว้ได้ — จะไม่ส่งแจ้งเตือนห้องนั้น
            \x3c/div>
          \x3c/div>
        ` : `
          <div style="background:#FEF3C7; border:1px solid #FCD34D; border-radius:10px; padding:12px; margin-bottom:14px; font-size:13px; color:#92400E;">
            ⚠️ ยังไม่มีข้อมูลห้องเรียน — เพิ่มนักเรียนก่อนเพื่อตั้งค่า Group รายห้อง
          \x3c/div>
        `}

        <!-- Notification Toggles -->
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px;">
          <div style="font-weight:700; color:#0F172A; margin-bottom:10px; font-size:14px;">
            🔔 เปิด/ปิด การแจ้งเตือน
          \x3c/div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            ${[
              ['la_notify_absent',   d.line_notify_absent   !== false, '❌ นักเรียนขาดเรียน',       '→ Group รายห้อง'],
              ['la_notify_late',     d.line_notify_late     !== false, '🕐 นักเรียนมาสาย',          '→ Group รายห้อง'],
              ['la_notify_approval', d.line_notify_approval !== false, '📋 คำขออนุมัติใหม่',        '→ Group โรงเรียน'],
              ['la_notify_announce', d.line_notify_announce !== false, '📢 ประกาศโรงเรียน (ปักหมุด)','→ Group โรงเรียน'],
              ['la_notify_finance',  d.line_notify_finance  !== false, '💰 บันทึกรายรับ-รายจ่าย',  '→ Group โรงเรียน']
            ].map(([id, checked, label, sub]) => `
              <label style="display:flex; align-items:center; gap:10px; padding:10px 12px;
                            background:white; border:1.5px solid ${checked ? '#06C755' : '#E2E8F0'};
                            border-radius:10px; cursor:pointer; transition:all .12s;"
                     onclick="toggleLineNotify('${id}', this)">
                <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} style="display:none;">
                <div id="${id}_dot" style="width:42px; height:24px; border-radius:999px; background:${checked ? '#06C755' : '#CBD5E1'};
                              flex-shrink:0; position:relative; transition:background .2s;">
                  <div id="${id}_thumb" style="position:absolute; top:3px; left:${checked ? '21px' : '3px'};
                               width:18px; height:18px; border-radius:50%; background:white;
                               box-shadow:0 1px 3px rgba(0,0,0,.2); transition:left .2s;">\x3c/div>
                \x3c/div>
                <div>
                  <div style="font-weight:600; font-size:13px; color:#0F172A;">${label}\x3c/div>
                  <div style="font-size:11px; color:#64748B;">${sub}\x3c/div>
                \x3c/div>
              \x3c/label>
            `).join('')}
          \x3c/div>
        \x3c/div>

      \x3c/div>

      <style>
        .line-label { display:block; font-size:12px; font-weight:600; color:#475569; margin-bottom:4px; }
        .line-input {
          width:100%; padding:8px 12px; border:1.5px solid #E2E8F0; border-radius:8px;
          font-family:inherit; font-size:13px; background:#F8FAFC; box-sizing:border-box;
        }
        .line-input:focus { outline:none; border-color:#06C755; background:white; }
      \x3c/style>
    `,
    preConfirm: () => {
      const token = document.getElementById('la_token').value.trim();
      if (!token) { Swal.showValidationMessage('กรุณาใส่ Channel Access Token'); return false; }

      // classroom groups
      const clsGroups = {};
      document.querySelectorAll('.cls-gid').forEach(el => {
        const cls = el.dataset.classroom;
        const gid = el.value.trim();
        if (cls && gid) clsGroups[cls] = gid;
      });

      return {
        line_channel_token    : token,
        line_school_group_id  : document.getElementById('la_school_group').value.trim(),
        line_admin_user_ids   : [],
        line_classroom_groups : clsGroups,
        line_notify_absent    : document.getElementById('la_notify_absent').checked,
        line_notify_late      : document.getElementById('la_notify_late').checked,
        line_notify_approval  : document.getElementById('la_notify_approval').checked,
        line_notify_announce  : document.getElementById('la_notify_announce').checked,
        line_notify_finance   : document.getElementById('la_notify_finance').checked
      };
    }
  }).then(r => {
    if (!r.isConfirmed) return;
    showLoading('กำลังบันทึก...');
    google.script.run
      .withSuccessHandler(res => {
        hideLoading();
        if (res.status === 'success') {
          Swal.fire({ icon:'success', title:'บันทึก LINE OA แล้ว', text:'กดปุ่ม "ทดสอบ" เพื่อยืนยันการเชื่อมต่อ', timer:2500 });
        } else {
          Swal.fire({ icon:'error', text:res.message });
        }
      })
      .withFailureHandler(err => { hideLoading(); Swal.fire({ icon:'error', text:err.message || err }); })
      .saveLineSettings(r.value)
    .then(res => {
      hideLoading();
      if (res.status !== 'success') return showToast('error', res.message);
      _renderLineOAPanel(res.data);
    })
    .catch(err => { hideLoading(); showToast('error', err.message || err); });
  });
}

/* Toggle switch สวยๆ */
function toggleLineNotify(id, label) {
  const cb    = document.getElementById(id);
  const dot   = document.getElementById(id + '_dot');
  const thumb = document.getElementById(id + '_thumb');
  cb.checked  = !cb.checked;
  const on    = cb.checked;
  dot.style.background = on ? '#06C755' : '#CBD5E1';
  thumb.style.left     = on ? '21px' : '3px';
  label.style.borderColor = on ? '#06C755' : '#E2E8F0';
}

/* ทดสอบส่ง */
function testLineOA(targetType) {
  showLoading('กำลังส่งข้อความทดสอบ...');
  apiCall('testLineNotify', targetType)
    .then(res => {
      hideLoading();
      if (res.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'ส่งสำเร็จ! ✅',
          text: res.message,
          confirmButtonText: 'OK'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'ส่งไม่สำเร็จ',
          html: `<div style="font-size:13px;">${escapeHTML(res.message)}\x3c/div>
                 <div style="font-size:12px; color:#64748B; margin-top:8px;">
                   ตรวจสอบ: Token ถูกต้อง / OA ถูก Invite เข้ากลุ่มแล้ว / Group ID ถูกต้อง
                 \x3c/div>`
        });
      }
    })
    .catch(err => { hideLoading(); showToast('error', err.message || err); });
}


/* ============================================================
 *  แสดง Status Badge LINE OA ใน Dashboard
 * ============================================================ */
const _origRenderDashboard = window.renderDashboard;
if (typeof _origRenderDashboard === 'function') {
  window.renderDashboard = function(container) {
    _origRenderDashboard(container);
    // Inject LINE OA badge เล็กๆ ใน welcome row (lazy)
    setTimeout(() => {
      google.script.run
        .withSuccessHandler(res => {
          if (res.status !== 'success') return;
          const hasToken = !!res.data.line_channel_token;
          const wRow = document.querySelector('.welcome-row .sub');
          if (!wRow) return;
          const badge = document.createElement('span');
          badge.style.cssText = 'margin-left:8px; font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px;' +
            (hasToken ? 'background:#DCFCE7; color:#15803D;' : 'background:#FEE2E2; color:#B91C1C;');
          badge.innerHTML = hasToken ? '🟢 LINE OA เชื่อมต่อแล้ว' : '⚪ ยังไม่ได้ตั้งค่า LINE OA';
          wRow.appendChild(badge);
        })
        .withFailureHandler(()=>{})
        .getLineSettings(APP.token);
    }, 1200);
  };
}