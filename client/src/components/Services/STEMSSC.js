import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import '../../css/Services/STEMSSCDetail.css';

const STEMSSCDetail = () => {
  const navigate = useNavigate();

  // Navigate back to the /service route
  const handleGoBack = () => {
    navigate('/service');
  };

  const handleGoToReservation = () => {
    navigate('/reservation');
  };

  return (
    <div className="stem-ssc-detail">
      <h1>STEM-SSC</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '40px' }}>
        <Button onClick={handleGoBack}>ย้อนกลับ</Button>
        <Button type="primary" onClick={handleGoToReservation}>ดำเนินการจอง</Button>
      </div>
      <p></p>
      <img src="/services/stem-ssc.png" alt="STEM-SSC" style={{ maxWidth: '100%', height: 'auto' }} />
      <p></p>
      <p>STEM ย่อมาจาก Science, Technology, Engineering and Mathematics หรือการบูรณการความรู้ระหว่าง 4 สาขาวิชา ซึ่งได้แก่ วิทยาศาสตร์ เทคโนโลยี วิศวกรรมศาสตร์ และคณิตศาสตร์ โดยรูปแบบการเรียนรู้ที่นำเอาแกนหลักของสาขาวิชาเหล่านี้มาผสานรวมกันเรียกว่า สะเต็มศึกษา ซึ่งถือเป็นการบูรณาการระหว่างศาสตร์ต่าง ๆ (Interdisciplinary Integration) เพื่อนำเอาจุดเด่นของแต่ละสาขาวิชามาผสมผสานกันอย่างลงตัว โดยมุ่งเน้นไปที่ทักษะหรือการปฏิบัติจริง ไม่ใช่เพียงการเรียนทฤษฎีเท่านั้นความก้าวหน้าทางด้านเทคโนโลยีและวิทยาศาสตร์ ส่งผลให้โลกดิจิทัลและนวัตกรรมกลายเป็นส่วนสำคัญในการพัฒนาด้านต่าง ๆ ในโลกแห่งความจริง ดังนั้น เพื่อเป็นการตอบโจทย์การพัฒนาศักยภาพทรัพยากรบุคคลเพื่อรับมือกับการเปลี่ยนแปลงและความท้าทายของโลกยุคใหม่ ทักษะ STEM จึงเข้ามามีบทบาทสำคัญในการเรียนรู้ การทำงาน และการดำเนินชีวิตของผู้คนในปัจจุบัน SSC มีความพร้อมทั้งบุคลากรและเครื่องมืออุปกรณ์ทางวิทยาศาสตร์ ที่สามารถพัฒนาการเรียนรู้ของน้อง ๆ จากการปฏิบัติจริงผ่านรูปแบบกิจกรรม</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '40px' }}>
        <Button onClick={handleGoBack}>ย้อนกลับ</Button>
        <Button type="primary" onClick={handleGoToReservation}>ดำเนินการจอง</Button>
      </div>
    </div>
  );
};

export default STEMSSCDetail;
