const dayjs = require('dayjs');

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

  let classData = [];
  if (Array.isArray(reservation.classSubjects) && reservation.classSubjects.length) {
    classData = reservation.classSubjects;
  } else if (Array.isArray(reservation.slotSelections) && reservation.slotSelections.length) {
    const grouped = reservation.slotSelections.reduce((acc, slot) => {
      const classNumber = slot.classNumber || 1;
      if (!acc[classNumber]) {
        acc[classNumber] = [];
      }
      acc[classNumber].push(slot);
      return acc;
    }, {});

    classData = Object.entries(grouped).map(([classNumber, slots]) => ({
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
  }

  if (classData.length) {
    bookingDetails += '\n\nรายวิชาตามห้องเรียน:';
    classData.forEach((item, index) => {
      const classLabel = item.classNumber || index + 1;
      const slots = Array.isArray(item.slots) ? item.slots : [];
      if (!slots.length) {
        bookingDetails += `\n  - ห้อง ${classLabel}: ไม่พบข้อมูลรายวิชา`;
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
        bookingDetails += `\n  - ห้อง ${classLabel}: ${subjectName}${codeSuffix} • ${scheduleInfo}`;
      });
    });
  }

  const firstSelectedDate = Array.isArray(reservation.selectedDates) && reservation.selectedDates.length
    ? formatBuddhistDate(reservation.selectedDates[0])
    : '-';
  const totalClasses = reservation.numberOfClasses || classData.length || 1;
  const contactEmail = reservation.mail || reservation.email || reservation.userInfo?.email || '-';

  let message = `มีการจองใหม่:
    \nรหัสการจอง - ${reservation.reservationNumber}
    \nผู้ดำเนินการจอง - ${translatePrefix(reservation.prefix)}${reservation.name} ${reservation.surname}
    \nโรงเรียน - ${reservation.school}
    \nโทรศัพท์ - ${reservation.telephone}
    \nอีเมล - ${contactEmail}
    \nจำนวนนักเรียน - ${reservation.numberOfStudents} คน
    \nจำนวนห้องเรียน - ${totalClasses} ห้อง
    \nวันที่ทำการจอง - ${firstSelectedDate}
    \n\nรายละเอียดการจอง:${bookingDetails || '\n  - ไม่พบข้อมูลรายวิชา'}
    \n\nค่าบริการรวม: ${reservation.price} บาท`;

  return message;
};

module.exports = generateLineMessage;
