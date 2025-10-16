const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
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

async function sendEmailNotification(reservation) {
  try {
    const translatedPrefix = translatePrefix(reservation.prefix);
    const translatedStatus = translateStatus(reservation.status);
    const translatedSchoolSize = translateSchoolSize(reservation.schoolSize);

    const hasClassSubjects = Array.isArray(reservation.classSubjects) && reservation.classSubjects.length > 0;

    const classEntries = hasClassSubjects
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
              level: slot.level || null,
              levelLabel: slot.levelLabel || null,
              category: slot.category || null,
              categoryLabel: slot.categoryLabel || null,
              subcategory: slot.subcategory || null,
              subcategoryLabel: slot.subcategoryLabel || null,
            })),
          }));
        })();

    const classDetails = classEntries
      .map((classItem, index) => {
        const classLabel = classItem.classNumber || index + 1;
        const slots = Array.isArray(classItem?.slots) ? classItem.slots : [];
        if (!slots.length) {
          return `- ห้อง ${classLabel}: ไม่พบรายวิชา`;
        }

        const slotLines = slots.map((slot) => {
          const subjectName =
            (slot.subject && typeof slot.subject === 'object' && slot.subject.name_th) ||
            slot.name_th ||
            '-';
          const codeValue =
            (slot.subject && typeof slot.subject === 'object' && slot.subject.code) ||
            slot.code ||
            null;
          const dateLabel = slot.date ? formatBuddhistDate(slot.date) : '-';
          const slotLabel = slot.slot || slot.time || '-';
          const levelLabel = slot.levelLabel ? ` (ระดับ: ${slot.levelLabel})` : '';
          return `  • ${dateLabel} • ${slotLabel} • ${subjectName}${codeValue ? ` (${codeValue})` : ''}${levelLabel}`;
        });

        return [`- ห้อง ${classLabel}:`, ...slotLines].join('\n');
      })
      .join('\n');

    const mailOptions = {
      from: `"Sparkling Science Center" <${process.env.GMAIL_USER}>`,
      to: [process.env.GMAIL_USER, reservation.userInfo?.email].filter(Boolean).join(','),
      bcc: ['supattira.to@skru.ac.th', 'teerayut.sr@skru.ac.th'],
      subject: `มีการจองใหม่ในระบบ (New Reservation): ${reservation.reservationNumber}`,
      text: `
📌 สรุปข้อมูลการจองใหม่

ชื่อ-สกุล: ${translatedPrefix} ${reservation.name} ${reservation.surname}
ตำแหน่ง: ${translatedStatus}
โทรศัพท์: ${reservation.telephone}
อีเมล: ${reservation.mail}
โรงเรียน: ${reservation.school}
ขนาดโรงเรียน: ${translatedSchoolSize}
จำนวนนักเรียนที่เข้าอบรม: ${reservation.numberOfStudents} คน
จำนวนห้องเรียน: ${reservation.numberOfClasses || (classEntries.length || 1)} ห้อง
ช่วงชั้น: ${reservation.studentRange}
ระดับชั้น: ${reservation.studentRange === 'มัธยม' ? 'ม.' : 'ป.'}${reservation.studentLevel}
จำนวนวัน: ${reservation.numberOfDays} วัน

📆 รายละเอียดการจอง:
${classDetails || '-'}

หมายเลขการจอง: ${reservation.reservationNumber}
การยืนยัน: ${reservation.confirmation}

ค่าบริการรวม: ${reservation.price} บาท
  `.trim(),
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent');
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

module.exports = { sendEmailNotification };
