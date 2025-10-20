import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/th';
import { Alert, Button, Col, message, Row, Tag, Tooltip } from 'antd';
import { Calendar } from '../../../lib/react-calendar-kit';
import { useNavigate } from 'react-router-dom';
import Protected from '../../../hooks/userProtected';
import { useFormData } from '../../../contexts/FormDataContext';
import {
  useGetConfirmedReservationsQuery,
  useGetReservationRulesQuery,
} from '../reservationApiSlice';
import '../../../css/Reservation/CourseSelection.css';

dayjs.extend(isBetween);
dayjs.locale('th');

const WEEKDAY_LABELS = {
  0: 'วันอาทิตย์',
  1: 'วันจันทร์',
  2: 'วันอังคาร',
  3: 'วันพุธ',
  4: 'วันพฤหัสบดี',
  5: 'วันศุกร์',
  6: 'วันเสาร์',
};

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) return '-';
  const buddhistYear = date.year() + 543;
  const month = date.locale('th').format('MMMM');
  return `${date.format('D')} ${month} ${buddhistYear}`;
};

const formatDisplayRange = (start, end) =>
  `${start.locale('th').format('D MMM YYYY')} – ${end
    .locale('th')
    .format('D MMM YYYY')}`;

const DateSelection = forwardRef(({ onNext, onPrev, embedded = false }, ref) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();

  const { data: reservationRules = [] } = useGetReservationRulesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const { data: availabilityData } = useGetConfirmedReservationsQuery();

  const numberOfDays = useMemo(() => {
    const parsed = parseFloat(formData.numberOfDays);
    return Number.isNaN(parsed) ? 1 : parsed;
  }, [formData.numberOfDays]);

  const initialDates = useMemo(
    () => (formData.selectedDates || []).map((date) => dayjs(date)),
    [formData.selectedDates],
  );

  const [calendarValue, setCalendarValue] = useState(
    initialDates[0] && initialDates[0].isValid() ? initialDates[0] : dayjs(),
  );
  const [selectedDates, setSelectedDates] = useState(
    initialDates.filter((d) => d.isValid()),
  );

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

  // Generate deterministic color from text
  const colorFromText = (text) => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 55%)`;
    return color;
  };

  const processedRules = useMemo(() => {
    const summary = {
      weekdayRules: new Set(),
      blockedRanges: [],
      subcategoryRanges: [],
    };

    const rules = Array.isArray(reservationRules) ? reservationRules : [];
    rules.forEach((rule) => {
      if (!rule?.type) return;

      if (rule.type === 'weekday' && Array.isArray(rule.weekdays)) {
        rule.weekdays.forEach((day) => {
          if (typeof day === 'number' && day >= 0 && day <= 6) {
            summary.weekdayRules.add(day);
          }
        });
      }

      if (rule.type === 'date_range') {
        const start = rule.startDate ? dayjs(rule.startDate).startOf('day') : null;
        const end = rule.endDate ? dayjs(rule.endDate).endOf('day') : null;
        if (start?.isValid() && end?.isValid() && !end.isBefore(start)) {
          summary.blockedRanges.push({
            start,
            end,
            note: rule.note || '',
          });
        }
      }

      if (rule.type === 'subcategory') {
        const start = rule.startDate ? dayjs(rule.startDate).startOf('day') : null;
        const end = rule.endDate ? dayjs(rule.endDate).endOf('day') : null;
        if (start?.isValid() && end?.isValid() && !end.isBefore(start)) {
          summary.subcategoryRanges.push({
            start,
            end,
            subcategory: rule.subcategory_th || rule.subcategory_en || '-',
            note: rule.note || '',
          });
        }
      }
    });

    return summary;
  }, [reservationRules]);

  const getDateBlockers = useCallback(
    (value) => {
      const blockers = [];
      if (!value?.isValid?.()) return blockers;

      if (processedRules.weekdayRules.has(value.day())) {
        blockers.push({
          type: 'weekday',
          message: `ระบบไม่เปิดให้จองใน${WEEKDAY_LABELS[value.day()] || 'วันนี้'}`,
        });
      }

      processedRules.blockedRanges.forEach((range) => {
        if (value.isBetween(range.start, range.end, null, '[]')) {
          blockers.push({
            type: 'date_range',
            message: `ช่วงวันที่ ${formatDisplayRange(range.start, range.end)} ปิดรับการจอง${
              range.note ? ` (${range.note})` : ''
            }`,
          });
        }
      });

      return blockers;
    },
    [processedRules],
  );

  const getSubcategoryNotesForDate = useCallback(
    (value) => {
      if (!value?.isValid?.()) return [];
      return processedRules.subcategoryRanges
        .filter((range) => value.isBetween(range.start, range.end, null, '[]'))
        .map((range) => ({
          subcategory: range.subcategory,
          note: range.note,
          color: colorFromText(range.subcategory),
        }));
    },
    [processedRules],
  );

  const ruleSummaryList = useMemo(() => {
    const items = [];
    const weekdayList = Array.from(processedRules.weekdayRules);
    if (weekdayList.length) {
      const dayNames = weekdayList
        .sort((a, b) => a - b)
        .map((idx) => WEEKDAY_LABELS[idx])
        .filter(Boolean)
        .join(', ');
      if (dayNames) {
        items.push(`ระบบไม่เปิดให้จองใน${dayNames}`);
      }
    }

    processedRules.blockedRanges.forEach((range) => {
      items.push(
        `ปิดรับช่วง ${formatDisplayRange(range.start, range.end)}${
          range.note ? ` (${range.note})` : ''
        }`,
      );
    });

    processedRules.subcategoryRanges.forEach((range) => {
      items.push(
        `หัวข้อย่อย ${range.subcategory} ปิดรับระหว่าง ${formatDisplayRange(
          range.start,
          range.end,
        )}${range.note ? ` (${range.note})` : ''}`,
      );
    });

    if (!items.length) {
      items.push('กรุณาเลือกวันที่ที่สะดวก และตรวจสอบสถานะปฏิทินก่อนยืนยันการจอง');
    }

    return items;
  }, [processedRules]);

  const onSelect = (newValue) => {
    const dateOnly = newValue.startOf('day');
    const blockers = getDateBlockers(dateOnly);
    if (blockers.length) {
      message.warning(blockers[0]?.message || 'ไม่สามารถเลือกวันดังกล่าวได้');
      return;
    }

    setCalendarValue(newValue);
    const dates = [dateOnly];
    const requiredDays = Math.ceil(numberOfDays);
    for (let i = 1; i < requiredDays; i++) {
      const nextDate = dateOnly.add(i, 'day');
      const extraBlockers = getDateBlockers(nextDate);
      if (extraBlockers.length) {
        message.warning(
          `${formatBuddhistDate(nextDate)}: ${
            extraBlockers[0]?.message || 'ไม่สามารถเลือกวันดังกล่าวได้'
          }`,
        );
        return;
      }
      dates.push(nextDate);
    }
    setSelectedDates(dates);
  };

  const dateCellRender = (value) => {
    const formatValue = value.format('YYYY-MM-DD');
    const confirmed = confirmedReservations.filter((r) => r.dates.includes(formatValue));
    const processed = processedReservations.filter((r) => r.dates.includes(formatValue));
    const isSelected = selectedDates.some((date) => date.isSame(value, 'day'));
    const blockers = getDateBlockers(value);
    const subcategoryNotes = getSubcategoryNotesForDate(value);

    const disabledStyle =
      blockers.length > 0
        ? { opacity: 0.35, pointerEvents: 'none', cursor: 'not-allowed' }
        : {};

    const cellBody = (
      <div style={{ ...disabledStyle, position: 'relative' }}>
        {confirmed.map((r, i) => (
          <div
            key={`c-${i}`}
            style={{
              backgroundColor: '#E86447',
              color: 'white',
              marginBottom: 2,
              padding: '2px 4px',
              borderRadius: 4,
            }}
          >
            {r.school}
          </div>
        ))}
        {processed.map((r, i) => (
          <div
            key={`p-${i}`}
            style={{
              backgroundColor: '#B0B0B0',
              color: 'white',
              marginBottom: 2,
              padding: '2px 4px',
              borderRadius: 4,
            }}
          >
            {r.school}
          </div>
        ))}
        {isSelected && (
          <div
            style={{
              backgroundColor: '#1890ff',
              color: 'white',
              padding: '2px 4px',
              borderRadius: 4,
            }}
          >
            {value.date()}
          </div>
        )}
        {!isSelected && !confirmed.length && !processed.length && blockers.length > 0 && (
          <Tag color="red" style={{ marginTop: 4 }}>
            ปิดรับ
          </Tag>
        )}
        {/* Subcategory color stripe */}
        {subcategoryNotes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
            {subcategoryNotes.map((note, idx) => (
              <div
                key={`sub-${idx}`}
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: note.color,
                }}
                title={`หัวข้อ ${note.subcategory}${note.note ? `: ${note.note}` : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    );

    return cellBody;
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

  // Collect all subcategory colors for legend
const subcategoryColorMap = useMemo(() => {
  const map = {};
  processedRules.subcategoryRanges.forEach((r) => {
    const label = r.subcategory_th || r.subcategory || '-';
    if (!map[label]) map[label] = colorFromText(label);
  });
  return map;
}, [processedRules]);


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
                  <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                    {ruleSummaryList.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
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
              <div
                className="calendar-fixed-width"
                style={{ maxWidth: '100%', width: '900px', margin: '0 auto' }}
              >
                <Calendar
                  defaultValue={calendarValue}
                  onSelect={onSelect}
                  dateCellRender={dateCellRender}
                  className="reservation-calendar"
                />
              </div>
            </div>

            <div className="legend-box" style={{ marginTop: 16 }}>
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
              <span>
                <span className="legend-item" style={{ backgroundColor: '#ff4d4f' }}>
                  ปิดรับ
                </span>{' '}
                - ตามกฎที่ผู้ดูแลตั้งค่า
              </span>
              {Object.entries(subcategoryColorMap).map(([label, color]) => (
                <span key={label}>
                  <span className="legend-item" style={{ backgroundColor: color }} />
                  {' '}- {label}
                </span>
              ))}
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
