import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import { Alert, Button, Card, Col, message, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import Protected from '../../hooks/userProtected';
import { useFormData } from '../../contexts/FormDataContext';
import SubjectSelectionModal from './SubjectSelectionModal';
import '../../css/Reservation/CourseSelection.css';

const { Paragraph, Title } = Typography;

dayjs.locale('th');

const backendUrl = process.env.REACT_APP_BACKEND_URL;
const timeSlots = [
  'คาบเช้า (9:00 - 12:00)',
  'คาบบ่าย (13:00 - 16:00)',
];

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) {
    return '-';
  }
  const buddhistYear = date.year() + 543;
  const monthName = date.locale('th').format('MMMM');
  return `${date.format('D')} ${monthName} ${buddhistYear}`;
};

const SubjectSelection = () => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();

  const numberOfDays = useMemo(() => {
    const parsed = parseFloat(formData.numberOfDays);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [formData.numberOfDays]);

  const numberOfSlots = useMemo(() => {
    const slots = Math.ceil(Math.max(0, numberOfDays) * 2);
    return Number.isFinite(slots) ? slots : 0;
  }, [numberOfDays]);

  const numberOfClasses = useMemo(
    () => Math.min(5, Math.max(1, formData.numberOfClasses || 1)),
    [formData.numberOfClasses]
  );

  const selectedDates = useMemo(() => {
    if (!Array.isArray(formData.selectedDates)) {
      return [];
    }
    return formData.selectedDates.map((date) => dayjs(date));
  }, [formData.selectedDates]);

  const slotDefinitions = useMemo(() => {
    return Array.from({ length: numberOfSlots }, (_, slotIndex) => {
      const dayIndex = Math.floor(slotIndex / 2);
      const baseDate = selectedDates[dayIndex];
      const dateValue = baseDate && baseDate.isValid() ? baseDate.format('YYYY-MM-DD') : null;
      const displayDate = baseDate && baseDate.isValid() ? formatBuddhistDate(baseDate) : null;
      const slotLabel = slotIndex % 2 === 0 ? timeSlots[0] : timeSlots[1];
      return {
        slotIndex,
        dateValue,
        displayDate,
        slotLabel,
      };
    });
  }, [numberOfSlots, selectedDates]);

  const normaliseClassEntry = useCallback(
    (savedEntry, index) => {
      const savedSlots = Array.isArray(savedEntry?.slots) ? savedEntry.slots : [];

      const slots = slotDefinitions.map((definition) => {
        const existingSlot =
          savedSlots.find((slot) => slot.slotIndex === definition.slotIndex) ??
          savedSlots[definition.slotIndex];

        const subjectData = existingSlot?.subject
          ? existingSlot.subject
          : existingSlot?.name_th
          ? { code: existingSlot.code, name_th: existingSlot.name_th }
          : null;

        return {
          slotIndex: definition.slotIndex,
          date: definition.dateValue,
          slot: definition.slotLabel,
          subject: subjectData,
          code: subjectData?.code || existingSlot?.code || null,
          name_th: subjectData?.name_th || existingSlot?.name_th || null,
          level: existingSlot?.level || null,
          levelLabel: existingSlot?.levelLabel || null,
          category: existingSlot?.category || null,
          categoryLabel: existingSlot?.categoryLabel || null,
          subcategory: existingSlot?.subcategory || null,
          subcategoryLabel: existingSlot?.subcategoryLabel || null,
        };
      });

      return {
        classNumber: savedEntry?.classNumber || index + 1,
        slots,
      };
    },
    [slotDefinitions]
  );

  const initialClassSubjects = useMemo(() => {
    const savedSubjects = Array.isArray(formData.classSubjects)
      ? formData.classSubjects
      : [];
    return Array.from({ length: numberOfClasses }, (_, index) =>
      normaliseClassEntry(savedSubjects[index], index)
    );
  }, [formData.classSubjects, numberOfClasses, normaliseClassEntry]);

  const [classSubjects, setClassSubjects] = useState(initialClassSubjects);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeClassIndex, setActiveClassIndex] = useState(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);

  useEffect(() => {
    setClassSubjects((prev) =>
      Array.from({ length: numberOfClasses }, (_, index) => {
        const existing = prev[index];
        return normaliseClassEntry(existing, index);
      })
    );
  }, [numberOfClasses, slotDefinitions, normaliseClassEntry]);

  const openModal = (classIndex, slotIndex) => {
    const definition = slotDefinitions[slotIndex];
    if (!definition || !definition.dateValue) {
      message.warning('กรุณาเลือกวันที่ให้ครบก่อนเลือกวิชา');
      return;
    }
    setActiveClassIndex(classIndex);
    setActiveSlotIndex(slotIndex);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setActiveClassIndex(null);
    setActiveSlotIndex(null);
  };

  const handleSubjectSelected = (selection) => {
    if (activeClassIndex === null || activeSlotIndex === null) {
      return;
    }

    setClassSubjects((prev) => {
      const next = [...prev];
      const currentEntry = next[activeClassIndex] || normaliseClassEntry(null, activeClassIndex);
      const slots = Array.isArray(currentEntry.slots)
        ? [...currentEntry.slots]
        : slotDefinitions.map((definition) => ({
            slotIndex: definition.slotIndex,
            date: definition.dateValue,
            slot: definition.slotLabel,
          }));

      const definition = slotDefinitions[activeSlotIndex];
      const existingSlot = slots[activeSlotIndex] || {
        slotIndex: activeSlotIndex,
      };

      slots[activeSlotIndex] = {
        ...existingSlot,
        slotIndex: activeSlotIndex,
        date: definition?.dateValue || existingSlot.date || null,
        slot: definition?.slotLabel || existingSlot.slot || null,
        subject: selection.subject,
        code: selection.subject?.code || null,
        name_th: selection.subject?.name_th || null,
        level: selection.level || null,
        levelLabel: selection.levelLabel || null,
        category: selection.category || null,
        categoryLabel: selection.categoryLabel || null,
        subcategory: selection.subcategory || null,
        subcategoryLabel: selection.subcategoryLabel || null,
      };

      next[activeClassIndex] = {
        ...currentEntry,
        classNumber: currentEntry.classNumber || activeClassIndex + 1,
        slots,
      };

      return next;
    });

    closeModal();
  };

  const validateSelections = () => {
    if (!slotDefinitions.length) {
      message.warning('กรุณาเลือกจำนวนวันที่ต้องการอบรม และกำหนดวันที่ให้ครบ');
      return false;
    }

    if (slotDefinitions.some((definition) => !definition.dateValue)) {
      message.warning('กรุณาเลือกวันที่ให้ครบตามจำนวนวันที่ต้องการอบรม');
      return false;
    }

    const hasMissing = classSubjects.some((entry) => {
      if (!entry || !Array.isArray(entry.slots)) {
        return true;
      }
      if (entry.slots.length < slotDefinitions.length) {
        return true;
      }
      return entry.slots.some((slot) => !slot || !slot.subject);
    });

    if (hasMissing) {
      message.warning('กรุณาเลือกวิชาสำหรับทุกช่วงเวลาของทุกห้องเรียน');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateSelections()) {
      return;
    }

    updateFormData({ classSubjects });
    navigate('/user-info');
  };

  const handleBack = () => {
    updateFormData({ classSubjects });
    navigate('/dates');
  };

  return (
    <Protected>
      <Row justify="center" className="course-selection-container">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <div className="section">
            <Title level={2}>5. เลือกวิชาที่ต้องการอบรม</Title>
            {slotDefinitions.length === 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="กรุณาเลือกจำนวนวันและกำหนดวันที่ก่อน แล้วกลับมาหน้านี้เพื่อกำหนดวิชา"
              />
            )}
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={
                <div>
                  <strong>📌 หมายเหตุ:</strong>
                  <br />
                  <ol style={{ paddingLeft: '20px', marginBottom: 0 }}>
                    <li>คอร์สเรียนที่ขึ้นตัวอักษรสีเทา หมายถึงเต็มแล้วสำหรับภาคการศึกษานี้</li>
                    <li>กรุณาเลือกวิชาสำหรับทุกช่วงเวลาของทุกห้องเรียนก่อนดำเนินการต่อ</li>
                  </ol>
                </div>
              }
            />

            <Row gutter={[16, 16]}>
              {Array.from({ length: numberOfClasses }, (_, classIndex) => {
                const classEntry = classSubjects[classIndex];
                return (
                  <Col key={`class-${classIndex}`} xs={24} sm={24} md={12} lg={12}>
                    <Card
                      title={`ห้องเรียนที่ ${classIndex + 1}`}
                      bordered={false}
                      style={{ width: '100%', boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)' }}
                    >
                      {slotDefinitions.map((definition) => {
                        const slotData =
                          classEntry?.slots?.[definition.slotIndex] || {
                            slotIndex: definition.slotIndex,
                          };
                        const subjectName = slotData.subject?.name_th;
                        const subjectCode = slotData.subject?.code;
                        return (
                          <div key={`class-${classIndex}-slot-${definition.slotIndex}`} style={{ marginBottom: 16 }}>
                            <Paragraph strong style={{ marginBottom: 8 }}>
                              {definition.displayDate
                                ? `${definition.displayDate} • ${definition.slotLabel}`
                                : `กำหนดวันที่สำหรับช่วงเวลา: ${definition.slotLabel}`}
                            </Paragraph>
                            <Button
                              type="dashed"
                              onClick={() => openModal(classIndex, definition.slotIndex)}
                              style={{ marginBottom: '10px', width: '100%' }}
                              disabled={!definition.dateValue}
                            >
                              {subjectName ? subjectName : 'เลือกวิชาสำหรับช่วงเวลา'}
                            </Button>
                            {subjectName && (
                              <div>
                                <Paragraph>
                                  <strong>ชื่อคอร์ส:</strong> {subjectName}
                                </Paragraph>
                                <Paragraph>
                                  <strong>รหัสคอร์ส:</strong> {subjectCode}
                                </Paragraph>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>

          <div className="course-selection-footer">
            {formData.reservationNumber && (
              <p className="reservation-number">
                <strong>หมายเลขการจองของคุณ:</strong> {formData.reservationNumber}
              </p>
            )}
            <div>
              <Button onClick={handleBack} style={{ marginRight: '10px' }}>
                กลับไปหน้าก่อน
              </Button>
              <Button type="primary" onClick={handleNext} size="large">
                หน้าถัดไป
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <SubjectSelectionModal
        isModalVisible={isModalVisible}
        handleCancel={closeModal}
        backendUrl={backendUrl}
        onSubjectSelected={handleSubjectSelected}
        numberOfStudents={formData.numberOfStudents || 1}
        initialSelection={
          activeClassIndex !== null &&
          activeSlotIndex !== null &&
          classSubjects[activeClassIndex]?.slots?.[activeSlotIndex]
            ? {
                level: classSubjects[activeClassIndex].slots[activeSlotIndex].level,
                category: classSubjects[activeClassIndex].slots[activeSlotIndex].category,
                subcategory: classSubjects[activeClassIndex].slots[activeSlotIndex].subcategory,
                subject: classSubjects[activeClassIndex].slots[activeSlotIndex].subject,
              }
            : null
        }
      />
    </Protected>
  );
};

export default SubjectSelection;
