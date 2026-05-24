/* ============================================================
 *  Smart School Office — js_manual
 *  หน้าคู่มือการใช้งานระบบ
 * ============================================================ */

function renderManual(container) {
  container.innerHTML = `
    <div class="welcome-row">
      <div>
        <h1><i class='bx bxs-book-reader' style="color:#3B82F6;">\x3c/i> คู่มือการใช้งาน\x3c/h1>
        <div class="sub"><i class='bx bx-info-circle'>\x3c/i> Smart School Office v1.2 — อ่านเพื่อทำความเข้าใจระบบ\x3c/div>
      \x3c/div>
    \x3c/div>

    <!-- Quick Search -->
    <div class="page-card mb-4">
      <div class="page-card-body" style="padding:14px 20px;">
        <div class="relative">
          <i class='bx bx-search absolute' style="left:14px; top:50%; transform:translateY(-50%); color:#94A3B8; font-size:20px;">\x3c/i>
          <input type="text" id="manualSearch" placeholder="ค้นหาในคู่มือ..."
                 class="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 font-medium"
                 oninput="filterManual(this.value)">
        \x3c/div>
      \x3c/div>
    \x3c/div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">

      <!-- Sidebar TOC -->
      <div class="lg:col-span-1">
        <div class="page-card" style="position:sticky; top:80px;">
          <div class="page-card-header"><h2><i class='bx bx-list-ul' style="color:#3B82F6;">\x3c/i> สารบัญ\x3c/h2>\x3c/div>
          <div class="page-card-body" style="padding:10px;">
            ${manualTOC()}
          \x3c/div>
        \x3c/div>
      \x3c/div>

      <!-- Content -->
      <div class="lg:col-span-3" id="manualContent">
        ${manualContent()}
      \x3c/div>

    \x3c/div>

    <style>
      .man-section {
        background:white; border:1px solid #F1F5F9; border-radius:16px;
        margin-bottom:16px; overflow:hidden;
        box-shadow:0 1px 3px rgba(15,23,42,.04);
      }
      .man-header {
        padding:16px 20px; display:flex; align-items:center; gap:12px;
        border-bottom:1px solid #F1F5F9; cursor:pointer; user-select:none;
      }
      .man-header:hover { background:#F8FAFC; }
      .man-header .ic {
        width:42px; height:42px; border-radius:12px; flex-shrink:0;
        display:flex; align-items:center; justify-content:center; font-size:22px;
      }
      .man-header h2 { margin:0; font-size:16px; font-weight:700; color:#0F172A; flex:1; }
      .man-header .chevron { color:#94A3B8; font-size:20px; transition:transform .2s; }
      .man-header.open .chevron { transform:rotate(180deg); }
      .man-body { padding:20px; display:none; }
      .man-body.open { display:block; }

      .man-step {
        display:flex; gap:14px; margin-bottom:16px; align-items:flex-start;
      }
      .man-step .num {
        width:28px; height:28px; border-radius:50%; flex-shrink:0;
        background:linear-gradient(135deg,#1E40AF,#3B82F6); color:white;
        display:flex; align-items:center; justify-content:center;
        font-weight:700; font-size:13px;
      }
      .man-step .text { flex:1; }
      .man-step .text .title { font-weight:600; color:#0F172A; margin-bottom:4px; }
      .man-step .text .desc { font-size:13px; color:#475569; line-height:1.6; }

      .man-tip {
        background:#EFF6FF; border-left:3px solid #3B82F6; padding:10px 14px;
        border-radius:0 8px 8px 0; margin:12px 0; font-size:13px; color:#1E40AF;
      }
      .man-tip i { margin-right:6px; }
      .man-warn {
        background:#FEF3C7; border-left:3px solid #F59E0B; padding:10px 14px;
        border-radius:0 8px 8px 0; margin:12px 0; font-size:13px; color:#92400E;
      }
      .man-success {
        background:#DCFCE7; border-left:3px solid #10B981; padding:10px 14px;
        border-radius:0 8px 8px 0; margin:12px 0; font-size:13px; color:#14532D;
      }

      .man-table { width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; }
      .man-table th { background:#1E40AF; color:white; padding:8px 12px; text-align:left; }
      .man-table td { padding:8px 12px; border-bottom:1px solid #E2E8F0; }
      .man-table tr:nth-child(even) td { background:#F8FAFC; }

      .man-badge {
        display:inline-flex; align-items:center; gap:4px; padding:3px 10px;
        border-radius:999px; font-size:12px; font-weight:600;
      }
      .man-toc-item {
        display:flex; align-items:center; gap:8px; padding:7px 10px;
        border-radius:8px; cursor:pointer; font-size:13px; font-weight:500;
        color:#475569; transition:all .12s; margin-bottom:2px;
      }
      .man-toc-item:hover { background:#EFF6FF; color:#1E40AF; }
      .man-toc-item i { font-size:16px; flex-shrink:0; }

      .kbd {
        background:#F1F5F9; border:1px solid #CBD5E1; border-radius:5px;
        padding:2px 7px; font-family:monospace; font-size:12px; color:#334155;
      }

      .feature-grid {
        display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr));
        gap:10px; margin:12px 0;
      }
      .feature-item {
        background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px;
        padding:10px 12px; font-size:13px;
        display:flex; align-items:center; gap:8px; color:#334155;
      }
      .feature-item i { color:#3B82F6; font-size:18px; flex-shrink:0; }

      #manualSearch { font-family: 'Sarabun', sans-serif; }
      .man-hidden { display:none !important; }
    \x3c/style>
  `;

  // เปิด section แรกอัตโนมัติ
  toggleManSection('sec-start');
}

function manualTOC() {
  const items = [
    { id:'sec-start',    icon:'bxs-rocket',          label:'เริ่มต้นใช้งาน' },
    { id:'sec-login',    icon:'bxs-lock-open',        label:'เข้าสู่ระบบ / ออก' },
    { id:'sec-dashboard',icon:'bxs-home-alt-2',       label:'หน้าหลัก (Dashboard)' },
    { id:'sec-students', icon:'bxs-user-detail',      label:'ข้อมูลนักเรียน' },
    { id:'sec-personnel',icon:'bxs-group',            label:'ครูและบุคลากร' },
    { id:'sec-attend',   icon:'bxs-check-square',     label:'การเข้าเรียน' },
    { id:'sec-academic', icon:'bxs-book-content',     label:'งานวิชาการ' },
    { id:'sec-reg',      icon:'bxs-id-card',          label:'งานทะเบียน' },
    { id:'sec-finance',  icon:'bxs-wallet',           label:'งานการเงิน' },
    { id:'sec-doc',      icon:'bxs-envelope',         label:'สารบรรณ' },
    { id:'sec-approve',  icon:'bxs-badge-check',      label:'ระบบอนุมัติ' },
    { id:'sec-calendar', icon:'bxs-calendar-event',   label:'ปฏิทิน / ข่าวสาร' },
    { id:'sec-files',    icon:'bxs-folder',           label:'คลังไฟล์' },
    { id:'sec-reports',  icon:'bxs-bar-chart-alt-2',  label:'รายงาน' },
    { id:'sec-users',    icon:'bxs-user-account',     label:'จัดการผู้ใช้' },
    { id:'sec-settings', icon:'bxs-cog',              label:'ตั้งค่าระบบ' },
    { id:'sec-faq',      icon:'bxs-help-circle',      label:'คำถามที่พบบ่อย' }
  ];
  return items.map(i => `
    <div class="man-toc-item" onclick="scrollToSection('${i.id}')">
      <i class='bx ${i.icon}'>\x3c/i> ${i.label}
    \x3c/div>
  `).join('');
}

function manualContent() {
  return `
    <!-- เริ่มต้น -->
    ${manSection('sec-start','bxs-rocket','#3B82F6','เริ่มต้นใช้งานระบบ',`
      <div class="man-success"><i class='bx bx-check-circle'>\x3c/i>
        Smart School Office พร้อมใช้งานบน Browser ทุกตัว ไม่ต้องติดตั้งโปรแกรมเพิ่มเติม
      \x3c/div>
      <div class="man-tip"><i class='bx bx-bulb'>\x3c/i>
        แนะนำให้ใช้ <b>Google Chrome\x3c/b> หรือ <b>Microsoft Edge\x3c/b> เวอร์ชั่นล่าสุด เพื่อประสิทธิภาพสูงสุด
      \x3c/div>

      <div class="feature-grid">
        <div class="feature-item"><i class='bx bx-check'>\x3c/i> ไม่ต้องติดตั้งโปรแกรม\x3c/div>
        <div class="feature-item"><i class='bx bx-check'>\x3c/i> ใช้งานได้บนมือถือ\x3c/div>
        <div class="feature-item"><i class='bx bx-check'>\x3c/i> ข้อมูลบันทึกบน Google Sheets\x3c/div>
        <div class="feature-item"><i class='bx bx-check'>\x3c/i> ไฟล์เก็บบน Google Drive\x3c/div>
        <div class="feature-item"><i class='bx bx-check'>\x3c/i> ไม่มีค่าใช้จ่ายรายเดือน\x3c/div>
        <div class="feature-item"><i class='bx bx-check'>\x3c/i> หลายผู้ใช้พร้อมกันได้\x3c/div>
      \x3c/div>

      <h3 style="font-size:15px; margin:16px 0 10px; color:#0F172A;">ระดับสิทธิ์การใช้งาน\x3c/h3>
      <table class="man-table">
        <thead><tr><th>บทบาท\x3c/th><th>สิทธิ์\x3c/th><th>เมนูที่เข้าถึงได้\x3c/th>\x3c/tr>\x3c/thead>
        <tbody>
          <tr>
            <td><span class="man-badge" style="background:#DBEAFE;color:#1E40AF;">ผู้ดูแลระบบ (Admin)\x3c/span>\x3c/td>
            <td>อ่าน + เขียน + ลบ + อนุมัติ + ตั้งค่า\x3c/td>
            <td>ทุกเมนู\x3c/td>
          \x3c/tr>
          <tr>
            <td><span class="man-badge" style="background:#DCFCE7;color:#15803D;">เจ้าหน้าที่ (Staff)\x3c/span>\x3c/td>
            <td>อ่าน + เขียน\x3c/td>
            <td>ทุกเมนูยกเว้น ตั้งค่า + จัดการผู้ใช้\x3c/td>
          \x3c/tr>
          <tr>
            <td><span class="man-badge" style="background:#FEF3C7;color:#B45309;">ครู (Teacher)\x3c/span>\x3c/td>
            <td>อ่าน + เขียนของตัวเอง\x3c/td>
            <td>นักเรียน + การเข้าเรียน + วิชาการ + คะแนน\x3c/td>
          \x3c/tr>
        \x3c/tbody>
      \x3c/table>
    `)}

    <!-- Login -->
    ${manSection('sec-login','bxs-lock-open','#10B981','เข้าสู่ระบบ / ออกจากระบบ',`
      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">เลือกประเภทผู้ใช้\x3c/div>
          <div class="desc">กดแท็บ <b>"ผู้ดูแลระบบ"\x3c/b> หรือ <b>"Staff / ครู"\x3c/b> บนหน้า Login\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">กรอก Username และรหัสผ่าน\x3c/div>
          <div class="desc">บัญชีเริ่มต้น: <span class="kbd">admin\x3c/span> / <span class="kbd">Admin@2024\x3c/span>
          <br>กดไอคอน 👁 เพื่อแสดง/ซ่อนรหัสผ่าน\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">3\x3c/div>
        <div class="text">
          <div class="title">ติ๊ก "จดจำการเข้าสู่ระบบ" (ถ้าต้องการ)\x3c/div>
          <div class="desc">ระบบจะจำ session ไว้แม้ปิด browser (เหมาะสำหรับอุปกรณ์ส่วนตัว)\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">4\x3c/div>
        <div class="text">
          <div class="title">กด "เข้าสู่ระบบ"\x3c/div>
          <div class="desc">ระบบจะพาไปหน้าหลักอัตโนมัติ\x3c/div>
        \x3c/div>
      \x3c/div>

      <div class="man-tip"><i class='bx bx-info-circle'>\x3c/i>
        <b>ออกจากระบบ:\x3c/b> กดไอคอน <i class='bx bx-log-out'>\x3c/i> ที่มุมซ้ายล่างของ Sidebar
        หรือกดไอคอน 👤 บน Topbar → เปลี่ยนรหัสผ่านได้ที่นี่ด้วย
      \x3c/div>
      <div class="man-warn"><i class='bx bx-time-five'>\x3c/i>
        Session หมดอายุหลัง 1 ชั่วโมง (ตั้งค่าได้ในหน้าตั้งค่าระบบ) ระบบจะพากลับหน้า Login อัตโนมัติ
      \x3c/div>
    `)}

    <!-- Dashboard -->
    ${manSection('sec-dashboard','bxs-home-alt-2','#8B5CF6','หน้าหลัก (Dashboard)',`
      <p style="color:#475569; font-size:14px;">หน้าหลักแสดงภาพรวมของโรงเรียนทั้งหมด ประกอบด้วย:\x3c/p>

      <table class="man-table">
        <thead><tr><th>ส่วน\x3c/th><th>แสดงข้อมูล\x3c/th>\x3c/tr>\x3c/thead>
        <tbody>
          <tr><td><b>4 Stat Cards\x3c/b>\x3c/td><td>จำนวนนักเรียน / บุคลากร / % เข้าเรียนวันนี้ / คงเหลือในบัญชี\x3c/td>\x3c/tr>
          <tr><td><b>กราฟเส้น\x3c/b>\x3c/td><td>อัตราการเข้าเรียนย้อนหลัง 7 วัน\x3c/td>\x3c/tr>
          <tr><td><b>กราฟวงกลม\x3c/b>\x3c/td><td>สรุปรายรับ-รายจ่าย (รวมทุกรายการ)\x3c/td>\x3c/tr>
          <tr><td><b>ประกาศล่าสุด\x3c/b>\x3c/td><td>เหตุการณ์ที่ "ปักหมุด" จากเมนูปฏิทิน\x3c/td>\x3c/tr>
        \x3c/tbody>
      \x3c/table>

      <div class="man-tip"><i class='bx bx-refresh'>\x3c/i>
        ข้อมูลใน Dashboard โหลดใหม่ทุกครั้งที่กดเมนู "หน้าหลัก" — Badge <i class='bx bx-bell'>\x3c/i> บน Topbar แจ้งเตือนจำนวนคำขอรออนุมัติ อัพเดตทุก 1 นาที
      \x3c/div>
    `)}

    <!-- Students -->
    ${manSection('sec-students','bxs-user-detail','#3B82F6','ข้อมูลนักเรียน',`
      <h3 style="font-size:15px; margin:0 0 10px; color:#0F172A;">เพิ่มนักเรียนใหม่\x3c/h3>
      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">กดปุ่ม "เพิ่มนักเรียน" (มุมขวาบน)\x3c/div>
          <div class="desc">หน้าต่างฟอร์มจะเปิดขึ้น\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">อัพโหลดรูปนักเรียน (ไม่บังคับ)\x3c/div>
          <div class="desc">กด "อัพโหลดรูป" → เลือกไฟล์ JPG/PNG ≤ 8MB — ระบบบีบอัดรูปอัตโนมัติก่อนส่ง\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">3\x3c/div>
        <div class="text">
          <div class="title">กรอกข้อมูล 4 หมวด\x3c/div>
          <div class="desc">ข้อมูลส่วนตัว / การศึกษา / ผู้ปกครอง / สถานะ (ช่องที่มี <span style="color:red;">*\x3c/span> จำเป็นต้องกรอก)\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">4\x3c/div>
        <div class="text">
          <div class="title">กด "บันทึก"\x3c/div>
          <div class="desc">ระบบสร้างรหัสนักเรียนอัตโนมัติ เช่น <span class="kbd">25670001\x3c/span> (ปี + running number)\x3c/div>
        \x3c/div>
      \x3c/div>

      <h3 style="font-size:15px; margin:16px 0 10px; color:#0F172A;">การค้นหาและกรอง\x3c/h3>
      <table class="man-table">
        <thead><tr><th>ช่องค้นหา\x3c/th><th>ค้นหาได้จาก\x3c/th>\x3c/tr>\x3c/thead>
        <tbody>
          <tr><td>ช่องค้นหา\x3c/td><td>ชื่อ-นามสกุล, รหัสนักเรียน, เลขบัตรประชาชน\x3c/td>\x3c/tr>
          <tr><td>Dropdown ชั้น\x3c/td><td>กรองเฉพาะชั้นที่เลือก\x3c/td>\x3c/tr>
          <tr><td>Dropdown ปีการศึกษา\x3c/td><td>กรองตามปีการศึกษา\x3c/td>\x3c/tr>
          <tr><td>Dropdown สถานะ\x3c/td><td>กำลังศึกษา / จบ / ย้าย / ไม่ใช้งาน\x3c/td>\x3c/tr>
        \x3c/tbody>
      \x3c/table>

      <div class="man-tip"><i class='bx bx-download'>\x3c/i>
        กดปุ่ม <b>"Export"\x3c/b> เพื่อดาวน์โหลดรายชื่อนักเรียนทั้งหมดเป็นไฟล์ Excel (.xls)
      \x3c/div>
      <div class="man-warn"><i class='bx bx-error'>\x3c/i>
        ระบบตรวจสอบเลขบัตรประชาชนซ้ำ — ถ้ากรอกเลขซ้ำจะแจ้งเตือนทันที
      \x3c/div>
    `)}

    <!-- Personnel -->
    ${manSection('sec-personnel','bxs-group','#10B981','ครูและบุคลากร',`
      <p style="color:#475569; font-size:14px;">ใช้งานเหมือนหน้าข้อมูลนักเรียน เพิ่มเติมที่สำคัญ:\x3c/p>

      <table class="man-table">
        <thead><tr><th>ฟิลด์พิเศษ\x3c/th><th>วิธีใช้\x3c/th>\x3c/tr>\x3c/thead>
        <tbody>
          <tr>
            <td><b>รูปโปรไฟล์\x3c/b>\x3c/td>
            <td>แสดงในระบบ + ปพ.6 ของนักเรียนที่ครูสอน\x3c/td>
          \x3c/tr>
          <tr>
            <td><b>ลายเซ็น\x3c/b>\x3c/td>
            <td>อัพโหลดรูปลายเซ็น PNG พื้นโปร่งใส → จะพิมพ์ใน ปพ.5 อัตโนมัติ\x3c/td>
          \x3c/tr>
          <tr>
            <td><b>ประเภท\x3c/b>\x3c/td>
            <td>ครู = สอนได้ใน dropdown ปพ.5 | สนับสนุน/บริหาร = ไม่แสดงใน dropdown ครูผู้สอน\x3c/td>
          \x3c/tr>
        \x3c/tbody>
      \x3c/table>

      <div class="man-tip"><i class='bx bx-edit-alt'>\x3c/i>
        <b>ลายเซ็น:\x3c/b> ถ่ายรูปลายเซ็นบนกระดาษขาว → ลบพื้นหลังออก (ใช้ remove.bg ฟรี) → อัพโหลด PNG โปร่งใส → ลายเซ็นจะอยู่บน ปพ.5 สวยงาม
      \x3c/div>
    `)}

    <!-- Attendance -->
    ${manSection('sec-attend','bxs-check-square','#F59E0B','การเข้าเรียน',`
      <h3 style="font-size:15px; margin:0 0 10px; color:#0F172A;">Tab บันทึกรายวัน\x3c/h3>
      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">เลือกชั้นเรียน\x3c/div>
          <div class="desc">Dropdown จะแสดงเฉพาะชั้นที่มีนักเรียนในระบบ\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">เลือกวันที่\x3c/div>
          <div class="desc">ค่าเริ่มต้นเป็นวันนี้ สามารถย้อนหลังบันทึกได้\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">3\x3c/div>
        <div class="text">
          <div class="title">กดปุ่มสถานะรายคน\x3c/div>
          <div class="desc">
            <span style="background:#DCFCE7;color:#15803D;padding:2px 8px;border-radius:5px;font-weight:600;">มา\x3c/span>
            <span style="background:#FEE2E2;color:#B91C1C;padding:2px 8px;border-radius:5px;font-weight:600;">ขาด\x3c/span>
            <span style="background:#FEF3C7;color:#B45309;padding:2px 8px;border-radius:5px;font-weight:600;">ลา\x3c/span>
            <span style="background:#DBEAFE;color:#1E40AF;padding:2px 8px;border-radius:5px;font-weight:600;">มาสาย\x3c/span>
            <br>ค่าเริ่มต้นทุกคน = <b>มา\x3c/b>
          \x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">4\x3c/div>
        <div class="text">
          <div class="title">กด "บันทึก" (มุมขวาบน)\x3c/div>
          <div class="desc">บันทึกพร้อมกันทุกคนในห้องครั้งเดียว\x3c/div>
        \x3c/div>
      \x3c/div>

      <div class="man-tip"><i class='bx bx-check-double'>\x3c/i>
        ปุ่ม <b>"มาทั้งหมด"\x3c/b> ตั้งค่าทุกคนเป็น "มา" ด้วยคลิกเดียว — ประหยัดเวลาในวันที่ไม่มีขาด
      \x3c/div>

      <h3 style="font-size:15px; margin:16px 0 10px; color:#0F172A;">Tab รายงาน\x3c/h3>
      <p style="font-size:14px; color:#475569;">เลือกชั้น + ช่วงวันที่ → แสดงสถิติรายนักเรียน\x3c/p>
      <div class="man-warn"><i class='bx bx-error'>\x3c/i>
        นักเรียนที่ % เข้าเรียน &lt; 80% จะขึ้น <span style="background:#FEE2E2;color:#B91C1C;padding:2px 8px;border-radius:5px;">สีแดง\x3c/span> เกณฑ์ปรับได้ในหน้าตั้งค่า
      \x3c/div>
    `)}

    <!-- Academic -->
    ${manSection('sec-academic','bxs-book-content','#8B5CF6','งานวิชาการ',`
      <h3 style="font-size:15px; margin:0 0 10px; color:#0F172A;">ขั้นตอนการใช้งาน (ตามลำดับ)\x3c/h3>
      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">เพิ่มรายวิชา (Tab รายวิชา)\x3c/div>
          <div class="desc">กรอก รหัสวิชา, ชื่อวิชา, กลุ่มสาระ, ชั้น, เทอม, ครูผู้สอน, น้ำหนักคะแนน\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">บันทึกคะแนน (Tab บันทึก ปพ.5)\x3c/div>
          <div class="desc">เลือกวิชา → รายชื่อนักเรียนในชั้นนั้นโหลดอัตโนมัติ → กรอกคะแนน → เกรดคำนวณสด\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">3\x3c/div>
        <div class="text">
          <div class="title">พิมพ์ ปพ.5\x3c/div>
          <div class="desc">กดปุ่ม "พิมพ์ ปพ.5" → หน้า A4 เปิดในแท็บใหม่ → กด "พิมพ์" หรือ Ctrl+P\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">4\x3c/div>
        <div class="text">
          <div class="title">ดู GPA และพิมพ์ ปพ.6 (Tab GPA)\x3c/div>
          <div class="desc">ค้นชื่อนักเรียน → กด "ดู GPA" หรือ "ปพ.6" → เปิด A4 ในแท็บใหม่\x3c/div>
        \x3c/div>
      \x3c/div>

      <div class="man-tip"><i class='bx bx-calculator'>\x3c/i>
        <b>การคำนวณเกรดสด:\x3c/b> กรอกคะแนนระหว่างภาค + ปลายภาค → ระบบรวมและแสดงเกรดทันทีโดยไม่ต้องกด Save ก่อน
      \x3c/div>

      <table class="man-table">
        <thead><tr><th>เกรด\x3c/th><th>คะแนน (%)\x3c/th>\x3c/tr>\x3c/thead>
        <tbody>
          <tr><td>4.0\x3c/td><td>80 ขึ้นไป\x3c/td>\x3c/tr>
          <tr><td>3.5\x3c/td><td>75–79\x3c/td>\x3c/tr>
          <tr><td>3.0\x3c/td><td>70–74\x3c/td>\x3c/tr>
          <tr><td>2.5\x3c/td><td>65–69\x3c/td>\x3c/tr>
          <tr><td>2.0\x3c/td><td>60–64\x3c/td>\x3c/tr>
          <tr><td>1.5\x3c/td><td>55–59\x3c/td>\x3c/tr>
          <tr><td>1.0\x3c/td><td>50–54\x3c/td>\x3c/tr>
          <tr><td>0.0\x3c/td><td>ต่ำกว่า 50\x3c/td>\x3c/tr>
          <tr><td><b>มส\x3c/b>\x3c/td><td>% เข้าเรียน &lt; 80%\x3c/td>\x3c/tr>
        \x3c/tbody>
      \x3c/table>
      <div class="man-tip"><i class='bx bx-cog'>\x3c/i>
        เกณฑ์ตัดเกรดทั้งหมดนี้ <b>ปรับได้\x3c/b> ในหน้า "ตั้งค่าระบบ" → กลุ่มเกณฑ์ตัดเกรด
      \x3c/div>
    `)}

    <!-- Registration -->
    ${manSection('sec-reg','bxs-id-card','#06B6D4','งานทะเบียน',`
      <h3 style="font-size:15px; margin:0 0 10px; color:#0F172A;">Workflow รับสมัครนักเรียน\x3c/h3>
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:14px; font-size:13px; font-weight:600;">
        <span style="background:#DBEAFE;color:#1E40AF;padding:6px 14px;border-radius:999px;">รับสมัคร\x3c/span>
        <i class='bx bx-right-arrow-alt' style="color:#94A3B8; font-size:20px;">\x3c/i>
        <span style="background:#FEF3C7;color:#B45309;padding:6px 14px;border-radius:999px;">รอพิจารณา\x3c/span>
        <i class='bx bx-right-arrow-alt' style="color:#94A3B8; font-size:20px;">\x3c/i>
        <span style="background:#DCFCE7;color:#15803D;padding:6px 14px;border-radius:999px;">อนุมัติ → สร้างนักเรียน\x3c/span>
      \x3c/div>

      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">กรอกใบสมัคร\x3c/div>
          <div class="desc">กด "รับสมัครใหม่" → กรอกข้อมูลนักเรียนและผู้ปกครอง + ชั้นที่สมัคร\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">อนุมัติใบสมัคร\x3c/div>
          <div class="desc">Admin กด <i class='bx bx-check' style="color:#10B981;">\x3c/i> อนุมัติ → <b>ระบบสร้างข้อมูลนักเรียนในเมนู "ข้อมูลนักเรียน" อัตโนมัติ\x3c/b>\x3c/div>
        \x3c/div>
      \x3c/div>

      <div class="man-success"><i class='bx bx-magic-wand'>\x3c/i>
        หลังอนุมัติแล้ว ข้อมูลนักเรียนจะปรากฏในเมนู "ข้อมูลนักเรียน" พร้อมรหัสนักเรียนทันที ไม่ต้องกรอกซ้ำ
      \x3c/div>
    `)}

    <!-- Finance -->
    ${manSection('sec-finance','bxs-wallet','#10B981','งานการเงิน',`
      <h3 style="font-size:15px; margin:0 0 10px; color:#0F172A;">บันทึกรายรับ (ออกใบเสร็จ)\x3c/h3>
      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">กดปุ่ม "รายรับ" (เขียว)\x3c/div>
          <div class="desc">ฟอร์มเปิดขึ้น เลือกหมวดหมู่ เช่น ค่าเทอม, ค่าบำรุง\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">เลือกนักเรียน (ถ้ามี)\x3c/div>
          <div class="desc">เลือกจาก dropdown เพื่อให้ใบเสร็จแสดงชื่อนักเรียน + ชั้น\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">3\x3c/div>
        <div class="text">
          <div class="title">กรอกจำนวนเงิน → กด "บันทึก"\x3c/div>
          <div class="desc">ระบบถามว่า "พิมพ์ใบเสร็จเลยไหม?" → กด "พิมพ์" เพื่อพิมพ์ A4 ทันที\x3c/div>
        \x3c/div>
      \x3c/div>

      <div class="man-tip"><i class='bx bx-receipt'>\x3c/i>
        ใบเสร็จมี: เลขที่ใบเสร็จ + วันที่ภาษาไทย + <b>คำอ่านภาษาไทย\x3c/b> (เช่น "หนึ่งพันห้าร้อยบาทถ้วน") + ลายเซ็น 2 ช่อง
      \x3c/div>
      <div class="man-tip"><i class='bx bx-printer'>\x3c/i>
        พิมพ์ใบเสร็จซ้ำได้ทุกเมื่อ กดไอคอน <i class='bx bx-printer'>\x3c/i> (เขียว) ในแถวรายรับ
      \x3c/div>
    `)}

    <!-- Documents -->
    ${manSection('sec-doc','bxs-envelope','#EF4444','สารบรรณโรงเรียน',`
      <p style="color:#475569; font-size:14px;">จัดการเอกสารราชการ 6 ประเภท:\x3c/p>
      <div class="feature-grid">
        <div class="feature-item"><i class='bx bx-envelope-open' style="color:#10B981;">\x3c/i> หนังสือรับ\x3c/div>
        <div class="feature-item"><i class='bx bx-send' style="color:#3B82F6;">\x3c/i> หนังสือส่ง\x3c/div>
        <div class="feature-item"><i class='bx bx-clipboard' style="color:#8B5CF6;">\x3c/i> คำสั่ง\x3c/div>
        <div class="feature-item"><i class='bx bx-note' style="color:#F59E0B;">\x3c/i> บันทึกข้อความ\x3c/div>
        <div class="feature-item"><i class='bx bx-megaphone' style="color:#EF4444;">\x3c/i> ประกาศ\x3c/div>
        <div class="feature-item"><i class='bx bx-file' style="color:#06B6D4;">\x3c/i> แบบฟอร์มเอกสาร\x3c/div>
      \x3c/div>

      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">กด "เพิ่มเอกสาร" หรือคลิกการ์ดประเภทเอกสาร\x3c/div>
          <div class="desc">การ์ดสีจะ filter ตารางให้เฉพาะประเภทที่กด\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">กรอกข้อมูล + แนบไฟล์\x3c/div>
          <div class="desc">เลขที่เอกสารสร้างอัตโนมัติ เช่น "คำสั่ง 001/2569"\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">3\x3c/div>
        <div class="text">
          <div class="title">เลือกสถานะ\x3c/div>
          <div class="desc">ร่าง = ยังแก้ไขได้ | ใช้งาน = เผยแพร่แล้ว | เก็บถาวร = ปิดแล้ว\x3c/div>
        \x3c/div>
      \x3c/div>
    `)}

    <!-- Approvals -->
    ${manSection('sec-approve','bxs-badge-check','#F59E0B','ระบบอนุมัติ',`
      <h3 style="font-size:15px; margin:0 0 10px; color:#0F172A;">สำหรับผู้ขอ (Staff / Teacher)\x3c/h3>
      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">กด "ส่งคำขออนุมัติ"\x3c/div>
          <div class="desc">เลือกประเภท: ใบลา / งบประมาณ / จัดซื้อ / ไปราชการ / อื่นๆ\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">กรอกเรื่อง + รายละเอียด + จำนวนเงิน (ถ้ามี)\x3c/div>
          <div class="desc">แนบไฟล์เพิ่มเติมได้ เช่น ใบเสนอราคา, ใบลา\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">3\x3c/div>
        <div class="text">
          <div class="title">รอผลการพิจารณา\x3c/div>
          <div class="desc">ดู tab "รอพิจารณา" เพื่อติดตาม — เมื่ออนุมัติ/ปฏิเสธ สถานะจะเปลี่ยน\x3c/div>
        \x3c/div>
      \x3c/div>

      <h3 style="font-size:15px; margin:16px 0 10px; color:#0F172A;">สำหรับผู้อนุมัติ (Admin)\x3c/h3>
      <div class="man-tip"><i class='bx bx-check-circle'>\x3c/i>
        กดไอคอน <i class='bx bx-check' style="color:#10B981;">\x3c/i> เพื่ออนุมัติ หรือ <i class='bx bx-x' style="color:#EF4444;">\x3c/i> เพื่อปฏิเสธ → ใส่ความเห็นได้
      \x3c/div>
      <div class="man-tip"><i class='bx bx-bell'>\x3c/i>
        จำนวนคำขอรออนุมัติแสดงเป็น Badge สีแดงที่เมนู "ระบบอนุมัติ" และไอคอน 🔔 บน Topbar
      \x3c/div>
    `)}

    <!-- Calendar -->
    ${manSection('sec-calendar','bxs-calendar-event','#06B6D4','ปฏิทินและข่าวสาร',`
      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">เลื่อนดูเดือน\x3c/div>
          <div class="desc">กด ‹ › เพื่อไปเดือนก่อน/ถัดไป | กด "วันนี้" เพื่อกลับมาวันปัจจุบัน\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">คลิกวันในปฏิทิน\x3c/div>
          <div class="desc">ถ้าไม่มีเหตุการณ์ → เปิดฟอร์มเพิ่มเหตุการณ์ในวันนั้น | ถ้ามี → แสดงรายละเอียด\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">3\x3c/div>
        <div class="text">
          <div class="title">เพิ่มเหตุการณ์\x3c/div>
          <div class="desc">กด "เพิ่มเหตุการณ์" → กรอกหัวข้อ, ประเภท, วันที่เริ่ม-สิ้นสุด, เวลา, สถานที่\x3c/div>
        \x3c/div>
      \x3c/div>

      <div class="man-tip"><i class='bx bx-pin'>\x3c/i>
        <b>ปักหมุดในหน้าหลัก:\x3c/b> ติ๊ก "ปักหมุดในหน้าหลัก" → เหตุการณ์จะแสดงใน Dashboard ส่วน "ประกาศล่าสุด"
      \x3c/div>

      <table class="man-table">
        <thead><tr><th>ประเภท\x3c/th><th>สี\x3c/th><th>ใช้สำหรับ\x3c/th>\x3c/tr>\x3c/thead>
        <tbody>
          <tr><td>วิชาการ\x3c/td><td><span style="color:#3B82F6;">■\x3c/span> น้ำเงิน\x3c/td><td>สอบ, ส่งงาน, กิจกรรมการเรียน\x3c/td>\x3c/tr>
          <tr><td>กิจกรรม\x3c/td><td><span style="color:#10B981;">■\x3c/span> เขียว\x3c/td><td>กีฬา, วันสำคัญ, กิจกรรมโรงเรียน\x3c/td>\x3c/tr>
          <tr><td>ประชุม\x3c/td><td><span style="color:#F59E0B;">■\x3c/span> ส้ม\x3c/td><td>ประชุมครู, ประชุมผู้ปกครอง\x3c/td>\x3c/tr>
          <tr><td>วันหยุด\x3c/td><td><span style="color:#EF4444;">■\x3c/span> แดง\x3c/td><td>วันหยุดนักขัตฤกษ์, วันหยุดโรงเรียน\x3c/td>\x3c/tr>
          <tr><td>ทั่วไป\x3c/td><td><span style="color:#64748B;">■\x3c/span> เทา\x3c/td><td>อื่นๆ\x3c/td>\x3c/tr>
        \x3c/tbody>
      \x3c/table>
    `)}

    <!-- Files -->
    ${manSection('sec-files','bxs-folder','#F59E0B','คลังไฟล์',`
      <div class="man-step">
        <div class="num">1\x3c/div>
        <div class="text">
          <div class="title">อัพโหลดไฟล์\x3c/div>
          <div class="desc">กด "อัพโหลดไฟล์" → เลือกได้หลายไฟล์พร้อมกัน → ระบบส่งทีละไฟล์พร้อม progress\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">2\x3c/div>
        <div class="text">
          <div class="title">Browse โฟลเดอร์\x3c/div>
          <div class="desc">กดการ์ดโฟลเดอร์เพื่อเข้าดูไฟล์ภายใน | กด Breadcrumb "คลังไฟล์" เพื่อกลับ root\x3c/div>
        \x3c/div>
      \x3c/div>
      <div class="man-step">
        <div class="num">3\x3c/div>
        <div class="text">
          <div class="title">จัดการไฟล์แต่ละไฟล์\x3c/div>
          <div class="desc">
            <i class='bx bx-show' style="color:#3B82F6;">\x3c/i> ดู (เปิดในแท็บใหม่) ·
            <i class='bx bx-download' style="color:#10B981;">\x3c/i> ดาวน์โหลด ·
            <i class='bx bx-trash' style="color:#EF4444;">\x3c/i> ลบ (Admin เท่านั้น)
          \x3c/div>
        \x3c/div>
      \x3c/div>

      <div class="man-tip"><i class='bx bx-folder'>\x3c/i>
        โฟลเดอร์สร้างอัตโนมัติตาม Category ที่อัพโหลด เช่น students, personnel, documents, signatures, logo
      \x3c/div>
      <div class="man-warn"><i class='bx bx-error'>\x3c/i>
        ไฟล์ขนาดสูงสุด 8MB ต่อไฟล์ | รูปภาพถูกบีบอัดอัตโนมัติก่อนส่ง | ไฟล์ถูกเก็บใน Google Drive ที่ตั้งค่าไว้
      \x3c/div>
    `)}

    <!-- Reports -->
    ${manSection('sec-reports','bxs-bar-chart-alt-2','#EF4444','รายงาน',`
      <p style="color:#475569; font-size:14px;">รายงาน 5 ประเภท พร้อมกรองข้อมูลได้:\x3c/p>
      <table class="man-table">
        <thead><tr><th>รายงาน\x3c/th><th>กรองได้\x3c/th><th>เนื้อหา\x3c/th>\x3c/tr>\x3c/thead>
        <tbody>
          <tr>
            <td>นักเรียนแยกตามชั้น\x3c/td>
            <td>ชั้นเรียน\x3c/td>
            <td>สรุปจำนวนชาย/หญิง หรือรายชื่อเต็ม\x3c/td>
          \x3c/tr>
          <tr>
            <td>สรุปการเข้าเรียน\x3c/td>
            <td>ชั้น + ช่วงวันที่\x3c/td>
            <td>มา/ขาด/ลา/มาสาย/% แต่ละคน\x3c/td>
          \x3c/tr>
          <tr>
            <td>สรุปการเงิน\x3c/td>
            <td>ช่วงวันที่\x3c/td>
            <td>รายการ + รายรับ/รายจ่าย/คงเหลือสุทธิ\x3c/td>
          \x3c/tr>
          <tr>
            <td>GPA นักเรียน\x3c/td>
            <td>ชั้น + ปีการศึกษา\x3c/td>
            <td>GPA ของนักเรียนแต่ละคน\x3c/td>
          \x3c/tr>
          <tr>
            <td>รายชื่อบุคลากร\x3c/td>
            <td>—\x3c/td>
            <td>ข้อมูลบุคลากรทั้งหมด\x3c/td>
          \x3c/tr>
        \x3c/tbody>
      \x3c/table>
      <div class="man-tip"><i class='bx bx-spreadsheet'>\x3c/i>
        ไฟล์ที่ดาวน์โหลดเป็น <b>.xls\x3c/b> (Excel) เปิดได้ด้วย Microsoft Excel, Google Sheets, LibreOffice
      \x3c/div>
    `)}

    <!-- Users -->
    ${manSection('sec-users','bxs-user-account','#8B5CF6','จัดการผู้ใช้งาน (Admin)',`
      <div class="man-warn"><i class='bx bx-lock'>\x3c/i>
        เมนูนี้มองเห็นเฉพาะ <b>Admin\x3c/b> เท่านั้น
      \x3c/div>

      <table class="man-table">
        <thead><tr><th>การดำเนินการ\x3c/th><th>วิธีทำ\x3c/th>\x3c/tr>\x3c/thead>
        <tbody>
          <tr><td>เพิ่มผู้ใช้ใหม่\x3c/td><td>กดปุ่ม "เพิ่มผู้ใช้" → กำหนด Username + รหัสผ่าน (≥ 6 ตัว) + บทบาท\x3c/td>\x3c/tr>
          <tr><td>แก้ไขผู้ใช้\x3c/td><td>กดไอคอน <i class='bx bx-edit' style="color:#3B82F6;">\x3c/i> → แก้ข้อมูล (เว้นรหัสผ่านว่างถ้าไม่ต้องการเปลี่ยน)\x3c/td>\x3c/tr>
          <tr><td>เปิด/ปิดบัญชี\x3c/td><td>กดที่ Badge สถานะ <b>เปิด/ปิด\x3c/b> ของผู้ใช้นั้นได้เลย\x3c/td>\x3c/tr>
          <tr><td>รีเซ็ตรหัสผ่าน\x3c/td><td>กดไอคอน <i class='bx bx-key' style="color:#F59E0B;">\x3c/i> → กรอกรหัสผ่านใหม่\x3c/td>\x3c/tr>
          <tr><td>ลบผู้ใช้\x3c/td><td>กดไอคอน <i class='bx bx-trash' style="color:#EF4444;">\x3c/i> (ไม่สามารถลบตัวเองหรือ Admin คนสุดท้ายได้)\x3c/td>\x3c/tr>
        \x3c/tbody>
      \x3c/table>
    `)}

    <!-- Settings -->
    ${manSection('sec-settings','bxs-cog','#64748B','ตั้งค่าระบบ (Admin)',`
      <div class="man-warn"><i class='bx bx-lock'>\x3c/i>
        เมนูนี้มองเห็นเฉพาะ <b>Admin\x3c/b> เท่านั้น
      \x3c/div>

      <table class="man-table">
        <thead><tr><th>หมวด\x3c/th><th>ตั้งค่า\x3c/th>\x3c/tr>\x3c/thead>
        <tbody>
          <tr>
            <td><b>ข้อมูลโรงเรียน\x3c/b>\x3c/td>
            <td>โลโก้, ชื่อ, ที่อยู่, อำเภอ, จังหวัด, โทร, อีเมล\x3c/td>
          \x3c/tr>
          <tr>
            <td><b>ปีการศึกษา\x3c/b>\x3c/td>
            <td>ปีการศึกษาปัจจุบัน, เทอม, % เข้าเรียนขั้นต่ำ, GPA ขั้นต่ำ, เกณฑ์ตัดเกรด\x3c/td>
          \x3c/tr>
          <tr>
            <td><b>Google Drive\x3c/b>\x3c/td>
            <td>Folder ID สำหรับเก็บไฟล์ (ถ้าว่างระบบสร้างโฟลเดอร์ใหม่ให้)\x3c/td>
          \x3c/tr>
          <tr>
            <td><b>ความปลอดภัย\x3c/b>\x3c/td>
            <td>Session timeout, โหมดบำรุงรักษา, การแจ้งเตือน\x3c/td>
          \x3c/tr>
        \x3c/tbody>
      \x3c/table>

      <div class="man-tip"><i class='bx bx-save'>\x3c/i>
        กด <b>"บันทึกการตั้งค่า"\x3c/b> มุมขวาบนทุกครั้งหลังแก้ไข — การตั้งค่ามีผลทันที ไม่ต้อง Deploy ใหม่
      \x3c/div>
    `)}

    <!-- FAQ -->
    ${manSection('sec-faq','bxs-help-circle','#EF4444','คำถามที่พบบ่อย (FAQ)',`
      ${faqItem('ลืมรหัสผ่าน Admin ทำอย่างไร?',
        'ให้ Admin คนอื่นรีเซ็ตผ่านเมนู "จัดการผู้ใช้งาน" → ไอคอนกุญแจ<br>หรือถ้าไม่มี Admin คนอื่น ให้เข้า Google Sheets → Sheet "Users" → แก้ไขฟิลด์ password ด้วย hashPassword() ใน Apps Script')}
      ${faqItem('ข้อมูลหายหลัง Deploy ใหม่ไหม?',
        'ไม่หาย ข้อมูลทั้งหมดเก็บใน Google Sheets ไม่ใช่ใน Script การ Deploy ใหม่เปลี่ยนแค่โค้ด HTML/GS เท่านั้น')}
      ${faqItem('อัพโหลดรูปแล้วไม่แสดง?',
        'ตรวจสอบว่าตั้งค่า Google Drive Folder ID ถูกต้องในหน้าตั้งค่าระบบ หรือให้ระบบสร้าง Folder ใหม่โดยปล่อยฟิลด์ว่างไว้')}
      ${faqItem('ปพ.5 / ใบเสร็จ Print แล้วหน้าเกิน?',
        'ก่อนกด Print → กด "More settings" → ปิด "Headers and footers" + ตั้ง Margins เป็น "None" หรือ "Minimum"')}
      ${faqItem('เพิ่มผู้ใช้แล้ว Login ไม่ได้?',
        'ตรวจสอบว่าบัญชีนั้น "เปิดใช้งาน" อยู่ (Badge สีเขียว) และรหัสผ่านตรงกัน อย่าลืมว่า Username ไม่คำนึงตัวพิมพ์เล็ก/ใหญ่')}
      ${faqItem('ระบบช้ามาก ทำอย่างไร?',
        'Google Apps Script มีข้อจำกัดเวลา 6 วินาทีต่อ request สำหรับบัญชีฟรี แนะนำให้แบ่งข้อมูลเป็นปีการศึกษา และใช้ filter ค้นหาแทนการโหลดทั้งหมด')}
      ${faqItem('ใช้บนมือถือได้ไหม?',
        'ได้ ระบบออกแบบ responsive รองรับทุกขนาดหน้าจอ Sidebar จะซ่อนและเปิดด้วยปุ่ม ☰ เมื่อหน้าจอเล็ก')}
      ${faqItem('สำรองข้อมูลอย่างไร?',
        'Google Sheets มี Version History อัตโนมัติ กด File → Version history → See version history เพื่อดูประวัติ หรือ Export Google Sheet เป็น .xlsx ทุกสัปดาห์')}
    `)}
  `;
}

function manSection(id, icon, color, title, body) {
  return `
    <div class="man-section" id="${id}">
      <div class="man-header" onclick="toggleManSection('${id}')">
        <div class="ic" style="background:${color}1A; color:${color};">
          <i class='bx ${icon}'>\x3c/i>
        \x3c/div>
        <h2>${title}\x3c/h2>
        <i class='bx bx-chevron-down chevron'>\x3c/i>
      \x3c/div>
      <div class="man-body">${body}\x3c/div>
    \x3c/div>
  `;
}

function faqItem(question, answer) {
  return `
    <div style="border:1px solid #E2E8F0; border-radius:10px; margin-bottom:10px; overflow:hidden;">
      <div style="padding:12px 16px; font-weight:600; color:#0F172A; background:#F8FAFC; font-size:14px;">
        <i class='bx bx-question-mark' style="color:#3B82F6; margin-right:6px;">\x3c/i>
        ${question}
      \x3c/div>
      <div style="padding:12px 16px; font-size:13px; color:#475569; line-height:1.7;">${answer}\x3c/div>
    \x3c/div>
  `;
}

function toggleManSection(id) {
  const section = document.getElementById(id);
  if (!section) return;
  const header = section.querySelector('.man-header');
  const body   = section.querySelector('.man-body');
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  header.classList.toggle('open', !isOpen);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // เปิด section
  const body   = el.querySelector('.man-body');
  const header = el.querySelector('.man-header');
  if (!body.classList.contains('open')) {
    body.classList.add('open');
    header.classList.add('open');
  }
  el.scrollIntoView({ behavior:'smooth', block:'start' });
}

function filterManual(q) {
  const keyword = q.toLowerCase().trim();
  document.querySelectorAll('.man-section').forEach(sec => {
    if (!keyword) {
      sec.classList.remove('man-hidden');
      return;
    }
    const text = sec.textContent.toLowerCase();
    sec.classList.toggle('man-hidden', !text.includes(keyword));
  });
}