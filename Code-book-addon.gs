/* =====================================================
   ส่วนเพิ่มสำหรับอ่านข้อมูลหนังสือจากชีต book
   คอลัมน์ A = เล่มที่
   คอลัมน์ B = หมวด
   คอลัมน์ C = ชื่อหนังสือ
   คอลัมน์ D = URL รูปปก
   คอลัมน์ E = รายละเอียดที่น่าสนใจ
===================================================== */

const BOOK_SHEET_NAME = 'book';

function getBooks_() {
  const ss = SpreadsheetApp.openById(WEBSITE_SPREADSHEET_ID);
  const sheet = ss.getSheetByName(BOOK_SHEET_NAME);

  if (!sheet) {
    throw new Error('ไม่พบชีต ' + BOOK_SHEET_NAME);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, 5)
    .getDisplayValues()
    .filter(row => row.some(value => String(value).trim() !== ''))
    .map(row => ({
      bookId: String(row[0] || '').trim(),
      category: String(row[1] || '').trim(),
      title: String(row[2] || '').trim(),
      image: normalizeBookImageUrl_(row[3]),
      detail: String(row[4] || '').trim()
    }));
}

function normalizeBookImageUrl_(url) {
  const value = String(url || '').trim();
  if (!value) return '';

  const driveMatch = value.match(/[-\w]{25,}/);
  if (value.includes('drive.google.com') && driveMatch) {
    return 'https://lh3.googleusercontent.com/d/' + driveMatch[0];
  }

  return value;
}

/*
เพิ่มเงื่อนไขนี้ใน doGet(e) ปัจจุบัน ก่อน return Invalid mode:

  if (mode === 'books') {
    try {
      return jsonOutput_({
        success: true,
        data: getBooks_()
      });
    } catch (error) {
      return jsonOutput_({
        success: false,
        message: error.message
      });
    }
  }
*/
