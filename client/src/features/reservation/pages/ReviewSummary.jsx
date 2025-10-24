import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
} from "react";
import { useFormData } from "../../../contexts/FormDataContext";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Typography,
  Button,
  Tag,
  Card,
  Divider,
  Alert,
  message,
} from "antd";
import {
  ProfileOutlined,
  PhoneOutlined,
  MailOutlined,
  BankOutlined,
  CalendarOutlined,
  BookOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useCreateReservationMutation } from "../reservationApiSlice";
import { groupClassSubjects } from "../utils/classGrouping";
import "../../../css/Reservation/SummaryPage.css";

dayjs.locale("th");
const { Title, Text } = Typography;

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) return "-";
  const buddhistYear = date.year() + 543;
  const month = date.locale("th").format("MMMM");
  return `${date.format("D")} ${month} ${buddhistYear}`;
};

const translatePrefix = (p) =>
  ({ mr: "นาย", ms: "นางสาว", mrs: "นาง", dr: "ดร." }[p] || p);
const translateStatus = (s) =>
  ({
    teacher: "ครู",
    school_representative: "ตัวแทนโรงเรียน",
    principal: "ผู้อำนวยการ",
    vice_principal: "รองผู้อำนวยการ",
  }[s] || s);
const translateSchoolSize = (s) =>
  ({
    small: "โรงเรียนขนาดเล็ก",
    medium: "โรงเรียนขนาดกลาง",
    large: "โรงเรียนขนาดใหญ่",
    very_large: "โรงเรียนขนาดใหญ่พิเศษ",
  }[s] || s);

const SummaryPage = forwardRef(({ onNext, onPrev, embedded = false }, ref) => {
  const { formData, updateFormData } = useFormData();
  const authUser = useSelector((st) => st.auth.user);
  const [createReservation, { isLoading: isSaving }] =
    useCreateReservationMutation();
  const navigate = useNavigate();

  const userId = authUser?.id || authUser?._id || null;
  const {
    numberOfDays,
    numberOfStudents,
    numberOfClasses,
    classSubjects = [],
    name,
    surname,
    prefix,
    status,
    telephone,
    mail,
    school,
    schoolSize,
    selectedDates = [],
    studentRange,
    studentLevel,
  } = formData;

  const groupedClasses = useMemo(
    () => groupClassSubjects(classSubjects),
    [classSubjects]
  );
  const groupedClassCount = groupedClasses.length;

  const classStudentCounts = useMemo(() => {
    const arr = Array.isArray(formData.studentsPerClass)
      ? formData.studentsPerClass
      : [];
    return arr.reduce((map, v, i) => {
      const n = Number(v);
      map.set(i + 1, Number.isFinite(n) && n > 0 ? Math.round(n) : 0);
      return map;
    }, new Map());
  }, [formData.studentsPerClass]);

  const fallbackClassStudents = useMemo(() => {
    const parsed = Number(numberOfStudents);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return groupedClassCount <= 1 ? Math.round(parsed) : 0;
  }, [groupedClassCount, numberOfStudents]);

  const resolveClassStudents = (classNumber) => {
    const value = classStudentCounts.get(classNumber);
    if (Number.isFinite(value) && value > 0) return value;
    return fallbackClassStudents;
  };

  const getUniqueSubjects = useCallback((cls) => {
    const uniqueSubjects = {};
    (cls?.slots || []).forEach((slot, slotIndex) => {
      const subj = slot.subject;
      if (!subj) return;
      const code = subj.code || slot.code || `slot-${slot.slotIndex}`;
      if (!uniqueSubjects[code]) {
        const slotCount =
          subj.slot && subj.slot > 0 ? Number(subj.slot) : 1;
        const rawPrice =
          slot.price != null ? Number(slot.price) : Number(subj.price);
        uniqueSubjects[code] = {
          ...subj,
          code,
          level_th: subj.level_th || "-",
          category_th: subj.category_th || "-",
          subcategory_th: subj.subcategory_th || "-",
          price: Number.isFinite(rawPrice) ? rawPrice : 0,
          slotCount,
          dates: {},
          firstSlotIndex: Number.isFinite(slot?.slotIndex)
            ? Number(slot.slotIndex)
            : Number.isFinite(slotIndex)
              ? slotIndex
              : Number.MAX_SAFE_INTEGER,
        };
      }
      const slotIndexValue = Number.isFinite(slot?.slotIndex)
        ? Number(slot.slotIndex)
        : Number.isFinite(slotIndex)
          ? slotIndex
          : null;
      if (
        Number.isFinite(slotIndexValue) &&
        (uniqueSubjects[code].firstSlotIndex == null ||
          slotIndexValue < uniqueSubjects[code].firstSlotIndex)
      ) {
        uniqueSubjects[code].firstSlotIndex = slotIndexValue;
      }
      const dateKey = slot.date
        ? dayjs(slot.date).format("YYYY-MM-DD")
        : "unknown";
      if (!uniqueSubjects[code].dates[dateKey])
        uniqueSubjects[code].dates[dateKey] = new Set();
      if (slot.slot?.includes("เช้า"))
        uniqueSubjects[code].dates[dateKey].add("9.00–12.00");
      else if (slot.slot?.includes("บ่าย"))
        uniqueSubjects[code].dates[dateKey].add("13.00–16.00");
      else if (slot.slot)
        uniqueSubjects[code].dates[dateKey].add(slot.slot);
    });
    return Object.values(uniqueSubjects).sort((a, b) => {
      const aIdx = Number.isFinite(a.firstSlotIndex)
        ? a.firstSlotIndex
        : Number.MAX_SAFE_INTEGER;
      const bIdx = Number.isFinite(b.firstSlotIndex)
        ? b.firstSlotIndex
        : Number.MAX_SAFE_INTEGER;
      return aIdx - bIdx;
    });
  }, []);

  const currency = (v) => Number(v || 0).toLocaleString("th-TH");

  const overallTotals = useMemo(() => {
    const totals = { base: 0, discount: 0, overflow: 0 };
    const globalSubjectSelectionCounts = new Map();

    groupedClasses.forEach((cls, classIdx) => {
      const mapValue = classStudentCounts.get(cls.classNumber);
      const classStudents =
        Number.isFinite(mapValue) && mapValue > 0
          ? mapValue
          : fallbackClassStudents;
      const subjects = getUniqueSubjects(cls);

      subjects.forEach((record, idx) => {
        const subjectCode =
          record.code ||
          record.name_th ||
          record.subcategory_th ||
          `subject-${idx}`;
        const base = Number(record.price) || 0;
        let overflowCount = 0;
        const capacity = Number(record.student_max);
        if (
          classStudents > 0 &&
          Number.isFinite(capacity) &&
          capacity > 0
        ) {
          overflowCount = Math.max(0, classStudents - capacity);
        }
        const overflowTooHigh = overflowCount > 5;
        const chargeableOverflow = overflowTooHigh ? 0 : overflowCount;
        const overflowCharge = chargeableOverflow * 200;

        const perClassEligible = classIdx >= 1 || idx >= 1;
        const globalPriorCount =
          globalSubjectSelectionCounts.get(subjectCode) || 0;
        const totalClassrooms =
          record?.total_classroom != null
            ? Number(record.total_classroom)
            : record?.total_classrooms != null
              ? Number(record.total_classrooms)
              : null;
        const repeatEligible =
          Number.isFinite(totalClassrooms) &&
          totalClassrooms > 2 &&
          globalPriorCount >= 1;

        const discountEligible = perClassEligible || repeatEligible;
        const discountAmount = discountEligible ? Math.min(4000, base) : 0;

        totals.base += base;
        totals.discount += discountAmount;
        totals.overflow += overflowCharge;

        globalSubjectSelectionCounts.set(subjectCode, globalPriorCount + 1);
      });
    });

    return totals;
  }, [
    groupedClasses,
    classStudentCounts,
    fallbackClassStudents,
    getUniqueSubjects,
  ]);

  const overallNetBase = overallTotals.base - overallTotals.discount;
  const grandTotal = overallNetBase + overallTotals.overflow;

  const globalSubjectSelectionCountsForDisplay = new Map();

  const saveData = async () => {
    try {
      const totalStudents = Array.isArray(formData.studentsPerClass)
        ? formData.studentsPerClass.reduce((a, v) => {
            const n = Number(v);
            return a + (Number.isFinite(n) && n > 0 ? n : 0);
          }, 0)
        : formData.numberOfStudents || 0;

      const totalPrice = grandTotal;

      updateFormData({ price: totalPrice, numberOfStudents: totalStudents });
      await createReservation({
        ...formData,
        userId,
        price: totalPrice,
        numberOfStudents: totalStudents,
      }).unwrap();
      message.success("การจองสำเร็จ!");
      if (onNext) onNext();
    } catch (e) {
      console.error(e);
      message.error("การจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  useImperativeHandle(ref, () => ({
    next: saveData,
    prev: () => (onPrev ? onPrev() : navigate("/user-info")),
  }));

  return (
    <div
      style={{
        maxWidth: 950,
        margin: "0 auto",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        padding: "32px 40px",
      }}
    >
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <FileTextOutlined style={{ fontSize: 48, color: "#1677ff" }} />
        <Title level={3}>สรุปข้อมูลการจอง</Title>
        <Text type="secondary">กรุณาตรวจสอบรายละเอียดก่อนยืนยัน</Text>
      </div>

      {/* USER INFO */}
      <Card
        title={
          <span>
            <ProfileOutlined /> ข้อมูลผู้จอง
          </span>
        }
        bordered={false}
        style={{ marginBottom: 24 }}
      >
        <p>
          <strong>ชื่อ-สกุล:</strong> {`${translatePrefix(prefix)} ${name} ${surname}`}
        </p>
        <p>
          <strong>ตำแหน่ง:</strong> {translateStatus(status)}
        </p>
        <p>
          <PhoneOutlined /> {telephone} <br />
          <MailOutlined /> {mail}
        </p>
        <Divider />
        <p>
          <BankOutlined /> {school} <br />
          <Text type="secondary">{translateSchoolSize(schoolSize)}</Text>
        </p>
      </Card>

      {/* TRAINING INFO */}
      <Card
        title={
          <span>
            <CalendarOutlined /> รายละเอียดการอบรม
          </span>
        }
        bordered={false}
        style={{ marginBottom: 24 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr" }}>
          <Text strong>วันที่อบรม:</Text>
          <div>
            {selectedDates.length ? (
              selectedDates.map((d) => (
                <Tag color="blue" key={d}>
                  {formatBuddhistDate(d)}
                </Tag>
              ))
            ) : (
              <Text type="secondary">ยังไม่ได้เลือกวันที่</Text>
            )}
          </div>
          <Text strong>จำนวนวัน:</Text>
          <Text>{numberOfDays} วัน</Text>
          <Text strong>จำนวนนักเรียน:</Text>
          <Text>
            {numberOfStudents} คน, {studentRange} {studentLevel}
          </Text>
          <Text strong>จำนวนห้องเรียน:</Text>
          <Text>{numberOfClasses}</Text>
        </div>
      </Card>

      {/* SUBJECTS PER CLASS */}
      <Card
        title={
          <span>
            <BookOutlined /> วิชาตามห้องเรียน
          </span>
        }
        bordered={false}
      >
        {groupedClasses.length ? (
          groupedClasses.map((cls, classIdx) => {
            const classStudents = resolveClassStudents(cls.classNumber);
            const subjectsArray = getUniqueSubjects(cls);
            const classPricing = subjectsArray.reduce(
              (acc, record, idx) => {
                const subjectCode =
                  record.code ||
                  record.name_th ||
                  record.subcategory_th ||
                  `subject-${idx}`;
                const base = Number(record.price) || 0;
                let overflowCount = 0;
                const capacity = Number(record.student_max);
                if (
                  classStudents > 0 &&
                  Number.isFinite(capacity) &&
                  capacity > 0
                ) {
                  overflowCount = Math.max(0, classStudents - capacity);
                }
                const overflowTooHigh = overflowCount > 5;
                const chargeableOverflow = overflowTooHigh ? 0 : overflowCount;
                const overflowCharge = chargeableOverflow * 200;

                const perClassEligible = classIdx >= 1 || idx >= 1;
                const globalPriorCount =
                  globalSubjectSelectionCountsForDisplay.get(subjectCode) || 0;
                const totalClassrooms =
                  record?.total_classroom != null
                    ? Number(record.total_classroom)
                    : record?.total_classrooms != null
                      ? Number(record.total_classrooms)
                      : null;
                const repeatEligible =
                  Number.isFinite(totalClassrooms) &&
                  totalClassrooms > 2 &&
                  globalPriorCount >= 1;

                const discountEligible = perClassEligible || repeatEligible;
                const discountAmount = discountEligible
                  ? Math.min(4000, base)
                  : 0;
                const discountedBase = Math.max(0, base - discountAmount);
                const total = discountedBase + overflowCharge;

                acc.base += base;
                acc.discount += discountAmount;
                acc.overflow += overflowCharge;
                acc.breakdown.push({
                  ...record,
                  basePrice: base,
                  discountAmount,
                  discountedBase,
                  overflowCount,
                  overflowCharge,
                  overflowTooHigh,
                  discountEligible,
                  repeatEligible,
                  total,
                });

                globalSubjectSelectionCountsForDisplay.set(
                  subjectCode,
                  globalPriorCount + 1
                );
                return acc;
              },
              { base: 0, discount: 0, overflow: 0, breakdown: [] }
            );
            const subjectsArrayWithOverflow = classPricing.breakdown;
            const netBase = classPricing.base - classPricing.discount;
            const totalClassPrice = netBase + classPricing.overflow;

            return (
              <div key={cls.classNumber} style={{ marginBottom: 40 }}>
                <div
                  style={{
                    background: "linear-gradient(90deg,#eff6ff,#ffffff)",
                    padding: "10px 16px",
                    borderRadius: 8,
                    marginBottom: 16,
                    borderLeft: "5px solid #1677ff",
                  }}
                >
                  <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                    ห้องเรียนที่ {cls.classNumber}
                  </Title>
                  <Text type="secondary">
                    นักเรียน {classStudents.toLocaleString("th-TH")} คน,{" "}
                    {studentRange} {studentLevel}
                  </Text>
                </div>

                {/* Subject cards */}
                {subjectsArrayWithOverflow.map((record, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#f9fafb",
                      padding: "16px 20px",
                      borderRadius: 10,
                      marginBottom: 16,
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    {/* Date/time */}
                    {Object.entries(record.dates).map(([date, times]) => (
                      <div key={date} style={{ marginBottom: 6 }}>
                        <Text strong>{formatBuddhistDate(date)}:</Text>{" "}
                        <Text type="secondary">
                          {Array.from(times).join(" และ ")}
                        </Text>
                      </div>
                    ))}

                    <Divider style={{ margin: "8px 0" }} />

                    {/* Subject info */}
                    <div>
                      <strong style={{ fontSize: "1.05rem" }}>
                        {record.name_th}
                      </strong>{" "}
                      {record.code && (
                        <Text type="secondary" style={{ fontSize: "0.9rem" }}>
                          ({record.code})
                        </Text>
                      )}
                    </div>

                    <div style={{ marginTop: 6 }}>
                      <Tag color="blue">{record.level_th}</Tag>
                      <Tag color="cyan">{record.category_th}</Tag>
                      <Tag color="purple">{record.subcategory_th}</Tag>
                      <Tag color="magenta">
                        ระยะเวลาเรียน {record.slotCount * 3} ชั่วโมง
                      </Tag>
                    </div>

                    {/* Price */}
                    <div style={{ marginTop: 10, textAlign: "right" }}>
                      <div>
                        <Text
                          delete={record.discountAmount > 0}
                          style={{
                            fontSize: "0.95rem",
                            color: record.discountAmount > 0 ? "#94a3b8" : "#1677ff",
                            marginRight: record.discountAmount > 0 ? 8 : 0,
                          }}
                        >
                          ราคาปกติ ฿{currency(record.basePrice)} บาท
                        </Text>
                        {record.discountAmount > 0 && (
                          <Text strong style={{ color: "#16a34a", fontSize: "1.05rem" }}>
                            ราคาหลังส่วนลด ฿{currency(record.discountedBase)} บาท
                          </Text>
                        )}
                      </div>
                      {record.discountAmount > 0 && (
                        <div style={{ color: "#16a34a", fontSize: "0.9rem" }}>
                          ส่วนลด -฿{currency(record.discountAmount)} บาท
                        </div>
                      )}
                      {record.overflowTooHigh ? (
                        <div style={{ marginTop: 6, color: "#dc2626", fontSize: "0.9rem" }}>
                          มีนักเรียนเกินจำนวนที่คอร์สรองรับมากกว่า 5 คน ไม่สามารถเลือกวิชานี้ได้
                        </div>
                      ) : (
                        record.overflowCount > 0 && (
                          <div style={{ marginTop: 6, color: "#dc2626", fontSize: "0.9rem" }}>
                            <div>
                              มีนักเรียนเกินจำนวนที่คอร์สรองรับ{" "}
                              {record.overflowCount.toLocaleString("th-TH")} คน
                            </div>
                            <div>
                              จะมีค่าบริการเพิ่ม{" "}
                              {record.overflowCount.toLocaleString("th-TH")} คน x 200 บาท ={" "}
                              {currency(record.overflowCharge)} บาท
                            </div>
                          </div>
                        )
                      )}
                      <div
                        style={{
                          fontSize: "0.95rem",
                          color: "#0f172a",
                          marginTop: 6,
                          fontWeight: 600,
                        }}
                      >
                        รวมสุทธิ: ฿{currency(record.total)} บาท
                      </div>
                    </div>
                  </div>
                ))}

                {/* Per-class total */}
                <div
                  style={{
                    textAlign: "right",
                    color: "#334155",
                    marginTop: 12,
                  }}
                >
                  <div>ราคาพื้นฐานรวม: {currency(classPricing.base)} บาท</div>
                  {classPricing.discount > 0 && (
                    <div style={{ color: "#16a34a" }}>
                      ส่วนลดรวม: -{currency(classPricing.discount)} บาท
                    </div>
                  )}
                  <div>
                    ยอดหลังส่วนลด: {currency(netBase)} บาท
                  </div>
                  {classPricing.overflow > 0 && (
                    <div style={{ color: "#dc2626" }}>
                      ค่าบริการเพิ่มจากนักเรียนเกิน:{" "}
                      {currency(classPricing.overflow)} บาท
                    </div>
                  )}
                  <div
                    style={{
                      fontWeight: 700,
                      marginTop: 4,
                    }}
                  >
                    รวมสุทธิ: {currency(totalClassPrice)} บาท
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <Alert type="info" message="ยังไม่ได้เลือกวิชา" showIcon />
        )}
      </Card>

      {/* TOTAL */}
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Title level={4} style={{ color: "#1677ff" }}>
          <DollarOutlined /> ค่าบริการรวมทั้งหมด:{" "}
          {currency(grandTotal)} บาท
        </Title>
        <div
          style={{
            color: "#64748b",
            fontSize: "0.95rem",
            marginTop: 6,
            lineHeight: 1.6,
          }}
        >
          <div>ราคาก่อนส่วนลด {currency(overallTotals.base)} บาท</div>
          {overallTotals.discount > 0 && (
            <div>ส่วนลดรวม -{currency(overallTotals.discount)} บาท</div>
          )}
          <div>ยอดหลังส่วนลด {currency(overallNetBase)} บาท</div>
          {overallTotals.overflow > 0 && (
            <div>ค่าบริการเพิ่ม +{currency(overallTotals.overflow)} บาท</div>
          )}
        </div>
      </div>

      {!embedded && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Button
            onClick={() => (onPrev ? onPrev() : navigate("/user-info"))}
            icon={<ArrowLeftOutlined />}
            style={{ marginRight: 10 }}
          >
            กลับไปหน้าก่อน
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={isSaving}
            onClick={saveData}
          >
            ยืนยันการจอง
          </Button>
        </div>
      )}
    </div>
  );
});

SummaryPage.displayName = "ReviewSummary";
export default SummaryPage;
