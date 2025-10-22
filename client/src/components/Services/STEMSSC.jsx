import React from "react";
import { Button, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph } = Typography;

const STEMSSCDetail = () => {
  const navigate = useNavigate();

  const handleGoToReservation = () => {
    navigate("/reservation");
  };

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
            backgroundImage: "url('/services/stem-ssc.png')",
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
            อบรมวิทยาศาสตร์สำหรับนักเรียน (STEM-SSC)
          </Title>

          <Paragraph
            style={{
              fontSize: "16px",
              lineHeight: "1.8",
              textAlign: "justify",
              color: "#333",
            }}
          >
            STEM ย่อมาจาก Science, Technology, Engineering and Mathematics
            หรือการบูรณาการความรู้ระหว่าง 4 สาขาวิชา ได้แก่ วิทยาศาสตร์
            เทคโนโลยี วิศวกรรมศาสตร์ และคณิตศาสตร์ โดยรูปแบบการเรียนรู้ที่นำเอา
            แกนหลักของสาขาวิชาเหล่านี้มาผสานรวมกันเรียกว่า
            <strong> สะเต็มศึกษา </strong>
            ซึ่งถือเป็นการบูรณาการระหว่างศาสตร์ต่าง ๆ (Interdisciplinary
            Integration) เพื่อพัฒนาทักษะปฏิบัติจริง ไม่ใช่เพียงทฤษฎีเท่านั้น
            ความก้าวหน้าทางเทคโนโลยีและวิทยาศาสตร์ส่งผลให้โลกดิจิทัลและนวัตกรรม
            กลายเป็นส่วนสำคัญในการพัฒนามนุษย์ในยุคใหม่
            <br />
            <br />
            <strong>SSC</strong> มีความพร้อมทั้งบุคลากรและเครื่องมือทางวิทยาศาสตร์
            ที่สามารถพัฒนาการเรียนรู้ของนักเรียนผ่านกิจกรรมที่ลงมือทำจริง
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
              onClick={handleGoToReservation}
              style={{
                backgroundColor: "#1890ff",
                borderRadius: "8px",
                fontWeight: "bold",
                minWidth: "180px",
                height: "48px",
                boxShadow: "0 3px 10px rgba(24,144,255,0.3)",
              }}
            >
              ดำเนินการจอง
            </Button>

            <Button
              size="large"
              onClick={handleGoToDivisions}
              style={{
                borderRadius: "8px",
                fontWeight: "bold",
                borderColor: "#1890ff",
                color: "#1890ff",
                minWidth: "180px",
                height: "48px",
              }}
            >
              รายชื่อวิทยากร
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

export default STEMSSCDetail;
