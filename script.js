console.log(
  'learning-base.js VERSION 2026-07-18-02'
);
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

toggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.textContent = isOpen ? '✕' : '☰';
});

document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '☰';
  });
});

document.querySelectorAll('.book-meta button').forEach(button => {
  button.addEventListener('click', () => {
    button.textContent = '✓';
    button.setAttribute('aria-label', 'เพิ่มลงตะกร้าแล้ว');

    setTimeout(() => {
      button.textContent = '+';
    }, 1400);
  });
});


/* ======================================
   รูปภาพเว็บไซต์
====================================== */

const IMAGE_API_URL =
  'https://script.google.com/macros/s/AKfycbyFu-j4vaLGLq4jFTXyZZp_IwEzHn3cXqCf2ShjF5oWFPZ72qioRubjCbyzuu-GotIqsQ/exec?mode=images';

async function loadWebsiteImages() {
  try {
    const response = await fetch(IMAGE_API_URL, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const images = await response.json();

    setImageUrl('card1Image', images.card1);
    setImageUrl('card2Image', images.card2);
    setImageUrl('card3Image', images.card3);

    if (images.hero) {
      const hero = document.querySelector('.hero');

      if (hero) {
        hero.style.backgroundImage = `url("${images.hero}")`;
      }
    }

  } catch (error) {
    console.error('โหลดรูปภาพเว็บไซต์ไม่สำเร็จ:', error);
  }
}

function setImageUrl(elementId, url) {
  if (!url) return;

  const image = document.getElementById(elementId);

  if (image) {
    image.src = url;
  }
}


/* ======================================
   ข่าวสารแบบสไลด์
====================================== */

const NEWS_API_URL =
  'https://script.google.com/macros/s/AKfycbyFu-j4vaLGLq4jFTXyZZp_IwEzHn3cXqCf2ShjF5oWFPZ72qioRubjCbyzuu-GotIqsQ/exec?mode=news';

let newsCurrentIndex = 0;
let newsAutoTimer = null;
let newsItems = [];
let newsDisplayMode = 'none';

async function loadNewsSlider() {
  const slider = document.getElementById('newsSlider');
  const slidesContainer = document.getElementById('newsSlides');
  const dotsContainer = document.getElementById('newsDots');
  const loading = document.getElementById('newsLoading');

  if (!slider || !slidesContainer || !dotsContainer) {
    return;
  }

  try {
    const response = await fetch(NEWS_API_URL, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'โหลดข่าวสารไม่สำเร็จ');
    }

    newsItems = Array.isArray(result.slides)
      ? result.slides.filter(Boolean)
      : [];

    const newsMode = String(result.mode || 'none')
      .trim()
      .toLowerCase();

    // สำคัญ ต้องกำหนดค่าให้ตัวแปรหลัก
    newsDisplayMode = newsMode;

    if (newsItems.length === 0) {
      slider.classList.add('is-empty');
      return;
    }

    slider.classList.remove('is-empty');
    slidesContainer.innerHTML = '';
    dotsContainer.innerHTML = '';
    newsCurrentIndex = 0;

    newsItems.forEach(function (url, index) {
      const slide = document.createElement('div');
      slide.className = 'news-slide';

      if (index === 0) {
        slide.classList.add('active');
      }

      const image = document.createElement('img');
      image.src = url;
      image.alt = `ข่าวสารลำดับที่ ${index + 1}`;
      image.loading = index === 0 ? 'eager' : 'lazy';

      image.onerror = function () {
        console.error('โหลดรูปข่าวไม่ได้:', url);
      };

      slide.appendChild(image);
      slidesContainer.appendChild(slide);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'news-dot';
      dot.setAttribute(
        'aria-label',
        `แสดงข่าวลำดับที่ ${index + 1}`
      );

      if (index === 0) {
        dot.classList.add('active');
      }

      dot.addEventListener('click', function () {
        if (newsDisplayMode !== 'block') return;

        showNewsSlide(index);
        restartNewsAutoSlide();
      });

      dotsContainer.appendChild(dot);
    });

    if (loading) {
      loading.style.display = 'none';
    }

    if (
      newsDisplayMode !== 'block' ||
      newsItems.length <= 1
    ) {
      // J1 = none หรือมีเพียงภาพเดียว
      slider.classList.add('single-slide');
      stopNewsAutoSlide();

    } else {
      // J1 = block และมีมากกว่า 1 ภาพ
      slider.classList.remove('single-slide');
      startNewsAutoSlide();
    }

  } catch (error) {
    console.error('โหลดภาพข่าวสารไม่สำเร็จ:', error);

    if (loading) {
      loading.textContent = 'ไม่สามารถโหลดข่าวสารได้';
    }

    setTimeout(function () {
      slider.classList.add('is-empty');
    }, 1500);
  }
}

function showNewsSlide(index) {
  const slides = document.querySelectorAll('.news-slide');
  const dots = document.querySelectorAll('.news-dot');

  if (!slides.length) return;

  if (index < 0) {
    index = slides.length - 1;
  }

  if (index >= slides.length) {
    index = 0;
  }

  newsCurrentIndex = index;

  slides.forEach(function (slide, slideIndex) {
    slide.classList.toggle(
      'active',
      slideIndex === newsCurrentIndex
    );
  });

  dots.forEach(function (dot, dotIndex) {
    dot.classList.toggle(
      'active',
      dotIndex === newsCurrentIndex
    );
  });
}

function nextNewsSlide() {
  if (newsDisplayMode !== 'block') return;

  showNewsSlide(newsCurrentIndex + 1);
}

function previousNewsSlide() {
  if (newsDisplayMode !== 'block') return;

  showNewsSlide(newsCurrentIndex - 1);
}

function startNewsAutoSlide() {
  stopNewsAutoSlide();

  if (
    newsDisplayMode !== 'block' ||
    newsItems.length <= 1
  ) {
    return;
  }

  newsAutoTimer = setInterval(function () {
    nextNewsSlide();
  }, 2500);
}

function stopNewsAutoSlide() {
  if (newsAutoTimer) {
    clearInterval(newsAutoTimer);
    newsAutoTimer = null;
  }
}

function restartNewsAutoSlide() {
  if (
    newsDisplayMode === 'block' &&
    newsItems.length > 1
  ) {
    startNewsAutoSlide();
  }
}


/* ======================================
   เริ่มระบบหลังหน้าเว็บโหลดเสร็จ
====================================== */

document.addEventListener('DOMContentLoaded', function () {
  const prevButton = document.getElementById('newsPrev');
  const nextButton = document.getElementById('newsNext');
  const slider = document.getElementById('newsSlider');

  if (prevButton) {
    prevButton.addEventListener('click', function () {
      previousNewsSlide();
      restartNewsAutoSlide();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      nextNewsSlide();
      restartNewsAutoSlide();
    });
  }

  if (slider) {
    slider.addEventListener('mouseenter', stopNewsAutoSlide);
    slider.addEventListener('mouseleave', restartNewsAutoSlide);
  }

  loadWebsiteImages();
  loadNewsSlider();
});
