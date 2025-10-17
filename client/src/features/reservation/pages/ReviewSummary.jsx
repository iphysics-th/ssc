import React, { forwardRef, useImperativeHandle } from "react";
import { useFormData } from "../../../contexts/FormDataContext";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Typography,
  Button,
  Tag,
  Card,
  Table,
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
  CopyOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useCreateReservationMutation } from "../reservationApiSlice";
import "../../../css/Reservation/SummaryPage.css";

dayjs.locale("th");
const { Title, Text } = Typography;

// ----------- Utility Functions -----------
const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) return "-";
  const buddhistYear = date.year() + 543;
  const month = date.locale("th").format("MMMM");
  return `${date.format("D")} ${month} ${buddhistYear}`;
};

const translatePrefix = (prefix) =>
  ({ mr: "นาย", ms: "นางสาว", mrs: "นาง", dr: "ดร." }[prefix] || prefix);

const translateSchoolSize = (size) =>
  ({
    small: "โรงเรียนขนาดเล็ก",
    medium: "โรงเรียนขนาดกลาง",
    large: "โรงเรียนขนาดใหญ่",
    very_large: "โรงเรียนขนาดใหญ่พิเศษ",
  }[size] || size);

const translateStatus = (status) =>
  ({
    teacher: "ครู",
    school_representative: "ตัวแทนโรงเรียน",
    principal: "ผู้อำนวยการ",
    vice_principal: "รองผู้อำนวยการ",
  }[status] || status);

// ----------- Component -----------
const SummaryPage = forwardRef(({ onNext, onPrev, embedded = false }, ref) => {
  const { formData } = useFormData();
  const authUser = useSelector((state) => state.auth.user);
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
    reservationNumber,
    selectedDates = [],
    studentRange,
    studentLevel,
  } = formData;

  // --- Simplified price function (for layout clarity) ---
  const calculatePrice = (days, students) => {
    if (!days || !students) return 0;
    if (days <= 1) return students * 500;
    if (days <= 2) return students * 450;
    return students * 400;
  };
  const price = calculatePrice(numberOfDays, numberOfStudents);

  // --- Handle save ---
  const saveData = async () => {
    try {
      await createReservation({ ...formData, userId }).unwrap();
      message.success("การจองสำเร็จ!");
      if (onNext) onNext();
    } catch (error) {
      console.error(error);
      message.error("การจองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  };

  useImperativeHandle(ref, () => ({
    next: saveData,
    prev: () => (onPrev ? onPrev() : navigate("/user-info")),
  }));

  // --- Table columns for classSubjects ---
  const subjectColumns = [
    {
      title: "ห้องเรียน",
      dataIndex: "classNumber",
      key: "classNumber",
      align: "center",
      width: "10%",
      render: (text) => <strong>ห้อง {text}</strong>,
    },
    {
      title: "วันที่",
      dataIndex: "date",
      key: "date",
      width: "25%",
      render: (value) => <Text>{formatBuddhistDate(value)}</Text>,
    },
    {
      title: "ช่วงเวลา",
      dataIndex: "slot",
      key: "slot",
      width: "20%",
    },
    {
      title: "ชื่อวิชา",
      dataIndex: "subjectName",
      key: "subjectName",
      render: (value, record) => (
        <>
          {value}{" "}
          {record.code && (
            <Text type="secondary" style={{ fontSize: "0.85rem" }}>
              ({record.code})
            </Text>
          )}
        </>
      ),
    },
  ];

  const subjectData = classSubjects.flatMap((cls) =>
    (cls.slots || []).map((slot, index) => ({
      key: `${cls.classNumber}-${index}`,
      classNumber: cls.classNumber,
      date: slot.date,
      slot: slot.slot,
      subjectName: slot.subject?.name_th || slot.name_th || "-",
      code: slot.subject?.code || slot.code,
    }))
  );

  return (
    <div
      className="summary-container"
      style={{
        maxWidth: 900,
        margin: "0 auto",
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        padding: "32px 40px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 32,
          color: "#334155",
        }}
      >
        <FileTextOutlined style={{ fontSize: 48, color: "#1677ff" }} />
        <Title level={3} style={{ marginTop: 8, marginBottom: 0 }}>
          สรุปข้อมูลการจอง
        </Title>
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
        headStyle={{ fontWeight: 600 }}
      >
        <p>
          <strong>ชื่อ-สกุล:</strong>{" "}
          {`${translatePrefix(prefix)} ${name} ${surname}`}
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

      {/* TRAINING DETAILS */}
      <Card
        title={
          <span>
            <CalendarOutlined /> รายละเอียดการอบรม
          </span>
        }
        bordered={false}
        style={{ marginBottom: 24 }}
        headStyle={{ fontWeight: 600 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: "8px" }}>
          <Text strong>วันที่อบรม:</Text>
          <div>
            {selectedDates.length ? (
              selectedDates.map((d) => (
                <Tag color="blue" style={{ marginBottom: 4 }} key={d}>
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
          <Text>{numberOfStudents} คน</Text>

          <Text strong>จำนวนห้องเรียน:</Text>
          <Text>{numberOfClasses}</Text>

          <Text strong>ระดับชั้น:</Text>
          <Text>
            {studentRange ? `${studentRange} ${studentLevel}` : "-"}
          </Text>
        </div>
      </Card>

      {/* SUBJECTS (TABLE) */}
      <Card
        title={
          <span>
            <BookOutlined /> วิชาตามห้องเรียน
          </span>
        }
        bordered={false}
        style={{ marginBottom: 24 }}
      >
        {subjectData.length ? (
          <Table
            columns={subjectColumns}
            dataSource={subjectData}
            pagination={false}
            size="middle"
            bordered
          />
        ) : (
          <Alert
            type="info"
            message="ยังไม่ได้เลือกวิชา"
            showIcon
            style={{ background: "#f8fafc" }}
          />
        )}
      </Card>

      {/* RESERVATION ID */}
      {reservationNumber && (
        <Card
          style={{
            background: "#f9fafb",
            borderRadius: 10,
            border: "1px dashed #d0d7de",
            marginBottom: 20,
          }}
        >
          <Text strong>
            หมายเลขการจองของคุณ:{" "}
            <span style={{ color: "#2563eb" }}>{reservationNumber}</span>
          </Text>
          <Button
            icon={<CopyOutlined />}
            size="small"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(reservationNumber);
                message.success("คัดลอกหมายเลขเรียบร้อย!");
              } catch {
                message.error("ไม่สามารถคัดลอกได้");
              }
            }}
            style={{ marginLeft: 10 }}
          >
            คัดลอก
          </Button>
        </Card>
      )}

      {/* PRICE */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Title level={4} style={{ color: "#1677ff", marginBottom: 4 }}>
          <DollarOutlined /> ค่าบริการรวม: {price} บาท
        </Title>
        <a
          href="/utility/calculation.jpg"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#2563eb",
            textDecoration: "underline",
            fontSize: "0.9rem",
          }}
        >
          ตารางการคำนวณค่าเรียน คลิกดู
        </a>
      </div>

      {/* ACTIONS */}
      {!embedded && (
        <div style={{ textAlign: "center" }}>
          <Button
            onClick={() => (onPrev ? onPrev() : navigate("/user-info"))}
            icon={<ArrowLeftOutlined />}
            style={{ marginRight: 10 }}
          >
            กลับไปหน้าก่อน
          </Button>
          <Button
            type="primary"
            onClick={saveData}
            loading={isSaving}
            icon={<CheckCircleOutlined />}
          >
            ยืนยันการจอง
          </Button>
        </div>
      )}

      {/* NOTES */}
      <Alert
        type="info"
        showIcon
        style={{
          marginTop: 32,
          borderRadius: 12,
          background: "#f0f9ff",
        }}
        message={
          <div>
            <strong>หมายเหตุ:</strong>
            <ul style={{ paddingLeft: 24, marginBottom: 0 }}>
              <li>ระบบรองรับการจองห้องเรียน 1–5 ห้องต่อครั้ง</li>
              <li>ตรวจสอบรายชื่อวิชาในแต่ละห้องก่อนยืนยัน</li>
              <li>สามารถแก้ไขข้อมูลได้โดยกด “กลับไปหน้าก่อน”</li>
              <li>ระบบจะส่งอีเมลยืนยันอัตโนมัติ</li>
              <li>ตรวจสอบสถานะได้ที่ ssc.skru.ac.th</li>
            </ul>
          </div>
        }
      />
    </div>
  );
});

SummaryPage.displayName = "ReviewSummary";
export default SummaryPage;
