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

  console.log("เริ่มโหลดรูป");

  try {

    const response = await fetch(IMAGE_API_URL);

    console.log(response);

    const images = await response.json();

    console.log(images);

    setImageUrl('card1Image', images.card1);
    setImageUrl('card2Image', images.card2);
    setImageUrl('card3Image', images.card3);

  } catch(err){

    console.log(err);

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
