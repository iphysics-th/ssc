import React, { useEffect, useState } from 'react';
import { Avatar, Card, Col, Form, Input, Row, Select, Space, Typography, message, Button } from 'antd';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useFormData } from '../../contexts/FormDataContext';

const { Title, Text } = Typography;
const { Option } = Select;
const backendUrl = process.env.REACT_APP_BACKEND_URL;

const UserProfile = () => {
  const [form] = Form.useForm();
  const auth = useSelector((state) => state.auth);
  const { updateFormData } = useFormData();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [reservationProfile, setReservationProfile] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/api/user/profile`, {
          withCredentials: true,
        });
        if (!mounted) return;
        const { account, reservationProfile: profile } = response.data || {};
        setAccountInfo(account || null);
        setReservationProfile(profile || null);
        if (profile) {
          form.setFieldsValue(profile);
          updateFormData({ ...profile, __profilePrefilled: true });
        } else {
          const defaults = {
            name: account?.name || '',
            mail: account?.email || '',
          };
          form.setFieldsValue(defaults);
          updateFormData({ ...defaults, __profilePrefilled: true });
        }
      } catch (error) {
        if (mounted) {
          console.error('Failed to fetch profile', error);
          setAccountInfo(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [form, updateFormData]);

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const response = await axios.put(
        `${backendUrl}/api/user/profile`,
        values,
        { withCredentials: true }
      );
      const { reservationProfile: profile } = response.data || {};
      setReservationProfile(profile || values);
      updateFormData({ ...values, __profilePrefilled: true });
      message.success('บันทึกข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Failed to save profile', error);
      message.error('ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const displayAccount = accountInfo || (typeof auth.user === 'object' ? auth.user : null);
  const displayRoles = Array.isArray(displayAccount?.roles) ? displayAccount.roles : [];

  return (
    <div>
      <Title level={3} className="dashboard-section-title">ข้อมูลบัญชีผู้ใช้</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card loading={loading} bordered>
            <Space align="start" size="large">
              <Avatar size={64} src={displayAccount?.avatar} icon={!displayAccount?.avatar && undefined} />
              <div>
                <Title level={4} style={{ margin: 0 }}>{displayAccount?.username || displayAccount?.name || '-'}</Title>
                <Text type="secondary">{displayAccount?.email || '-'}</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong>สิทธิ์:</Text>{' '}
                  {displayRoles.length ? displayRoles.join(', ') : 'member'}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="ข้อมูลสำหรับการจอง" bordered>
            <Form
              form={form}
              layout="vertical"
              initialValues={reservationProfile || {}}
              onFinish={handleSubmit}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="คำนำหน้า"
                    name="prefix"
                    rules={[{ required: true, message: 'กรุณาเลือกคำนำหน้า' }]}
                  >
                    <Select placeholder="เลือกคำนำหน้า" allowClear>
                      <Option value="mr">นาย</Option>
                      <Option value="ms">นางสาว</Option>
                      <Option value="mrs">นาง</Option>
                      <Option value="dr">ดร.</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="ตำแหน่ง"
                    name="status"
                    rules={[{ required: true, message: 'กรุณาเลือกตำแหน่ง' }]}
                  >
                    <Select placeholder="เลือกตำแหน่ง" allowClear>
                      <Option value="teacher">ครู</Option>
                      <Option value="school_representative">ตัวแทนโรงเรียน</Option>
                      <Option value="principal">ผู้อำนวยการ</Option>
                      <Option value="vice_principal">รองผู้อำนวยการ</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="ชื่อ"
                    name="name"
                    rules={[{ required: true, message: 'กรุณาใส่ชื่อ' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="สกุล"
                    name="surname"
                    rules={[{ required: true, message: 'กรุณาใส่นามสกุล' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="โทรศัพท์"
                    name="telephone"
                    rules={[{ required: true, message: 'กรุณาใส่เบอร์โทรศัพท์' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="อีเมลสำหรับการติดต่อกลับ"
                    name="mail"
                    rules={[{ required: true, type: 'email', message: 'กรุณาใส่อีเมลที่ถูกต้อง' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="โรงเรียน"
                    name="school"
                    rules={[{ required: true, message: 'กรุณาใส่ชื่อโรงเรียน' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="ขนาดโรงเรียน"
                    name="schoolSize"
                    rules={[{ required: true, message: 'กรุณาเลือกขนาดโรงเรียน' }]}
                  >
                    <Select placeholder="เลือกขนาดโรงเรียน" allowClear>
                      <Option value="small">โรงเรียนขนาดเล็ก</Option>
                      <Option value="medium">โรงเรียนขนาดกลาง</Option>
                      <Option value="large">โรงเรียนขนาดใหญ่</Option>
                      <Option value="very_large">โรงเรียนขนาดใหญ่พิเศษ</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={saving}>
                    บันทึกข้อมูล
                  </Button>
                  <Button onClick={() => form.resetFields()} disabled={saving}>
                    ล้างข้อมูล
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfile;
