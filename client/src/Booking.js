import React, { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Steps } from 'antd';
import CourseSelection from './CourseSelection';
import UserInfoForm from './UserInfoForm';
import SummaryPage from './SummaryPage';

const { Step } = Steps;

const Booking = ({ location }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    switch (location.pathname) {
      case '/booking/time':
        setCurrentStep(0);
        break;
      case '/booking/user-info':
        setCurrentStep(1);
        break;
      case '/booking/summary':
        setCurrentStep(2);
        break;
      default:
        break;
    }
  }, [location]);

  return (
    <>
      {currentStep >= 0 && (
        <Steps current={currentStep} style={{ marginBottom: 20 }}>
          <Step title="เลือกตารางเวลา" />
          <Step title="ข้อมูลผู้จอง" />
          <Step title="สรุปการจอง" />
        </Steps>
      )}
      <div style={{ background: '#fff', padding: 24, minHeight: 280 }}>
        <Routes>
          <Route path="/booking/time" element={<CourseSelection />} />
          <Route path="/user-info" element={<UserInfoForm />} />
          <Route path="/summary" element={<SummaryPage />} />
        </Routes>
      </div>
    </>
  );
};

export default Booking;
