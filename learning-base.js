console.log(
  'learning-base.js VERSION 2026-07-18-05'
);

const LEARNING_API_URL =
  'https://script.google.com/macros/s/AKfycbzvVPllEQ0MSBDokzrav34yJ5IcTiqcVo2mALWNgwFBTlYdrWrr-S47UD4zz_k-b4yVBQ/exec';

let LEARNING_STUDENT = JSON.parse(
  localStorage.getItem('LEARN_STUDENT') || 'null'
);

let LEARNING_ACTIVITIES = [];

async function learningApi(mode, data = {}) {
  const url = new URL(LEARNING_API_URL);

  url.searchParams.set('mode', mode);
  url.searchParams.set('data', JSON.stringify(data));
  url.searchParams.set('_', Date.now().toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();

  if (
    result &&
    result.success === false
  ) {
    throw new Error(result.message || 'เกิดข้อผิดพลาด');
  }

  return result;
}

async function loadLearningActivities() {
  const grid = document.getElementById('activityGrid');
  const loading = document.getElementById('learningLoading');

  if (!grid) {
    console.error('ไม่พบ #activityGrid');
    return;
  }

  if (loading) {
    loading.style.display = 'block';
    loading.textContent = 'กำลังโหลดกิจกรรม...';
  }

  try {
    const result = await learningApi(
      'learningActivities'
    );
console.log('API URL ที่เรียก:', LEARNING_API_URL);
console.log('ผล API ล่าสุด:', result);
console.log(
  'กิจกรรมรายการแรก:',
  result.activities?.[0]
);
    LEARNING_ACTIVITIES =
      Array.isArray(result.activities)
        ? result.activities
        : [];

    renderLearningBaseFilter(
      LEARNING_ACTIVITIES
    );

    renderLearningActivities(
      LEARNING_ACTIVITIES
    );

    if (loading) {
      loading.style.display = 'none';
    }

  } catch (error) {
    console.error(
      'โหลดกิจกรรมไม่สำเร็จ:',
      error
    );

    grid.innerHTML = '';

    if (loading) {
      loading.style.display = 'block';
      loading.textContent =
        'โหลดกิจกรรมไม่สำเร็จ: ' +
        error.message;
    }
  }
}
function renderLearningActivities(list) {
  const grid = document.getElementById('activityGrid');

  if (!grid) return;

  if (!Array.isArray(list) || list.length === 0) {
    grid.innerHTML =
      '<div class="learning-message">ยังไม่มีกิจกรรม</div>';
    return;
  }

  const fallbackImage =
    'https://placehold.co/600x400?text=Learning+Base';

  grid.innerHTML = list.map(function (activity) {
    const image = String(
      activity.image1 || fallbackImage
    ).trim();

    const teacher =
      activity.teacherName ||
      activity.teacherId ||
      '-';

    return `
      <article class="learning-card">

        <img
          class="learning-card-image"
          src="${escapeLearningAttr(image)}"
          alt="${escapeLearningAttr(
            activity.title || 'กิจกรรม'
          )}"
          loading="lazy"
          referrerpolicy="no-referrer"
          onerror="
            this.onerror=null;
            this.src='${fallbackImage}';
          "
        >

        <div class="learning-card-body">

          <span class="learning-tag">
            ${escapeLearningHtml(
              activity.baseNo || '-'
            )}
          </span>

          <div class="learning-title">
            ${escapeLearningHtml(
              activity.title || '-'
            )}
          </div>

          <div class="learning-muted">
            จำนวน ${getLearningHours(activity)} ชั่วโมง
          </div>

          ${
            activity.learningType
              ? `
                <div class="learning-muted">
                  รูปแบบ:
                  ${escapeLearningHtml(
                    activity.learningType
                  )}
                </div>
              `
              : ''
          }

          <div class="learning-muted">
            วันที่:
            ${formatLearningThaiDate(
              activity.activityDate
            )}
          </div>

          <div class="learning-muted">
            ครูฐาน:
            ${escapeLearningHtml(teacher)}
          </div>

          <p class="learning-muted learning-detail">
            ${escapeLearningHtml(
              activity.detail || ''
            )}
          </p>

          <div class="learning-card-actions">
<button
  type="button"
  onclick="addLearningToCart(
    '${escapeLearningAttr(activity.activityId)}'
  )">
  ใส่ตะกร้า
</button>

            <button
              type="button"
              onclick="openLearningActivityDetail(
                '${escapeLearningAttr(
                  activity.activityId
                )}'
              )">
              ดูรายละเอียด
            </button>
          </div>

        </div>
      </article>
    `;
  }).join('');
}

function renderLearningBaseFilter(list) {
  const select = document.getElementById('baseFilter');

  if (!select) return;

  const bases = [
    ...new Set(
      list
        .map(item => String(item.baseNo || '').trim())
        .filter(Boolean)
    )
  ].sort();

  select.innerHTML =
    '<option value="">ทุกฐานการเรียนรู้</option>' +
    bases.map(base => `
      <option value="${escapeLearningAttr(base)}">
        ${escapeLearningHtml(base)}
      </option>
    `).join('');
}

function filterActivities() {
  const select = document.getElementById('baseFilter');
  const selected = select ? select.value : '';

  if (!selected) {
    renderLearningActivities(LEARNING_ACTIVITIES);
    return;
  }

  const filtered = LEARNING_ACTIVITIES.filter(item =>
    String(item.baseNo || '').trim() === selected
  );

  renderLearningActivities(filtered);
}

function getLearningHours(activity) {
  return Number(
    activity.hours ||
    activity['ชั่วโมง'] ||
    activity.hour ||
    0
  );
}

function formatLearningThaiDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeLearningHtml(String(value));
  }

  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function openStudentModal() {
  const modal = document.getElementById('studentModal');
  const logout = document.getElementById('studentLogoutBtn');

  if (!modal) return;

  modal.style.display = 'flex';

  if (logout) {
    logout.classList.toggle(
      'learning-hidden',
      !LEARNING_STUDENT
    );
  }
}

function toggleStudentRegister() {
  const box = document.getElementById('studentRegisterBox');

  if (box) {
    box.classList.toggle('learning-hidden');
  }
}

function closeLearningModal(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.style.display = 'none';
  }
}

function requireLearningStudent() {
  if (LEARNING_STUDENT) return true;

  Swal.fire(
    'กรุณาเข้าสู่ระบบ',
    'กรุณา Login ก่อนเลือกกิจกรรม',
    'warning'
  );

  openStudentModal();
  return false;
}

async function studentLogin() {
  const phone = document
    .getElementById('loginPhone')
    .value.trim();

  if (!/^0\d{9}$/.test(phone)) {
    return Swal.fire(
      'แจ้งเตือน',
      'กรุณากรอกเบอร์โทร 10 หลัก',
      'warning'
    );
  }

  try {
    Swal.showLoading();

    const result = await learningApi('studentLogin', {
      phone
    });

    Swal.close();

    if (!result.ok) {
      return Swal.fire(
        'แจ้งเตือน',
        result.message,
        'warning'
      );
    }

    LEARNING_STUDENT = result.student;

    localStorage.setItem(
      'LEARN_STUDENT',
      JSON.stringify(LEARNING_STUDENT)
    );

    updateLearningTop();
    closeLearningModal('studentModal');

    Swal.fire('สำเร็จ', result.message, 'success');

  } catch (error) {
    Swal.close();
    Swal.fire('ผิดพลาด', error.message, 'error');
  }
}

async function registerStudent() {
  const fullname = document
    .getElementById('stuFullname')
    .value.trim();

  const phone = document
    .getElementById('stuPhone')
    .value.trim();

  const address = document
    .getElementById('stuAddress')
    .value.trim();

  if (!fullname || !phone || !address) {
    return Swal.fire(
      'แจ้งเตือน',
      'กรุณากรอกข้อมูลให้ครบ',
      'warning'
    );
  }

  try {
    Swal.showLoading();

    const result = await learningApi('registerStudent', {
      fullname,
      phone,
      address
    });

    Swal.close();

    Swal.fire(
      result.ok ? 'สำเร็จ' : 'แจ้งเตือน',
      result.message,
      result.ok ? 'success' : 'warning'
    );

  } catch (error) {
    Swal.close();
    Swal.fire('ผิดพลาด', error.message, 'error');
  }
}

function studentLogout() {
  LEARNING_STUDENT = null;
  localStorage.removeItem('LEARN_STUDENT');

  updateLearningTop();
  closeLearningModal('studentModal');

  Swal.fire('สำเร็จ', 'ออกจากระบบแล้ว', 'success');
}

async function addLearningToCart(activityId) {
  if (!requireLearningStudent()) return;

  try {
    Swal.showLoading();

    const result = await learningApi('addToCart', {
      studentId: LEARNING_STUDENT.studentId,
      activityId
    });

    Swal.close();

    Swal.fire(
      result.ok ? 'สำเร็จ' : 'แจ้งเตือน',
      result.message,
      result.ok ? 'success' : 'warning'
    );

    if (result.ok) {
      loadLearningCartCount();
    }

  } catch (error) {
    Swal.close();
    Swal.fire('ผิดพลาด', error.message, 'error');
  }
}

function openLearningActivityDetail(activityId) {
  const activity = LEARNING_ACTIVITIES.find(
    item => item.activityId === activityId
  );

  if (!activity) return;

  const images = [
    activity.image1,
    activity.image2,
    activity.image3
  ].filter(Boolean);

  const content = document.getElementById('detailContent');

  content.innerHTML = `
    ${
      images.length
        ? `
          <img
            src="${escapeLearningAttr(images[0])}"
            alt="${escapeLearningAttr(activity.title || '')}"
            style="
              width:100%;
              max-height:420px;
              object-fit:cover;
              border-radius:16px;
            "
          >
        `
        : ''
    }

    <h2>${escapeLearningHtml(activity.title || '-')}</h2>

    <p>
      <strong>ฐาน:</strong>
      ${escapeLearningHtml(activity.baseNo || '-')}
    </p>

    <p>
      <strong>จำนวนชั่วโมง:</strong>
      ${getLearningHours(activity)}
    </p>

    <p>
      <strong>รายละเอียด:</strong><br>
      ${escapeLearningHtml(activity.detail || '-')}
    </p>
  `;

  const button = document.getElementById('detailAddCartBtn');

  button.onclick = function () {
    addLearningToCart(activityId);
  };

  document.getElementById('detailModal').style.display = 'flex';
}

async function openCart() {
  if (!requireLearningStudent()) return;

  const modal = document.getElementById('cartModal');
  const listBox = document.getElementById('cartList');

  modal.style.display = 'flex';
  listBox.innerHTML = 'กำลังโหลด...';

  try {
    const result = await learningApi('getMyCart', {
      studentId: LEARNING_STUDENT.studentId
    });

    const list = Array.isArray(result.items)
      ? result.items
      : [];

    if (!list.length) {
      listBox.innerHTML =
        '<div class="learning-message">ยังไม่มีกิจกรรมในตะกร้า</div>';
      return;
    }

    listBox.innerHTML = list.map(item => `
      <div class="learning-card-body">
        <strong>
          ${escapeLearningHtml(item.activity?.title || '-')}
        </strong>

        <div class="learning-muted">
          ${getLearningHours(item.activity || {})} ชั่วโมง
        </div>
      </div>
    `).join('');

  } catch (error) {
    listBox.innerHTML =
      `<div class="learning-message">${escapeLearningHtml(error.message)}</div>`;
  }
}

async function loadLearningCartCount() {
  const count = document.getElementById('cartCount');

  if (!count) return;

  if (!LEARNING_STUDENT) {
    count.textContent = '0';
    return;
  }

  try {
    const result = await learningApi('getMyCart', {
      studentId: LEARNING_STUDENT.studentId
    });

    count.textContent = Array.isArray(result.items)
      ? String(result.items.length)
      : '0';

  } catch {
    count.textContent = '0';
  }
}

function openScoreModal() {
  if (!LEARNING_STUDENT) {
    return Swal.fire(
      'แจ้งเตือน',
      'กรุณา Login ก่อนดูชั่วโมงสะสม',
      'warning'
    );
  }

  Swal.fire(
    'ชั่วโมงสะสม',
    'ส่วน API ชั่วโมงสะสมจะเชื่อมต่อในขั้นถัดไป',
    'info'
  );
}

function openTeacherPage() {
  window.open(
    `${LEARNING_API_URL}?page=teacher`,
    '_blank',
    'noopener'
  );
}

function updateLearningTop() {
  const account = document.getElementById('accountBtn');

  if (account) {
    account.textContent = LEARNING_STUDENT
      ? `👤 ${LEARNING_STUDENT.fullname}`
      : 'Login';
  }

  loadLearningCartCount();
}

function escapeLearningHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeLearningAttr(value) {
  return escapeLearningHtml(value);
}

document.addEventListener('DOMContentLoaded', async function () {
  console.log('เริ่มระบบฐานการเรียนรู้');

  const loading = document.getElementById('learningLoading');

  try {
    updateLearningTop();
    await loadLearningActivities();
  } catch (error) {
    console.error('เริ่มระบบฐานการเรียนรู้ไม่สำเร็จ:', error);

    if (loading) {
      loading.style.display = 'block';
      loading.textContent =
        'เกิดข้อผิดพลาดในการเริ่มระบบ: ' + error.message;
    }
  }
});
