// src/admin/pages/AdminReservations.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Empty,
  Spin,
  Typography,
  Divider,
  Tag,
  Select,
  message,
  Card,
} from "antd";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/th";
import {
  useGetReservationTableQuery,
  useUpdateReservationStatusMutation,
} from "../../features/reservation/reservationApiSlice";

dayjs.locale("th");
const { Text, Title } = Typography;

/* -----------------------------------------------------
   🔸 Helper Functions
----------------------------------------------------- */
const monthTh = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const confirmationDotColorMap = {
  received: "#B0B0B0",
  processed: "#FADB14",
  confirmed: "#52C41A",
  canceled: "#FF4D4F",
};
const statusStyleMap = {
  received: { bg: "#f5f5f5", color: "#555" },
  processed: { bg: "#fff8db", color: "#b58b00" },
  confirmed: { bg: "#e8f8ec", color: "#237804" },
  canceled: { bg: "#fdecec", color: "#a8071a" },
};

const translateConfirmationStatus = (status) =>
  ({
    received: "ได้รับข้อมูล",
    processed: "กำลังดำเนินการ",
    confirmed: "ยืนยันการจอง",
    canceled: "ยกเลิกการจอง",
  }[status] || status);

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

const formatBuddhistDate = (value) => {
  const d = dayjs(value);
  if (!d.isValid()) return "-";
  return `${d.date()} ${monthTh[d.month()]} ${d.year() + 543}`;
};
const currency = (v) => Number(v || 0).toLocaleString("th-TH");
const getYear = (iso) => (dayjs(iso).isValid() ? dayjs(iso).year() : null);
const getMonthIndex = (iso) => (dayjs(iso).isValid() ? dayjs(iso).month() : 0);

/* -----------------------------------------------------
   🔸 Main Component
----------------------------------------------------- */
export default function AdminReservations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, isFetching } = useGetReservationTableQuery({
    page: 1,
    limit: 1000,
  });
  const [updateReservationStatus] = useUpdateReservationStatusMutation();

  const [selectedReservation, setSelectedReservation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const reservations = useMemo(
    () => (data?.data && Array.isArray(data.data) ? data.data : []),
    [data]
  );

  // ===== Year Filter =====
  const allYears = useMemo(() => {
    const years = new Set();
    reservations.forEach((r) => {
      const y = getYear(r.createdAt);
      if (y) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [reservations]);

  const initialYear =
    Number(searchParams.get("year")) ||
    (allYears.length ? allYears[0] : dayjs().year());
  const [selectedYear, setSelectedYear] = useState(initialYear);

  useEffect(() => {
    const np = new URLSearchParams();
    np.set("year", selectedYear);
    setSearchParams(np);
  }, [selectedYear]);

  // ===== Filter and Group =====
  const reservationsOfYear = useMemo(
    () => reservations.filter((r) => getYear(r.createdAt) === selectedYear),
    [reservations, selectedYear]
  );

  const monthGroups = useMemo(() => {
    const groups = {};
    reservationsOfYear.forEach((r) => {
      const m = getMonthIndex(r.createdAt);
      if (!groups[m]) groups[m] = [];
      groups[m].push(r);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => b - a)
      .map(([monthIndex, list]) => ({ monthIndex: Number(monthIndex), list }));
  }, [reservationsOfYear]);

  // ===== Handlers =====
  const handleStatusChange = async (record, val) => {
    try {
      await updateReservationStatus({
        id: record._id || record.id,
        field: "confirmation",
        value: val,
      }).unwrap();
      message.success(`อัปเดตเป็น "${translateConfirmationStatus(val)}"`);
    } catch {
      message.error("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const openModal = (r) => {
    setSelectedReservation(r);
    setModalOpen(true);
  };

  // ===== Components =====
  const StatusSelect = ({ record }) => (
    <Select
      value={record.confirmation || "received"}
      onChange={(val) => handleStatusChange(record, val)}
      style={{ minWidth: 160 }}
      size="small"
      options={Object.keys(confirmationDotColorMap).map((k) => ({
        value: k,
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: confirmationDotColorMap[k],
                display: "inline-block",
              }}
            />
            {translateConfirmationStatus(k)}
          </div>
        ),
      }))}
    />
  );

  const ReservationItem = ({ r }) => {
    const price = currency(r.price);
    const createdDate = formatBuddhistDate(r.createdAt);
    const trainDates =
      r.selectedDates?.map((d) => formatBuddhistDate(d)).join(", ") || "-";

    return (
      <div className="reservation-item" onClick={() => openModal(r)}>
        <div className="status-section" onClick={(e) => e.stopPropagation()}>
          <StatusSelect record={r} />
        </div>
        <div className="info-section">
          <div className="res-id">
            หมายเลขการจอง: {r.reservationNumber || "-"}
          </div>
          <div className="res-info">
            <Text strong>ชื่อผู้จอง:</Text>{" "}
            {translatePrefix(r.prefix)} {r.name} {r.surname}{" "}
            <Text type="secondary">({translateStatus(r.status)})</Text>
            <br />
            <Text strong>โรงเรียน:</Text> {r.school}{" "}
            {r.schoolSize && (
              <Text type="secondary">
                ({translateSchoolSize(r.schoolSize)})
              </Text>
            )}
          </div>
          <div className="tag-list">
            <Tag color="gold">ค่าบริการรวม ฿{price}</Tag>
            <Tag color="blue">จองเมื่อ {createdDate}</Tag>
            <Tag color="purple">อบรม {trainDates}</Tag>
          </div>
        </div>
      </div>
    );
  };

  const DetailModal = () => {
  const r = selectedReservation;
  if (!r) return null;

  const price = Number(r.price || 0);
  const status = r.confirmation || "received";
  const style = statusStyleMap[status] || statusStyleMap.received;
  const statusColor = confirmationDotColorMap[status] || "#999";
  const statusText = translateConfirmationStatus(status);
  const selectedDates =
    r.selectedDates?.map((d) => formatBuddhistDate(d)) || [];

  return (
    <Modal
      open={modalOpen}
      onCancel={() => setModalOpen(false)}
      footer={null}
      width={850}
      centered
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 700 }}>
            รายละเอียดการจอง (เลขที่ {r.reservationNumber})
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text strong>สถานะการจอง:</Text>
            <StatusSelect record={r} />
          </div>
        </div>
      }
      bodyStyle={{ maxHeight: "75vh", overflowY: "auto" }}
    >
      {/* User Info */}
      <div style={{ marginBottom: 12 }}>
        <Text strong>ชื่อผู้จอง:</Text> {translatePrefix(r.prefix)} {r.name}{" "}
        {r.surname}
        <br />
        <Text strong>โรงเรียน:</Text> {r.school}{" "}
        {r.schoolSize && (
          <Text type="secondary">({translateSchoolSize(r.schoolSize)})</Text>
        )}
        <br />
        <Text strong>อีเมล:</Text> {r.mail || "-"}
        <br />
        <Text strong>โทรศัพท์:</Text> {r.telephone || "-"}
      </div>

      <Divider />

      {/* Summary Row */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Text strong style={{ color: "#1677ff" }}>
          ค่าบริการรวม: {currency(price)} บาท
        </Text>
        <div
          style={{
            background: style.bg,
            color: style.color,
            padding: "6px 14px",
            borderRadius: 20,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: statusColor,
            }}
          />
          {statusText}
        </div>
      </div>

      <Divider />

      {/* Dates & Classes */}
      <Text strong>วันที่อบรม:</Text>{" "}
      <Text>{selectedDates.join(", ") || "-"}</Text>
      <br />
      <Text strong>จำนวนห้องเรียน:</Text>{" "}
      <Text>{r.numberOfClasses || 1}</Text>

      {/* Classroom and Subject Info */}
      {Array.isArray(r.classSubjects) &&
        r.classSubjects.map((cls, i) => {
          const classNumber = cls.classNumber || i + 1;
          const slots = cls.slots || [];

          const uniqueSubjects = {};
          slots.forEach((slot) => {
            const subj = slot.subject || slot;
            if (!subj) return;
            const code = subj.code || slot.code || `subj-${i}`;
            if (!uniqueSubjects[code]) {
              uniqueSubjects[code] = {
                ...subj,
                code,
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
          });

          const subjectsArray = Object.values(uniqueSubjects);
          const totalClassPrice = subjectsArray.reduce(
            (a, b) => a + (b.price || 0),
            0
          );

          return (
            <div key={i} style={{ marginTop: 24 }}>
              <div
                style={{
                  background: "linear-gradient(90deg,#eff6ff,#ffffff)",
                  padding: "10px 16px",
                  borderRadius: 8,
                  borderLeft: "5px solid #1677ff",
                  marginBottom: 12,
                }}
              >
                <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                  ห้องเรียนที่ {classNumber}
                </Title>
              </div>

              {subjectsArray.map((record, idx) => (
                <Card
                  key={idx}
                  size="small"
                  style={{
                    marginBottom: 12,
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    background: "#ffffff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    style={{
                      marginBottom: 8,
                      paddingBottom: 6,
                      borderBottom: "1px dashed #e2e8f0",
                    }}
                  >
                    {Object.entries(record.dates).map(([date, times]) => (
                      <div key={date}>
                        <Text strong>{formatBuddhistDate(date)}:</Text>{" "}
                        <Text type="secondary">
                          {Array.from(times).join(" และ ")}
                        </Text>
                      </div>
                    ))}
                  </div>

                  <div>
                    <strong>{record.name_th}</strong>{" "}
                    {record.code && (
                      <Text type="secondary" style={{ fontSize: "0.85rem" }}>
                        ({record.code})
                      </Text>
                    )}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <Tag color="blue">{record.level_th}</Tag>
                    <Tag color="cyan">{record.category_th}</Tag>
                    <Tag color="purple">{record.subcategory_th}</Tag>
                    <Tag color="magenta">
                      ระยะเวลาเรียน {record.slot * 3 || 3} ชั่วโมง
                    </Tag>
                    <Tag color="gold">
                      ฿{(record.price || 0).toLocaleString("th-TH")}
                    </Tag>
                  </div>
                </Card>
              ))}

              <div style={{ textAlign: "right", marginTop: 8 }}>
                <Text strong>รวม: {currency(totalClassPrice)} บาท</Text>
              </div>
            </div>
          );
        })}
    </Modal>
  );
};


  if (isLoading)
    return (
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <Spin size="large" />
      </div>
    );

  if (!reservations.length)
    return <Empty description="ยังไม่มีข้อมูลการจอง" />;

  return (
    <div className="admin-reservations-container">
      <style>{`
  .admin-reservations-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 24px;
  }

  .reservation-item {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 16px;
    align-items: start;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 14px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.05);
    cursor: pointer;
    transition: 0.2s ease;
  }

  .reservation-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(0,0,0,0.08);
  }

  .status-section {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .res-id {
    font-weight: 600;
    color: #0f172a;
    font-size: 1rem;
  }

  .res-info {
    font-size: 0.95rem;
    color: #334155;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
  }

  /* ✅ Responsive Behavior for iPad & iPhone */
  @media (max-width: 1024px) {
    .admin-reservations-container {
      padding: 16px 12px;
    }

    .reservation-item {
      grid-template-columns: 1fr;
      gap: 10px;
      padding: 14px 16px;
    }

    .status-section {
      justify-content: flex-start;
    }

    .res-id {
      font-size: 0.95rem;
    }

    .res-info {
      font-size: 0.9rem;
    }

    .tag-list {
      gap: 6px;
    }
  }

  @media (max-width: 600px) {
    .admin-reservations-container {
      padding: 12px;
    }

    .reservation-item {
      padding: 12px 14px;
    }

    .res-id {
      font-size: 0.9rem;
    }

    .tag-list {
      flex-direction: column;
      gap: 4px;
    }

    /* Make modal more compact on small phones */
    .ant-modal {
      width: 95% !important;
      max-width: 95% !important;
    }

    .ant-modal-body {
      padding: 12px !important;
    }

    .ant-modal-title {
      font-size: 1rem !important;
    }
  }
`}</style>


      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Title level={3} style={{ color: "#1677ff" }}>
          All Reservations
        </Title>
        <Select
          value={selectedYear}
          onChange={setSelectedYear}
          options={allYears.map((y) => ({ value: y, label: y + 543 }))}
          style={{ width: 120 }}
        />
      </div>

      {monthGroups.map(({ monthIndex, list }) => (
        <div key={monthIndex} style={{ marginBottom: 32 }}>
          <Title level={4}>
            {monthTh[monthIndex]} {selectedYear + 543}
          </Title>
          {list.map((r) => (
            <ReservationItem key={r._id || r.id} r={r} />
          ))}
        </div>
      ))}

      {isFetching && (
        <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
          กำลังรีเฟรชข้อมูล...
        </Text>
      )}

      <DetailModal />
    </div>
  );
}
