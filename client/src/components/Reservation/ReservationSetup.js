import React, { useEffect, useImperativeHandle, useMemo, useState, forwardRef } from 'react';
import { Alert, Button, Col, Form, InputNumber, Modal, Row, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import Protected from '../../hooks/userProtected';
import { useFormData } from '../../contexts/FormDataContext';
import '../../css/Reservation/CourseSelection.css';
import { useLazyCheckReservationNumberQuery } from '../../features/reservation/reservationApiSlice';

const dayOptions = [
  { value: '0.5', label: '0.5 วัน' },
  { value: '1', label: '1 วัน' },
  { value: '1.5', label: '1.5 วัน' },
  { value: '2', label: '2 วัน' },
  { value: '2.5', label: '2.5 วัน' },
  { value: '3', label: '3 วัน' },
];

const classOptions = Array.from({ length: 5 }, (_, index) => {
  const value = index + 1;
  return { value, label: `${value} ห้องเรียน` };
});

const ReservationSetup = forwardRef(({ onNext, embedded = false }, ref) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();
  const [triggerReservationCheck] = useLazyCheckReservationNumberQuery();

  const [numberOfDays, setNumberOfDays] = useState(String(formData.numberOfDays || '1'));
  const [numberOfClasses, setNumberOfClasses] = useState(
    formData.numberOfClasses ? Math.min(5, Math.max(1, formData.numberOfClasses)) : 1
  );
  const [numberOfStudents, setNumberOfStudents] = useState(formData.numberOfStudents || 1);
  const [studentRange, setStudentRange] = useState(formData.studentRange || 'มัธยม');
  const [studentLevel, setStudentLevel] = useState(formData.studentLevel || 1);
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);

  const normalizedClassOptions = useMemo(() => classOptions, []);

  const checkReservationNumberUnique = async (reservationNumber) => {
    try {
      const response = await triggerReservationCheck(reservationNumber).unwrap();
      return !response?.exists;
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
      updateFormData({ reservationNumber: number });
    };

    if (!formData.reservationNumber) {
      generateAndCheckNumber();
    }
  }, [formData.reservationNumber, updateFormData]);

  const handleOpenStudentModal = () => setIsStudentModalVisible(true);
  const handleCloseStudentModal = () => setIsStudentModalVisible(false);

  const handleStudentModalOk = () => {
    updateFormData({ numberOfStudents, studentRange, studentLevel });
    setIsStudentModalVisible(false);
  };

  const handleNext = () => {
    const parsedDays = parseFloat(numberOfDays);
    const sanitizedClasses = Math.min(5, Math.max(1, Number(numberOfClasses) || 1));

    const updates = {
      numberOfDays: parsedDays,
      numberOfClasses: sanitizedClasses,
      numberOfStudents,
      studentRange,
      studentLevel,
    };

    if (formData.numberOfDays && formData.numberOfDays !== parsedDays) {
      updates.selectedDates = [];
      updates.classSubjects = [];
    }

    if (formData.numberOfClasses && formData.numberOfClasses !== sanitizedClasses) {
      const existingSubjects = Array.isArray(formData.classSubjects) ? formData.classSubjects : [];
      updates.classSubjects =
        sanitizedClasses <= existingSubjects.length
          ? existingSubjects.slice(0, sanitizedClasses)
          : existingSubjects.slice();
    }

    updateFormData(updates);
    if (onNext) {
      onNext();
    } else {
      navigate('/dates');
    }
  };

  useImperativeHandle(ref, () => ({
    next: handleNext,
  }));

  return (
    <Protected>
      <Row justify="center" className="course-selection-container">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <div className="section">
            <h2>1. จำนวนผู้เข้าอบรม</h2>
            <div className="student-info-box">
              {numberOfStudents > 0 && (
                <div className="count-box">
                  {numberOfStudents} คน
                </div>
              )}
              <Button type="primary" onClick={handleOpenStudentModal} size="middle">
                กรอกข้อมูล
              </Button>
            </div>
          </div>

          <div className="section">
            <h2>2. เลือกจำนวนวันที่ต้องการอบรม</h2>
            <Select
              value={numberOfDays}
              style={{ width: '100%' }}
              onChange={setNumberOfDays}
              options={dayOptions}
            />
          </div>

          <div className="section">
            <h2>3. จำนวนห้องเรียน</h2>
            <Select
              value={numberOfClasses}
              style={{ width: '100%' }}
              onChange={(value) => setNumberOfClasses(value)}
              options={normalizedClassOptions}
            />
            <Alert
              style={{ marginTop: 16 }}
              type="info"
              showIcon
              message="ระบบรองรับการจองห้องเรียน 1 - 5 ห้อง ในการดำเนินการครั้งเดียว"
            />
          </div>

          {!embedded && (
            <div className="course-selection-footer">
              {formData.reservationNumber && (
                <p className="reservation-number">
                  <strong>หมายเลขการจองของคุณ:</strong> {formData.reservationNumber}
                </p>
              )}
              <Button type="primary" onClick={handleNext} size="large">
                หน้าถัดไป
              </Button>
            </div>
          )}
        </Col>
      </Row>

      <Modal
        title="กรอกจำนวนนักเรียน"
        open={isStudentModalVisible}
        onCancel={handleCloseStudentModal}
        onOk={handleStudentModalOk}
        maskClosable={false}
      >
        <Form layout="vertical">
          <Form.Item
            label="จำนวนนักเรียนที่เข้าอบรม"
            name="numberOfStudents"
            rules={[{ required: true, message: 'กรุณากรอกจำนวนนักเรียน!' }]}
          >
            <InputNumber
              min={1}
              max={150}
              value={numberOfStudents}
              onChange={(value) => setNumberOfStudents(value || 1)}
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
              onChange={setStudentRange}
              options={[
                { value: 'ประถม', label: 'ประถม' },
                { value: 'มัธยม', label: 'มัธยม' },
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
              onChange={setStudentLevel}
              options={[1, 2, 3, 4, 5, 6].map((level) => ({
                value: level,
                label: `${level}`,
              }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Protected>
  );
});

ReservationSetup.displayName = 'ReservationSetup';

export default ReservationSetup;
