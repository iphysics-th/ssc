import React from 'react';
import { useFormData } from '../../contexts/FormDataContext';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, message, Typography } from 'antd';
import axios from 'axios';
import '../../css/Reservation/SummaryPage.css';
import { useSelector } from 'react-redux';

dayjs.locale('th');

const backendUrl = process.env.REACT_APP_BACKEND_URL;

const saveToDatabase = async (data) => {
  try {
    const response = await axios.post(`${backendUrl}/api/reservation/create`, data);
    console.log('Data saved:', response.data);
    message.success('การจองสำเร็จ!');
  } catch (error) {
    console.error('Error saving data:', error);
    message.error('การจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  }
};

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) {
    return '-';
  }
  const buddhistYear = date.year() + 543;
  const monthName = date.locale('th').format('MMMM');
  return `${date.format('D')} ${monthName} ${buddhistYear}`;
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

const SummaryPage = () => {
  const { formData } = useFormData();
  const authUser = useSelector(state => state.auth.user);
  const userInfo = authUser && typeof authUser === 'object' ? authUser : null;
  const userId = userInfo?.id || userInfo?._id || null;

  const {
    numberOfDays,
    numberOfStudents,
    numberOfClasses = 1,
    classSubjects = [],
    name,
    surname,
    prefix,
    status,
    telephone,
    mail,
    school,
    schoolSize,
    reservationNumber,
    selectedDates = [],
    studentRange,
    studentLevel
  } = formData;

  const navigate = useNavigate();

  const goBackToUserInfo = () => {
    navigate('/user-info');
  };

  const calculatePrice = (days, students) => {
    // Existing pricing logic retained
    let pricePerStudent = 0;

    if (days === 0.5) {
      if (students <= 25) {
        pricePerStudent = [4500, 2500, 1800, 1200, 1000, 900, 800, 750, 650, 600, 590, 550, 500, 480, 450, 420, 400, 390, 380, 350, 330, 320, 310, 300, 300][students - 1];
      } else {
        pricePerStudent = 300;
      }
    } else if (days === 1) {
      if (students <= 25) {
        pricePerStudent = [8000, 4500, 2800, 2200, 2000, 1800, 1500, 1200, 1100, 1050, 1000, 900, 820, 800, 750, 720, 700, 680, 650, 620, 600, 580, 550, 530, 520][students - 1];
      } else if (students <= 30) {
        pricePerStudent = 500;
      } else if (students <= 39) {
        pricePerStudent = 450;
      } else if (students <= 49) {
        pricePerStudent = 420;
      } else if (students <= 59) {
        pricePerStudent = 400;
      } else if (students <= 69) {
        pricePerStudent = 380;
      } else if (students <= 79) {
        pricePerStudent = 350;
      } else if (students <= 89) {
        pricePerStudent = 320;
      } else if (students <= 99) {
        pricePerStudent = 330;
      } else {
        pricePerStudent = 300;
      }
    } else if (days === 1.5) {
      if (students <= 25) {
        pricePerStudent = [12000, 6500, 4200, 3200, 2800, 2500, 2000, 1800, 1600, 1500, 1400, 1300, 1250, 1200, 1100, 1050, 1000, 980, 950, 900, 850, 820, 800, 790, 750][students - 1];
      } else if (students <= 30) {
        pricePerStudent = 700;
      } else if (students <= 39) {
        pricePerStudent = 650;
      } else if (students <= 49) {
        pricePerStudent = 600;
      } else if (students <= 59) {
        pricePerStudent = 550;
      } else if (students <= 69) {
        pricePerStudent = 500;
      } else if (students <= 79) {
        pricePerStudent = 450;
      } else if (students <= 89) {
        pricePerStudent = 400;
      } else if (students <= 99) {
        pricePerStudent = 350;
      } else {
        pricePerStudent = 330;
      }
    } else if (days === 2) {
      if (students <= 25) {
        pricePerStudent = [15000, 8000, 5300, 4200, 3500, 3000, 2500, 2200, 2000, 1900, 1800, 1700, 1600, 1500, 1400, 1350, 1300, 1250, 1200, 1150, 1100, 1050, 1020, 1000, 980][students - 1];
      } else if (students <= 30) {
        pricePerStudent = 900;
      } else if (students <= 39) {
        pricePerStudent = 800;
      } else if (students <= 49) {
        pricePerStudent = 700;
      } else if (students <= 59) {
        pricePerStudent = 650;
      } else if (students <= 69) {
        pricePerStudent = 600;
      } else if (students <= 79) {
        pricePerStudent = 550;
      } else if (students <= 89) {
        pricePerStudent = 520;
      } else if (students <= 99) {
        pricePerStudent = 500;
      } else {
        pricePerStudent = 480;
      }
    }

    return students * pricePerStudent;
  };

  const price = calculatePrice(numberOfDays, numberOfStudents);

  const saveData = async () => {
    const classSubjectsPayload = (classSubjects || []).map((classItem, index) => {
      const slots = Array.isArray(classItem?.slots)
        ? classItem.slots.map((slot) => {
            const slotSubject =
              slot?.subject ||
              (slot?.code || slot?.name_th
                ? { code: slot.code || null, name_th: slot.name_th || null }
                : null);
            return {
              slotIndex: slot?.slotIndex ?? null,
              date: slot?.date ? dayjs(slot.date).toDate() : null,
              slot: slot?.slot || null,
              subject: slotSubject,
              code: slotSubject?.code || null,
              name_th: slotSubject?.name_th || null,
              level: slot?.level || null,
              levelLabel: slot?.levelLabel || null,
              category: slot?.category || null,
              categoryLabel: slot?.categoryLabel || null,
              subcategory: slot?.subcategory || null,
              subcategoryLabel: slot?.subcategoryLabel || null,
            };
          })
        : [];

      return {
        classNumber: classItem?.classNumber || index + 1,
        slots,
      };
    });

    const slotSelections = classSubjectsPayload.flatMap((item) =>
      (item.slots || []).map((slot) => ({
        classNumber: item.classNumber,
        slotIndex: slot.slotIndex ?? null,
        date: slot.date,
        time: slot.slot,
        slot: slot.slot,
        subject: slot.subject || null,
        code: slot.code,
        name_th: slot.name_th,
        level: slot.level,
        levelLabel: slot.levelLabel,
        category: slot.category,
        categoryLabel: slot.categoryLabel,
        subcategory: slot.subcategory,
        subcategoryLabel: slot.subcategoryLabel,
      }))
    );

    const dataToSave = {
      numberOfDays,
      numberOfStudents,
      numberOfClasses,
      classSubjects: classSubjectsPayload,
      studentRange,
      studentLevel,
      name,
      surname,
      prefix,
      status,
      telephone,
      mail,
      school,
      schoolSize,
      reservationNumber,
      price,
      selectedDates: (selectedDates || []).map((date) => dayjs(date).toDate()),
      slotSelections,
      userInfo: userInfo
        ? {
            username: userInfo.username,
            email: userInfo.email,
          }
        : {},
      userId,
    };

    await saveToDatabase(dataToSave);
  };

  return (
    <div className="summary-container">
      <Typography.Title level={3} className="summary-title">สรุปข้อมูลการจอง</Typography.Title>
      <div className="summary-details">
        <p><strong>ชื่อ-สกุล:</strong> {`${translatePrefix(prefix)} ${name} ${surname}`}</p>
        <p><strong>ตำแหน่ง:</strong> {translateStatus(status)}</p>
        <p><strong>โทรศัพท์:</strong> {telephone}</p>
        <p><strong>อีเมล:</strong> {mail}</p>
        <p><strong>โรงเรียน:</strong> {school}</p>
        <p><strong>ขนาดโรงเรียน:</strong> {translateSchoolSize(schoolSize)}</p>
        <p><strong>จำนวนนักเรียนที่เข้าอบรม:</strong> {numberOfStudents} คน</p>
        <p><strong>จำนวนห้องเรียน:</strong> {numberOfClasses}</p>
        <p><strong>ช่วงชั้น:</strong> {studentRange}</p>
        <p><strong>ระดับชั้น:</strong> {studentRange ? (studentRange === 'มัธยม' ? 'ม.' : 'ป.') : ''}{studentLevel ?? '-'}</p>
        <p><strong>จำนวนวัน:</strong> {numberOfDays} วัน</p>
      </div>

      <Typography.Title level={4} className="booking-details-title">รายละเอียดการจอง</Typography.Title>
      <div className="booking-details">
        <div style={{ marginBottom: 16 }}>
          <p><strong>วันที่อบรม:</strong></p>
          {selectedDates && selectedDates.length ? (
            <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
              {selectedDates.map((date) => (
                <li key={date}>{formatBuddhistDate(date)}</li>
              ))}
            </ul>
          ) : (
            <p>ยังไม่ได้เลือกวันที่</p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <p><strong>วิชาตามห้องเรียน:</strong></p>
          {classSubjects && classSubjects.length ? (
            <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
              {classSubjects.map((classItem, index) => (
                <li key={`class-${index}`}>
                  <strong>ห้องเรียนที่ {classItem?.classNumber ?? index + 1}</strong>
                  {Array.isArray(classItem?.slots) && classItem.slots.length ? (
                    <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                      {classItem.slots.map((slot, slotIndex) => (
                        <li key={`class-${index}-slot-${slotIndex}`}>
                          {(slot?.date && formatBuddhistDate(slot.date)) || '-'}
                          {slot?.slot ? ` • ${slot.slot}` : ''}
                          {` • ${(slot?.subject?.name_th || slot?.name_th || '-')}`}
                          {slot?.subject?.code || slot?.code ? ` (${slot?.subject?.code || slot?.code})` : ''}
                          {slot?.levelLabel ? ` • ระดับ: ${slot.levelLabel}` : ''}
                          {slot?.categoryLabel ? ` • กลุ่มวิชา: ${slot.categoryLabel}` : ''}
                          {slot?.subcategoryLabel ? ` • สาขาย่อย: ${slot.subcategoryLabel}` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span> • ยังไม่ได้เลือกวิชา</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>ยังไม่ได้เลือกวิชา</p>
          )}
        </div>

        {reservationNumber && (
          <p className="reservation-number">
            <strong>หมายเลขการจองของคุณ:</strong> {reservationNumber}
            <Button onClick={async () => {
              try {
                await navigator.clipboard.writeText(reservationNumber);
                message.success('คัดลอกหมายเลขการจองเรียบร้อยแล้ว!');
              } catch (error) {
                message.error('ไม่สามารถคัดลอกหมายเลขการจองได้');
              }
            }} style={{ marginLeft: '10px' }}>COPY!</Button>
          </p>
        )}
      </div>

      <p className="total-price">
        <strong>ค่าบริการรวม:</strong> {`${price} บาท`}
      </p>

      <a
        href="/utility/calculation.jpg"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-block', marginTop: '10px', color: '#1890ff', textDecoration: 'underline' }}
      >
        ตารางการคำนวณค่าเรียน คลิก!!
      </a>

      <div className="summary-actions">
        <Button onClick={goBackToUserInfo} style={{ marginRight: '10px' }}>กลับไปหน้าก่อน</Button>
        <Button type="primary" onClick={saveData}>ยืนยันการจอง</Button>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginTop: 24 }}
        message={
          <div>
            <strong>📌 หมายเหตุ:</strong><br />
            <ol style={{ paddingLeft: '20px', marginBottom: 0 }}>
              <li>ระบบรองรับการจองห้องเรียน 1 - 5 ห้องต่อครั้ง โดยใช้รายละเอียดการเดินทางชุดเดียวกัน</li>
              <li>โปรดตรวจสอบรายชื่อวิชาในแต่ละห้องเรียนก่อนยืนยันการจอง</li>
              <li>หากต้องการแก้ไขข้อมูล ให้ใช้ปุ่ม \"กลับไปหน้าก่อน\" เพื่อปรับรายละเอียด</li>
              <li>หลังยืนยันการจอง จะมีอีเมลแจ้งยืนยันอัตโนมัติ</li>
              <li>สามารถตรวจสอบสถานะการจองได้ที่หน้าแรก (ssc.skru.ac.th)</li>
            </ol>
          </div>
        }
      />
    </div>
  );
};

export default SummaryPage;
