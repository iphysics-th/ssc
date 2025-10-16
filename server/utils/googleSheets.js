const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../config/sparking-science-center-829064e5c35f.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const translatePrefix = (prefix) => {
  const prefixMapping = {
    'mr': 'นาย',
    'ms': 'นางสาว',
    'mrs': 'นาง',
    'dr': 'ดร.'
  };
  return prefixMapping[prefix] || prefix;
};

const translateStatus = (status) => {
  const statusMapping = {
    'teacher': 'ครู',
    'school_representative': 'ตัวแทนโรงเรียน',
    'principal': 'ผู้อำนวยการ',
    'vice_principal': 'รองผู้อำนวยการ'
  };
  return statusMapping[status] || status;
};

const translateSchoolSize = (size) => {
  const sizeMapping = {
    'small': 'โรงเรียนขนาดเล็ก',
    'medium': 'โรงเรียนขนาดกลาง',
    'large': 'โรงเรียนขนาดใหญ่',
    'very_large': 'โรงเรียนขนาดใหญ่พิเศษ'
  };
  return sizeMapping[size] || size;
};

const monthMapping = {
  'January': 'มกราคม',
  'February': 'กุมภาพันธ์',
  'March': 'มีนาคม',
  'April': 'เมษายน',
  'May': 'พฤษภาคม',
  'June': 'มิถุนายน',
  'July': 'กรกฎาคม',
  'August': 'สิงหาคม',
  'September': 'กันยายน',
  'October': 'ตุลาคม',
  'November': 'พฤศจิกายน',
  'December': 'ธันวาคม'
};

function formatBuddhistDate(dateStr) {
  const date = new Date(dateStr);
  const buddhistYear = date.getFullYear() + 543;
  const monthName = monthMapping[date.toLocaleString('en-US', { month: 'long' })];
  return `${date.getDate()} ${monthName} ${buddhistYear}`;
}

async function appendReservationToSheet(reservation) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const range = 'Reservations!A2';

    const translatedPrefix = translatePrefix(reservation.prefix);
    const translatedStatus = translateStatus(reservation.status);
    const translatedSchoolSize = translateSchoolSize(reservation.schoolSize);

    const classEntries = Array.isArray(reservation.classSubjects) && reservation.classSubjects.length > 0
      ? reservation.classSubjects
      : (() => {
          const grouped = (reservation.slotSelections || []).reduce((acc, slot) => {
            const classNumber = slot.classNumber || 1;
            if (!acc[classNumber]) {
              acc[classNumber] = [];
            }
            acc[classNumber].push(slot);
            return acc;
          }, {});

          return Object.entries(grouped).map(([classNumber, slots]) => ({
            classNumber: Number(classNumber),
            slots: slots.map((slot, index) => ({
              slotIndex: slot.slotIndex ?? index,
              date: slot.date || null,
              slot: slot.slot || slot.time || null,
              subject:
                slot.subject ||
                (slot.name_th ? { code: slot.code || null, name_th: slot.name_th } : null),
              code: slot.code || null,
              name_th: slot.name_th || null,
            })),
          }));
        })();

    const classSummary = classEntries.length
      ? `${reservation.numberOfClasses || classEntries.length || 1} ห้อง: ${classEntries
          .map((classItem, index) => {
            const classLabel = classItem.classNumber || index + 1;
            const slots = Array.isArray(classItem?.slots) ? classItem.slots : [];
            if (!slots.length) {
              return `ห้อง ${classLabel} —`;
            }
            const slotDescriptions = slots.map((slot) => {
              const dateLabel = slot.date ? formatBuddhistDate(slot.date) : '-';
              const slotLabel = slot.slot || slot.time || '-';
              const subjectName =
                (slot.subject && typeof slot.subject === 'object' && slot.subject.name_th) ||
                slot.name_th ||
                '-';
              const codeValue =
                (slot.subject && typeof slot.subject === 'object' && slot.subject.code) ||
                slot.code ||
                null;
              return `${dateLabel} ${slotLabel} ${subjectName}${codeValue ? ` (${codeValue})` : ''}`;
            });
            return `ห้อง ${classLabel} ${slotDescriptions.join(' | ')}`;
          })
          .join(', ')}`
      : '';

    const values = [[
      reservation.reservationNumber || '',
      `${translatedPrefix} ${reservation.name} ${reservation.surname}`,
      reservation.telephone || '',
      reservation.mail || '',
      reservation.school || '',
      translatedSchoolSize || '',
      reservation.numberOfStudents || 0,
      reservation.numberOfDays || 0,
      reservation.price || 0,
      translatedStatus || '',
      reservation.confirmation || '',
      (reservation.selectedDates || []).map(formatBuddhistDate).join(', ') || '',
      classSummary,
      new Date().toISOString()
    ]];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    });

    console.log('✅ Appended to Google Sheet at:', response.data.updates.updatedRange);
  } catch (error) {
    console.error('❌ Google Sheets append error:', error.message);
  }
}

module.exports = { appendReservationToSheet };
