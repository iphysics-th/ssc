import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef,
} from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { Alert, Button, Card, Col, message, Row, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import Protected from "../../../hooks/userProtected";
import { useFormData } from "../../../contexts/FormDataContext";
import SubjectSelectionModal from "../components/SubjectModal";
import "../../../css/Reservation/CourseSelection.css";

const { Paragraph, Title } = Typography;
dayjs.locale("th");

const timeSlots = ["คาบเช้า (9:00 - 12:00)", "คาบบ่าย (13:00 - 16:00)"];

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) return "-";
  const buddhistYear = date.year() + 543;
  const monthName = date.locale("th").format("MMMM");
  return `${date.format("D")} ${monthName} ${buddhistYear}`;
};

const SubjectSelection = forwardRef(({ onNext, onPrev, embedded = false }, ref) => {
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
    if (!Array.isArray(formData.selectedDates)) return [];
    return formData.selectedDates.map((date) => dayjs(date));
  }, [formData.selectedDates]);

  const slotDefinitions = useMemo(() => {
    return Array.from({ length: numberOfSlots }, (_, slotIndex) => {
      const dayIndex = Math.floor(slotIndex / 2);
      const baseDate = selectedDates[dayIndex];
      const dateValue = baseDate && baseDate.isValid() ? baseDate.format("YYYY-MM-DD") : null;
      const displayDate = baseDate && baseDate.isValid() ? formatBuddhistDate(baseDate) : null;
      const slotLabel = slotIndex % 2 === 0 ? timeSlots[0] : timeSlots[1];
      return { slotIndex, dateValue, displayDate, slotLabel };
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
        const priceSource =
          existingSlot?.price ??
          existingSlot?.subject?.price ??
          subjectData?.price ??
          null;
        const priceValue = Number(priceSource);
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
          price: Number.isFinite(priceValue) ? priceValue : null,
        };
      });
      return { classNumber: savedEntry?.classNumber || index + 1, slots };
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
      message.warning("กรุณาเลือกวันที่ให้ครบก่อนเลือกวิชา");
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
    if (activeClassIndex === null || activeSlotIndex === null) return;

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
      const existingSlot = slots[activeSlotIndex] || { slotIndex: activeSlotIndex };

      const priceValue = Number(selection.subject?.price);

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
        price: Number.isFinite(priceValue) ? priceValue : null,
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
      message.warning("กรุณาเลือกจำนวนวันที่ต้องการอบรม และกำหนดวันที่ให้ครบ");
      return false;
    }

    if (slotDefinitions.some((definition) => !definition.dateValue)) {
      message.warning("กรุณาเลือกวันที่ให้ครบตามจำนวนวันที่ต้องการอบรม");
      return false;
    }

    const hasMissing = classSubjects.some((entry) => {
      if (!entry || !Array.isArray(entry.slots)) return true;
      if (entry.slots.length < slotDefinitions.length) return true;
      return entry.slots.some((slot) => !slot || !slot.subject);
    });

    if (hasMissing) {
      message.warning("กรุณาเลือกวิชาสำหรับทุกช่วงเวลาของทุกห้องเรียน");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateSelections()) return;
    updateFormData({ classSubjects });
    if (onNext) onNext();
    else navigate("/user-info");
  };

  const handleBack = () => {
    updateFormData({ classSubjects });
    if (onPrev) onPrev();
    else navigate("/dates");
  };

  useImperativeHandle(ref, () => ({ next: handleNext, prev: handleBack }));

  return (
    <Protected>
      <Row justify="center" className="course-selection-container">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <div className="section">
            <Title level={2} style={{ color: "#0f172a", marginBottom: 20 }}>
              5. เลือกวิชาที่ต้องการอบรม
            </Title>

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
              style={{ marginBottom: 24 }}
              message={
                <div>
                  <strong>📘 หมายเหตุ:</strong>
                  <br />
                  <ol style={{ paddingLeft: "20px", marginBottom: 0 }}>
                    <li>คอร์สที่ขึ้นสีเทา หมายถึงเต็มแล้วสำหรับภาคการศึกษานี้</li>
                    <li>กรุณาเลือกวิชาสำหรับทุกช่วงเวลาของทุกห้องเรียนก่อนดำเนินการต่อ</li>
                  </ol>
                </div>
              }
            />

            <Row gutter={[24, 24]}>
              {Array.from({ length: numberOfClasses }, (_, classIndex) => {
                const classEntry = classSubjects[classIndex];
                return (
                  <Col key={`class-${classIndex}`} xs={24} sm={24} md={12} lg={12}>
                    <Card
                      title={
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>
                          ห้องเรียนที่ {classIndex + 1}
                        </span>
                      }
                      bordered={false}
                      style={{
                        width: "100%",
                        borderRadius: 16,
                        background: "#ffffff",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                        padding: "8px 0",
                        overflow: "hidden",
                      }}
                      headStyle={{
                        background: "linear-gradient(90deg,#e0f2fe,#fff)",
                        borderBottom: "1px solid #e2e8f0",
                        fontWeight: 700,
                      }}
                    >
                      {slotDefinitions.map((definition) => {
                        const slotData =
                          classEntry?.slots?.[definition.slotIndex] || {};
                        const subjectName = slotData.subject?.name_th;
                        const subjectCode = slotData.subject?.code;

                        return (
                          <div
                            key={`class-${classIndex}-slot-${definition.slotIndex}`}
                            style={{
                              background: "#f8fafc",
                              borderRadius: "12px",
                              padding: "16px 18px",
                              marginBottom: 16,
                              boxShadow: "inset 0 0 0 1px #e2e8f0",
                              transition: "all 0.25s ease",
                            }}
                          >
                            {/* ──────────────── Date & Slot Time ──────────────── */}
                            <div style={{ marginBottom: 12 }}>
                              {definition.displayDate ? (
                                <>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      fontSize: "1rem",
                                      color: "#1e293b",
                                      marginBottom: 4,
                                    }}
                                  >
                                    {definition.displayDate}
                                  </div>
                                  <div
                                    style={{
                                      color: "#64748b",
                                      fontWeight: 500,
                                      fontSize: "0.95rem",
                                    }}
                                  >
                                    {definition.slotLabel}
                                  </div>
                                </>
                              ) : (
                                <div style={{ color: "#94a3b8" }}>
                                  กำหนดวันที่สำหรับช่วงเวลา: {definition.slotLabel}
                                </div>
                              )}
                            </div>

                            {/* ──────────────── Button ──────────────── */}
                            <Button
                              size="large"
                              block
                              onClick={() => openModal(classIndex, definition.slotIndex)}
                              disabled={!definition.dateValue}
                              style={{
                                backgroundColor: subjectName ? "#1677ff" : "#e0f2fe",
                                color: subjectName ? "#fff" : "#0369a1",
                                border: "none",
                                fontWeight: 600,
                                fontSize: "1rem",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                transition: "all 0.25s ease",
                                boxShadow: subjectName
                                  ? "0 3px 8px rgba(22,119,255,0.3)"
                                  : "0 2px 4px rgba(14,165,233,0.15)",
                              }}
                            >
                              {subjectName ? "เปลี่ยนวิชา" : "เลือกวิชา"}
                            </Button>

                            {/* ──────────────── Selected Course Info ──────────────── */}
                            {subjectName && (
                              <div
                                style={{
                                  marginTop: 12,
                                  background: "#fff",
                                  borderRadius: "8px",
                                  padding: "10px 14px",
                                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                  border: "1px solid #f1f5f9",
                                }}
                              >
                                <Paragraph
                                  style={{
                                    marginBottom: 4,
                                    color: "#64748b",
                                    fontSize: "0.9rem",
                                    fontWeight: 500,
                                  }}
                                >
                                  {subjectCode || "-"}
                                </Paragraph>
                                <Paragraph
                                  style={{
                                    marginBottom: 0,
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    fontSize: "0.95rem",
                                  }}
                                >
                                  {subjectName}
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

          {!embedded && (
            <div className="course-selection-footer">
              {formData.reservationNumber && (
                <p className="reservation-number">
                  <strong>หมายเลขการจองของคุณ:</strong>{" "}
                  {formData.reservationNumber}
                </p>
              )}
              <div>
                <Button onClick={handleBack} style={{ marginRight: "10px" }}>
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

      <SubjectSelectionModal
        isModalVisible={isModalVisible}
        handleCancel={closeModal}
        onSubjectSelected={handleSubjectSelected}
        numberOfStudents={formData.numberOfStudents || 1}
        initialSelection={
          activeClassIndex !== null &&
            activeSlotIndex !== null &&
            classSubjects[activeClassIndex]?.slots?.[activeSlotIndex]
            ? {
              level:
                classSubjects[activeClassIndex].slots[activeSlotIndex].level,
              category:
                classSubjects[activeClassIndex].slots[activeSlotIndex]
                  .category,
              subcategory:
                classSubjects[activeClassIndex].slots[activeSlotIndex]
                  .subcategory,
              subject:
                classSubjects[activeClassIndex].slots[activeSlotIndex]
                  .subject,
            }
            : null
        }
      />
    </Protected>
  );
});

SubjectSelection.displayName = "SelectSubjects";
export default SubjectSelection;
