import React, { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Card, Calendar, Alert, Select, Space, Row, Col, Button, InputNumber, Form, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useFormData } from '../../../contexts/FormDataContext';
import SubjectSelectionModal from '../components/SubjectModal';
import Protected from '../../../hooks/userProtected';
import '../../../css/Reservation/CourseSelection.css';
import { message } from 'antd';
import {
  useGetConfirmedReservationsQuery,
  useLazyCheckReservationNumberQuery,
} from '../reservationApiSlice';

dayjs.locale('th');

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

const timeSlots = ['คาบเช้า (9:00 - 12:00)', 'คาบบ่าย (13:00 - 16:00)'];

const CourseSelection = () => {
  const [studentRange, setStudentRange] = useState('มัธยม');
  const [studentLevel, setStudentLevel] = useState(1);
  const [value, setValue] = useState(dayjs());
  const [startDate, setStartDate] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [numberOfDays, setNumberOfDays] = useState('1');
  const [numberOfStudents, setNumberOfStudents] = useState(1); // Initialize with 1 student
  const [slotSelections, setSlotSelections] = useState({});
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false); // State for modal visibility
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData(); // Use the context
  const [currentSelection, setCurrentSelection] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingContext, setEditingContext] = useState({ date: null, slot: null });
  const { data: availabilityData } = useGetConfirmedReservationsQuery();
  const [triggerReservationCheck] = useLazyCheckReservationNumberQuery();


  const confirmedReservations = useMemo(() => {
    if (!availabilityData?.confirmed) {
      return [];
    }
    return availabilityData.confirmed.map((reservation) => ({
      dates: (reservation.selectedDates || []).map((date) =>
        dayjs(date).format('YYYY-MM-DD')
      ),
      school: reservation.school,
    }));
  }, [availabilityData]);

  const processedReservations = useMemo(() => {
    if (!availabilityData?.processed) {
      return [];
    }
    return availabilityData.processed.map((reservation) => ({
      dates: (reservation.selectedDates || []).map((date) =>
        dayjs(date).format('YYYY-MM-DD')
      ),
      school: reservation.school,
    }));
  }, [availabilityData]);

  useEffect(() => {
    const newSlotSelections = { ...slotSelections };
    selectedDates.forEach(date => {
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      if (!newSlotSelections[dateStr]) {
        newSlotSelections[dateStr] = {};
        for (let i = 0; i < timeSlots.length; i++) {
          if (!newSlotSelections[dateStr][timeSlots[i]]) {
            newSlotSelections[dateStr][timeSlots[i]] = 'physics'; // Set default subject to physics
          }
        }
      }
    });
    setSlotSelections(newSlotSelections);
  }, [selectedDates, slotSelections]);

  const checkReservationNumberUnique = async (reservationNumber) => {
    try {
      const response = await triggerReservationCheck(reservationNumber).unwrap();
      return !response?.exists; // If it exists, we return false, meaning it's not unique
    } catch (error) {
      console.error('Error checking reservation number:', error);
      return false;
    }
  };

  useEffect(() => {
    const generateAndCheckNumber = async () => {
      let unique = false;
      let number;
      while (!unique) {
        number = Math.random().toString(36).substr(2, 9).toUpperCase();
        unique = await checkReservationNumberUnique(number);
      }
      updateFormData({ ...formData, reservationNumber: number });
    };

    if (!formData.reservationNumber) {
      generateAndCheckNumber();
    }
  }, []);

  useEffect(() => {
    if (formData.selectedDates && formData.numberOfDays && formData.slotSelections && formData.numberOfStudents) {
      setSelectedDates(formData.selectedDates);
      setNumberOfDays(String(formData.numberOfDays));
      setSlotSelections(formData.slotSelections);
      setNumberOfStudents(formData.numberOfStudents); // Set initial value from form data
    }
  }, [formData]);

  const goToUserInfoForm = () => {
    updateFormData({
      ...formData,
      numberOfDays: parseFloat(numberOfDays),
      numberOfStudents,
      selectedDates,
      slotSelections,
      studentRange,
      studentLevel
    });

    navigate('/user-info');
  };

  const onSelect = (newValue) => {
    const day = newValue.day(); // 0 = Sunday, 6 = Saturday
    const dateOnly = newValue.startOf('day');

    const blockedStart = dayjs('2025-08-06');
    const blockedEnd = dayjs('2025-09-30');

    // Block all days in the specified range
    if (dateOnly.isSame(blockedStart) || dateOnly.isSame(blockedEnd) || (dateOnly.isAfter(blockedStart) && dateOnly.isBefore(blockedEnd))) {
      message.warning('ไม่สามารถเลือกวันที่ระหว่างวันที่ 6 สิงหาคม ถึง 30 กันยายนได้');
      return;
    }

    // Block weekdays as usual
    if (day !== 0 && day !== 6) {
      message.warning('สามารถเลือกได้เฉพาะวันเสาร์และวันอาทิตย์เท่านั้น');
      return;
    }

    setStartDate(newValue);

    const dates = [newValue];
    for (let i = 1; i < Math.ceil(numberOfDays); i++) {
      dates.push(newValue.add(i, 'day'));
    }

    setSelectedDates(dates);
  };




  const dateCellRender = (value) => {
    const formatValue = value.format('YYYY-MM-DD');
    const day = value.day();
    const isWeekend = day === 0 || day === 6;

    const confirmed = confirmedReservations.filter(r => r.dates.includes(formatValue));
    const processed = processedReservations.filter(r => r.dates.includes(formatValue));
    const isSelected = selectedDates.some(date => date.isSame(value, 'day'));

    const cellStyle = isWeekend
      ? {}
      : { opacity: 0.4, pointerEvents: 'none', cursor: 'not-allowed' };

    return (
      <div style={cellStyle}>
        {confirmed.map((r, index) => (
          <div key={`c-${index}`} style={{ backgroundColor: '#E86447', color: 'white', marginBottom: '2px', padding: '2px 4px', borderRadius: 4 }}>
            {r.school}
          </div>
        ))}
        {processed.map((r, index) => (
          <div key={`p-${index}`} style={{ backgroundColor: '#B0B0B0', color: 'white', marginBottom: '2px', padding: '2px 4px', borderRadius: 4 }}>
            {r.school}
          </div>
        ))}
        {isSelected && (
          <div style={{ backgroundColor: '#1890ff', color: 'white', padding: '2px 4px', borderRadius: 4 }}>
            {value.date()}
          </div>
        )}
      </div>
    );
  };



  const handleDaysChange = (value) => {
    setNumberOfDays(parseFloat(value));
    setStartDate(null);
    setSelectedDates([]);
  };

  const handleSubjectChange = (date, slot, subject) => {
    const newSelections = { ...slotSelections };
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    if (!newSelections[dateStr]) {
      newSelections[dateStr] = {};
    }
    newSelections[dateStr][slot] = subject || 'physics';
    setSlotSelections(newSelections);
  };

  const formatBuddhistDate = (date) => {
    const buddhistYear = date.year() + 543; // Convert to Buddhist Era
    const month = monthMapping[date.format('MMMM')];
    return `${date.format('D')} ${month} ${buddhistYear}`;
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const [currentDate, setCurrentDate] = useState(null);
  const [currentSlot, setCurrentSlot] = useState(null);

  const showModal = (date, slot) => {
    setEditingContext({ date, slot });
    setIsModalVisible(true);
  };

  const onSubjectSelected = (selectedDetails) => {
    const { date, slot } = editingContext;
    const dateStr = dayjs(date).format('YYYY-MM-DD');

    if (!slotSelections[dateStr]) {
      slotSelections[dateStr] = {};
    }

    slotSelections[dateStr][slot] = {
      code: selectedDetails.code,
      name_th: selectedDetails.name_th,
    };

    setSlotSelections({ ...slotSelections });
    setIsModalVisible(false);
    setEditingContext({ date: null, slot: null });
  };

  const renderTimeSlots = () => {
    return selectedDates.map((date, index) => {
      const dateSlots = [];
      for (let i = 0; i < Math.min(timeSlots.length, (numberOfDays * 2) - (index * 2)); i++) {
        const slot = timeSlots[i % 2];
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        const subjectCode = slotSelections[dateStr] && slotSelections[dateStr][slot] ? slotSelections[dateStr][slot].code : null;
        const subjectName = slotSelections[dateStr] && slotSelections[dateStr][slot] ? slotSelections[dateStr][slot].name_th : 'Choose Subject';
        dateSlots.push(
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <Card
              title={slot}
              bordered={false}
              style={{ width: '100%', boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)', transition: '0.3s' }}
            >
              <Button type="dashed" onClick={() => showModal(date, slot)} style={{ marginBottom: '10px', width: '100%' }}>
                {subjectName}
              </Button>
              {subjectCode && (
                <div>
                  <p><strong>ชื่อคอร์ส:</strong> {subjectName}</p>
                  <p><strong>Code:</strong> {subjectCode}</p>
                </div>
              )}
            </Card>
          </Col>
        );
      }
      return (
        <div key={index} style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>{formatBuddhistDate(dayjs(date))}</h3>
          <Row gutter={[16, 16]}>
            {dateSlots}
          </Row>
        </div>
      );
    });
  };

  return (
    <Protected>
      <Row justify="center" className="course-selection-container">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          {/* Section 1 */}
          <div className="section">
            <h2>1. จำนวนผู้เข้าอบรม</h2>
            <div className="student-info-box">
              {numberOfStudents > 0 && (
                <div className="count-box">
                  {numberOfStudents} คน
                </div>
              )}
              <Button
                type="primary"
                onClick={() => setIsStudentModalVisible(true)}
                size="middle"
              >
                กรอกข้อมูล
              </Button>
            </div>
          </div>

          {/* Section 2 */}
          <div className="section">
            <h2>2. เลือกจำนวนวันที่ต้องการอบรม</h2>
            <Select
              value={numberOfDays}
              style={{ width: '100%' }}
              onChange={handleDaysChange}
              options={[
                { value: '1', label: '1 วัน' },
                //{ value: '1.5', label: '1.5 วัน' },
                { value: '2', label: '2 วัน' },
                //{ value: '2.5', label: '2.5 วัน' },
                { value: '3', label: '3 วัน' },
              ]}
            />
          </div>


          {/* Section 3 */}
          <p></p>
          <div className="section">
            <h2>3. เลือกวันที่ต้องการอบรม</h2>
            <div className="calendar-rules-notice" style={{ marginBottom: '16px' }}>
              <Alert
                type="info"
                showIcon
                message={
                  <div>
                    <strong>📌 หมายเหตุ:</strong><br />
                    เวลาเรียนสามารถเลือกได้เฉพาะ:
                    <ol style={{ paddingLeft: '20px', marginBottom: 0 }}>
                      <li>วันเสาร์หรือวันอาทิตย์</li>
                      <li>ไม่อยู่ในช่วงวันที่ 6 สิงหาคม - 30 กันยายน</li>
                      <li>ไม่ตรงกับช่วงวันหยุดยาว เช่น ปีใหม่ หรือสงกรานต์</li>
                    </ol>
                  </div>
                }
              />
            </div>

            <div className="calendar-alert">
              <Alert message={`คุณเลือกวันที่: ${selectedDates.map(date => formatBuddhistDate(dayjs(date))).join(', ')}`} />
            </div>

            <div className="calendar-scroll-wrapper">
              <div className="calendar-fixed-width">
                <Calendar
                  onSelect={onSelect}
                  dateCellRender={dateCellRender}
                />
              </div>
            </div>

            {value && (
              <div style={{ marginTop: 16 }}>
                <h4>รายละเอียดการจองวันที่ {formatBuddhistDate(value)}</h4>
                {[...confirmedReservations, ...processedReservations]
                  .filter(r => r.dates.includes(value.format('YYYY-MM-DD')))
                  .map((r, index) => (
                    <p key={index}>🏫 {r.school}</p>
                  ))}
              </div>
            )}


            <div className="legend-box">
              <span>
                <span className="legend-item" style={{ backgroundColor: '#E86447' }}>ไม่ว่าง</span> - ยืนยันการจองแล้ว
              </span>
              <span>
                <span className="legend-item" style={{ backgroundColor: '#B0B0B0' }}>ไม่ว่าง</span> - ดำเนินการแล้ว (รอชำระเงิน)
              </span>
              <span>
                <span className="legend-item" style={{ backgroundColor: '#1890ff' }}>เลือก</span> - ช่วงเวลาที่คุณเลือก
              </span>
            </div>
          </div>


          {/* Section 4 */}
          <p></p>
          <p></p>
          <div className="section">
            <h2>4. เลือกวิชาที่ต้องการอบรม</h2>

            {/* 🔔 Notice about greyed-out courses */}
            <div className="calendar-rules-notice" style={{ marginBottom: '16px' }}>
              <Alert
                type="info"
                showIcon
                message={
                  <div>
                    <strong>📌 หมายเหตุ:</strong><br />
                    <ol style={{ paddingLeft: '20px', marginBottom: 0 }}>
                      <li>คอร์สเรียนที่ขึ้นตัวอักษรที่ขึ้นสีเทา หมายถึงเต็มแล้วสำหรับภาคการศึกษานี้</li>
                    </ol>
                  </div>
                }
              />
            </div>

            {renderTimeSlots()}

            <SubjectSelectionModal
              isModalVisible={isModalVisible}
              handleCancel={handleCancel}
              onSubjectSelected={onSubjectSelected}
              numberOfStudents={numberOfStudents}
            />
          </div>


          {/* Reservation number and Next */}
          <div className="course-selection-footer">
            {formData.reservationNumber && (
              <p className="reservation-number">
                <strong>หมายเลขการจองของคุณ:</strong> {formData.reservationNumber}
              </p>
            )}
            <Button type="primary" onClick={goToUserInfoForm} size="large">หน้าถัดไป</Button>
          </div>
        </Col>
      </Row>

      {/* Modal */}
      <Modal
        title="กรอกจำนวนนักเรียน"
        visible={isStudentModalVisible}
        onCancel={() => setIsStudentModalVisible(false)}
        onOk={() => {
          setIsStudentModalVisible(false);
          updateFormData({ ...formData, numberOfStudents, studentRange, studentLevel });
        }}
      >
        <Form.Item
          label="จำนวนนักเรียนที่เข้าอบรม"
          name="numberOfStudents"
          rules={[{ required: true, message: 'กรุณากรอกจำนวนนักเรียน!' }]}
        >
          <InputNumber
            min={1}
            max={150}
            value={numberOfStudents}
            onChange={(value) => setNumberOfStudents(value)}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="ช่วงชั้น"
          name="studentRange"
          rules={[{ required: true, message: 'กรุณาเลือกช่วงชั้น!' }]}
        >
          <Select
            value={studentRange}
            onChange={(value) => setStudentRange(value)}
            options={[
              { value: 'ประถม', label: 'ประถม' },
              { value: 'มัธยม', label: 'มัธยม' }
            ]}
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          label="ระดับชั้น"
          name="studentLevel"
          rules={[{ required: true, message: 'กรุณาเลือกระดับชั้น!' }]}
        >
          <Select
            value={studentLevel}
            onChange={(value) => setStudentLevel(value)}
            options={[1, 2, 3, 4, 5, 6].map(level => ({
              value: level,
              label: `${level}`
            }))}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Modal>

    </Protected>
  );
};

export default CourseSelection;
