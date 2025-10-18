import React, { useMemo, useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { useSelector } from 'react-redux';
import Protected from '../../hooks/userProtected';
import UserProfile from './UserProfile';
import UserReservations from './UserReservations';
import ReservationTable from '../Admin/reservationData';
import SlideUploadComponent from '../Admin/slideUpload';
import CourseManagement from '../Admin/CourseManagement';
import UserManagement from './UserManagement';
import './Dashboard.css';

const { Sider, Content } = Layout;

const Dashboard = () => {
  const auth = useSelector((state) => state.auth);
  const user = typeof auth.user === 'object' ? auth.user : null;
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = roles.includes('admin');

  const [selectedKey, setSelectedKey] = useState('profile');

  const menuItems = useMemo(() => {
    const items = [
      { key: 'profile', label: 'ข้อมูลผู้ใช้' },
      { key: 'my-reservations', label: 'การจองของฉัน' },
    ];

    if (isAdmin) {
      items.push(
        { key: 'reservation-data', label: 'ข้อมูลการจองทั้งหมด' },
        { key: 'slide-upload', label: 'อัปโหลดสไลด์' },
        { key: 'course-management', label: 'จัดการคอร์ส' },
        { key: 'user-management', label: 'จัดการผู้ใช้' },
      );
    }
    return items;
  }, [isAdmin]);

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
  };

  return (
    <Protected>
      <Layout className="dashboard-layout">
        <Sider breakpoint="lg" collapsedWidth="0" className="dashboard-sider">
          <div className="dashboard-user">
            <Typography.Title level={4}>
              {user?.username || user?.name || 'ผู้ใช้งาน'}
            </Typography.Title>
            <Typography.Text type="secondary">{user?.email}</Typography.Text>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={handleMenuClick}
            className="dashboard-menu"
          />
        </Sider>
        <Layout>
          <Content className="dashboard-content">
            {selectedKey === 'profile' && <UserProfile />}
            {selectedKey === 'my-reservations' && <UserReservations />}
            {isAdmin && selectedKey === 'reservation-data' && <ReservationTable />}
            {isAdmin && selectedKey === 'slide-upload' && <SlideUploadComponent />}
            {isAdmin && selectedKey === 'course-management' && <CourseManagement />}
            {isAdmin && selectedKey === 'user-management' && <UserManagement />}
          </Content>
        </Layout>
      </Layout>
    </Protected>
  );
};

export default Dashboard;
