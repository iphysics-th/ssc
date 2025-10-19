import React, { useEffect, useImperativeHandle, useMemo, useState, forwardRef } from "react";
import { Alert, Button, Card, Col, InputNumber, Row, Select, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import Protected from "../../hooks/userProtected";
import { useFormData } from "../../contexts/FormDataContext";
import "../../css/Reservation/CourseSelection.css";
import { useLazyCheckReservationNumberQuery } from "../../features/reservation/reservationApiSlice";

const { Title, Text } = Typography;

const dayOptions = [
  { value: "0.5", label: "0.5 วัน" },
  { value: "1", label: "1 วัน" },
  { value: "1.5", label: "1.5 วัน" },
  { value: "2", label: "2 วัน" },
  { value: "2.5", label: "2.5 วัน" },
  { value: "3", label: "3 วัน" },
];

const classOptions = Array.from({ length: 5 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1} ห้องเรียน`,
}));

const ReservationSetup = forwardRef(({ onNext, embedded = false }, ref) => {
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();
  const [triggerReservationCheck] = useLazyCheckReservationNumberQuery();

  const [numberOfDays, setNumberOfDays] = useState(String(formData.numberOfDays || "1"));
  const [numberOfClasses, setNumberOfClasses] = useState(
    formData.numberOfClasses ? Math.min(5, Math.max(1, formData.numberOfClasses)) : 1
  );

  const [classData, setClassData] = useState(() => {
    const base = Array.from({ length: numberOfClasses }, (_, i) => ({
      students: formData.studentsPerClass?.[i] || 1,
      studentRange: formData.studentRange || "มัธยม",
      studentLevel: formData.studentLevel || 1,
    }));
    return base;
  });

  const [reservationNumber, setReservationNumber] = useState(formData.reservationNumber || null);

  const totalStudents = useMemo(
    () =>
      classData.reduce(
        (sum, c) => sum + (Number.isFinite(Number(c.students)) ? Number(c.students) : 0),
        0
      ),
    [classData]
  );

  useEffect(() => {
    // Generate unique reservation number
    const generateAndCheckNumber = async () => {
      let unique = false;
      let number;
      while (!unique) {
        number = Math.random().toString(36).substr(2, 9).toUpperCase();
        try {
          const res = await triggerReservationCheck(number).unwrap();
          unique = !res?.exists;
        } catch {
          unique = true;
        }
      }
      setReservationNumber(number);
      updateFormData({ reservationNumber: number });
    };

    if (!formData.reservationNumber) generateAndCheckNumber();
  }, [formData.reservationNumber, triggerReservationCheck, updateFormData]);

  // Update number of classes dynamically
  useEffect(() => {
    setClassData((prev) => {
      const newData = [...prev];
      if (numberOfClasses > prev.length) {
        for (let i = prev.length; i < numberOfClasses; i++) {
          newData.push({ students: 1, studentRange: "มัธยม", studentLevel: 1 });
        }
      } else if (numberOfClasses < prev.length) {
        newData.splice(numberOfClasses);
      }
      return newData;
    });
  }, [numberOfClasses]);

  const handleClassChange = (index, key, value) => {
    setClassData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleNext = () => {
    const sanitizedClasses = Math.min(5, Math.max(1, Number(numberOfClasses) || 1));
    const trimmed = classData.slice(0, sanitizedClasses).map((c) => ({
      students: Math.max(1, Math.round(Number(c.students) || 1)),
      studentRange: c.studentRange,
      studentLevel: c.studentLevel,
    }));
    const total = trimmed.reduce((sum, c) => sum + c.students, 0);

    updateFormData({
      numberOfDays: parseFloat(numberOfDays),
      numberOfClasses: sanitizedClasses,
      studentsPerClass: trimmed.map((c) => c.students),
      numberOfStudents: total,
      studentRange: trimmed[0]?.studentRange || "มัธยม",
      studentLevel: trimmed[0]?.studentLevel || 1,
    });

    if (onNext) onNext();
    else navigate("/reservation/dates");
  };

  useImperativeHandle(ref, () => ({ next: handleNext }));

  return (
    <Protected>
      <Row justify="center" className="course-selection-container">
        <Col xs={24} sm={22} md={20} lg={18} xl={16}>
          <div className="section">
            <Title level={2} style={{ color: "#0f172a", marginBottom: 20 }}>
              1. ข้อมูลห้องเรียน
            </Title>

            {/* Total Students */}
            <div
              style={{
                background: "linear-gradient(90deg,#e0f2fe,#f0f9ff)",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <Text strong style={{ fontSize: "1.1rem", color: "#0369a1" }}>
                👩‍🏫 จำนวนนักเรียนทั้งหมด
              </Text>
              <Text strong style={{ fontSize: "1.3rem", color: "#0284c7" }}>
                {totalStudents} คน
              </Text>
            </div>

            {/* Number of Classes */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>จำนวนห้องเรียน</Text>
              <Select
                value={numberOfClasses}
                options={classOptions}
                onChange={setNumberOfClasses}
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>

            {/* Number of Days */}
            <div style={{ marginBottom: 24 }}>
              <Text strong>จำนวนวันที่ต้องการอบรม</Text>
              <Select
                value={numberOfDays}
                options={dayOptions}
                onChange={setNumberOfDays}
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>

            {/* Class Cards */}
            <Row gutter={[16, 16]}>
              {classData.map((c, index) => (
                <Col key={index} xs={24} sm={24} md={12}>
                  <Card
                    title={
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        ห้องเรียนที่ {index + 1}
                      </div>
                    }
                    bordered={false}
                    style={{
                      borderRadius: 16,
                      background: "#ffffff",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                    }}
                    headStyle={{
                      background: "linear-gradient(90deg,#e0f2fe,#fff)",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <Text type="secondary">จำนวนนักเรียน</Text>
                        <InputNumber
                          min={1}
                          max={150}
                          value={c.students}
                          onChange={(value) => handleClassChange(index, "students", value)}
                          style={{ width: "100%", marginTop: 4 }}
                        />
                      </div>

                      <div>
                        <Text type="secondary">ช่วงชั้น</Text>
                        <Select
                          value={c.studentRange}
                          onChange={(value) => handleClassChange(index, "studentRange", value)}
                          options={[
                            { value: "ประถม", label: "ประถม" },
                            { value: "มัธยม", label: "มัธยม" },
                          ]}
                          style={{ width: "100%", marginTop: 4 }}
                        />
                      </div>

                      <div>
                        <Text type="secondary">ระดับชั้น</Text>
                        <Select
                          value={c.studentLevel}
                          onChange={(value) => handleClassChange(index, "studentLevel", value)}
                          options={[1, 2, 3, 4, 5, 6].map((level) => ({
                            value: level,
                            label: `${level}`,
                          }))}
                          style={{ width: "100%", marginTop: 4 }}
                        />
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {!embedded && (
            <div className="course-selection-footer" style={{ marginTop: 40 }}>
              {reservationNumber && (
                <p className="reservation-number">
                  <strong>หมายเลขการจองของคุณ:</strong> {reservationNumber}
                </p>
              )}
              <Button type="primary" onClick={handleNext} size="large">
                หน้าถัดไป
              </Button>
            </div>
          )}
        </Col>
      </Row>
    </Protected>
  );
});

ReservationSetup.displayName = "ReservationSetup";
export default ReservationSetup;
