import React from "react";
import { Button, Typography, Image } from "antd";

const { Title, Paragraph } = Typography;

const ScienterestDetail = () => {
  const chatUrl = process.env.REACT_APP_SCIENTEREST_CHAT_URL;

  const handleOpenChat = () => {
    if (chatUrl) {
      window.open(chatUrl, "_blank");
    } else {
      alert("ไม่พบลิงก์เข้าร่วมโอเพนแชท กรุณาติดต่อผู้ดูแลระบบ");
    }
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
            backgroundImage: "url('/services/sciterest-ssc.png')",
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
            เติมวิทย์ คิดสนุกกับวิทย์รอบตัว (SCIENTEREST)
          </Title>

          <Paragraph
            style={{
              fontSize: "16px",
              lineHeight: "1.8",
              textAlign: "justify",
              color: "#333",
            }}
          >
            <strong>กิจกรรม “เติมวิทย์ คิดสนุกกับวิทย์รอบตัว”</strong> เป็นกิจกรรมเสริมความรู้
            ทางวิทยาศาสตร์ที่ผสมผสานความคิดสร้างสรรค์กับความสนุกสนาน
            เปิดโอกาสให้ผู้สนใจทุกเพศทุกวัยได้เข้ามามีส่วนร่วมในการทดลองจริง
            เรียนรู้ผ่านประสบการณ์รอบตัว และเห็นว่าวิทยาศาสตร์อยู่ใกล้ตัวกว่าที่คิด
            <br />
            <br />
            หัวข้อกิจกรรมมีความหลากหลาย เช่น การนวดหน้าเชิงวิทยาศาสตร์
            การหล่อเบ้าพลาสติก การทำอาหารจากปฏิกิริยาเคมี การควบคุมอุปกรณ์ด้วย
            Arduino และกิจกรรมอื่น ๆ ที่ออกแบบมาเพื่อสร้างแรงบันดาลใจทางวิทยาศาสตร์
            <br />
            <br />
            สามารถเข้าร่วมกลุ่ม <strong>LINE OpenChat</strong> เพื่อรับข่าวสาร
            และสมัครเข้าร่วมกิจกรรม “เติมวิทย์..คิดสนุก..กับวิทย์รอบตัว S&T SKRU”
            ได้จากปุ่มด้านล่าง หรือสแกน QR Code
          </Paragraph>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "20px",
              marginTop: "20px",
            }}
          >
            <Button
              type="primary"
              size="large"
              onClick={handleOpenChat}
              style={{
                backgroundColor: "#06c755", // LINE green
                borderRadius: "8px",
                fontWeight: "bold",
                minWidth: "220px",
                height: "48px",
                boxShadow: "0 3px 10px rgba(6,199,85,0.3)",
              }}
            >
              เข้าร่วมโอเพนแชท
            </Button>

            <div style={{ textAlign: "center" }}>
              <Image
                src="/services/scienterest.jpg"
                alt="QR Code - Scienterest OpenChat"
                width={160}
                style={{
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  padding: "4px",
                  background: "#fff",
                }}
              />
              <Paragraph
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  color: "#666",
                  textAlign: "center",
                }}
              >
                สแกนเพื่อเข้าร่วมโอเพนแชท
              </Paragraph>
            </div>
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
            img {
              margin: 0 auto;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ScienterestDetail;
