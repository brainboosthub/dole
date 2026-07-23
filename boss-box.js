(() => {
  'use strict';

  const BOSS_WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbzq9SWm2mEBe_gsusJKNEj7hlORO29BejRrOI7CoapwBj145UCyUBccmzdv4pzLAHlW/exec';
  const BOSS_API_URL = BOSS_WEB_APP_URL + '?mode=boss';

  const text = value => String(value ?? '').trim();

  function normalizeBoss(result) {
    const source = result?.boss || result?.data?.boss || result?.data || result || {};

    if (Array.isArray(source)) {
      const byLabel = {};
      source.forEach(row => {
        if (Array.isArray(row)) byLabel[text(row[0])] = text(row[1]);
        else if (row && typeof row === 'object') {
          byLabel[text(row.label || row.key || row.item || row['รายการ'])] =
            text(row.value || row.url || row.text || row['ระบุ']);
        }
      });
      return {
        image: byLabel['รูป'] || byLabel['รูปภาพ'] || '',
        name: byLabel['ชื่อ'] || '',
        position: byLabel['ตำแหน่ง'] || ''
      };
    }

    return {
      image: text(source.image || source.photo || source.url || source['รูป'] || source['รูปภาพ']),
      name: text(source.name || source.fullName || source['ชื่อ']),
      position: text(source.position || source.title || source['ตำแหน่ง'])
    };
  }

  function hideBossBox() {
    document.getElementById('bossBox')?.setAttribute('hidden', '');
    document.getElementById('leftInfoStack')?.classList.add('boss-is-hidden');
  }

  function renderBoss(boss) {
    // ไม่แสดง Box เมื่อข้อมูลคอลัมน์ B ว่างทั้งหมด
    if (!boss.image && !boss.name && !boss.position) {
      hideBossBox();
      return;
    }

    const box = document.getElementById('bossBox');
    const photo = document.getElementById('bossPhoto');
    const name = document.getElementById('bossName');
    const position = document.getElementById('bossPosition');
    if (!box || !photo || !name || !position) return;

    if (boss.image) {
      photo.src = boss.image;
      photo.hidden = false;
    } else {
      photo.removeAttribute('src');
      photo.hidden = true;
    }

    name.textContent = boss.name;
    name.hidden = !boss.name;
    position.textContent = boss.position;
    position.hidden = !boss.position;

    document.getElementById('leftInfoStack')?.classList.remove('boss-is-hidden');
    box.removeAttribute('hidden');
  }

  async function loadBoss() {
    try {
      const response = await fetch(BOSS_API_URL + '&_t=' + Date.now(), {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success === false) throw new Error(result.message || 'โหลดข้อมูลผู้บริหารไม่สำเร็จ');

      renderBoss(normalizeBoss(result));
    } catch (error) {
      console.error('โหลดข้อมูลผู้บริหารไม่สำเร็จ:', error);
      hideBossBox();
    }
  }

  document.addEventListener('DOMContentLoaded', loadBoss);
})();

