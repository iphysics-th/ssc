const dayjs = require('dayjs');
const { groupClassSubjects, countUniqueClasses } = require('../app/utils/classGrouping');

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

const formatBuddhistDate = (date) => {
  const buddhistYear = dayjs(date).year() + 543;
  const monthName = monthMapping[dayjs(date).format('MMMM')];
  return `${dayjs(date).format('D')} ${monthName} ${buddhistYear}`;
};

const translateSubject = (subject) => {
  const subjectMapping = {
    'physics': 'ฟิสิกส์',
    'chemistry': 'เคมี',
    'biology': 'ชีววิทยา',
    'mathematics': 'คณิตศาสตร์'
  };
  return subjectMapping[subject] || subject;
};

const translatePrefix = (prefix) => {
  const prefixMapping = {
    'mr': 'นาย',
    'ms': 'นางสาว',
    'mrs': 'นาง',
    'dr': 'ดร.'
  };
  return prefixMapping[prefix] || prefix;
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

const translateStatus = (status) => {
  const statusMapping = {
    'teacher': 'ครู',
    'school_representative': 'ตัวแทนโรงเรียน',
    'principal': 'ผู้อำนวยการ',
    'vice_principal': 'รองผู้อำนวยการ'
  };
  return statusMapping[status] || status;
};

const generateLineMessage = (reservation) => {
  let bookingDetails = '';

  if (Array.isArray(reservation.selectedDates) && reservation.selectedDates.length) {
    bookingDetails += '\nวันที่อบรม:';
    reservation.selectedDates.forEach((date) => {
      const formattedDate = formatBuddhistDate(new Date(date));
      bookingDetails += `\n  - ${formattedDate}`;
    });
  }

  const classData = groupClassSubjects(reservation.classSubjects || []);
  const studentsPerClass = Array.isArray(reservation.studentsPerClass)
    ? reservation.studentsPerClass
    : [];

  if (classData.length) {
    bookingDetails += '\n\nรายวิชาตามห้องเรียน:';
    classData.forEach((item, index) => {
      const classLabel = item.classNumber || index + 1;
      const slots = Array.isArray(item.slots) ? item.slots : [];
      const studentCount =
        studentsPerClass[item.classNumber - 1] ?? studentsPerClass[index] ?? null;
      const studentSuffix = studentCount ? ` (${studentCount} คน)` : '';

      if (!slots.length) {
        bookingDetails += `\n  - ห้อง ${classLabel}${studentSuffix}: ไม่พบข้อมูลรายวิชา`;
        return;
      }

      slots.forEach((slot) => {
        const subjectName =
          (slot.subject && typeof slot.subject === 'object' && slot.subject.name_th) ||
          slot.name_th ||
          (typeof slot.subject === 'string' ? translateSubject(slot.subject) : '-');
        const codeValue =
          (slot.subject && typeof slot.subject === 'object' && slot.subject.code) ||
          slot.code ||
          null;
        const codeSuffix = codeValue ? ` (${codeValue})` : '';
        const dateLabel = slot.date ? formatBuddhistDate(new Date(slot.date)) : '-';
        const slotLabel = slot.slot || slot.time || '';
        const scheduleInfo = slotLabel ? `${dateLabel} • ${slotLabel}` : dateLabel;
        bookingDetails += `\n  - ห้อง ${classLabel}${studentSuffix}: ${subjectName}${codeSuffix} • ${scheduleInfo}`;
      });
    });
  }

  const firstSelectedDate = Array.isArray(reservation.selectedDates) && reservation.selectedDates.length
    ? formatBuddhistDate(reservation.selectedDates[0])
    : '-';
  const totalClasses = countUniqueClasses(reservation.classSubjects || []) || reservation.numberOfClasses || 1;
  const totalStudents = studentsPerClass.reduce((acc, value) => {
    const numeric = Number(value);
    return acc + (Number.isFinite(numeric) && numeric > 0 ? numeric : 0);
  }, 0);
  const contactEmail = reservation.mail || reservation.email || reservation.userInfo?.email || '-';

  let message = `มีการจองใหม่:
    \nรหัสการจอง - ${reservation.reservationNumber}
    \nผู้ดำเนินการจอง - ${translatePrefix(reservation.prefix)}${reservation.name} ${reservation.surname}
    \nโรงเรียน - ${reservation.school}
    \nโทรศัพท์ - ${reservation.telephone}
    \nอีเมล - ${contactEmail}
    \nจำนวนนักเรียน - ${totalStudents || reservation.numberOfStudents || '-'} คน
    \nจำนวนห้องเรียน - ${totalClasses} ห้อง
    \nวันที่ทำการจอง - ${firstSelectedDate}
    \n\nรายละเอียดการจอง:${bookingDetails || '\n  - ไม่พบข้อมูลรายวิชา'}
    \n\nค่าบริการรวม: ${reservation.price} บาท`;

  return message;
};

module.exports = generateLineMessage;
