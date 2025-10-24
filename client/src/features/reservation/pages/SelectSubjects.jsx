import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef,
} from "react";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/th";
import { Alert, Button, Card, Col, message, Row, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import Protected from "../../../hooks/userProtected";
import { useFormData } from "../../../contexts/FormDataContext";
import SubjectSelectionModal from "../components/SubjectModal";
import { useGetReservationRulesQuery } from "../reservationApiSlice";
import "../../../css/Reservation/CourseSelection.css";

const buildSlotKey = (dateValue, slotIndex) => {
  if (!dateValue) return null;
  const index = Number(slotIndex);
  if (!Number.isFinite(index)) return null;
  return `${dateValue}__${index}`;
};

const { Paragraph, Title } = Typography;
dayjs.locale("th");
dayjs.extend(isBetween);

const timeSlots = ["คาบเช้า (9:00 - 12:00)", "คาบบ่าย (13:00 - 16:00)"];

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) return "-";
  const buddhistYear = date.year() + 543;
  const monthName = date.locale("th").format("MMMM");
  return `${date.format("D")} ${monthName} ${buddhistYear}`;
};

const formatDisplayRange = (start, end) =>
  `${start.locale("th").format("D MMM YYYY")} – ${end.locale("th").format("D MMM YYYY")}`;

const SubjectSelection = forwardRef(({ onNext, onPrev, embedded = false }, ref) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();
  const { data: reservationRules = [] } = useGetReservationRulesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

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

  const subcategoryRuleMap = useMemo(() => {
    const map = new Map();
    const rules = Array.isArray(reservationRules) ? reservationRules : [];
    rules
      .filter((rule) => rule?.type === "subcategory")
      .forEach((rule) => {
        const start = rule.startDate ? dayjs(rule.startDate).startOf("day") : null;
        const end = rule.endDate ? dayjs(rule.endDate).endOf("day") : null;
        if (!start?.isValid() || !end?.isValid() || end.isBefore(start)) return;
        const key = rule.subcategory_en;
        if (!key) return;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({
          start,
          end,
          note: rule.note || "",
          rule,
        });
      });
    return map;
  }, [reservationRules]);

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

  const activeClassSubjectOrder = useMemo(() => {
    if (activeClassIndex === null || activeClassIndex === undefined) return [];
    const classEntry = classSubjects[activeClassIndex];
    const slots = Array.isArray(classEntry?.slots) ? classEntry.slots : [];
    const seen = new Set();
    const order = [];
    slots.forEach((slot, idx) => {
      if (activeSlotIndex != null && idx === activeSlotIndex) return;
      const code = slot?.subject?.code || slot?.code || null;
      if (!code || seen.has(code)) return;
      seen.add(code);
      const slotIndexValue = Number.isFinite(slot?.slotIndex)
        ? Number(slot.slotIndex)
        : idx;
      order.push({ code, slotIndex: slotIndexValue });
    });
    return order;
  }, [activeClassIndex, activeSlotIndex, classSubjects]);

  const subjectUsageBySlotMap = useMemo(() => {
    const map = new Map();
    classSubjects.forEach((classEntry, classIdx) => {
      const slots = Array.isArray(classEntry?.slots) ? classEntry.slots : [];
      slots.forEach((slot) => {
        const code = slot?.subject?.code;
        if (!code) return;
        const dateValue = slot?.date || slot?.dateValue;
        const key = buildSlotKey(dateValue, slot?.slotIndex);
        if (!key) return;
        const slotIndexValue = Number(slot?.slotIndex);
        if (
          classIdx === activeClassIndex &&
          Number.isFinite(slotIndexValue) &&
          slotIndexValue === activeSlotIndex
        )
          return;
        if (!map.has(key)) map.set(key, new Map());
        const subjectMap = map.get(key);
        subjectMap.set(code, (subjectMap.get(code) || 0) + 1);
      });
    });
    return map;
  }, [classSubjects, activeClassIndex, activeSlotIndex]);

  const subjectUsageBySlotSnapshot = useMemo(() => {
    const snapshot = {};
    subjectUsageBySlotMap.forEach((subjectMap, key) => {
      snapshot[key] = {};
      subjectMap.forEach((count, code) => {
        snapshot[key][code] = count;
      });
    });
    return snapshot;
  }, [subjectUsageBySlotMap]);

  const overallSubjectCountsMap = useMemo(() => {
    const counts = new Map();
    classSubjects.forEach((classEntry, classIdx) => {
      const slots = Array.isArray(classEntry?.slots) ? classEntry.slots : [];
      const uniqueCodes = new Set();
      slots.forEach((slot) => {
        const code = slot?.subject?.code;
        if (!code) return;
        const slotIndexValue = Number(slot?.slotIndex);
        if (
          classIdx === activeClassIndex &&
          Number.isFinite(slotIndexValue) &&
          slotIndexValue === activeSlotIndex
        )
          return;
        uniqueCodes.add(code);
      });
      uniqueCodes.forEach((code) => {
        counts.set(code, (counts.get(code) || 0) + 1);
      });
    });
    return counts;
  }, [classSubjects, activeClassIndex, activeSlotIndex]);

  const overallSubjectCountsSnapshot = useMemo(() => {
    const snapshot = {};
    overallSubjectCountsMap.forEach((count, code) => {
      snapshot[code] = count;
    });
    return snapshot;
  }, [overallSubjectCountsMap]);

  const countSubjectUsageForSlot = useCallback(
    (subjectCode, dateValue, slotIndex, skipIndices = []) => {
      if (!subjectCode || !dateValue || !Number.isFinite(slotIndex)) return 0;
      let count = 0;
      classSubjects.forEach((classEntry, classIdx) => {
        const slots = Array.isArray(classEntry?.slots) ? classEntry.slots : [];
        slots.forEach((slot) => {
          const slotCode = slot?.subject?.code;
          if (!slotCode || slotCode !== subjectCode) return;
          if (!slot?.date || slot.date !== dateValue) return;
          const slotIdxValue = Number(slot?.slotIndex);
          if (!Number.isFinite(slotIdxValue) || slotIdxValue !== slotIndex) return;
          if (
            classIdx === activeClassIndex &&
            skipIndices.includes(slotIdxValue)
          ) {
            return;
          }
          count += 1;
        });
      });
      return count;
    },
    [classSubjects, activeClassIndex]
  );

  const resolveSubcategoryBlock = useCallback(
    (subcategoryKey, durationRaw) => {
      if (activeSlotIndex === null || activeSlotIndex === undefined) return null;
      if (!subcategoryKey) return null;
      const ruleEntries = subcategoryRuleMap.get(subcategoryKey);
      if (!ruleEntries?.length) return null;

      const duration = Math.max(1, Number(durationRaw) || 1);
      for (let offset = 0; offset < duration; offset++) {
        const definition = slotDefinitions[activeSlotIndex + offset];
        if (!definition?.dateValue) {
          return { type: "missing_date", slotIndex: activeSlotIndex + offset };
        }
        const day = dayjs(definition.dateValue);
        if (!day.isValid()) continue;
        const conflict = ruleEntries.find((entry) =>
          day.isBetween(entry.start, entry.end, null, "[]")
        );
        if (conflict) {
          return {
            type: "rule",
            range: conflict,
            date: day,
          };
        }
      }
      return null;
    },
    [activeSlotIndex, slotDefinitions, subcategoryRuleMap]
  );

  const buildRuleBlockMessage = useCallback(
    (info, subcategoryLabel) => {
      if (!info) return "";
      const label = subcategoryLabel ? ` ${subcategoryLabel}` : "";
      if (info.type === "missing_date") {
        return `หัวข้อย่อย${label} ต้องการช่วงเวลาต่อเนื่องที่ยังไม่ได้เลือก`;
      }
      if (info.type === "rule" && info.range?.start && info.range?.end) {
        const rangeText = formatDisplayRange(info.range.start, info.range.end);
        const note = info.range.note ? ` (${info.range.note})` : "";
        return `หัวข้อย่อย${label} ปิดรับระหว่าง ${rangeText}${note}`;
      }
      return `หัวข้อย่อย${label} ไม่สามารถเลือกได้ในช่วงเวลานี้`;
    },
    []
  );

  const activeSlot = useMemo(() => {
    if (activeSlotIndex === null || activeSlotIndex === undefined) return null;
    return slotDefinitions[activeSlotIndex] || null;
  }, [activeSlotIndex, slotDefinitions]);

  const activeSlotKey = useMemo(() => {
    if (!activeSlot) return null;
    const slotIndexValue = activeSlot?.slotIndex;
    return buildSlotKey(activeSlot?.dateValue, slotIndexValue);
  }, [activeSlot]);

  const studentsPerClass = useMemo(() => {
    const saved = Array.isArray(formData.studentsPerClass)
      ? formData.studentsPerClass
      : [];
    return Array.from({ length: numberOfClasses }, (_, idx) => {
      const value = Number(saved[idx]);
      return Number.isFinite(value) && value > 0 ? Math.round(value) : 1;
    });
  }, [formData.studentsPerClass, numberOfClasses]);

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

    const duration = Math.max(1, Number(selection.subject?.slot) || 1);
    const ruleBlock = resolveSubcategoryBlock(selection.subcategory, duration);
    if (ruleBlock) {
      message.warning(
        buildRuleBlockMessage(
          ruleBlock,
          selection.subcategoryLabel || selection.subcategory
        )
      );
      return;
    }

    const subjectCode = selection.subject?.code || null;
    const totalClassroomsRaw =
      selection.subject?.total_classroom ?? selection.subject?.total_classrooms;
    const totalClassroomsValue = Number(totalClassroomsRaw);
    if (
      subjectCode &&
      Number.isFinite(totalClassroomsValue) &&
      totalClassroomsValue > 0
    ) {
      for (let offset = 0; offset < duration; offset++) {
        const targetSlotIndex = activeSlotIndex + offset;
        if (targetSlotIndex >= slotDefinitions.length) {
          message.warning("ช่วงเวลานี้ไม่เพียงพอสำหรับวิชานี้");
          return;
        }
        const definition = slotDefinitions[targetSlotIndex];
        if (!definition || !definition.dateValue) {
          message.warning("กรุณาเลือกวันที่ให้ครบก่อนเลือกวิชานี้");
          return;
        }
        const slotIdxValue = Number(definition.slotIndex);
        if (!Number.isFinite(slotIdxValue)) {
          message.warning("ไม่สามารถระบุช่วงเวลานี้ได้");
          return;
        }
        const usage = countSubjectUsageForSlot(
          subjectCode,
          definition.dateValue,
          slotIdxValue,
          [slotIdxValue]
        );
        if (usage >= totalClassroomsValue) {
          const displayDate =
            definition.displayDate || formatBuddhistDate(definition.dateValue);
          message.warning(
            `ช่วงเวลา ${displayDate} ${definition.slotLabel || ""} ถูกจองเต็มแล้ว`
          );
          return;
        }
      }
    }

    setClassSubjects((prev) => {
      const next = [...prev];
      const currentEntry =
        next[activeClassIndex] || normaliseClassEntry(null, activeClassIndex);

      const slots = slotDefinitions.map((definition, i) => {
        const existing = currentEntry.slots?.[i];
        return {
          slotIndex: i,
          date: definition.dateValue,
          slot: definition.slotLabel,
          ...(existing || {}),
        };
      });

      const priceValue = Number(selection.subject?.price);

      for (let offset = 0; offset < duration; offset++) {
        const targetSlotIndex = activeSlotIndex + offset;
        if (targetSlotIndex >= slots.length) break;

        const definition = slotDefinitions[targetSlotIndex];
        slots[targetSlotIndex] = {
          ...slots[targetSlotIndex],
          slotIndex: targetSlotIndex,
          date: definition?.dateValue || null,
          slot: definition?.slotLabel || null,
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
      }

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
    else navigate("/reservation/user-info");
  };

  const handleBack = () => {
    updateFormData({ classSubjects });
    if (onPrev) onPrev();
    else navigate("/reservation/dates");
  };

  useImperativeHandle(ref, () => ({ next: handleNext, prev: handleBack }));

  return (
    <Protected>
      <Row justify="center" className="course-selection-container">
        <Col xs={24} sm={22} md={20} lg={20} xl={20} xxl={18}>
          <div className="section">
            <Title level={2} style={{ color: "#0f172a", marginBottom: 20 }}>
              3. เลือกวิชาที่ต้องการอบรม
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
        classStudentCount={
          activeClassIndex !== null
            ? studentsPerClass[activeClassIndex] || 0
            : formData.numberOfStudents || 0
        }
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
        resolveSubcategoryBlock={resolveSubcategoryBlock}
        buildRuleBlockMessage={buildRuleBlockMessage}
        existingSubjectOrder={activeClassSubjectOrder}
        subjectUsageBySlot={subjectUsageBySlotSnapshot}
        overallSubjectCounts={overallSubjectCountsSnapshot}
        activeSlotKey={activeSlotKey}
        activeClassIndex={activeClassIndex ?? 0}
      />
    </Protected>
  );
});

SubjectSelection.displayName = "SelectSubjects";
export default SubjectSelection;
