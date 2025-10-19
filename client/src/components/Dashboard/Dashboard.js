import React, { useMemo, useState } from 'react';
import { Layout, Menu, Typography, Card, Button, Drawer, Grid } from 'antd';
import { useSelector } from 'react-redux';
import Protected from '../../hooks/userProtected';
import UserProfile from './UserProfile';
import UserReservations from './UserReservations';
import ReservationTable from '../Admin/reservationData';
import SlideUploadComponent from '../Admin/slideUpload';
import CourseManagement from '../Admin/CourseManagement';
import UserManagement from './UserManagement';
import {
  UserOutlined,
  BookOutlined,
  TableOutlined,
  UploadOutlined,
  SettingOutlined,
  TeamOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import './Dashboard.css';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const Dashboard = () => {
  const auth = useSelector((state) => state.auth);
  const user = typeof auth.user === 'object' ? auth.user : null;
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = roles.includes('admin');

  const [selectedKey, setSelectedKey] = useState('profile');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // prettier, icon-rich sidebar menu
  const menuItems = useMemo(() => {
    const items = [
      { key: 'profile', label: 'ข้อมูลผู้ใช้', icon: <UserOutlined /> },
      { key: 'my-reservations', label: 'การจองของฉัน', icon: <BookOutlined /> },
    ];
    if (isAdmin) {
      items.push(
        { key: 'reservation-data', label: 'ข้อมูลการจองทั้งหมด', icon: <TableOutlined /> },
        { key: 'slide-upload', label: 'อัปโหลดสไลด์', icon: <UploadOutlined /> },
        { key: 'course-management', label: 'จัดการคอร์ส', icon: <SettingOutlined /> },
        { key: 'user-management', label: 'จัดการผู้ใช้', icon: <TeamOutlined /> },
      );
    }
    return items;
  }, [isAdmin]);

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  };

  const menuComponent = (
    <Menu
      mode="inline"
      selectedKeys={[selectedKey]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{
        borderRight: 0,
        background: 'transparent',
        padding: '8px 0',
        fontWeight: 500,
        fontSize: '16px',
      }}
    />
  );

  return (
    <Protected>
      <Layout
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)',
        }}
      >
        {/* Side Navigation */}
        {!isMobile && (
          <Sider
            breakpoint="lg"
            collapsedWidth="0"
            className="dashboard-sider"
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(10px)',
              borderRight: '1px solid #e5e7eb',
              boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
            }}
          >
            <div
              className="dashboard-user"
              style={{
                textAlign: 'center',
                padding: '24px 16px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <Typography.Title level={4} style={{ margin: 0 }}>
                {user?.username || user?.name || 'ผู้ใช้งาน'}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {user?.email}
              </Typography.Text>
            </div>

            {menuComponent}
          </Sider>
        )}

        {/* Content Area */}
        <Layout>
          <Content
            style={{
              padding: isMobile ? '16px 12px' : '32px 24px',
              minHeight: '100vh',
              display: 'flex',
              justifyContent: 'center',
              background: 'linear-gradient(145deg, #f1f5f9 0%, #ffffff 100%)',
            }}
          >
            {/* Card Stack Wrapper */}
            <Card
              bordered={false}
              style={{
                width: '100%',
                maxWidth: 1200,
                borderRadius: 20,
                background: '#ffffff',
                boxShadow:
                  '0 10px 25px rgba(0,0,0,0.08), 0 -2px 5px rgba(0,0,0,0.03)',
                padding: isMobile ? 16 : 24,
                transition: 'all 0.3s ease-in-out',
              }}
              bodyStyle={{ padding: 0 }}
            >
              <div
                style={{
                  padding: isMobile ? '12px 16px 20px' : '16px 24px 24px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <Typography.Title
                  level={3}
                  style={{ marginBottom: 0, color: '#0f172a', fontWeight: 700, fontSize: isMobile ? 20 : 26 }}
                >
                  {menuItems.find((i) => i.key === selectedKey)?.label || ''}
                </Typography.Title>
                {isMobile && (
                  <Button
                    type="default"
                    icon={<MenuOutlined />}
                    size="large"
                    onClick={() => setIsDrawerOpen(true)}
                    style={{ borderRadius: 12 }}
                  >
                    เมนู
                  </Button>
                )}
              </div>

              <div style={{ padding: isMobile ? 16 : 24 }}>
                {selectedKey === 'profile' && <UserProfile />}
                {selectedKey === 'my-reservations' && <UserReservations />}
                {isAdmin && selectedKey === 'reservation-data' && <ReservationTable />}
                {isAdmin && selectedKey === 'slide-upload' && <SlideUploadComponent />}
                {isAdmin && selectedKey === 'course-management' && <CourseManagement />}
                {isAdmin && selectedKey === 'user-management' && <UserManagement />}
              </div>
            </Card>
            {isMobile && (
              <Drawer
                placement="left"
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                bodyStyle={{ padding: 0 }}
                width={280}
              >
                <div className="dashboard-user" style={{ padding: 16 }}>
                  <Typography.Title level={5} style={{ marginBottom: 4 }}>
                    {user?.username || user?.name || 'ผู้ใช้งาน'}
                  </Typography.Title>
                  <Typography.Text type="secondary">{user?.email}</Typography.Text>
                </div>
                {menuComponent}
              </Drawer>
            )}
          </Content>
        </Layout>
      </Layout>
    </Protected>
  );
};

export default Dashboard;
