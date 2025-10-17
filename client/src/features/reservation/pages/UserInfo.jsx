import React, { useEffect } from 'react';
import { Form, Input, Button, Select, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useFormData } from '../../../contexts/FormDataContext';

const { Option } = Select;

const backendUrl = process.env.REACT_APP_BACKEND_URL;

const UserInfoForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { formData, updateFormData } = useFormData();
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    // Set form fields with context data when the component mounts or formData updates
    form.setFieldsValue(formData);
  }, [form, formData]);

  // Handle form submission
  const handleSubmit = (values) => {
    updateFormData(values);
    navigate('/summary');
  };

  const goBackToSubjects = () => {
    updateFormData(form.getFieldsValue());
    navigate('/subjects');
  };

  useEffect(() => {
    const shouldPrefill = auth?.isAuthenticated && !formData.__profilePrefilled;
    if (!shouldPrefill) {
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/user/profile`, {
          withCredentials: true,
        });
        const profile = response.data?.reservationProfile;
        if (profile) {
          form.setFieldsValue(profile);
          updateFormData({ ...profile, __profilePrefilled: true });
        } else {
          updateFormData({ __profilePrefilled: true });
        }
      } catch (error) {
        console.error('Failed to hydrate profile', error);
        updateFormData({ __profilePrefilled: true });
      }
    };

    fetchProfile();
  }, [auth?.isAuthenticated, form, formData.__profilePrefilled, updateFormData]);

  return (
    <Card style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <Form
        form={form}
        onFinish={handleSubmit}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        layout="horizontal"
      >
      <h3>6. ข้อมูลส่วนตัวของผู้จอง</h3>
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
      <h3>7. ข้อมูลของโรงเรียน</h3>
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

    </Form>
    </Card>
  );
};

export default UserInfoForm;
