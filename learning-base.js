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
  url.searchParams.set(
    'data',
    JSON.stringify(data || {})
  );

  url.searchParams.set(
    '_',
    Date.now().toString()
  );

  const response = await fetch(
    url.toString(),
    {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow'
    }
  );

  if (!response.ok) {
    throw new Error(
      `เชื่อมต่อระบบไม่สำเร็จ HTTP ${response.status}`
    );
  }

  const responseText = await response.text();

  let result;

  try {
    result = JSON.parse(responseText);

  } catch (error) {
    console.error(
      'ข้อมูลที่ได้รับไม่ใช่ JSON:',
      responseText
    );

    throw new Error(
      'Apps Script ส่งข้อมูลกลับมาไม่ถูกต้อง'
    );
  }

  if (!result || typeof result !== 'object') {
    throw new Error(
      'ไม่ได้รับข้อมูลจาก Apps Script'
    );
  }

  /*
   * success:false หมายถึง doGet หรือระบบหลังบ้าน
   * เกิดข้อผิดพลาดจริง
   */
  if (result.success === false) {
    throw new Error(
      result.message ||
      'ระบบหลังบ้านเกิดข้อผิดพลาด'
    );
  }

  /*
   * ไม่โยน Error เมื่อ ok:false
   * ให้แต่ละฟังก์ชันนำไปแสดงเป็นข้อความแจ้งเตือน
   */
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
  const input =
    document.getElementById('loginPhone');

  const phone = String(
    input ? input.value : ''
  )
    .replace(/\D/g, '')
    .trim();

  if (!/^0\d{9}$/.test(phone)) {
    return Swal.fire(
      'แจ้งเตือน',
      'กรุณากรอกเบอร์โทร 10 หลัก โดยขึ้นต้นด้วย 0',
      'warning'
    );
  }

  try {
    Swal.fire({
      title: 'กำลังเข้าสู่ระบบ...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: function () {
        Swal.showLoading();
      }
    });

    const result = await learningApi(
      'studentLogin',
      { phone: phone }
    );

    if (!result.ok) {
      return Swal.fire(
        'แจ้งเตือน',
        result.message ||
        'เข้าสู่ระบบไม่สำเร็จ',
        'warning'
      );
    }

    if (
      !result.student ||
      !result.student.studentId
    ) {
      return Swal.fire(
        'ผิดพลาด',
        'ข้อมูลผู้เรียนที่ได้รับไม่ครบ',
        'error'
      );
    }

    LEARNING_STUDENT = result.student;

    localStorage.setItem(
      'LEARN_STUDENT',
      JSON.stringify(LEARNING_STUDENT)
    );

    updateLearningTop();
    closeLearningModal('studentModal');

    Swal.fire(
      'สำเร็จ',
      result.message ||
      'เข้าสู่ระบบสำเร็จ',
      'success'
    );

  } catch (error) {
    console.error(
      'เข้าสู่ระบบนักศึกษาไม่สำเร็จ:',
      error
    );

    Swal.fire(
      'ผิดพลาด',
      error.message,
      'error'
    );
  }
}

async function registerStudent() {
  const fullname = String(
    document
      .getElementById('stuFullname')
      ?.value || ''
  ).trim();

  const phone = String(
    document
      .getElementById('stuPhone')
      ?.value || ''
  )
    .replace(/\D/g, '')
    .trim();

  const address = String(
    document
      .getElementById('stuAddress')
      ?.value || ''
  ).trim();

  if (!fullname || !phone || !address) {
    return Swal.fire(
      'แจ้งเตือน',
      'กรุณากรอกชื่อ เบอร์โทร และที่อยู่ให้ครบ',
      'warning'
    );
  }

  if (!/^0\d{9}$/.test(phone)) {
    return Swal.fire(
      'แจ้งเตือน',
      'เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 10 หลัก',
      'warning'
    );
  }

  try {
    Swal.fire({
      title: 'กำลังลงทะเบียน...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: function () {
        Swal.showLoading();
      }
    });

    const result = await learningApi(
      'registerStudent',
      {
        fullname: fullname,
        phone: phone,
        address: address
      }
    );

    if (!result.ok) {
      return Swal.fire(
        'แจ้งเตือน',
        result.message ||
        'ลงทะเบียนไม่สำเร็จ',
        'warning'
      );
    }

    /*
     * ถ้า Backend ส่งข้อมูล student กลับมา
     * ให้ Login อัตโนมัติเหมือนระบบเดิม
     */
    if (
      result.student &&
      result.student.studentId
    ) {
      LEARNING_STUDENT = result.student;

      localStorage.setItem(
        'LEARN_STUDENT',
        JSON.stringify(LEARNING_STUDENT)
      );

      updateLearningTop();
      closeLearningModal('studentModal');
    }

    Swal.fire(
      'สำเร็จ',
      result.message ||
      'ลงทะเบียนสำเร็จ',
      'success'
    );

  } catch (error) {
    console.error(
      'ลงทะเบียนไม่สำเร็จ:',
      error
    );

    Swal.fire(
      'ผิดพลาด',
      error.message,
      'error'
    );
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

  const studentId = String(
    LEARNING_STUDENT?.studentId || ''
  ).trim();

  activityId = String(
    activityId || ''
  ).trim();

  if (!studentId) {
    return Swal.fire(
      'แจ้งเตือน',
      'ไม่พบรหัสผู้เรียน กรุณา Login ใหม่',
      'warning'
    );
  }

  if (!activityId) {
    return Swal.fire(
      'แจ้งเตือน',
      'ไม่พบรหัสกิจกรรม',
      'warning'
    );
  }

  try {
    Swal.fire({
      title: 'กำลังเพิ่มลงตะกร้า...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: function () {
        Swal.showLoading();
      }
    });

    const result = await learningApi(
      'addToCart',
      {
        studentId: studentId,
        activityId: activityId
      }
    );

    if (!result.ok) {
      return Swal.fire(
        'แจ้งเตือน',
        result.message ||
        'ไม่สามารถเพิ่มลงตะกร้าได้',
        'warning'
      );
    }

    await loadLearningCartCount();

    Swal.fire(
      'สำเร็จ',
      result.message ||
      'เพิ่มลงตะกร้าแล้ว',
      'success'
    );

  } catch (error) {
    console.error(
      'เพิ่มกิจกรรมลงตะกร้าไม่สำเร็จ:',
      error
    );

    Swal.fire(
      'ผิดพลาด',
      error.message,
      'error'
    );
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

  if (!modal || !listBox) return;

  modal.style.display = 'flex';
  listBox.innerHTML =
    '<div class="learning-message">กำลังโหลด...</div>';

  try {
    const result = await learningApi('getMyCart', {
      studentId: LEARNING_STUDENT.studentId
    });

    const list = Array.isArray(result.items)
      ? result.items
      : [];

    if (!list.length) {
      listBox.innerHTML =
        '<div class="learning-message">' +
        'ยังไม่มีกิจกรรมในตะกร้า' +
        '</div>';
      return;
    }

    const totalHours = list.reduce(function (sum, item) {
      return sum + getLearningHours(item.activity || {});
    }, 0);

    const fallbackImage =
      'https://placehold.co/300x200?text=Activity';

    listBox.innerHTML = `
      <div class="learning-cart-summary">
        รวมทั้งหมด ${totalHours} ชั่วโมง
      </div>

      ${list.map(function (item) {
        const activity = item.activity || {};
        const cartActivityId = String(
  item.activityId ||
  activity.activityId ||
  ''
).trim();

const cartId = String(
  item.cartId || ''
).trim();

        const image = String(
          activity.image1 || fallbackImage
        ).trim();

        return `
          <div class="learning-cart-item">

            <div class="learning-cart-info">
              <div class="learning-cart-title">
                ${escapeLearningHtml(
                  activity.title || '-'
                )}
              </div>

              <div class="learning-muted">
                ชั่วโมง:
                ${getLearningHours(activity)}
                ชั่วโมง
              </div>

              <div class="learning-muted">
                วันที่:
                ${formatLearningThaiDate(
                  activity.activityDate
                )}
              </div>

              <div class="learning-cart-actions">

               <button
  type="button"
  class="learning-confirm-btn"
  onclick="confirmLearningJoin(
    '${escapeLearningAttr(cartActivityId)}'
  )">
  ยืนยันเข้าร่วม
</button>

<button
  type="button"
  class="learning-delete-btn"
  onclick="cancelLearningCartItem(
    '${escapeLearningAttr(cartId)}'
  )">
  ลบ
</button>

              </div>
            </div>

            <img
              class="learning-cart-image"
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

          </div>
        `;
      }).join('')}
    `;

  } catch (error) {
    console.error('โหลดตะกร้าไม่สำเร็จ:', error);

    listBox.innerHTML = `
      <div class="learning-message">
        ${escapeLearningHtml(error.message)}
      </div>
    `;
  }
}
async function confirmLearningJoin(activityId) {
  if (!requireLearningStudent()) return;

  const studentId = String(
    LEARNING_STUDENT?.studentId || ''
  ).trim();

  activityId = String(
    activityId || ''
  ).trim();

  if (!studentId) {
    return Swal.fire(
      'แจ้งเตือน',
      'ไม่พบรหัสผู้เรียน กรุณา Login ใหม่',
      'warning'
    );
  }

  if (!activityId) {
    return Swal.fire(
      'แจ้งเตือน',
      'ไม่พบรหัสกิจกรรม',
      'warning'
    );
  }

  const confirmResult = await Swal.fire({
    title: 'ยืนยันเข้าร่วมกิจกรรม?',
    text: 'ต้องการยืนยันเข้าร่วมกิจกรรมนี้หรือไม่',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ยืนยันเข้าร่วม',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#16a34a',
    reverseButtons: true
  });

  if (!confirmResult.isConfirmed) {
    return;
  }

  try {
    Swal.fire({
      title: 'กำลังยืนยันเข้าร่วม...',
      text: 'กรุณารอสักครู่',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: function () {
        Swal.showLoading();
      }
    });

    const result = await learningApi(
      'confirmJoin',
      {
        studentId: studentId,
        activityId: activityId
      }
    );

    /*
     * สำคัญมาก:
     * Backend เดิมอาจตอบ ok:false โดยที่
     * success ไม่ได้เป็น false
     */
    if (!result.ok) {
      return Swal.fire(
        'แจ้งเตือน',
        result.message ||
        'ไม่สามารถยืนยันเข้าร่วมกิจกรรมได้',
        'warning'
      );
    }

    await Swal.fire(
      'สำเร็จ',
      result.message ||
      'ยืนยันเข้าร่วมกิจกรรมสำเร็จ',
      'success'
    );

    await loadLearningCartCount();

    const cartModal =
      document.getElementById('cartModal');

    if (
      cartModal &&
      cartModal.style.display === 'flex'
    ) {
      await openCart();
    }

  } catch (error) {
    console.error(
      'ยืนยันเข้าร่วมไม่สำเร็จ:',
      error
    );

    Swal.fire(
      'ผิดพลาด',
      error.message ||
      'ไม่สามารถยืนยันเข้าร่วมได้',
      'error'
    );
  }
}

async function loadLearningCartCount() {
  const count =
    document.getElementById('cartCount');

  if (!count) return;

  if (!LEARNING_STUDENT?.studentId) {
    count.textContent = '0';
    return;
  }

  try {
    const result = await learningApi(
      'getMyCart',
      {
        studentId:
          LEARNING_STUDENT.studentId
      }
    );

    const items =
      Array.isArray(result.items)
        ? result.items
        : [];

    count.textContent =
      String(items.length);

  } catch (error) {
    console.error(
      'โหลดจำนวนตะกร้าไม่สำเร็จ:',
      error
    );

    count.textContent = '0';
  }
}

async function openScoreModal() {
  if (!LEARNING_STUDENT) {
    return Swal.fire(
      'แจ้งเตือน',
      'กรุณา Login ก่อนดูชั่วโมงสะสม',
      'warning'
    );
  }

  Swal.fire({
    title: 'กำลังโหลดชั่วโมงสะสม...',
    allowOutsideClick: false,
    allowEscapeKey: false,

    didOpen: function () {
      Swal.showLoading();
    }
  });

  try {
    const result = await learningApi(
      'getStudentScores',
      {
        studentId:
          LEARNING_STUDENT.studentId
      }
    );

    const list = Array.isArray(result.list)
      ? result.list
      : [];

    const total = Number(
      result.total || 0
    );

    updateLearningScoreButton(total);

    if (!list.length) {
      return Swal.fire({
        title: 'ชั่วโมงสะสม',

        html: `
          <div style="
            padding:20px 10px;
            text-align:center;
          ">
            <div style="
              font-size:34px;
              font-weight:700;
              color:#16a34a;
              margin-bottom:8px;
            ">
              ${total} ชั่วโมง
            </div>

            <div style="color:#64748b;">
              ยังไม่มีรายการบันทึกชั่วโมง
            </div>
          </div>
        `,

        icon: 'info',
        confirmButtonText: 'ปิด'
      });
    }

    const rows = list.map(function (item) {
      const hours = Number(
        item.actualHours || 0
      );

      return `
        <div style="
          padding:14px 0;
          border-bottom:1px solid #e5e7eb;
          text-align:left;
        ">
          <div style="
            font-weight:600;
            color:#0f172a;
            margin-bottom:5px;
          ">
            ${escapeLearningHtml(
              item.title || '-'
            )}
          </div>

          ${
            item.baseNo
              ? `
                <div style="
                  font-size:13px;
                  color:#64748b;
                  margin-bottom:3px;
                ">
                  ฐานที่:
                  ${escapeLearningHtml(
                    item.baseNo
                  )}
                </div>
              `
              : ''
          }

          ${
            item.activityDate
              ? `
                <div style="
                  font-size:13px;
                  color:#64748b;
                  margin-bottom:3px;
                ">
                  วันที่:
                  ${escapeLearningHtml(
                    item.activityDate
                  )}
                </div>
              `
              : ''
          }

          <div style="
            margin-top:7px;
            font-size:16px;
            font-weight:700;
            color:#16a34a;
          ">
            ${hours} ชั่วโมง
          </div>
        </div>
      `;
    }).join('');

    Swal.fire({
      title: 'ชั่วโมงสะสม',

      html: `
        <div style="
          max-height:480px;
          overflow-y:auto;
          padding-right:6px;
        ">
          <div style="
            background:#f0fdf4;
            border:1px solid #bbf7d0;
            border-radius:14px;
            padding:16px;
            margin-bottom:8px;
            text-align:center;
          ">
            <div style="
              color:#64748b;
              font-size:14px;
            ">
              ชั่วโมงสะสมทั้งหมด
            </div>

            <div style="
              color:#16a34a;
              font-size:32px;
              font-weight:700;
            ">
              ${total} ชั่วโมง
            </div>
          </div>

          ${rows}
        </div>
      `,

      width: 600,
      confirm

function openTeacherPage() {
  window.open(
    `${LEARNING_API_URL}?page=teacher`,
    '_blank',
    'noopener'
  );
}
async function cancelLearningCartItem(cartId) {
  if (!requireLearningStudent()) return;

  cartId = String(cartId || '').trim();

  if (!cartId) {
    return Swal.fire(
      'แจ้งเตือน',
      'ไม่พบรหัสรายการตะกร้า',
      'warning'
    );
  }

  const confirmResult = await Swal.fire({
    title: 'ยืนยันการลบ?',
    text: 'ต้องการลบกิจกรรมนี้ออกจากตะกร้าหรือไม่',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ไม่',
    confirmButtonColor: '#dc2626',
    reverseButtons: true
  });

  if (!confirmResult.isConfirmed) return;

  try {
    Swal.fire({
      title: 'กำลังลบ...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: function () {
        Swal.showLoading();
      }
    });

    const result = await learningApi(
      'cancelCart',
      {
        cartId: cartId,
        studentId:
          LEARNING_STUDENT.studentId
      }
    );

    if (!result.ok) {
      return Swal.fire(
        'แจ้งเตือน',
        result.message ||
        'ไม่สามารถลบรายการได้',
        'warning'
      );
    }

    await Swal.fire(
      'สำเร็จ',
      result.message ||
      'ลบออกจากตะกร้าแล้ว',
      'success'
    );

    await loadLearningCartCount();
    await openCart();

  } catch (error) {
    console.error(
      'ลบรายการตะกร้าไม่สำเร็จ:',
      error
    );

    Swal.fire(
      'ผิดพลาด',
      error.message,
      'error'
    );
  }
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
