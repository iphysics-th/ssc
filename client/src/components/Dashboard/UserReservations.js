import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Empty,
  Spin,
  Typography,
  Divider,
  Tag,
  Modal,
} from "antd";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { useSelector } from "react-redux";
import {
  useGetMyReservationsQuery,
  useLazyGetReservationsByEmailQuery,
} from "../../features/reservation/reservationApiSlice";

dayjs.locale("th");
const { Text, Title } = Typography;

const formatBuddhistDate = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) return "-";
  const buddhistYear = date.year() + 543;
  const monthName = date.locale("th").format("MMMM");
  return `${date.format("D")} ${monthName} ${buddhistYear}`;
};

const formatMonthYear = (value) => {
  const date = dayjs(value);
  if (!date.isValid()) return "-";
  const buddhistYear = date.year() + 543;
  const monthName = date.locale("th").format("MMMM");
  return `${monthName} ${buddhistYear}`;
};

const confirmationDotColorMap = {
  received: "#B0B0B0",
  processed: "#FADB14",
  confirmed: "#52C41A",
  canceled: "#FF4D4F",
};

const translateConfirmationStatus = (status) =>
  ({
    received: "ได้รับข้อมูล",
    processed: "กำลังดำเนินการ",
    confirmed: "ยืนยันการจอง",
    canceled: "ยกเลิกการจอง",
  }[status] || status);

const statusStyleMap = {
  received: { bg: "#f5f5f5", color: "#555" },
  processed: { bg: "#fff8db", color: "#b58b00" },
  confirmed: { bg: "#e8f8ec", color: "#237804" },
  canceled: { bg: "#fdecec", color: "#a8071a" },
};

const UserReservations = () => {
  const auth = useSelector((state) => state.auth);
  const user = typeof auth.user === "object" ? auth.user : null;
  const userEmail = (user?.email || user?.mail || "").trim();
  const username = (user?.username || "").trim();

  const {
    data: primaryReservations = [],
    isLoading: isPrimaryLoading,
    isError: isPrimaryError,
  } = useGetMyReservationsQuery();

  const [
    triggerFallback,
    {
      data: fallbackReservations = [],
      isFetching: isFallbackFetching,
      isError: isFallbackError,
    },
  ] = useLazyGetReservationsByEmailQuery();

  const [hasTriggeredFallback, setHasTriggeredFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const shouldTriggerFallback =
      (isPrimaryError ||
        (!isPrimaryLoading &&
          Array.isArray(primaryReservations) &&
          primaryReservations.length === 0)) &&
      (userEmail || username) &&
      !hasTriggeredFallback;

    if (shouldTriggerFallback) {
      triggerFallback({
        email: userEmail || undefined,
        username: username || undefined,
      });
      setHasTriggeredFallback(true);
    }
  }, [
    isPrimaryError,
    isPrimaryLoading,
    primaryReservations,
    userEmail,
    username,
    hasTriggeredFallback,
    triggerFallback,
  ]);

  useEffect(() => {
    if (
      isFallbackError ||
      (isPrimaryError && !hasTriggeredFallback && !(userEmail || username))
    ) {
      setErrorMessage("ไม่สามารถดึงข้อมูลการจองได้");
      return;
    }
    if (!isPrimaryLoading && !isFallbackFetching) setErrorMessage(null);
  }, [
    isFallbackError,
    isPrimaryError,
    hasTriggeredFallback,
    userEmail,
    username,
    isPrimaryLoading,
    isFallbackFetching,
  ]);

  const reservations = useMemo(() => {
    if (primaryReservations?.length > 0) return primaryReservations;
    if (fallbackReservations?.length > 0) return fallbackReservations;
    return [];
  }, [primaryReservations, fallbackReservations]);

  const isLoading = isPrimaryLoading || (hasTriggeredFallback && isFallbackFetching);
  const currency = (v) => Number(v || 0).toLocaleString("th-TH");

  if (isLoading)
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
        <Spin size="large" />
      </div>
    );

  if (errorMessage)
    return <Typography.Text type="danger">{errorMessage}</Typography.Text>;

  if (!reservations.length)
    return (
      <Empty
        description={
          <span>
            {user?.username ? `${user.username} ยังไม่มีการจอง` : "ยังไม่มีการจอง"}
          </span>
        }
      />
    );

  /** group by month-year (descending) */
  const groupedByMonth = reservations.reduce((acc, reservation) => {
    const created = reservation.createdAt || reservation.selectedDates?.[0];
    const key = created ? dayjs(created).format("YYYY-MM") : "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(reservation);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedByMonth)
    .sort(([a], [b]) => (dayjs(b).isAfter(dayjs(a)) ? 1 : -1))
    .map(([key, items]) => ({
      monthLabel: formatMonthYear(key),
      reservations: items,
    }));

  /** modal open */
  const openModal = (reservation) => {
    setSelectedReservation(reservation);
    setIsModalVisible(true);
  };

  /** modal close */
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedReservation(null);
  };

  return (
    <div>

      {sortedGroups.map(({ monthLabel, reservations }) => (
        <div key={monthLabel} style={{ marginBottom: 40 }}>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 10,
              borderLeft: "5px solid #1677ff",
              paddingLeft: 10,
            }}
          >
            {monthLabel}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {reservations.map((reservation, index) => {
              const createdAt = reservation.createdAt
                ? formatBuddhistDate(reservation.createdAt)
                : "-";
              const selectedDates = Array.isArray(reservation.selectedDates)
                ? reservation.selectedDates.map((d) => formatBuddhistDate(d))
                : [];

              const price = Number(reservation.price || 0);
              const status = reservation.confirmation || "received";
              const style = statusStyleMap[status] || statusStyleMap.received;
              const statusColor = confirmationDotColorMap[status] || "#999";
              const statusText = translateConfirmationStatus(status);

              return (
                <Card
                  key={reservation._id || index}
                  hoverable
                  onClick={() => openModal(reservation)}
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                    background: "linear-gradient(145deg,#f9fafb,#ffffff)",
                    transition: "transform 0.2s ease",
                    cursor: "pointer",
                  }}
                  bodyStyle={{ padding: "18px 22px" }}
                >
                  <Text strong style={{ color: "#1677ff", fontSize: "1.05rem" }}>
                    หมายเลขการจอง: {reservation.reservationNumber || "-"}
                  </Text>

                  <Divider style={{ margin: "10px 0" }} />

                  <Text strong>ค่าบริการรวม: </Text>
                  <Text>{currency(price)} บาท</Text>
                  <br />

                  <Text strong>วันที่ทำการจอง: </Text>
                  <Text>{createdAt}</Text>
                  <br />

                  <Text strong>วันที่อบรม: </Text>
                  <Text>{selectedDates.join(", ") || "-"}</Text>
                  <Divider style={{ margin: "10px 0" }} />

                  <div
                    style={{
                      background: style.bg,
                      color: style.color,
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.9rem",
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: statusColor,
                        display: "inline-block",
                      }}
                    ></span>
                    {statusText}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* ========== Modal for Reservation Detail ========== */}
      <Modal
        open={isModalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
        centered
        title={
          <div style={{ textAlign: "center", fontWeight: 700 }}>
            รายละเอียดการจอง
          </div>
        }
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {selectedReservation && (
          <ReservationDetailCard
            reservation={selectedReservation}
            currency={currency}
          />
        )}
      </Modal>
    </div>
  );
};

/* =====================================================
   Reservation Detail Component (inside Modal)
   ===================================================== */
const ReservationDetailCard = ({ reservation, currency }) => {
  const { Text, Title } = Typography;

  const selectedDates = Array.isArray(reservation.selectedDates)
    ? reservation.selectedDates.map((d) => formatBuddhistDate(d))
    : [];

  const classSubjects = Array.isArray(reservation.classSubjects)
    ? reservation.classSubjects
    : [];

  const price = Number(reservation.price || 0);
  const status = reservation.confirmation || "received";
  const style = statusStyleMap[status] || statusStyleMap.received;
  const statusColor = confirmationDotColorMap[status] || "#999";
  const statusText = translateConfirmationStatus(status);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <Text strong style={{ fontSize: "1rem", color: "#1677ff" }}>
            ค่าบริการรวม: {currency(price)} บาท
          </Text>
          <br />
          <Text type="secondary">
            หมายเลขการจอง: {reservation.reservationNumber || "-"}
          </Text>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            minWidth: "180px",
          }}
        >
          <Text strong style={{ color: "#334155" }}>
            สถานะการจอง:
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
              fontSize: "0.95rem",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: statusColor,
              }}
            ></span>
            {statusText}
          </div>
        </div>
      </div>

      <Divider style={{ margin: "14px 0" }} />

      <Text strong>วันที่อบรม:</Text>{" "}
      <Text>{selectedDates.join(", ") || "-"}</Text>
      <br />
      <Text strong>จำนวนห้องเรียน:</Text>{" "}
      <Text>{reservation.numberOfClasses || 1}</Text>

      {classSubjects.map((cls, i) => {
        const classNumber = cls.classNumber || i + 1;
        const slots = cls.slots || [];

        const uniqueSubjects = {};
        slots.forEach((slot) => {
          const subj = slot?.subject;
          if (!subj) return;
          const code = subj.code || slot.code;
          if (!uniqueSubjects[code]) {
            uniqueSubjects[code] = {
              ...subj,
              code,
              price: subj.price || 0,
              level_th: subj.level_th || "-",
              category_th: subj.category_th || "-",
              subcategory_th: subj.subcategory_th || "-",
              slotCount: subj.slot || 1,
              dates: {},
            };
          }
          const dateKey = slot.date
            ? dayjs(slot.date).format("YYYY-MM-DD")
            : "unknown";
          if (!uniqueSubjects[code].dates[dateKey]) {
            uniqueSubjects[code].dates[dateKey] = new Set();
          }
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

            {subjectsArray.length > 0 ? (
              subjectsArray.map((record, idx) => (
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
                      ระยะเวลาเรียน {record.slotCount * 3} ชั่วโมง
                    </Tag>
                    <Tag color="gold">
                      ฿{record.price.toLocaleString("th-TH")}
                    </Tag>
                  </div>
                </Card>
              ))
            ) : (
              <Text type="secondary">ยังไม่ได้เลือกวิชา</Text>
            )}

            <div style={{ textAlign: "right", marginTop: 8 }}>
              <Text strong>รวม: {currency(totalClassPrice)} บาท</Text>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserReservations;
