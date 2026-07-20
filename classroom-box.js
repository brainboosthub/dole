(() => {
  'use strict';

  /* วาง URL /exec ของโปรเจกต์ Apps Script ห้องเรียนหลัง Deploy เวอร์ชันใหม่ */
  const CLASSROOM_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbysu0yLm0UuP0t5HN_PouiI2-C9OR9TD9XI31hKcdqLpfscWlAAumMEx6JcXukh3twGJg/exec';

  const frame = () => document.getElementById('classroomFrame');
  const message = () => document.getElementById('classroomMessage');

  function getSharedStudent() {
    try { return JSON.parse(localStorage.getItem('LEARN_STUDENT') || 'null'); }
    catch { return null; }
  }

  function isConfigured() {
    return /^https:\/\/script\.google\.com\/.*\/exec(?:\?|$)/.test(CLASSROOM_WEB_APP_URL);
  }

  function sendAuthToClassroom() {
    const target = frame()?.contentWindow;
    if (!target) return;
    const student = getSharedStudent();
    target.postMessage({
      type: 'SHARED_STUDENT_AUTH',
      student: student ? {
        studentId: student.studentId || student.id || '',
        fullname: student.fullname || student.name || '',
        phone: student.phone || ''
      } : null
    }, '*');
  }

  function loadClassroom() {
    const iframe = frame();
    const msg = message();
    if (!iframe || !msg) return;

    if (!isConfigured()) {
      msg.classList.add('is-error');
      msg.innerHTML = 'ยังไม่ได้กำหนด URL ห้องเรียน<br>เปิดไฟล์ <b>classroom-box.js</b> แล้ววาง URL /exec ที่ CLASSROOM_WEB_APP_URL';
      iframe.removeAttribute('src');
      return;
    }

    msg.classList.remove('is-error');
    msg.textContent = 'กำลังเชื่อมต่อระบบห้องเรียน...';
    const separator = CLASSROOM_WEB_APP_URL.includes('?') ? '&' : '?';
    iframe.src = CLASSROOM_WEB_APP_URL + separator + 'embed=1&_t=' + Date.now();
  }

  window.addEventListener('message', event => {
    const data = event.data || {};
    if (data.type === 'CLASSROOM_READY') {
      message()?.setAttribute('hidden', '');
      sendAuthToClassroom();
    }
    if (data.type === 'OPEN_SHARED_LOGIN') {
      if (window.LearningBase?.openStudentModal) window.LearningBase.openStudentModal();
    }
    if (data.type === 'CLASSROOM_HEIGHT') {
      const height = Math.max(650, Number(data.height) || 900);
      if (frame()) frame().style.height = Math.ceil(height + 8) + 'px';
    }
    if (data.type === 'CLASSROOM_SCORE') {
      const badge = document.getElementById('studentScoreBadge');
      if (!badge) return;
      if (!data.score || !getSharedStudent()) {
        badge.hidden = true;
        badge.textContent = 'คะแนนรวม 0/0';
        return;
      }
      badge.textContent = `คะแนนรวม ${data.score.totalScore}/${data.score.totalFull} (${data.score.percent}%)`;
      badge.hidden = false;
    }
  });

  window.addEventListener('LEARN_AUTH_CHANGED', sendAuthToClassroom);
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('classroomRefreshBtn')?.addEventListener('click', loadClassroom);
    frame()?.addEventListener('load', () => setTimeout(sendAuthToClassroom, 250));
    loadClassroom();
  });
})();
