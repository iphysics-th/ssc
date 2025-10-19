import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Empty,
  Spin,
  Typography,
  Divider,
  Table,
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

  const subjectColumns = [
    {
      title: "วันที่",
      dataIndex: "date",
      key: "date",
      width: "18%",
      render: (v) => formatBuddhistDate(v),
    },
    {
      title: "ช่วงเวลา",
      dataIndex: "slot",
      key: "slot",
      width: "10%",
      align: "center",
    },
    {
      title: "ชื่อวิชา",
      dataIndex: "subjectName",
      key: "subjectName",
      render: (v, r) => (
        <>
          {v}{" "}
          {r.code && (
            <Text type="secondary" style={{ fontSize: "0.8rem" }}>
              ({r.code})
            </Text>
          )}
        </>
      ),
    },
    {
      title: "ระดับ",
      dataIndex: "levelLabel",
      key: "levelLabel",
      width: "12%",
    },
    {
      title: "กลุ่มวิชา",
      dataIndex: "categoryLabel",
      key: "categoryLabel",
      width: "18%",
    },
    {
      title: "กลุ่มวิชาย่อย",
      dataIndex: "subcategoryLabel",
      key: "subcategoryLabel",
      width: "18%",
    },
    {
      title: "ราคา (บาท)",
      dataIndex: "price",
      key: "price",
      align: "right",
      width: "12%",
      render: (v) => v?.toLocaleString("th-TH") || "0",
    },
  ];

  // ✅ Card Stack Aesthetic
  return (
    <div>
      <Title level={3} className="dashboard-section-title">
        การจองของฉัน
      </Title>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          marginTop: 20,
        }}
      >
        {reservations.map((reservation, index) => {
          const selectedDates = Array.isArray(reservation.selectedDates)
            ? reservation.selectedDates.map((d) => formatBuddhistDate(d)).join(", ")
            : "-";

          const classSubjects = Array.isArray(reservation.classSubjects)
            ? reservation.classSubjects
            : [];

          const price = Number(reservation.price || 0);
          const status = reservation.confirmation || "received";
          const style = statusStyleMap[status] || statusStyleMap.received;
          const statusColor = confirmationDotColorMap[status] || "#999";
          const statusText = translateConfirmationStatus(status);

          return (
            <Card
              key={reservation._id || index}
              bordered={false}
              hoverable
              style={{
                borderRadius: 16,
                boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
                background:
                  index % 2 === 0
                    ? "linear-gradient(145deg, #f9fafb, #ffffff)"
                    : "linear-gradient(145deg, #f3f4f6, #ffffff)",
                overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {/* Header Row: Price + Status */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div>
                  <Text strong style={{ fontSize: "1rem", color: "#1677ff" }}>
                    ค่าบริการรวม: {price.toLocaleString("th-TH")} บาท
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
                    minWidth: "200px",
                  }}
                >
                  <Text strong style={{ marginBottom: 4, color: "#334155" }}>
                    สถานะการจอง:
                  </Text>
                  <div
                    style={{
                      background: style.bg,
                      color: style.color,
                      padding: "6px 14px",
                      borderRadius: "20px",
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
                        display: "inline-block",
                      }}
                    ></span>
                    {statusText}
                  </div>
                </div>
              </div>

              <Divider style={{ margin: "10px 0" }} />

              <Text strong>วันที่อบรม:</Text> <Text>{selectedDates}</Text>
              <br />
              <Text strong>จำนวนห้องเรียน:</Text>{" "}
              <Text>{reservation.numberOfClasses || 1}</Text>

              {classSubjects.length > 0 && (
                <>
                  <Divider plain style={{ margin: "10px 0" }}>
                    <Text type="secondary">รายละเอียดรายวิชา</Text>
                  </Divider>

                  {classSubjects.map((classItem, classIndex) => {
                    const subjectEntries = (classItem.slots || []).map((slot, i) => ({
                      key: `${classItem.classNumber}-${i}`,
                      date: slot?.date || "-",
                      slot: slot?.slot || "-",
                      subjectName: slot?.subject?.name_th || slot?.name_th || "-",
                      code: slot?.subject?.code || slot?.code || "-",
                      levelLabel:
                        slot?.levelLabel ||
                        slot?.subject?.level_th ||
                        slot?.subject?.level_en ||
                        "-",
                      categoryLabel:
                        slot?.categoryLabel ||
                        slot?.subject?.category_th ||
                        slot?.subject?.category_en ||
                        "-",
                      subcategoryLabel:
                        slot?.subcategoryLabel ||
                        slot?.subject?.subcategory_th ||
                        slot?.subject?.subcategory_en ||
                        "-",
                      price: Number(slot?.subject?.price || slot?.price || 0),
                    }));

                    return (
                      <Card
                        key={`class-${classIndex}`}
                        size="small"
                        style={{
                          marginTop: 12,
                          borderRadius: 10,
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                        title={`ห้องเรียนที่ ${classItem.classNumber || classIndex + 1}`}
                      >
                        {subjectEntries.length ? (
                          <Table
                            columns={subjectColumns}
                            dataSource={subjectEntries}
                            pagination={false}
                            size="small"
                            bordered
                          />
                        ) : (
                          <Text type="secondary">ยังไม่ได้เลือกวิชา</Text>
                        )}
                      </Card>
                    );
                  })}
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default UserReservations;
