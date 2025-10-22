import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const cardData = [
  {
    title: "อบรมวิทยาศาสตร์สำหรับนักเรียน (STEM-SSC)",
    imageUrl: "/services/stem-ssc.png",
    description: "กิจกรรมเรียนรู้วิทยาศาสตร์ภาคปฏิบัติ เน้นการทดลอง ปฏิบัติลงมือจริง ในสาขา ฟิสิกส์ เคมี ชีววิทยา และอื่นๆ  (อ่านต่อ)",
    link: "/stem-ssc"
  },
  {
    title: "ค่ายวิทยาศาสตร์ (SCICAMP-SSC)",
    imageUrl: "/services/scicamp-ssc.png",
    description: "ค่ายวิทยาศาสตร์ที่นอกจากกิจกรรมที่เน้นการทดลองทางวิทยาศาสตร์ในช่วงกลางวันแล้ว ยังมีกิจกรรมภาคกลางคืน อาทิ ดาราศาสตร์ กิจกรรมสันทนาการ เป็นต้น",
    link: "/scicamp-ssc"
  },
  {
    title: "เติมวิทย์ คิดสนุกกับวิทย์รอบตัว (SCIENTEREST)",
    imageUrl: "/services/sciterest-ssc.png",
    description: "กิจกรรม “เติมวิทย์คิดสนุก กับวิทย์รอบตัว” กิจกรรมที่มีหัวข้อพิเศษเช่น การนวดหน้า Arduino ทำอาหาร การหล่อเบ้าพลาสติก เปิดรับสมัครตลอดทั้งปี",
    link: "/scienterest"
  },
  {
    title: "ขอคำปรึกษาอาจารย์ผู้เชี่ยวชาญ (Hand-To-Sci)",
    imageUrl: "/services/hand-to-sci.jpg",
    description: "ขอคำปรึกษาอาจารย์ผู้เชี่ยวชาญ คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏสงขลา",
    link: "/hand-to-sci"
  }
];

const Services = () => {
  const navigate = useNavigate();
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
            <Card
              hoverable
              onClick={() => navigate(card.link)}
              style={{
                width: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              bodyStyle={{ padding: 0 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', height: '180px' }}>
                <div style={{ width: '35%', overflow: 'hidden' }}>
                  <img
                    alt={card.title}
                    src={card.imageUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderTopLeftRadius: '8px',
                      borderBottomLeftRadius: '8px',
                    }}
                  />
                </div>
                <div style={{ padding: '12px', width: '65%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Title level={4} style={{ fontSize: fontSize, marginBottom: '8px' }}>
                    {card.title}
                  </Title>
                  <p style={{ fontSize: fontSize, flexGrow: 1, marginBottom: 0 }}>{card.description}</p>
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
