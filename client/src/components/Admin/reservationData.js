import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Select, message } from 'antd';

const ReservationTable = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const statusOptions = ['received', 'processed', 'confirmed', 'canceled'];

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/reservation/reservation-table`, {
        params: { page: 1, limit: 100 }
      });
      setReservations(response.data.data);
    } catch (error) {
      console.error("API Error:", error);
      message.error('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, field, value) => {
    try {
      await axios.put(`${backendUrl}/api/reservation/update-status`, {
        id,
        field,
        value,
      });
      message.success(`Updated ${field} to "${value}"`);
      fetchReservations();
    } catch (error) {
      console.error(`${field} update error:`, error);
      message.error(`Failed to update ${field}`);
    }
  };

  const confirmationDotColorMap = {
    received: '#B0B0B0',     // grey
    processed: '#FADB14',    // yellow
    confirmed: '#52C41A',    // green
    canceled: '#FF4D4F'      // red
  };


  const renderSelect = (record, field, value) => (
    <Select
      value={value}
      onChange={(newValue) => handleStatusChange(record.id, field, newValue)}
      style={{ width: 200 }}
      size="small"
    >
      {statusOptions.map(opt => (
        <Select.Option key={opt} value={opt}>
          <span style={{
            color: confirmationDotColorMap[opt],
            fontWeight: 'bold',
            marginRight: 6
          }}>●</span>
          {translateConfirmationStatus(opt)}
        </Select.Option>
      ))}
    </Select>
  );



  const columns = [
    {
      name: 'Confirmation',
      selector: row => row.confirmation,
      cell: row => renderSelect(row, 'confirmation', row.confirmation),
      sortable: true,
      width: '150px'
    },
    { name: 'Reservation #', selector: row => row.reservationNumber, sortable: true },
    { name: 'Status', selector: row => row.status },
    { name: 'Name', selector: row => row.name },
    { name: 'Surname', selector: row => row.surname },
    { name: 'Phone', selector: row => row.telephone },
    { name: 'School', selector: row => row.school },
    { name: 'Students', selector: row => row.numberOfStudents },
  ];

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

  const formatBuddhistDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const monthName = monthMapping[date.toLocaleString('en-US', { month: 'long' })];
    const buddhistYear = date.getFullYear() + 543;
    return `${date.getDate()} ${monthName} ${buddhistYear}`;
  };

  const translatePrefix = (prefix) => {
    const map = { mr: 'นาย', ms: 'นางสาว', mrs: 'นาง', dr: 'ดร.' };
    return map[prefix] || prefix;
  };

  const translateConfirmationStatus = (status) => {
    const map = {
      received: 'ได้รับข้อมูล',
      processed: 'กำลังดำเนินการ',
      confirmed: 'ยืนยันการจอง',
      canceled: 'ยกเลิกการจอง'
    };
    return map[status] || status;
  };


  const translateStatus = (status) => {
    const map = {
      teacher: 'ครู',
      school_representative: 'ตัวแทนโรงเรียน',
      principal: 'ผู้อำนวยการ',
      vice_principal: 'รองผู้อำนวยการ',
    };
    return map[status] || status;
  };

  const translateSchoolSize = (size) => {
    const map = {
      small: 'โรงเรียนขนาดเล็ก',
      medium: 'โรงเรียนขนาดกลาง',
      large: 'โรงเรียนขนาดใหญ่',
      very_large: 'โรงเรียนขนาดใหญ่พิเศษ',
    };
    return map[size] || size;
  };

  const ExpandedComponent = ({ data }) => (
    <div style={{ padding: '10px', fontSize: '14px', background: '#f9f9f9' }}>
      <h4 style={{ marginBottom: 8 }}>รายละเอียดการจอง</h4>
      <p><strong>หมายเลขการจอง:</strong> {data.reservationNumber}</p>
      <p>
        <strong>สถานะการดำเนินการ:</strong>{' '}
        <span style={{
          color: confirmationDotColorMap[data.confirmation],
          fontWeight: 'bold',
          marginRight: 6
        }}>●</span>
        {translateConfirmationStatus(data.confirmation)}
      </p>

      <p><strong>วันที่จอง:</strong> {formatBuddhistDate(data.createdAt)}</p>
      <p><strong>ตำแหน่ง:</strong> {translateStatus(data.status)}</p>
      <p><strong>ชื่อ-สกุล:</strong> {translatePrefix(data.prefix)} {data.name} {data.surname}</p>
      <p><strong>โทรศัพท์:</strong> {data.telephone}</p>
      <p><strong>อีเมล:</strong> {data.mail}</p>
      <p><strong>โรงเรียน:</strong> {data.school}</p>
      <p><strong>ขนาดโรงเรียน:</strong> {translateSchoolSize(data.schoolSize)}</p>
      <p><strong>ช่วงชั้น:</strong> {data.studentRange}</p>
      <p><strong>ระดับชั้น:</strong> {data.studentRange ? (data.studentRange === 'มัธยม' ? 'ม.' : 'ป.') : ''}{data.studentLevel ?? '-'}</p>
      <p><strong>จำนวนนักเรียน:</strong> {data.numberOfStudents}</p>
      <p><strong>จำนวนวัน:</strong> {data.numberOfDays}</p>
      <p><strong>ค่าบริการรวม:</strong> {data.price} บาท</p>
      <p><strong>วันอบรม:</strong> {data.selectedDates?.map(d => formatBuddhistDate(d)).join(', ') || '—'}</p>
      <p><strong>ข้อมูลผู้ใช้งาน:</strong> {data.userInfo ? `${data.userInfo.username || 'N/A'} (${data.userInfo.email || 'N/A'})` : 'N/A'}</p>
      <p><strong>รายวิชาที่เลือก:</strong></p>
      <ul style={{ paddingLeft: '20px' }}>
        {data.classSubjects && data.classSubjects.length > 0 ? (
          data.classSubjects.map((classItem, index) => (
            <li key={`class-${index}`}>
              <strong>ห้องเรียนที่ {classItem.classNumber ?? index + 1}</strong>
              {Array.isArray(classItem?.slots) && classItem.slots.length ? (
                <ul style={{ paddingLeft: '20px', marginTop: 4 }}>
                  {classItem.slots.map((slot, slotIndex) => (
                    <li key={`class-${index}-slot-${slotIndex}`}>
                      {slot.date ? formatBuddhistDate(slot.date) : '-'}
                      {slot.slot ? ` • ${slot.slot}` : ''}
                      {slot.subject?.name_th ? ` • ${slot.subject.name_th}` : slot.name_th ? ` • ${slot.name_th}` : ' • -'}
                      {slot.subject?.code ? ` (${slot.subject.code})` : slot.code ? ` (${slot.code})` : ''}
                      {slot.levelLabel ? ` • ระดับ: ${slot.levelLabel}` : ''}
                      {slot.categoryLabel ? ` • กลุ่มวิชา: ${slot.categoryLabel}` : ''}
                      {slot.subcategoryLabel ? ` • สาขาย่อย: ${slot.subcategoryLabel}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <span> • —</span>
              )}
            </li>
          ))
        ) : (
          (data.slotSelections || []).map((slot, index) => (
            <li key={index}>
              {formatBuddhistDate(slot.date)} เวลา {slot.time} ({slot.name_th}) [{slot.code}]
            </li>
          ))
        )}
      </ul>
    </div>
  );



  return (
    <div style={{ padding: '10px' }}>
      <h2 style={{ textAlign: 'center', color: '#1890ff' }}>Reservation Table</h2>
      <DataTable
        columns={columns}
        data={reservations}
        progressPending={loading}
        pagination
        responsive
        highlightOnHover
        striped
        dense
        expandableRows
        expandableRowsComponent={ExpandedComponent}
      />
    </div>
  );
};

export default ReservationTable;
