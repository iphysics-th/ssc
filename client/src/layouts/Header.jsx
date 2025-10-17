import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Layout, Menu, Button, Drawer, Row, Col, notification, Dropdown, Avatar, Space } from 'antd';
import { DownOutlined, UserOutlined, LoginOutlined, FormOutlined, DashboardOutlined, LogoutOutlined } from '@ant-design/icons';
import '../AppHeader.css';
import { useLogOutMutation } from '../features/auth/authAPI';
import { userLoggedOut } from '../features/auth/authSlice';

const { Header } = Layout;

const AppHeader = () => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const auth = useSelector((state) => state.auth); // Access the auth state
    const dispatch = useDispatch(); // Use useDispatch to dispatch actions
    const navigate = useNavigate();
    // Use the query hook without destructuring it incorrectly

    const [logOut] = useLogOutMutation();

    const handleLogout = async () => {
        try {
            await logOut().unwrap();
            dispatch(userLoggedOut()); // Dispatch userLoggedOut action here
            notification.success({
                message: 'Logout Successful',
                description: 'You have been successfully logged out.',
            });
        } catch (error) {
            console.error('Logout failed: ', error);
            notification.error({
                message: 'Logout Failed',
                description: 'There was a problem logging you out.',
            });
        }
    };


    const showDrawer = () => {
        setDrawerVisible(true);
    };

    const closeDrawer = () => {
        setDrawerVisible(false);
    };

    // Function to handle menu item click and close the drawer
    const handleMenuItemClick = () => {
        closeDrawer();
    };

    const isAuthenticated = auth.isAuthenticated;
    const user = typeof auth.user === 'object' ? auth.user : null;
    const displayName = user?.username || user?.name || user?.email || 'บัญชีผู้ใช้';
    const roles = Array.isArray(user?.roles) ? user.roles : [];

    const guestMenuItems = [
        {
            key: 'register',
            icon: <FormOutlined />,
            label: <Link to="/signup">ลงทะเบียน</Link>,
        },
        {
            key: 'login',
            icon: <LoginOutlined />,
            label: <Link to="/signin">ลงชื่อเข้าใช้</Link>,
        },
    ];

    const userMenuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'แดชบอร์ด',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'ออกจากระบบ',
        },
    ];

    const handleUserMenuClick = ({ key }) => {
        if (key === 'logout') {
            handleLogout();
            return;
        }
        if (key === 'dashboard') {
            navigate('/dashboard');
        }
    };

    return (
        <Header className="app-header">
            <Row align="middle" style={{ width: '100%' }}>
                <Col xs={0} md={2}>
                    <div className="logo-container-desktop">
                        <Link to="/">
                            <img src="/logo_ssc.svg" alt="Logo" className="logo" />
                        </Link>
                    </div>
                </Col>

                <Col xs={0} md={15} offset={4}>
                    <Menu className="menu-desktop" mode="horizontal" defaultSelectedKeys={['1']}>
                        <Menu.Item key="1"><Link to="/">หน้าแรก</Link></Menu.Item>
                        <Menu.Item key="2"><Link to="/service">บริการของเรา</Link></Menu.Item>
                        <Menu.Item key="3"><Link to="/divisions">บุคลากร</Link></Menu.Item>
                        <Menu.Item key="4"><Link to="/instrument">เครื่องมือทดสอบ</Link></Menu.Item>
                        <Menu.Item key="5"><Link to="/contact">ติดต่อเรา</Link></Menu.Item>
                    </Menu>
                </Col>

                <Col xs={5} md={0}>
                    <Button className="menu-mobile" onClick={showDrawer}>Menu</Button>
                </Col>

                <Col xs={5} md={0} offset={3}>
                    <div className="logo-container-mobile">
                        <Link to="/">
                            <img src="/logo_ssc.svg" alt="Logo" className="logo" />
                        </Link>
                    </div>
                </Col>


                <Drawer
                    title="Menu"
                    placement="left"
                    closable={true}
                    onClose={closeDrawer}
                    visible={drawerVisible}
                >
                    <div>
                        <Link to="/">
                            <img src="/logo_ssc.svg" alt="Logo" className="logo-drawer" />
                        </Link>
                    </div>
                    <Menu mode="vertical" onClick={handleMenuItemClick}>
                        <Menu.Item key="1"><Link to="/">หน้าแรก</Link></Menu.Item>
                        <Menu.Item key="2"><Link to="/service">บริการของเรา</Link></Menu.Item>
                        <Menu.Item key="3"><Link to="/divisions">บุคลากร</Link></Menu.Item>
                        <Menu.Item key="4"><Link to="/instrument">เครื่องมือทดสอบ</Link></Menu.Item>
                        <Menu.Item key="5"><Link to="/contact">ติดต่อเรา</Link></Menu.Item>
                        {isAuthenticated ? (
                            <>
                                <Menu.Item key="drawer-dashboard">
                                    <span onClick={() => { closeDrawer(); navigate('/dashboard'); }}>แดชบอร์ด</span>
                                </Menu.Item>
                                <Menu.Item key="drawer-logout">
                                    <span onClick={() => { closeDrawer(); handleLogout(); }}>ออกจากระบบ</span>
                                </Menu.Item>
                            </>
                        ) : (
                            <>
                                <Menu.Item key="drawer-login">
                                    <Link to="/signin">ลงชื่อเข้าใช้</Link>
                                </Menu.Item>
                                <Menu.Item key="drawer-register">
                                    <Link to="/signup">ลงทะเบียน</Link>
                                </Menu.Item>
                            </>
                        )}
                    </Menu>
                </Drawer>

                <Col xs={9} md={3} style={{ textAlign: 'right' }}>
                    <Dropdown
                        menu={isAuthenticated ? { items: userMenuItems, onClick: handleUserMenuClick } : { items: guestMenuItems }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Button type="text" className="header-user-button">
                            <Space>
                                <Avatar size="small" icon={<UserOutlined />} />
                                <span className="header-username">{displayName}</span>
                                <DownOutlined />
                            </Space>
                        </Button>
                    </Dropdown>
                </Col>
            </Row>
        </Header>
    );
};

export default AppHeader;
