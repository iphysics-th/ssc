import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { Form, Input, Button, Select, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useFormData } from '../../../contexts/FormDataContext';
import { useGetUserProfileQuery } from '../../auth/authApiSlice';

const { Option } = Select;

const UserInfoForm = forwardRef(({ onNext, onPrev, embedded = false }, ref) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();
  const auth = useSelector((state) => state.auth);
  const shouldPrefill = auth?.isAuthenticated && !formData.__profilePrefilled;
  const {
    data: profileData,
    isFetching: isProfileFetching,
    error: profileError,
  } = useGetUserProfileQuery(undefined, { skip: !shouldPrefill });

  useEffect(() => {
    // Set form fields with context data when the component mounts or formData updates
    form.setFieldsValue(formData);
  }, [form, formData]);

  // Handle form submission
  const handleSubmit = (values) => {
    updateFormData(values);
    if (onNext) {
      onNext();
    } else {
      navigate('/reservation/summary');
    }
  };

  const goBackToSubjects = () => {
    updateFormData(form.getFieldsValue());
    if (onPrev) {
      onPrev();
    } else {
      navigate('/reservation/subjects');
    }
  };

  useEffect(() => {
    if (!shouldPrefill || isProfileFetching) {
      return;
    }

    const profile = profileData?.reservationProfile;
    if (profile) {
      form.setFieldsValue(profile);
      updateFormData({ ...profile, __profilePrefilled: true });
    } else if (profileData) {
      updateFormData({ __profilePrefilled: true });
    }
  }, [shouldPrefill, isProfileFetching, profileData, form, updateFormData]);

  useEffect(() => {
    if (!shouldPrefill && !profileError) {
      return;
    }
    if (profileError && !isProfileFetching) {
      console.error('Failed to hydrate profile', profileError);
      updateFormData({ __profilePrefilled: true });
    }
  }, [profileError, isProfileFetching, shouldPrefill, updateFormData]);

  useImperativeHandle(ref, () => ({
    next: () => form.submit(),
    prev: goBackToSubjects,
  }));

  return (
    <Card style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <Form
        form={form}
        onFinish={handleSubmit}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        layout="horizontal"
      >
      <h3>4. ข้อมูลส่วนตัวของผู้จอง</h3>
      <Form.Item
        label="คำนำหน้า"
        name="prefix"
        rules={[{ required: true, message: 'คำนำหน้า' }]}
        
      >
        <Select placeholder="คำนำหน้าของคุณ">
          <Option value="mr">นาย</Option>
          <Option value="ms">นางสาว</Option>
          <Option value="mrs">นาง</Option>
          <Option value="dr">ดร.</Option>
        </Select>
      </Form.Item>


      <Form.Item label="ชื่อ - สกุล" style={{ marginBottom: 0 }}>
        <Form.Item
          name="name"
          rules={[{ required: true, message: 'กรุณาใส่ชื่อของคุณ!' }]}
          style={{ display: 'inline-block', width: 'calc(50% - 2px)' }}
        >
          <Input placeholder="ชื่อ" />
        </Form.Item>
        <Form.Item
          name="surname"
          rules={[{ required: true, message: 'Please input your surname!' }]}
          style={{ display: 'inline-block', width: 'calc(50% - 2px)', margin: '0 2px' }}
        >
          <Input placeholder="สกุล" />
        </Form.Item>
      </Form.Item>

      <Form.Item
        label="ตำแหน่ง"
        name="status"
        rules={[{ required: true, message: 'กรุณาเลือกตำแหน่งของคุณ' }]}
      >
        <Select placeholder="กรุณาเลือกตำแหน่งของคุณ">
          <Option value="teacher">ครู</Option>
          <Option value="school_representative">ตัวแทนโรงเรียน</Option>
          <Option value="principal">ผู้อำนวยการ</Option>
          <Option value="vice_principal">รองผู้อำนวยการ</Option>
        </Select>
      </Form.Item>
      <Form.Item
        label="โทรศัพท์"
        name="telephone"
        rules={[{ required: true, message: 'กรุณาใส่เบอร์โทรของคุณ' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="อีเมล"
        name="mail"
        rules={[{ required: true, message: 'กรุณาใส่อีเมลของคุณ' }]}
      >
        <Input />
      </Form.Item>
      <h3>5. ข้อมูลของโรงเรียน</h3>
      <Form.Item
        label="โรงเรียน"
        name="school"
        rules={[{ required: true, message: 'กรุณาใส่ชื่อโรงเรียนของคุณ' }]}
      >
        <Input />
      </Form.Item>


      <Form.Item
        label="ขนาดโรงเรียน"
        name="schoolSize"
        rules={[{ required: true, message: 'Please select your status!' }]}
      >
        <Select placeholder="ขนาดของโรงเรียน">
          <Option value="small">โรงเรียนขนาดเล็ก</Option>
          <Option value="medium">โรงเรียนขนาดกลาง</Option>
          <Option value="large">โรงเรียนขนาดใหญ่</Option>
          <Option value="very_large">โรงเรียนขนาดใหญ่พิเศษ</Option>
        </Select>
      </Form.Item>

      

      {!embedded && (
        <Form.Item wrapperCol={{ span: 24, style: { textAlign: 'center' } }}>
          {formData.reservationNumber && (
              <p className="reservation-number">
                  <strong>หมายเลขการจองของคุณ:</strong> {formData.reservationNumber}
              </p>
          )}
          <Button onClick={goBackToSubjects} style={{ marginRight: '10px' }}>
            กลับไปหน้าก่อน
          </Button>
          <Button type="primary" htmlType="submit" style={{ width: '40%' }}>
            หน้าถัดไป
          </Button>
        </Form.Item>
      )}

    </Form>
    </Card>
  );
});

UserInfoForm.displayName = 'UserInfo';

export default UserInfoForm;
