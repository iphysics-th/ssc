import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button } from 'antd';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const { Title } = Typography;

const cardData = [
  {
    title: "อบรมวิทยาศาสตร์สำหรับนักเรียน (STEM-SSC)",
    imageUrl: "/services/stem-ssc.png", // Replace with actual image URL
    description: "กิจกรรมเรียนรู้วิทยาศาสตร์ภาคปฏิบัติ เน้นการทดลอง ปฏิบัติลงมือจริง ในสาขา ฟิสิกส์ เคมี ชีววิทยา และอื่นๆ  (อ่านต่อ)",
    link: "/stem-ssc" // Replace with actual route in your app
  },
  {
    title: "ค่ายวิทยาศาสตร์ (SCICAMP-SSC)",
    imageUrl: "/services/scicamp-ssc.png", // Replace with actual image URL
    description: "ค่ายวิทยาศาสตร์ที่นอกจากกิจกรรมที่เน้นการทดลองทางวิทยาศาสตร์ในช่วงกลางวันแล้ว ยังมีกิจกรรมภาคกลางคืน อาทิ ดาราศาสตร์ กิจกรรมสันทนาการ เป็นต้น",
    link: "/scicamp-ssc" // Replace with actual route in your app
  },
  {
    title: "เติมวิทย์ คิดสนุกกับวิทย์รอบตัว (SCIENTEREST)",
    imageUrl: "/services/sciterest-ssc.png", // Replace with actual image URL
    description: "กิจกรรม “เติมวิทย์คิดสนุก กับวิทย์รอบตัว” กิจกรรมที่มีหัวข้อพิเศษเช่น การนวดหน้า Arduino ทำอาหาร การหล่อเบ้าพลาสติก เปิดรับสมัครตลอดทั้งปี",
    link: "/scienterest" // Replace with actual route in your app
  },
  {
    title: "ขอคำปรึกษาอาจารย์ผู้เชี่ยวชาญ (Hand-To-Sci)",
    imageUrl: "/services/hand-to-sci.png", // Replace with actual image URL
    description: "ขอคำปรึกษาอาจารย์ผู้เชี่ยวชาญ คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏสงขลา",
    link: "/hand-to-sci" // Replace with actual route in your app
  }
];

const Services = () => {
  const navigate = useNavigate(); // Initialize navigate

  const [fontSize, setFontSize] = useState('initial');

  useEffect(() => {
    const handleResize = () => {
      const newFontSize = window.innerWidth < 600 ? `${Math.max(window.innerWidth / 27, 12)}px` : 'initial';
      setFontSize(newFontSize);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ padding: '10px' }}>
      <Row gutter={[16, 16]}>
        {cardData.map((card, index) => (
          <Col key={index} xs={22} sm={22} md={22} lg={12} xl={12}>
            <Card hoverable style={{ width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', paddingBottom: '56.25%', position: 'relative', height: 0 }}>
                <div style={{ width: '35%', position: 'absolute', height: '100%', overflow: 'hidden' }}>
                  <img alt={card.title} src={card.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '10px', width: '65%', position: 'absolute', right: '-2%', height: '100%' }}>
                  <Title style={{ fontSize: fontSize }}>{card.title}</Title>
                  <p style={{ fontSize: fontSize }}>{card.description}</p>
                  {/* Use navigate to open a new route */}
                  <Button type="primary" onClick={() => navigate(card.link)}>
                    รายละเอียด
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Services;
