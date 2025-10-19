import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Tag } from 'antd'; // Import Ant Design Tag for colored status
import '../../../css/Reservation/ReserveCheck.css';
import { useLazySearchReservationQuery } from '../reservationApiSlice';
import { groupClassSubjects } from '../utils/classGrouping';

const ReserveCheck = forwardRef(({ onPrev }, ref) => {
  const [reservationNumber, setReservationNumber] = useState('');
  const [reservationData, setReservationData] = useState(null);
  const [error, setError] = useState(null);
  const [searchReservation, { isFetching }] = useLazySearchReservationQuery();

  useImperativeHandle(ref, () => ({
    prev: () => onPrev?.(),
  }));

  const handleInputChange = (e) => {
    setReservationNumber(e.target.value);
  };

  const handleSearch = async () => {
    if (!reservationNumber) {
      setError('กรุณากรอกหมายเลขการจองของคุณ');
      setReservationData(null);
      return;
    }

    try {
      const data = await searchReservation(reservationNumber).unwrap();
      setReservationData(data);
      setError(null);
    } catch (err) {
      setError('ไม่พบหมายเลขการจอง');
      setReservationData(null);
    }
  };

  const translatePrefix = (prefix) => {
    switch (prefix) {
      case 'mr': return 'นาย';
      case 'ms': return 'นางสาว';
      case 'mrs': return 'นาง';
      case 'dr': return 'ดร.';
      default: return prefix;
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'teacher': return 'ครู';
      case 'school_representative': return 'ตัวแทนโรงเรียน';
      case 'principal': return 'ผู้อำนวยการ';
      case 'vice_principal': return 'รองผู้อำนวยการ';
      default: return status;
    }
  };

  const translateSchoolSize = (size) => {
    switch (size) {
      case 'small': return 'โรงเรียนขนาดเล็ก';
      case 'medium': return 'โรงเรียนขนาดกลาง';
      case 'large': return 'โรงเรียนขนาดใหญ่';
      case 'very_large': return 'โรงเรียนขนาดใหญ่พิเศษ';
      default: return size;
    }
  };

  const translateConfirmation = (confirmation) => {
    switch (confirmation) {
      case 'received': return 'ได้รับข้อมูลการจอง';
      case 'processed': return 'รอชำระเงิน';
      case 'confirmed': return 'ยืนยันการจอง';
      default: return confirmation;
    }
  };

  const getColorForConfirmation = (confirmation) => {
    switch (confirmation) {
      case 'confirmed': return 'green';
      case 'processed': return 'red';
      case 'received': return 'red';
      default: return 'blue';
    }
  };

  const formatThaiDate = (date) => {
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const d = new Date(date);
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    const year = d.getFullYear() + 543; // Convert to Buddhist Era (BE)
    return `${day} ${month} ${year}`;
  };

  const formatCurrency = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return '-';
    return num.toLocaleString('th-TH');
  };

  return (
    <div className="reservation-lookup-container">
      <h1>ตรวจสอบการจอง</h1>
      <input
        type="text"
        placeholder="กรอกหมายเลขการจอง"
        value={reservationNumber}
        onChange={handleInputChange}
        className="reservation-input"
      />
      <button onClick={handleSearch} className="search-button" disabled={isFetching}>
        {isFetching ? 'กำลังค้นหา...' : 'ค้นหา'}
      </button>
      {error && <p className="error-message">{error}</p>}
      {reservationData && (() => {
        const groupedClasses = groupClassSubjects(reservationData.classSubjects || []);
        const studentsPerClass = Array.isArray(reservationData.studentsPerClass)
          ? reservationData.studentsPerClass
          : [];
        const totalClasses = groupedClasses.length || reservationData.numberOfClasses || 1;
        const totalStudents =
          studentsPerClass.reduce((acc, value) => {
            const numeric = Number(value);
            return acc + (Number.isFinite(numeric) && numeric > 0 ? numeric : 0);
          }, 0) || reservationData.numberOfStudents || 0;

        return (
          <div className="reservation-data">
          <h2>รายละเอียดการจอง</h2>
          {reservationData.reservationNumber && <p><strong>หมายเลขการจองของคุณ:</strong> {reservationData.reservationNumber}</p>}
          {reservationData.prefix && <p><strong>คำนำหน้า:</strong> {translatePrefix(reservationData.prefix)}</p>}
          {reservationData.name && reservationData.surname && <p><strong>ชื่อ - สกุล:</strong> {reservationData.name} {reservationData.surname}</p>}
          {reservationData.status && <p><strong>ตำแหน่ง:</strong> {translateStatus(reservationData.status)}</p>}
          {reservationData.telephone && <p><strong>โทรศัพท์:</strong> {reservationData.telephone}</p>}
          {reservationData.mail && <p><strong>อีเมล:</strong> {reservationData.mail}</p>}
          {reservationData.school && <p><strong>โรงเรียน:</strong> {reservationData.school}</p>}
          {reservationData.schoolSize && <p><strong>ขนาดโรงเรียน:</strong> {translateSchoolSize(reservationData.schoolSize)}</p>}
          {totalStudents > 0 && <p><strong>จำนวนนักเรียนที่เข้าอบรม:</strong> {totalStudents} คน</p>}
          {reservationData.studentRange && <p><strong>ช่วงชั้น:</strong> {reservationData.studentRange}</p>}
          {reservationData.studentLevel != null && (
            <p><strong>ระดับชั้น:</strong> {reservationData.studentRange === 'มัธยม' ? 'ม.' : 'ป.'}{reservationData.studentLevel}</p>
          )}
          <p><strong>จำนวนห้องเรียน:</strong> {totalClasses}</p>
          {reservationData.numberOfDays && <p><strong>จำนวนวัน:</strong> {reservationData.numberOfDays} วัน</p>}
          {reservationData.price != null && (
            <p><strong>ค่าบริการ:</strong> {formatCurrency(reservationData.price)} บาท</p>
          )}
          {reservationData.selectedDates && <p><strong>วันที่อบรม:</strong> {reservationData.selectedDates.map(date => formatThaiDate(date)).join(', ')}</p>}
          <br />
          {(() => {
            const groupedClasses = groupClassSubjects(reservationData.classSubjects || []);
            const studentsPerClass = Array.isArray(reservationData.studentsPerClass)
              ? reservationData.studentsPerClass
              : [];

            if (!groupedClasses.length) {
              return reservationData.slotSelections && reservationData.slotSelections.length > 0 ? (
                <>
                  <p><strong>รายละเอียดของคอร์สเรียน:</strong></p>
                  <table className="slot-selections-table">
                    <thead>
                      <tr>
                        <th>วันที่</th>
                        <th>เวลาเรียน</th>
                        <th>วิชา</th>
                        <th>รหัสวิชา</th>
                        <th>ราคา (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservationData.slotSelections.map((slot, index) => (
                        <tr key={index}>
                          <td>{formatThaiDate(slot.date)}</td>
                          <td>{slot.time}</td>
                          <td>{slot.name_th}</td>
                          <td>{slot.code}</td>
                          <td>{formatCurrency(slot.price ?? slot.subject?.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    {reservationData.price != null && (
                      <tfoot>
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            รวม
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                            {formatCurrency(reservationData.price)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </>
              ) : null;
            }

            return (
              <>
                <p><strong>รายละเอียดของคอร์สเรียน:</strong></p>
                <table className="slot-selections-table">
                  <thead>
                    <tr>
                      <th>ห้องเรียน</th>
                      <th>วันที่</th>
                      <th>ช่วงเวลา</th>
                      <th>วิชา</th>
                      <th>รหัสวิชา</th>
                      <th>นักเรียนต่อห้อง</th>
                      <th>ราคา (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedClasses.flatMap((classItem, classIndex) => {
                      const slots = Array.isArray(classItem?.slots) ? classItem.slots : [];
                      const studentCount =
                        studentsPerClass[classItem.classNumber - 1] ??
                        studentsPerClass[classIndex] ??
                        null;
                      return slots.map((slot, slotIndex) => (
                        <tr key={`class-${classIndex}-slot-${slotIndex}`}>
                          <td>{classItem.classNumber ? `ห้อง ${classItem.classNumber}` : `ห้อง ${classIndex + 1}`}</td>
                          <td>{slot.date ? formatThaiDate(slot.date) : '-'}</td>
                          <td>{slot.slot || '-'}</td>
                          <td>{slot.subject?.name_th || slot.name_th || '-'}</td>
                          <td>{slot.subject?.code || slot.code || '-'}</td>
                          <td>{studentCount ? studentCount.toLocaleString('th-TH') : '-'}</td>
                          <td>{formatCurrency(slot.price ?? slot.subject?.price)}</td>
                        </tr>
                      ));
                    })}
                  </tbody>
                  {reservationData.price != null && (
                    <tfoot>
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          รวม
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          {formatCurrency(reservationData.price)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </>
            );
          })()}
          <br />
          {reservationData.confirmation && (
            <p><strong>การยืนยัน:</strong>
              <Tag color={getColorForConfirmation(reservationData.confirmation)}>
                {translateConfirmation(reservationData.confirmation)}
              </Tag>
            </p>
          )}
          </div>
        );
      })()}
    </div>
  );
});

ReserveCheck.displayName = 'ReservationSuccess';

export default ReserveCheck;
