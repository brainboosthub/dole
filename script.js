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
    setTimeout(() => button.textContent = '+', 1400);
  });
});
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

    // ภาพพื้นหลัง Hero
    if (images.hero) {
      const hero = document.querySelector('.hero');

      if (hero) {
        hero.style.backgroundImage =
          `url("${images.hero}")`;
      }
    }

    // ภาพการ์ด
    setImageUrl('card1Image', images.card1);
    setImageUrl('card2Image', images.card2);
    setImageUrl('card3Image', images.card3);

  } catch (error) {
    console.error('โหลด URL รูปภาพจาก Google Sheet ไม่สำเร็จ:', error);
  }
}

function setImageUrl(elementId, url) {
  if (!url) return;

  const image = document.getElementById(elementId);

  if (image) {
    image.src = url;
  }
}

document.addEventListener('DOMContentLoaded', loadWebsiteImages);
