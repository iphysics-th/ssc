import React, { useEffect } from 'react';
import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import '../../../styles/variables.css';

const { Title, Paragraph } = Typography;

const SignUp = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/signin', { replace: true, state: { fromSignup: true } });
  }, [navigate]);

  return (
    <div className="signup-container" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div className="logo-container-mobile">
        <img src="/logo_ssc.svg" alt="Logo" className="logo" />
      </div>
      <div style={{ maxWidth: 420, margin: '0 auto' }}>
        <Title level={3} style={{ marginBottom: 12 }}>
          ใช้ Google Account ในการสมัครสมาชิก
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          เราเปิดให้ลงทะเบียนผ่านบัญชี Google เท่านั้นเพื่อความปลอดภัย และความรวดเร็วในการเข้าใช้งาน
        </Paragraph>
        <Button type="primary" size="large" onClick={() => navigate('/signin')}>
          ไปยังหน้าเข้าสู่ระบบ Google
        </Button>
      </div>
    </div>
  );
};

export default SignUp;
