import React, { useEffect, useMemo } from "react";
import { Card, Table, Tag, Typography, Select, message } from "antd";
import DataTable from "react-data-table-component";
import {
  useGetReservationTableQuery,
  useUpdateReservationStatusMutation,
} from "../../features/reservation/reservationApiSlice";
import { groupClassSubjects } from "../../features/reservation/utils/classGrouping";

const { Text, Title } = Typography;

const statusOptions = ["received", "processed", "confirmed", "canceled"];

const confirmationDotColorMap = {
  received: "#B0B0B0", // grey
  processed: "#FADB14", // yellow
  confirmed: "#52C41A", // green
  canceled: "#FF4D4F", // red
};

const monthMapping = {
  January: "มกราคม",
  February: "กุมภาพันธ์",
  March: "มีนาคม",
  April: "เมษายน",
  May: "พฤษภาคม",
  June: "มิถุนายน",
  July: "กรกฎาคม",
  August: "สิงหาคม",
  September: "กันยายน",
  October: "ตุลาคม",
  November: "พฤศจิกายน",
  December: "ธันวาคม",
};

const formatBuddhistDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const monthName = monthMapping[date.toLocaleString("en-US", { month: "long" })];
  const buddhistYear = date.getFullYear() + 543;
  return `${date.getDate()} ${monthName} ${buddhistYear}`;
};

const translateConfirmationStatus = (status) => ({
  received: "ได้รับข้อมูล",
  processed: "กำลังดำเนินการ",
  confirmed: "ยืนยันการจอง",
  canceled: "ยกเลิกการจอง",
}[status] || status);

const translatePrefix = (prefix) =>
  ({ mr: "นาย", ms: "นางสาว", mrs: "นาง", dr: "ดร." }[prefix] || prefix);

const translateStatus = (status) =>
({
  teacher: "ครู",
  school_representative: "ตัวแทนโรงเรียน",
  principal: "ผู้อำนวยการ",
  vice_principal: "รองผู้อำนวยการ",
}[status] || status);

const translateSchoolSize = (size) =>
({
  small: "โรงเรียนขนาดเล็ก",
  medium: "โรงเรียนขนาดกลาง",
  large: "โรงเรียนขนาดใหญ่",
  very_large: "โรงเรียนขนาดใหญ่พิเศษ",
}[size] || size);

const ReservationTable = () => {
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useGetReservationTableQuery({ page: 1, limit: 100 });
  const [updateReservationStatus] = useUpdateReservationStatusMutation();

  const reservations = useMemo(
    () => (data?.data && Array.isArray(data.data) ? data.data : []),
    [data]
  );

  useEffect(() => {
    if (error) {
      console.error("Failed to fetch reservations", error);
      message.error("ไม่สามารถโหลดข้อมูลการจองได้");
    }
  }, [error]);

  const handleStatusChange = async (id, field, value) => {
    try {
      await updateReservationStatus({ id, field, value }).unwrap();
      message.success(`อัปเดตสถานะเป็น "${translateConfirmationStatus(value)}"`);
    } catch (err) {
      console.error(`${field} update error:`, err);
      message.error("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const renderSelect = (record, field, value) => {
    const recordId = record.id ?? record._id;
    return (
      <Select
        value={value}
        onChange={(newValue) => handleStatusChange(recordId, field, newValue)}
        style={{ width: 180 }}
        size="small"
      >
        {statusOptions.map((opt) => (
          <Select.Option key={opt} value={opt}>
            <span
              style={{
                color: confirmationDotColorMap[opt],
                fontWeight: "bold",
                marginRight: 6,
              }}
            >
              ●
            </span>
            {translateConfirmationStatus(opt)}
          </Select.Option>
        ))}
      </Select>
    );
  };

  const columns = [
    {
      name: "สถานะ",
      selector: (row) => row.confirmation,
      cell: (row) => renderSelect(row, "confirmation", row.confirmation),
      sortable: true,
      width: "170px",
    },
    { name: "หมายเลขการจอง", selector: (row) => row.reservationNumber, sortable: true },
    { name: "ชื่อผู้จอง", selector: (row) => `${row.name} ${row.surname}` },
    { name: "โรงเรียน", selector: (row) => row.school },
    { name: "โทรศัพท์", selector: (row) => row.telephone },
    { name: "นักเรียน", selector: (row) => row.numberOfStudents },
  ];

  // --- Expanded Table for reservation detail ---
  const ExpandedComponent = ({ data }) => {
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

  const classBlocks = (data.classSubjects || []).map((cls, index) => {
    const subjectEntries = (cls.slots || []).map((slot, i) => ({
      key: `${cls.classNumber}-${i}`,
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

    const total = subjectEntries.reduce((sum, s) => sum + (s.price || 0), 0);
    return { classNumber: cls.classNumber ?? index + 1, subjectEntries, total };
  });

  const grandTotal = classBlocks.reduce((acc, cls) => acc + cls.total, 0);

  const statusColor = confirmationDotColorMap[data.confirmation] || "#999";
  const statusText = translateConfirmationStatus(data.confirmation);

  // Choose background and text colors based on status
  const statusStyleMap = {
    received: { bg: "#f5f5f5", color: "#555" },
    processed: { bg: "#fff8db", color: "#b58b00" },
    confirmed: { bg: "#e8f8ec", color: "#237804" },
    canceled: { bg: "#fdecec", color: "#a8071a" },
  };
  const style = statusStyleMap[data.confirmation] || statusStyleMap.received;

  return (
    <div
      style={{
        background: "#f9fafb",
        padding: 20,
        borderRadius: 12,
        marginTop: 10,
      }}
    >
      {/* ====== TOP HEADER ====== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        {/* Total Price */}
        <Card
          style={{
            flexGrow: 1,
            borderRadius: 10,
            background: "#f1f5f9",
            border: "1px dashed #cbd5e1",
            textAlign: "center",
            marginRight: 16,
          }}
        >
          <Title level={5} style={{ marginBottom: 0, color: "#1677ff" }}>
            ค่าบริการรวม: {grandTotal.toLocaleString("th-TH")} บาท
          </Title>
        </Card>

        {/* Reservation Status */}
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

      {/* General Info */}
      <Title level={5} style={{ marginBottom: 16 }}>
        รายละเอียดการจอง
      </Title>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "160px 1fr",
          rowGap: "6px",
          marginBottom: 16,
        }}
      >
        <Text strong>ชื่อผู้จอง:</Text>
        <Text>
          {translatePrefix(data.prefix)} {data.name} {data.surname}
        </Text>

        <Text strong>ตำแหน่ง:</Text>
        <Text>{translateStatus(data.status)}</Text>

        <Text strong>โรงเรียน:</Text>
        <Text>
          {data.school} ({translateSchoolSize(data.schoolSize)})
        </Text>

        <Text strong>อีเมล:</Text>
        <Text>{data.mail || "-"}</Text>

        <Text strong>โทรศัพท์:</Text>
        <Text>{data.telephone || "-"}</Text>

        <Text strong>วันที่จอง:</Text>
        <Text>{formatBuddhistDate(data.createdAt)}</Text>
      </div>

      {/* Tables per classroom */}
      {classBlocks.map((cls) => (
        <Card
          key={cls.classNumber}
          bordered={false}
          style={{
            marginTop: 20,
            borderRadius: 12,
            background: "#ffffff",
            boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
          }}
          title={<strong>ห้องเรียนที่ {cls.classNumber}</strong>}
        >
          {cls.subjectEntries.length ? (
            <Table
              columns={subjectColumns}
              dataSource={cls.subjectEntries}
              pagination={false}
              size="small"
              bordered
            />
          ) : (
            <Text type="secondary">ไม่มีข้อมูลรายวิชาในห้องนี้</Text>
          )}
        </Card>
      ))}
    </div>
  );
};


  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "24px 32px",
      }}
    >
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
          background: "linear-gradient(145deg, #f9fafb 0%, #ffffff 100%)",
          padding: "24px 20px",
        }}
      >
        <Title
          level={3}
          style={{
            textAlign: "center",
            marginBottom: 20,
            color: "#1677ff",
          }}
        >
          ตารางข้อมูลการจอง
        </Title>

        <DataTable
          columns={columns}
          data={reservations}
          progressPending={isLoading}
          pagination
          responsive
          highlightOnHover
          striped
          dense
          expandableRows
          expandableRowsComponent={ExpandedComponent}
          progressComponent={<span>Loading...</span>}
          customStyles={{
            rows: {
              style: {
                borderBottom: "1px solid #e5e7eb",
                minHeight: "56px",
              },
            },
            headCells: {
              style: {
                backgroundColor: "#f1f5f9",
                fontWeight: 600,
              },
            },
          }}
        />

        {isFetching && !isLoading && (
          <Text type="secondary" style={{ marginLeft: 8 }}>
            กำลังรีเฟรชข้อมูล…
          </Text>
        )}
      </Card>
    </div>
  );
};

export default ReservationTable;
