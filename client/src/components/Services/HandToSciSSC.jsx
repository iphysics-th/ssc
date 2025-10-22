import React from "react";
import { Button, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph } = Typography;

const HandToSciDetail = () => {
  const navigate = useNavigate();

  const handleGoToDivisions = () => {
    navigate("/divisions");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "#fafafa",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "1100px",
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          overflow: "hidden",
          flexWrap: "wrap",
        }}
      >
        {/* LEFT PANEL: IMAGE */}
        <div
          style={{
            flex: "1 1 400px",
            minHeight: "320px",
            backgroundImage: "url('/services/hand-to-sci.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* RIGHT PANEL: TEXT CONTENT */}
        <div
          style={{
            flex: "1 1 500px",
            padding: "30px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Title level={2} style={{ color: "#003366", marginBottom: "20px" }}>
            ขอคำปรึกษาอาจารย์ผู้เชี่ยวชาญ (Hand-To-Sci)
          </Title>

          <Paragraph
            style={{
              fontSize: "16px",
              lineHeight: "1.8",
              textAlign: "justify",
              color: "#333",
            }}
          >
            บริการ <strong>Hand-To-Sci</strong> เปิดโอกาสให้นักเรียน ครู
            หรือบุคคลทั่วไป สามารถขอคำปรึกษาจากอาจารย์ผู้เชี่ยวชาญ
            คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏสงขลา
            <br />
            <br />
            ไม่ว่าจะเป็นการวางแผนการทดลอง การใช้เครื่องมือทางวิทยาศาสตร์
            การออกแบบโครงงานวิจัย การวิเคราะห์ผล หรือการแก้ไขปัญหาทางเทคนิค
            ทีมอาจารย์ผู้เชี่ยวชาญพร้อมให้คำแนะนำอย่างมืออาชีพ
            เพื่อพัฒนาความรู้และทักษะทางวิทยาศาสตร์ของผู้ขอรับคำปรึกษา
            <br />
            <br />
            ผู้สนใจสามารถดูรายชื่ออาจารย์และสาขาความเชี่ยวชาญ
            เพื่อเลือกผู้ให้คำปรึกษาที่ตรงกับความต้องการได้ที่ปุ่มด้านล่าง
          </Paragraph>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            <Button
              type="primary"
              size="large"
              onClick={handleGoToDivisions}
              style={{
                backgroundColor: "#1890ff",
                borderRadius: "8px",
                fontWeight: "bold",
                minWidth: "200px",
                height: "48px",
                boxShadow: "0 3px 10px rgba(24,144,255,0.3)",
              }}
            >
              รายชื่อบุคลากร
            </Button>
          </div>
        </div>
      </div>

      {/* RESPONSIVE STYLE */}
      <style>
        {`
          @media (max-width: 768px) {
            div[style*="max-width: 1100px"] {
              flex-direction: column !important;
            }
            div[style*="background-image"] {
              order: -1; /* image on top for mobile */
              width: 100% !important;
              height: 250px !important;
            }
            div[style*="padding: 30px 40px"] {
              padding: 20px !important;
            }
            button {
              flex: 1 1 100%;
            }
            .ant-typography {
              font-size: 15px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default HandToSciDetail;
