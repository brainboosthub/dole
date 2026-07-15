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
