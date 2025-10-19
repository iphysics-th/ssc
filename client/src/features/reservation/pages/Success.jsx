import React from "react";
import { useNavigate } from "react-router-dom";
import { Typography, Button, Card } from "antd";
import {
  CheckCircleTwoTone,
  DashboardOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import "../../../css/Reservation/SuccessPage.css";

const { Title, Text, Paragraph } = Typography;

const Success = () => {
  const navigate = useNavigate();

  return (
    <div className="success-page">
      <Card
        className="success-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "500px",
        }}
      >

        <div className="success-content">
          <div className="success-icon-wrapper">
            <CheckCircleTwoTone
              twoToneColor="#52c41a"
              className="success-icon"
            />
            <Title
              level={2}
              className="success-title"
              style={{
                fontSize: "1.8rem",       // 🔹 adjust text size
                color: "#000000ff",         // 🔹 color
                fontWeight: 700,          // 🔹 boldness
                marginTop: "16px",        // 🔹 spacing above the text
                marginBottom: "8px",      // 🔹 spacing below
                textAlign: "center",      // 🔹 center alignment
              }}
            >
              การจองเสร็จสมบูรณ์!
            </Title>

            <Text className="success-subtitle">
              ระบบได้รับข้อมูลการจองของคุณเรียบร้อยแล้ว
            </Text>
          </div>

          <Paragraph className="success-description">
            กรุณาตรวจสอบอีเมลของคุณเพื่อดูรายละเอียดการจอง
            <br />
            และสามารถติดตามสถานะการจองได้ที่{" "}
            <Text strong>แดชบอร์ดของฉัน</Text>
          </Paragraph>

          <div className="success-actions">
            <Button
              type="primary"
              icon={<DashboardOutlined />}
              size="large"
              shape="round"
              className="success-button-primary"
              onClick={() => navigate("/dashboard")}
            >
              ไปที่แดชบอร์ดของฉัน
            </Button>

            <Button
              icon={<HomeOutlined />}
              size="large"
              shape="round"
              className="success-button-secondary"
              onClick={() => navigate("/")}
            >
              กลับไปหน้าแรก
            </Button>
          </div>

          <div className="success-footer">
            หากมีข้อสงสัยเพิ่มเติม กรุณาติดต่อศูนย์บริการวิชาการหรือผู้ดูแลระบบ
            <br />
            โทร. 074-260-260 | อีเมล: sparkling.science.center@gmail.com
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Success;
