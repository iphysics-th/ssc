import React, { useEffect, useMemo } from 'react';
import { Avatar, Card, Col, Form, Input, Row, Select, Space, Typography, message, Button } from 'antd';
import { useSelector } from 'react-redux';
import { useFormData } from '../../contexts/FormDataContext';
import {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} from '../../features/auth/authApiSlice';

const { Title, Text } = Typography;
const { Option } = Select;

const UserProfile = () => {
  const [form] = Form.useForm();
  const auth = useSelector((state) => state.auth);
  const { updateFormData } = useFormData();

  const {
    data: profileData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetUserProfileQuery();
  const [updateUserProfile, { isLoading: isSaving }] = useUpdateUserProfileMutation();

  const accountInfo = useMemo(() => {
    if (profileData?.account) {
      return profileData.account;
    }
    return typeof auth.user === 'object' ? auth.user : null;
  }, [profileData, auth.user]);

  useEffect(() => {
    if (!profileData) {
      return;
    }

    const reservationProfile = profileData?.reservationProfile;
    if (reservationProfile) {
      form.setFieldsValue(reservationProfile);
      updateFormData({ ...reservationProfile, __profilePrefilled: true });
      return;
    }

    if (profileData?.account) {
      const defaults = {
        name: profileData.account?.name || '',
        mail: profileData.account?.email || '',
      };
      form.setFieldsValue(defaults);
      updateFormData({ ...defaults, __profilePrefilled: true });
    }
  }, [profileData, form, updateFormData]);

  useEffect(() => {
    if (error) {
      console.error('Failed to fetch profile', error);
      message.error('ไม่สามารถดึงข้อมูลโปรไฟล์ได้');
    }
  }, [error]);

  const handleSubmit = async (values) => {
    try {
      const result = await updateUserProfile(values).unwrap();
      const reservationProfile = result?.reservationProfile || values;
      updateFormData({ ...reservationProfile, __profilePrefilled: true });
      message.success('บันทึกข้อมูลสำเร็จ');
      refetch();
    } catch (err) {
      console.error('Failed to save profile', err);
      message.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const displayRoles = useMemo(() => {
    if (!accountInfo) {
      return [];
    }
    if (Array.isArray(accountInfo.roles)) {
      return accountInfo.roles;
    }
    if (typeof accountInfo.role === 'string') {
      return [accountInfo.role];
    }
    return [];
  }, [accountInfo]);

  return (
    <div>
      <Title level={3} className="dashboard-section-title">ข้อมูลบัญชีผู้ใช้</Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card loading={isLoading} bordered>
            <Space align="start" size="large">
              <Avatar size={64} src={accountInfo?.avatar} />
              <div>
                <Title level={4} style={{ margin: 0 }}>{accountInfo?.username || accountInfo?.name || '-'}</Title>
                <Text type="secondary">{accountInfo?.email || '-'}</Text>
                <div style={{ marginTop: 8 }}>
                  <Text strong>สิทธิ์:</Text>{' '}
                  {displayRoles.length ? displayRoles.join(', ') : 'member'}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="ข้อมูลสำหรับการจอง" bordered loading={isFetching && !profileData}>
            <Form
              form={form}
              layout="vertical"
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
                  <Button type="primary" htmlType="submit" loading={isSaving}>
                    บันทึกข้อมูล
                  </Button>
                  <Button
                    onClick={() => form.resetFields()}
                    disabled={isSaving}
                  >
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

