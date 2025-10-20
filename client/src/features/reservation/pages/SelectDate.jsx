import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/th';
import { Alert, Button, Col, message, Row } from 'antd';
import { Calendar } from '../../../lib/react-calendar-kit';
import { useNavigate } from 'react-router-dom';
import Protected from '../../../hooks/userProtected';
import { useFormData } from '../../../contexts/FormDataContext';
import { useGetConfirmedReservationsQuery } from '../reservationApiSlice';
import '../../../css/Reservation/CourseSelection.css';

dayjs.extend(isBetween);
dayjs.locale('th');

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) return '-';
  const buddhistYear = date.year() + 543;
  const month = date.locale('th').format('MMMM');
  return `${date.format('D')} ${month} ${buddhistYear}`;
};

const DateSelection = forwardRef(({ onNext, onPrev, embedded = false }, ref) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();

  const numberOfDays = useMemo(() => {
    const parsed = parseFloat(formData.numberOfDays);
    return Number.isNaN(parsed) ? 1 : parsed;
  }, [formData.numberOfDays]);

  const initialDates = (formData.selectedDates || []).map((date) => dayjs(date));
  // This state is now ONLY for your own UI (details panel / selected highlight logic),
  // not for controlling the calendar panel/month.
  const [calendarValue, setCalendarValue] = useState(initialDates[0] || dayjs());
  const [selectedDates, setSelectedDates] = useState(initialDates);

  const { data: availabilityData } = useGetConfirmedReservationsQuery();

  const confirmedReservations = useMemo(() => {
    if (!availabilityData?.confirmed) return [];
    return availabilityData.confirmed.map((r) => ({
      dates: (r.selectedDates || []).map((d) => dayjs(d).format('YYYY-MM-DD')),
      school: r.school,
    }));
  }, [availabilityData]);

  const processedReservations = useMemo(() => {
    if (!availabilityData?.processed) return [];
    return availabilityData.processed.map((r) => ({
      dates: (r.selectedDates || []).map((d) => dayjs(d).format('YYYY-MM-DD')),
      school: r.school,
    }));
  }, [availabilityData]);

  const onSelect = (newValue) => {
    const day = newValue.day(); // 0=Sun,6=Sat
    const dateOnly = newValue.startOf('day');
    const blockedStart = dayjs('2025-08-06');
    const blockedEnd = dayjs('2025-09-30');

    if (dateOnly.isBetween(blockedStart, blockedEnd, null, '[]')) {
      message.warning('ไม่สามารถเลือกวันที่ระหว่างวันที่ 6 สิงหาคม ถึง 30 กันยายนได้');
      return;
    }

    if (day !== 0 && day !== 6) {
      message.warning('สามารถเลือกได้เฉพาะวันเสาร์และวันอาทิตย์เท่านั้น');
      return;
    }

    // Keep for your details panel & selected styling
    setCalendarValue(newValue);

    const dates = [dateOnly];
    const requiredDays = Math.ceil(numberOfDays);
    for (let i = 1; i < requiredDays; i++) {
      dates.push(dateOnly.add(i, 'day'));
    }
    setSelectedDates(dates);
  };

  const dateCellRender = (value) => {
    const formatValue = value.format('YYYY-MM-DD');
    const day = value.day();
    const isWeekend = day === 0 || day === 6;

    const confirmed = confirmedReservations.filter((r) => r.dates.includes(formatValue));
    const processed = processedReservations.filter((r) => r.dates.includes(formatValue));
    const isSelected = selectedDates.some((date) => date.isSame(value, 'day'));

    const cellStyle = isWeekend
      ? {}
      : { opacity: 0.4, pointerEvents: 'none', cursor: 'not-allowed' };

    return (
      <div style={cellStyle}>
        {confirmed.map((r, i) => (
          <div
            key={`c-${i}`}
            style={{ backgroundColor: '#E86447', color: 'white', marginBottom: 2, padding: '2px 4px', borderRadius: 4 }}
          >
            {r.school}
          </div>
        ))}
        {processed.map((r, i) => (
          <div
            key={`p-${i}`}
            style={{ backgroundColor: '#B0B0B0', color: 'white', marginBottom: 2, padding: '2px 4px', borderRadius: 4 }}
          >
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

  const handleNext = () => {
    if (!selectedDates.length) {
      message.warning('กรุณาเลือกวันที่ต้องการอบรม');
      return;
    }
    updateFormData({ selectedDates });
    if (onNext) onNext();
    else navigate('/reservation/subjects');
  };

  const handleBack = () => {
    updateFormData({ selectedDates });
    if (onPrev) onPrev();
    else navigate('/reservation');
  };

  useImperativeHandle(ref, () => ({
    next: handleNext,
    prev: handleBack,
  }));

  return (
    <Protected>
      <Row justify="center" className="course-selection-container">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <div className="section">
            <h2>2. เลือกวันที่ต้องการอบรม</h2>

            <Alert
              type="info"
              showIcon
              message={
                <div>
                  <strong>📌 หมายเหตุ:</strong>
                  <br />
                  เวลาเรียนสามารถเลือกได้เฉพาะ:
                  <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
                    <li>วันเสาร์หรือวันอาทิตย์</li>
                    <li>ไม่อยู่ในช่วงวันที่ 6 สิงหาคม - 30 กันยายน</li>
                    <li>ไม่ตรงกับช่วงวันหยุดยาว เช่น ปีใหม่ หรือสงกรานต์</li>
                  </ol>
                </div>
              }
              style={{ marginBottom: 16 }}
            />

            <Alert
              message={`คุณเลือกวันที่: ${
                selectedDates.length
                  ? selectedDates.map((date) => formatBuddhistDate(date)).join(', ')
                  : '-'
              }`}
              style={{ marginBottom: 16 }}
            />

            <div className="calendar-scroll-wrapper">
              <div className="calendar-fixed-width">
                {/* ✅ Uncontrolled calendar: remove `value`, use `defaultValue` only */}
                <Calendar
                  defaultValue={calendarValue}
                  onSelect={onSelect}
                  dateCellRender={dateCellRender}
                  className="reservation-calendar"
                />
              </div>
            </div>

            {calendarValue && (
              <div style={{ marginTop: 16 }}>
                <h4>รายละเอียดการจองวันที่ {formatBuddhistDate(calendarValue)}</h4>
                {[...confirmedReservations, ...processedReservations]
                  .filter((r) => r.dates.includes(calendarValue.format('YYYY-MM-DD')))
                  .map((r, i) => (
                    <p key={i}>🏫 {r.school}</p>
                  ))}
              </div>
            )}

            <div className="legend-box">
              <span>
                <span className="legend-item" style={{ backgroundColor: '#E86447' }}>
                  ไม่ว่าง
                </span>{' '}
                - ยืนยันการจองแล้ว
              </span>
              <span>
                <span className="legend-item" style={{ backgroundColor: '#B0B0B0' }}>
                  ไม่ว่าง
                </span>{' '}
                - ดำเนินการแล้ว (รอชำระเงิน)
              </span>
              <span>
                <span className="legend-item" style={{ backgroundColor: '#1890ff' }}>
                  เลือก
                </span>{' '}
                - ช่วงเวลาที่คุณเลือก
              </span>
            </div>
          </div>

          {!embedded && (
            <div className="course-selection-footer">
              {formData.reservationNumber && (
                <p className="reservation-number">
                  <strong>หมายเลขการจองของคุณ:</strong> {formData.reservationNumber}
                </p>
              )}
              <div>
                <Button onClick={handleBack} style={{ marginRight: 10 }}>
                  กลับไปหน้าก่อน
                </Button>
                <Button type="primary" onClick={handleNext} size="large">
                  หน้าถัดไป
                </Button>
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Protected>
  );
});

DateSelection.displayName = 'SelectDate';
export default DateSelection;
