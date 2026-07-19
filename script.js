(() => {
  'use strict';

  const WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbzq9SWm2mEBe_gsusJKNEj7hlORO29BejRrOI7CoapwBj145UCyUBccmzdv4pzLAHlW/exec';
  const IMAGE_API_URL = WEB_APP_URL + '?mode=images';
  const BOOK_API_URL = WEB_APP_URL + '?mode=books';
  const NEWS_API_URL = WEB_APP_URL + '?mode=news';

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');

  if (toggle && nav) {
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
  }

  async function loadWebsiteImages() {
    try {
      const response = await fetch(IMAGE_API_URL + '&_t=' + Date.now(), {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success === false) throw new Error(result.message || 'โหลดรูปภาพไม่สำเร็จ');
      const images = result.data || result;

      if (images.hero) {
        const hero = document.querySelector('.hero');
        if (hero) hero.style.backgroundImage = `url("${images.hero}")`;
      }
    } catch (error) {
      console.error('โหลด URL รูปภาพเว็บไซต์ไม่สำเร็จ:', error);
    }
  }


  let newsSlides = [];
  let newsIndex = 0;
  let newsTimer = null;

  async function loadNews() {
    const slider = document.getElementById('newsSlider');
    const slidesBox = document.getElementById('newsSlides');
    if (!slider || !slidesBox) return;
    try {
      const response = await fetch(NEWS_API_URL + '&_t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success === false) throw new Error(result.message || 'โหลดข่าวสารไม่สำเร็จ');
      const raw = result.slides || result.data?.slides || result.data || [];
      newsSlides = (Array.isArray(raw) ? raw : []).map(item =>
        typeof item === 'string' ? item : (item.image || item.url || item.imageUrl || '')
      ).map(String).map(x => x.trim()).filter(Boolean);
      const mode = String(result.mode || result.data?.mode || '').toLowerCase();
      if (!newsSlides.length) { slider.classList.add('is-empty'); return; }
      slider.classList.remove('is-empty');
      slider.classList.toggle('single-slide', mode !== 'block' || newsSlides.length <= 1);
      newsIndex = 0;
      renderNews();
      clearInterval(newsTimer);
      if (mode === 'block' && newsSlides.length > 1) {
        newsTimer = setInterval(() => { newsIndex = (newsIndex + 1) % newsSlides.length; renderNews(); }, 3000);
      }
    } catch (error) {
      slidesBox.innerHTML = `<div class="news-loading">โหลดข่าวสารไม่สำเร็จ: ${escapeHtml(error.message)}</div>`;
    }
  }

  function renderNews() {
    const slidesBox = document.getElementById('newsSlides');
    const dots = document.getElementById('newsDots');
    if (!slidesBox || !dots || !newsSlides.length) return;
    slidesBox.innerHTML = newsSlides.map((url,index) => `
      <div class="news-slide ${index === newsIndex ? 'active' : ''}">
        <img src="${escapeHtml(url)}" alt="ข่าวสาร ${index+1}" loading="lazy">
      </div>`).join('');
    dots.innerHTML = newsSlides.map((_,index) => `<button class="news-dot ${index===newsIndex?'active':''}" type="button" data-news-dot="${index}"></button>`).join('');
    dots.querySelectorAll('[data-news-dot]').forEach(btn => btn.addEventListener('click', () => { newsIndex = Number(btn.dataset.newsDot); renderNews(); }));
  }

  function bindNewsControls() {
    document.getElementById('newsPrev')?.addEventListener('click', () => { if (!newsSlides.length) return; newsIndex=(newsIndex-1+newsSlides.length)%newsSlides.length; renderNews(); });
    document.getElementById('newsNext')?.addEventListener('click', () => { if (!newsSlides.length) return; newsIndex=(newsIndex+1)%newsSlides.length; renderNews(); });
  }

  let books = [];
  let activeBookIndex = 0;
  let bookTimer = null;

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function normalizeBook(row, index) {
    return {
      id: String(row.bookId || row.id || row.number || row['เล่มที่'] || index + 1),
      category: String(row.category || row['หมวด'] || '').trim(),
      title: String(row.title || row.bookName || row['ชื่อหนังสือ'] || '').trim(),
      image: String(row.image || row.imageUrl || row['URL รูปปก'] || '').trim(),
      detail: String(row.detail || row.description || row['รายละเอียดที่น่าสนใจ'] || '').trim()
    };
  }

  async function loadBooks() {
    const slides = document.getElementById('bookSlides');
    const grid = document.getElementById('allBooksGrid');
    if (!slides || !grid) return;

    try {
      const response = await fetch(BOOK_API_URL + '&_t=' + Date.now(), {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success === false) throw new Error(result.message || 'โหลดหนังสือไม่สำเร็จ');

      const raw = result.data || result.books || result;
      books = (Array.isArray(raw) ? raw : [])
        .map(normalizeBook)
        .filter(book => book.title || book.image);

      if (!books.length) {
        slides.innerHTML = '<div class="book-loading">ยังไม่มีรายการหนังสือในชีต book</div>';
        grid.innerHTML = '';
        return;
      }

      activeBookIndex = 0;
      renderBookSlider();
      renderAllBooks();
      startBookAutoSlide();
    } catch (error) {
      console.error('โหลดรายการหนังสือไม่สำเร็จ:', error);
      slides.innerHTML = `<div class="book-loading">โหลดรายการหนังสือไม่สำเร็จ: ${escapeHtml(error.message)}</div>`;
    }
  }

  function renderBookSlider() {
    const slides = document.getElementById('bookSlides');
    const dots = document.getElementById('bookDots');
    if (!slides || !dots || !books.length) return;

    slides.innerHTML = books.map((book, index) => {
      const distance = circularDistance(index, activeBookIndex, books.length);
const positionClass =
  distance === 0 ? 'is-active' :
  distance === -1 ? 'is-prev' :
  distance === -2 ? 'is-far-prev' :
  distance === -3 ? 'is-super-far-prev' :
  distance === 1 ? 'is-next' :
  distance === 2 ? 'is-far-next' :
  distance === 3 ? 'is-super-far-next' :
  'is-hidden';

      const image = book.image || 'https://placehold.co/360x520?text=Book';
      return `
        <button class="book-cover ${positionClass}" type="button"
          data-book-index="${index}"
          aria-label="ดูรายละเอียด ${escapeHtml(book.title || 'หนังสือ')}">
          <img src="${escapeHtml(image)}"
            alt="${escapeHtml(book.title || 'ปกหนังสือ')}"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://placehold.co/360x520?text=Book';">
          <span class="book-cover-caption">${escapeHtml(book.title || '-')}</span>
        </button>`;
    }).join('');

    dots.innerHTML = books.map((_, index) => `
      <button class="book-slider-dot ${index === activeBookIndex ? 'active' : ''}"
        type="button" data-book-dot="${index}" aria-label="ไปหนังสือเล่มที่ ${index + 1}"></button>
    `).join('');

    slides.querySelectorAll('[data-book-index]').forEach(button => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.bookIndex);
        if (index === activeBookIndex) openBookDetail(index);
        else setActiveBook(index);
      });
    });

    dots.querySelectorAll('[data-book-dot]').forEach(button => {
      button.addEventListener('click', () => setActiveBook(Number(button.dataset.bookDot)));
    });
  }

  function circularDistance(index, active, length) {
    let distance = index - active;
    if (distance > length / 2) distance -= length;
    if (distance < -length / 2) distance += length;
    return distance;
  }

  function setActiveBook(index) {
    if (!books.length) return;
    activeBookIndex = (index + books.length) % books.length;
    renderBookSlider();
    restartBookAutoSlide();
  }

  function startBookAutoSlide() {
    clearInterval(bookTimer);
    if (books.length <= 1) return;
    bookTimer = setInterval(() => {
      activeBookIndex = (activeBookIndex + 1) % books.length;
      renderBookSlider();
    }, 3500);
  }

  function restartBookAutoSlide() {
    startBookAutoSlide();
  }

  function renderAllBooks() {
    const grid = document.getElementById('allBooksGrid');
    if (!grid) return;

    grid.innerHTML = books.map((book, index) => {
      const image = book.image || 'https://placehold.co/300x430?text=Book';
      return `
        <article class="all-book-card">
          <img src="${escapeHtml(image)}"
            alt="${escapeHtml(book.title || 'ปกหนังสือ')}"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://placehold.co/300x430?text=Book';">
          <div class="all-book-card-body">
            <span class="all-book-category">${escapeHtml(book.category || 'ไม่ระบุหมวด')}</span>
            <h3>${escapeHtml(book.title || '-')}</h3>
            <button class="book-detail-button" type="button" data-open-book="${index}">ดูรายละเอียด</button>
          </div>
        </article>`;
    }).join('');

    grid.querySelectorAll('[data-open-book]').forEach(button => {
      button.addEventListener('click', () => openBookDetail(Number(button.dataset.openBook)));
    });
  }

  function openBookDetail(index) {
    const book = books[index];
    const modal = document.getElementById('bookDetailModal');
    const content = document.getElementById('bookDetailContent');
    if (!book || !modal || !content) return;

    const image = book.image || 'https://placehold.co/360x520?text=Book';
    content.innerHTML = `
      <div class="book-detail-layout">
        <div class="book-detail-image-wrap">
          <img src="${escapeHtml(image)}"
            alt="${escapeHtml(book.title || 'ปกหนังสือ')}"
            onerror="this.onerror=null;this.src='https://placehold.co/360x520?text=Book';">
        </div>
        <div class="book-detail-info">
          <span class="book-detail-label">หมวด</span>
          <div class="book-detail-category">${escapeHtml(book.category || 'ไม่ระบุหมวด')}</div>
          <span class="book-detail-label">ชื่อหนังสือ</span>
          <h2 id="bookDetailTitle">${escapeHtml(book.title || '-')}</h2>
          <span class="book-detail-label">รายละเอียดที่น่าสนใจ</span>
          <p>${escapeHtml(book.detail || 'ยังไม่มีรายละเอียด')}</p>
        </div>
      </div>`;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeBookDetail() {
    const modal = document.getElementById('bookDetailModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

function bindBookControls() {
  document.getElementById('bookPrev')
    ?.addEventListener('click', () => {
      setActiveBook(activeBookIndex - 1);
    });

  document.getElementById('bookNext')
    ?.addEventListener('click', () => {
      setActiveBook(activeBookIndex + 1);
    });

  const toggleButton =
    document.getElementById('toggleBookListBtn');

  const panel =
    document.getElementById('allBooksPanel');

  if (toggleButton && panel) {
    toggleButton.addEventListener('click', () => {
      const willOpen = panel.hasAttribute('hidden');

      panel.toggleAttribute('hidden', !willOpen);

      toggleButton.setAttribute(
        'aria-expanded',
        String(willOpen)
      );

      const text =
        toggleButton.querySelector('.book-toggle-text');

      const icon =
        toggleButton.querySelector('.book-toggle-icon i');

      if (text) {
        text.textContent = 'หนังสือทั้งหมด';
      }

      if (icon) {
        icon.className = willOpen
          ? 'fa fa-eye'
          : 'fa fa-eye-slash';
      }

      if (willOpen) {
        window.setTimeout(() => {
          panel.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      }
    });
  }

  document.getElementById('bookDetailClose')
    ?.addEventListener('click', closeBookDetail);

  document.getElementById('bookDetailModal')
    ?.addEventListener('click', event => {
      if (event.target.id === 'bookDetailModal') {
        closeBookDetail();
      }
    });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeBookDetail();
    }
  });
}

  document.addEventListener('DOMContentLoaded', () => {
    bindNewsControls();
    bindBookControls();
    loadWebsiteImages();
    loadNews();
    loadBooks();
  });
})();
