import React, { forwardRef, useImperativeHandle, useMemo } from "react";
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

  const currency = (v) => Number(v || 0).toLocaleString("th-TH");

  const saveData = async () => {
    try {
      const totalStudents = Array.isArray(formData.studentsPerClass)
        ? formData.studentsPerClass.reduce((a, v) => {
            const n = Number(v);
            return a + (Number.isFinite(n) && n > 0 ? n : 0);
          }, 0)
        : formData.numberOfStudents || 0;

      const totalPrice = groupedClasses.reduce((sum, cls) => {
        const uniq = {};
        cls.slots.forEach((s) => {
          const subj = s.subject;
          if (!subj) return;
          const code = subj.code || s.code;
          if (!uniq[code]) uniq[code] = subj.price || 0;
        });
        return sum + Object.values(uniq).reduce((a, b) => a + b, 0);
      }, 0);

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
          groupedClasses.map((cls) => {
            const classStudents = classStudentCounts.get(cls.classNumber) || 0;

            // Combine subjects by unique code
            const uniqueSubjects = {};
            cls.slots.forEach((slot) => {
              const subj = slot.subject;
              if (!subj) return;
              const code = subj.code || slot.code;
              if (!uniqueSubjects[code]) {
                uniqueSubjects[code] = {
                  ...subj,
                  code,
                  level_th: subj.level_th || "-",
                  category_th: subj.category_th || "-",
                  subcategory_th: subj.subcategory_th || "-",
                  price: subj.price || 0,
                  slotCount: subj.slot || 1,
                  dates: {},
                };
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

            const subjectsArray = Object.values(uniqueSubjects);
            const totalClassPrice = subjectsArray.reduce(
              (a, b) => a + (b.price || 0),
              0
            );

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
                {subjectsArray.map((record, idx) => (
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
                    <div style={{ textAlign: "right", marginTop: 6 }}>
                      <Text strong style={{ color: "#1677ff" }}>
                        {currency(record.price)} บาท
                      </Text>
                    </div>
                  </div>
                ))}

                {/* Per-class total */}
                <div
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    color: "#334155",
                    marginTop: 12,
                  }}
                >
                  รวม: {currency(totalClassPrice)} บาท
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
          {groupedClasses
            .reduce((sum, cls) => {
              const uniq = {};
              cls.slots.forEach((slot) => {
                const subj = slot.subject;
                if (!subj) return;
                const code = subj.code || slot.code;
                if (!uniq[code]) uniq[code] = subj.price || 0;
              });
              return sum + Object.values(uniq).reduce((a, b) => a + b, 0);
            }, 0)
            .toLocaleString("th-TH")}{" "}
          บาท
        </Title>
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
