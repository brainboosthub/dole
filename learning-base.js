
(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbzq9SWm2mEBe_gsusJKNEj7hlORO29BejRrOI7CoapwBj145UCyUBccmzdv4pzLAHlW/exec';
  const TEACHER_URL = API_URL + '?page=teacher';
  let student = JSON.parse(localStorage.getItem('LEARN_STUDENT') || 'null');
  let activities = [];
  let detailSlideIndex = 0;
  let detailSlideTimer = null;

  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');

  async function callApi(action, data = {}, method = 'POST') {
    let response;
    if (method === 'GET') {
      const url = new URL(API_URL);
      url.searchParams.set('mode', 'learning');
      url.searchParams.set('action', action);
      Object.entries(data).forEach(([key, value]) => url.searchParams.set(key, value ?? ''));
      response = await fetch(url.toString(), { cache: 'no-store' });
    } else {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ mode: 'learning', action, data })
      });
    }
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); }
    catch { throw new Error('API ส่งข้อมูลกลับมาไม่ใช่ JSON'); }
    if (!response.ok || result?.success === false) throw new Error(result?.message || `HTTP ${response.status}`);
    return Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : result;
  }

  function showPage(id, btn) {
    const root = $('learningBaseModule');
    if (!root) return;
    root.querySelectorAll(':scope > .learning-container > section').forEach(s => s.classList.add('learning-hidden'));
    $(id)?.classList.remove('learning-hidden');
    root.querySelectorAll('.learning-tabs button').forEach(b => b.classList.remove('active'));
    btn?.classList.add('active');
    if (id === 'historyPage') loadHistory();
  }

  function openStudentModal() {
    $('studentModal').style.display = 'flex';
    $('registerBox').style.display = 'none';
    const newBtn = $('newRegisterBtn');
    const logoutBox = $('logoutBox');
    if (student) {
      $('loginPhone').value = student.phone || '';
      logoutBox.style.display = 'block';
      if (newBtn) newBtn.style.display = 'none';
    } else {
      $('loginPhone').value = '';
      logoutBox.style.display = 'none';
      if (newBtn) newBtn.style.display = 'inline-block';
    }
  }

  function closeModal(id) {
    const modal = $(id);
    if (modal) modal.style.display = 'none';
    if (id === 'detailModal') clearInterval(detailSlideTimer);
  }

  function updateTop() {
    const accountBtn = $('accountBtn');
    if (student) accountBtn.textContent = `👤 ${student.fullname}`;
    else accountBtn.textContent = 'Login';
    loadMyTotalHours();
    loadCartCount();
  }

  async function registerStudent() {
    const data = {
      fullname: $('stuFullname').value.trim(),
      phone: $('stuPhone').value.trim(),
      address: $('stuAddress').value.trim()
    };
    if (!data.fullname || !data.phone || !data.address)
      return Swal.fire('แจ้งเตือน','กรุณากรอก ชื่อ-นามสกุล เบอร์โทร และที่อยู่ ให้ครบ','warning');
    if (!/^0\d{9}$/.test(data.phone))
      return Swal.fire('แจ้งเตือน','เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 10 หลัก','warning');
    try {
      Swal.showLoading();
      const res = await callApi('registerStudent', data);
      Swal.close();
      await Swal.fire(res.ok ? 'สำเร็จ':'แจ้งเตือน',res.message,res.ok?'success':'warning');
      if (res.ok && res.student) {
        student = res.student;
        localStorage.setItem('LEARN_STUDENT', JSON.stringify(student));
        closeModal('studentModal'); updateTop();
      }
    } catch(err) { Swal.close(); Swal.fire('ผิดพลาด',err.message,'error'); }
  }

  async function studentLogin() {
    try {
      Swal.showLoading();
      const res = await callApi('studentLogin', { phone: $('loginPhone').value.trim() });
      Swal.close();
      if (!res.ok) return Swal.fire('แจ้งเตือน',res.message,'warning');
      student = res.student;
      localStorage.setItem('LEARN_STUDENT',JSON.stringify(student));
      closeModal('studentModal'); updateTop();
      Swal.fire('สำเร็จ',res.message,'success');
    } catch(err) { Swal.close(); Swal.fire('ผิดพลาด',err.message,'error'); }
  }

  async function loadActivities() {
    const grid = $('activityGrid');
    if (!grid) return;
    grid.innerHTML='กำลังโหลด...';
    try {
      activities = await callApi('getActivities', {}, 'GET') || [];
      renderBaseFilter(activities); renderActivities(activities);
    } catch(err) { grid.innerHTML=`<div class="learning-list-item">โหลดกิจกรรมไม่สำเร็จ: ${escapeHtml(err.message)}</div>`; }
  }

  function renderActivities(list) {
    const grid=$('activityGrid');
    if (!list.length) return grid.innerHTML='<div class="learning-list-item">ยังไม่มีกิจกรรม</div>';
    grid.innerHTML=list.map(a=>`
      <article class="learning-card">
        <img src="${escapeHtml(a.image1 || 'https://placehold.co/600x400?text=Learning+Base')}" alt="${escapeHtml(a.title || 'กิจกรรมฐานการเรียนรู้')}" loading="lazy">
        <div class="learning-card-body">
          <span class="learning-tag">${escapeHtml(a.baseNo || '-')}</span>
          <div class="learning-title">${escapeHtml(a.title || '-')}</div>
          <div class="learning-muted">ชั่วโมง: ${getActivityHours(a)} ชั่วโมง</div>
          ${a.learningType ? `<div class="learning-muted">รูปแบบ: ${escapeHtml(a.learningType)}</div>`:''}
          <div class="learning-muted">วันที่: ${formatThaiDate(a.activityDate)}</div>
          <div class="learning-muted">ครูฐาน: ${escapeHtml(a.teacherName || '-')}</div>
          <p class="learning-muted">${escapeHtml(a.detail || '')}</p>
          <div class="learning-actions">
            <button type="button" onclick="LearningBase.addToCart('${escapeHtml(a.activityId)}')">ใส่ตะกร้า</button>
            <button type="button" class="btn-green" onclick="LearningBase.openActivityDetail('${escapeHtml(a.activityId)}')">ดูรายละเอียด</button>
          </div>
        </div>
      </article>`).join('');
  }

  function requireStudent() {
    if (student) return true;
    Swal.fire('กรุณายืนยันตัวตน','กดปุ่ม Login ก่อนเลือกกิจกรรม','warning');
    openStudentModal(); return false;
  }

  async function addToCart(activityId) {
    if (!requireStudent()) return;
    try {
      Swal.showLoading();
      const res=await callApi('addToCart',{studentId:student.studentId,activityId});
      Swal.close(); Swal.fire(res.ok?'สำเร็จ':'แจ้งเตือน',res.message,res.ok?'success':'warning');
      loadCartCount();
    } catch(err) { Swal.close(); Swal.fire('ผิดพลาด',err.message,'error'); }
  }

async function openCart() {
  if (!requireStudent()) return;

  const cartModal = $('cartModal');
  const cartList = $('cartList');

  if (!cartModal || !cartList) return;

  cartModal.style.display = 'flex';
  cartList.innerHTML = 'กำลังโหลด...';

  try {
    const list = await callApi(
      'getMyCart',
      {
        studentId: student.studentId
      },
      'GET'
    ) || [];

    if (!list.length) {
      cartList.innerHTML = `
        <div class="learning-list-item">
          ยังไม่มีกิจกรรมในตะกร้า
        </div>
      `;
      return;
    }

    const totalHours = list.reduce((sum, cart) => {
      return sum + getActivityHours(cart.activity);
    }, 0);

    cartList.innerHTML = `
      <div class="learning-cart-summary">
        <b>รวมทั้งหมด ${totalHours} ชั่วโมง</b>
      </div>
    ` + list.map(cart => {
      const activity = cart.activity || {};

      const imageUrl =
        String(activity.image1 || '').trim() ||
        'https://placehold.co/300x200?text=Activity';

      return `
        <div class="learning-cart-item">

          <div class="learning-cart-info">

            <div class="learning-cart-title">
              ${escapeHtml(activity.title || '-')}
            </div>

            <div class="learning-muted">
              ฐาน: ${escapeHtml(activity.baseNo || '-')}
            </div>

            <div class="learning-muted">
              ชั่วโมง: ${getActivityHours(activity)} ชั่วโมง
            </div>

            <div class="learning-muted">
              วันที่ ${formatThaiDate(activity.activityDate)}
            </div>

            <div class="learning-cart-actions">

              <button
                type="button"
                class="btn-green learning-confirm-btn"
                onclick="LearningBase.confirmJoin(
                  '${escapeHtml(cart.activityId)}'
                )">
                ยืนยันเข้าร่วม
              </button>

              <button
                type="button"
                class="btn-red learning-delete-btn"
                onclick="LearningBase.cancelCartItem(
                  '${escapeHtml(cart.cartId)}'
                )">
                ลบ
              </button>

            </div>
          </div>

          <img
            class="learning-cart-image"
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(activity.title || 'รูปกิจกรรม')}"
            loading="lazy"
            onerror="
              this.onerror=null;
              this.src='https://placehold.co/300x200?text=Activity';
            ">

        </div>
      `;
    }).join('');

  } catch (error) {
    cartList.innerHTML = `
      <div class="learning-list-item">
        โหลดข้อมูลตะกร้าไม่สำเร็จ:
        ${escapeHtml(error.message)}
      </div>
    `;
  }
}

  async function loadCartCount() {
    if (!student) { $('cartCount').textContent='0'; return; }
    try { const list=await callApi('getMyCart',{studentId:student.studentId},'GET'); $('cartCount').textContent=(list||[]).length; }
    catch { $('cartCount').textContent='0'; }
  }

  async function confirmJoin(activityId) {
    if (!requireStudent()) return;
    try {
      Swal.showLoading(); const res=await callApi('confirmJoin',{studentId:student.studentId,activityId});
      Swal.close(); await Swal.fire(res.ok?'สำเร็จ':'แจ้งเตือน',res.message,res.ok?'success':'warning');
      loadCartCount(); if ($('cartModal').style.display==='flex') openCart();
    } catch(err) { Swal.close(); Swal.fire('ผิดพลาด',err.message,'error'); }
  }

  async function loadHistory() {
    if (!requireStudent()) return;
    $('historyList').innerHTML='กำลังโหลด...';
    try {
      const list=await callApi('getMyHistory',{studentId:student.studentId},'GET')||[];
      $('historyList').innerHTML=list.length?list.map(h=>`<div class="learning-list-item"><b>${escapeHtml(h.activity?.title||'-')}</b><br><span class="learning-muted">ฐาน ${escapeHtml(h.activity?.baseNo||'-')} | วันที่ ${formatThaiDate(h.activity?.activityDate)}</span><br><span class="learning-tag">ยืนยันแล้ว</span></div>`).join(''):'<div class="learning-list-item">ยังไม่มีประวัติการยืนยันกิจกรรม</div>';
    } catch(err) { $('historyList').innerHTML=`<div class="learning-list-item">${escapeHtml(err.message)}</div>`; }
  }

  async function cancelCartItem(cartId) {
    const result=await Swal.fire({title:'ยืนยันการยกเลิก?',text:'ต้องการลบกิจกรรมนี้ออกจากตะกร้าหรือไม่',icon:'warning',showCancelButton:true,confirmButtonText:'ใช่, ยกเลิก',cancelButtonText:'ไม่'});
    if (!result.isConfirmed) return;
    try { Swal.showLoading(); const res=await callApi('cancelCart',{cartId}); Swal.close(); await Swal.fire(res.ok?'สำเร็จ':'แจ้งเตือน',res.message,res.ok?'success':'warning'); openCart(); loadCartCount(); }
    catch(err) { Swal.close(); Swal.fire('ผิดพลาด',err.message,'error'); }
  }

  function showRegisterBox() { $('registerBox').style.display='block'; $('newRegisterBtn').style.display='none'; }

  function openActivityDetail(activityId) {
    const a=activities.find(x=>x.activityId===activityId);
    if(!a) return Swal.fire('แจ้งเตือน','ไม่พบข้อมูลกิจกรรม','warning');
    const images=[a.image1,a.image2,a.image3].filter(Boolean);
    const slider=images.length?`<div class="detail-slider">${images.map((img,i)=>`<div class="detail-slide ${i===0?'active':''}"><img src="${escapeHtml(img)}" alt=""></div>`).join('')}</div><div class="detail-dots">${images.map((_,i)=>`<span class="detail-dot ${i===0?'active':''}"></span>`).join('')}</div>`:'';
    $('detailContent').innerHTML=`${slider}<div class="detail-info"><h2>${escapeHtml(a.title||'-')}</h2><div class="line"><b>รูปแบบการเรียนรู้:</b> ${escapeHtml(a.learningType||'-')}</div><div class="line"><b>รายละเอียด:</b><br>${escapeHtml(a.detail||'-')}</div><div class="line"><b>วันที่จัดกิจกรรม:</b> ${formatThaiDate(a.activityDate)}</div></div>`;
    $('detailAddCartBtn').onclick=()=>addToCart(activityId); $('detailModal').style.display='flex'; startDetailSlider();
  }

  function startDetailSlider() {
    clearInterval(detailSlideTimer); detailSlideIndex=0;
    const slides=document.querySelectorAll('#detailModal .detail-slide'),dots=document.querySelectorAll('#detailModal .detail-dot');
    if(slides.length<=1)return;
    detailSlideTimer=setInterval(()=>{slides[detailSlideIndex].classList.remove('active');dots[detailSlideIndex]?.classList.remove('active');detailSlideIndex=(detailSlideIndex+1)%slides.length;slides[detailSlideIndex].classList.add('active');dots[detailSlideIndex]?.classList.add('active');},2500);
  }

  function renderBaseFilter(list) {
    const bases=[...new Set(list.map(a=>String(a.baseNo||'').trim()).filter(Boolean))].sort();
    $('baseFilter').innerHTML='<option value="">ทุกฐานการเรียนรู้</option>'+bases.map(b=>`<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
  }
  function filterActivities() { const v=$('baseFilter').value; renderActivities(v?activities.filter(a=>String(a.baseNo||'').trim()===v):activities); }
  function getActivityHours(a) { return Number(a?.hours||a?.['ชั่วโมง']||a?.hour||0); }
  function formatThaiDate(value) { if(!value)return'-';const d=new Date(value);if(isNaN(d))return escapeHtml(value);return d.toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'}); }

  async function loadMyTotalHours() {
    if(!student){ $('scoreBtn').textContent='รวม 0 ชั่วโมง';return; }
    try{const total=await callApi('getStudentTotalHours',{studentId:student.studentId},'GET');$('scoreBtn').textContent=`รวม ${total||0} ชั่วโมง`;}catch{$('scoreBtn').textContent='รวม 0 ชั่วโมง';}
  }

  async function openScoreModal() {
    if(!requireStudent())return;
    try{Swal.showLoading();const res=await callApi('getMyScoreDetail',{studentId:student.studentId},'GET');Swal.close();const list=res.list||[],total=res.total||0;if(!list.length)return Swal.fire('ชั่วโมงสะสม','ยังไม่มีรายการชั่วโมงที่ได้รับ','info');const html=`<div style="text-align:left"><h3>รวมทั้งหมด ${total} ชั่วโมง</h3><table style="width:100%;border-collapse:collapse"><tbody>${list.map(x=>`<tr><td style="padding:8px;border:1px solid #ddd">${escapeHtml(x.title)}</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(x.baseNo)}</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(x.actualHours)}</td></tr>`).join('')}</tbody></table></div>`;Swal.fire({title:'รายการชั่วโมงที่ได้รับ',html,width:800,confirmButtonText:'ปิด'});}catch(err){Swal.close();Swal.fire('ผิดพลาด',err.message,'error');}
  }

  function closeStudentModal() {
    Swal.fire({title:'ออกจากระบบ?',icon:'warning',showCancelButton:true,confirmButtonText:'ออกจากระบบ',cancelButtonText:'ยกเลิก'}).then(r=>{if(!r.isConfirmed)return;student=null;localStorage.removeItem('LEARN_STUDENT');closeModal('studentModal');updateTop();showPage('activitiesPage',$('learningBaseModule').querySelector('.learning-tabs button'));});
  }

  window.LearningBase={showPage,openStudentModal,closeModal,registerStudent,studentLogin,loadActivities,addToCart,openCart,confirmJoin,loadHistory,cancelCartItem,showRegisterBox,openActivityDetail,filterActivities,openScoreModal,closeStudentModal};

  document.addEventListener('DOMContentLoaded',()=>{
    const teacherLink=$('teacherPageLink'); if(teacherLink) teacherLink.href=TEACHER_URL;
    updateTop(); loadActivities();
  });
})();
