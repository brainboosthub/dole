(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbzq9SWm2mEBe_gsusJKNEj7hlORO29BejRrOI7CoapwBj145UCyUBccmzdv4pzLAHlW/exec';
  const FALLBACK_PHOTO = 'https://static.wixstatic.com/media/a503e5_9064df4bf13044dab24382c889fa7d87~mv2.png';

  const $ = id => document.getElementById(id);

  function getStudent() {
    try {
      return JSON.parse(localStorage.getItem('LEARN_STUDENT') || 'null');
    } catch (_) {
      return null;
    }
  }
function getCartCount() {
  try {
    const cart = JSON.parse(
      localStorage.getItem('LEARN_CART') || '[]'
    );

    return Array.isArray(cart) ? cart.length : 0;
  } catch (_) {
    return 0;
  }
}
  function safePhoto(url) {
    const value = String(url || '').trim();
    return value || FALLBACK_PHOTO;
  }

  async function getTotalHours(studentId) {
    if (!studentId) return 0;

    const url = new URL(API_URL);
    url.searchParams.set('mode', 'learning');
    url.searchParams.set('action', 'getStudentTotalHours');
    url.searchParams.set('studentId', studentId);
    url.searchParams.set('_t', Date.now());

    const response = await fetch(url.toString(), { cache: 'no-store' });
    const result = await response.json();

    if (!response.ok || result?.success === false) {
      throw new Error(result?.message || 'โหลดชั่วโมงกิจกรรมไม่สำเร็จ');
    }

    const value = Object.prototype.hasOwnProperty.call(result, 'data')
      ? result.data
      : result;

    return Number(value) || 0;
  }

async function renderProfile(studentOverride) {
  const student =
    studentOverride === undefined
      ? getStudent()
      : studentOverride;

  const photo = $('profilePhoto');
  const name = $('profileName');
  const status = $('profileStatus');
  const hours = $('profileHours');
  const loginBtn = $('profileLoginBtn');
  const cartBtn = $('profileCartBtn');

  if (
    !photo ||
    !name ||
    !status ||
    !hours ||
    !loginBtn ||
    !cartBtn
  ) return;

  photo.onerror = () => {
    photo.onerror = null;
    photo.src = FALLBACK_PHOTO;
  };

  // แสดงจำนวนตะกร้า
  cartBtn.innerHTML =
    `<i class="fa fa-shopping-cart"></i> ${getCartCount()} ตะกร้า`;

  if (!student) {
    photo.src = FALLBACK_PHOTO;
    name.textContent = 'ยังไม่ได้เข้าสู่ระบบ';
    status.textContent = 'กรุณา Login เพื่อดูข้อมูลกิจกรรม';
    hours.textContent = '0';
    loginBtn.textContent = 'Login';
    return;
  }

  photo.src = safePhoto(student.photo);
  name.textContent = student.fullname || 'สมาชิก';
  status.textContent = student.phone
    ? `เบอร์โทร ${student.phone}`
    : 'สมาชิกเว็บไซต์ห้องสมุด';

  loginBtn.textContent = 'บัญชีผู้ใช้';
  hours.textContent = '...';

  try {
    hours.textContent = String(
      await getTotalHours(student.studentId)
    );
  } catch (error) {
    console.error('โหลดชั่วโมงใน Profile ไม่สำเร็จ:', error);
    hours.textContent = '0';
  }
}

  function openAccount() {
    if (window.LearningBase?.openStudentModal) {
      window.LearningBase.openStudentModal();
    }
  }

  function openCart() {
    if (window.LearningBase?.openCart) {
      window.LearningBase.openCart();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('profileLoginBtn')?.addEventListener('click', openAccount);
    $('profileCartBtn')?.addEventListener('click', openCart);
    renderProfile();
  });

  window.addEventListener('LEARN_AUTH_CHANGED', event => {
    renderProfile(event.detail?.student || null);
  });

  window.addEventListener('storage', event => {
    if (event.key === 'LEARN_STUDENT') renderProfile();
  });
})();
