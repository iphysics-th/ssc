import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Steps } from 'antd';

const { Step } = Steps;

const StepNavigation = () => {
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    switch (location.pathname) {
      case '/time':
        setCurrentStep(0);
        break;
      case '/dates':
        setCurrentStep(1);
        break;
      case '/subjects':
        setCurrentStep(2);
        break;
      case '/user-info':
        setCurrentStep(3);
        break;
      case '/summary':
        setCurrentStep(4);
        break;
      default:
        setCurrentStep(-1);
        break;
    }
  }, [location]);

  return (
    currentStep >= 0 && (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
        <Steps
          current={currentStep}
          style={{ padding: '20px 0', maxWidth: '600px', width: '100%' }}
          direction="horizontal"
        >
          <Step title="รายละเอียดอบรม" />
          <Step title="เลือกวันที่" />
          <Step title="เลือกวิชา" />
          <Step title="ข้อมูลผู้จอง" />
          <Step title="สรุปการจอง" />
        </Steps>
      </div>
    )
  );

};

export default StepNavigation;
