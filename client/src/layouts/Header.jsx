import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
    Layout,
    Menu,
    Button,
    Drawer,
    Row,
    Col,
    notification,
    Dropdown,
    Avatar,
    Space,
} from "antd";
import {
    DownOutlined,
    UserOutlined,
    LoginOutlined,
    FormOutlined,
    DashboardOutlined,
    LogoutOutlined,
    EllipsisOutlined,
} from "@ant-design/icons";
import "../css/Layout/Header.css";
import { useLogOutMutation } from "../features/auth/authApiSlice";
import { userLoggedOut } from "../features/auth/authSlice";

const { Header } = Layout;

const AppHeader = () => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [overflowMenu, setOverflowMenu] = useState(false);
    const [logOut] = useLogOutMutation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const auth = useSelector((state) => state.auth);

    const isAuthenticated = auth.isAuthenticated;
    const user = typeof auth.user === "object" ? auth.user : null;
    const displayName =
        user?.username || user?.name || user?.email || "บัญชีผู้ใช้";

    // Auto-detect window width for responsive overflow menu
    useEffect(() => {
        const handleResize = () => {
            setOverflowMenu(window.innerWidth < 1280); // hide items before iPad mode
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = async () => {
        try {
            await logOut().unwrap();
            dispatch(userLoggedOut());
            notification.success({
                message: "Logout Successful",
                description: "You have been successfully logged out.",
            });
        } catch (error) {
            console.error("Logout failed: ", error);
            notification.error({
                message: "Logout Failed",
                description: "There was a problem logging you out.",
            });
        }
    };

    const guestMenuItems = [
        {
            key: "register",
            icon: <FormOutlined />,
            label: <Link to="/signup">ลงทะเบียน</Link>,
        },
        {
            key: "login",
            icon: <LoginOutlined />,
            label: <Link to="/signin">ลงชื่อเข้าใช้</Link>,
        },
    ];

    const userMenuItems = [
        { key: "dashboard", icon: <DashboardOutlined />, label: "แดชบอร์ด" },
        { key: "logout", icon: <LogoutOutlined />, label: "ออกจากระบบ" },
    ];

    const handleUserMenuClick = ({ key }) => {
        if (key === "logout") return handleLogout();
        if (key === "dashboard") navigate("/dashboard");
    };

    const renderUserDropdown = () => (
        <Dropdown
            menu={
                isAuthenticated
                    ? { items: userMenuItems, onClick: handleUserMenuClick }
                    : { items: guestMenuItems }
            }
            placement="bottomRight"
            trigger={["click"]}
        >
            <Button type="text" className="header-user-button">
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span className="header-username">{displayName}</span>
                    <DownOutlined />
                </Space>
            </Button>
        </Dropdown>
    );

    const moreMenuItems = [
        {
            key: "instrument",
            label: <Link to="/instrument">เครื่องมือทดสอบ</Link>,
        },
        {
            key: "contact",
            label: <Link to="/contact">ติดต่อเรา</Link>,
        },
    ];

    const renderDesktopMenu = () => (
        <Menu className="menu-desktop" mode="horizontal" selectable={false}>
            <Menu.Item key="1"><Link to="/">หน้าแรก</Link></Menu.Item>
            <Menu.Item key="2"><Link to="/service">บริการของเรา</Link></Menu.Item>
            <Menu.Item key="3"><Link to="/divisions">บุคลากร</Link></Menu.Item>

            {/* Hide some items into ... dropdown when overflowMenu is true */}
            {overflowMenu ? (
                <Menu.SubMenu
                    key="more"
                    title={
                        <span>
                            <EllipsisOutlined /> เพิ่มเติม
                        </span>
                    }
                >
                    {moreMenuItems.map((item) => (
                        <Menu.Item key={item.key}>{item.label}</Menu.Item>
                    ))}
                </Menu.SubMenu>
            ) : (
                <>
                    <Menu.Item key="4"><Link to="/instrument">เครื่องมือทดสอบ</Link></Menu.Item>
                    <Menu.Item key="5"><Link to="/contact">ติดต่อเรา</Link></Menu.Item>
                </>
            )}
        </Menu>
    );

    return (
        <Header className="app-header">
            <Row align="middle" style={{ width: "100%" }}>
                {/* Desktop logo */}
                <Col xs={0} lg={5}>   {/* Logo  */}
                    <div className="logo-container-desktop">
                        <Link to="/"><img src="/logo_ssc.svg" alt="Logo" className="logo" /></Link>
                    </div>
                </Col>

                <Col xs={0} lg={13}>  {/* Menu */}
                    {renderDesktopMenu()}
                </Col>

                <Col xs={0} lg={6} className="desktop-user-column">
                    <div className="desktop-user-wrapper">{renderUserDropdown()}</div>
                </Col>

                {/* Mobile / iPad hamburger */}
                <Col xs={6} lg={0} className="mobile-menu-column">
                    <Button className="menu-mobile" onClick={() => setDrawerVisible(true)}>
                        Menu
                    </Button>
                </Col>

                {/* Mobile / iPad logo */}
                <Col xs={12} lg={0} className="mobile-logo-column">
                    <div className="logo-container-mobile">
                        <Link to="/">
                            <img src="/logo_ssc.svg" alt="Logo" className="logo" />
                        </Link>
                    </div>
                </Col>

                {/* Mobile / iPad dropdown */}
                <Col xs={6} lg={0} className="mobile-user-column">
                    {renderUserDropdown()}
                </Col>

                {/* Drawer for mobile menu */}
                <Drawer
                    title="Menu"
                    placement="left"
                    closable
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                >
                    <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                        <Link to="/" onClick={() => setDrawerVisible(false)}>
                            <img src="/logo_ssc.svg" alt="Logo" className="logo-drawer" />
                        </Link>
                    </div>
                    <Menu mode="vertical" onClick={() => setDrawerVisible(false)}>
                        <Menu.Item key="1"><Link to="/">หน้าแรก</Link></Menu.Item>
                        <Menu.Item key="2"><Link to="/service">บริการของเรา</Link></Menu.Item>
                        <Menu.Item key="3"><Link to="/divisions">บุคลากร</Link></Menu.Item>
                        <Menu.Item key="4"><Link to="/instrument">เครื่องมือทดสอบ</Link></Menu.Item>
                        <Menu.Item key="5"><Link to="/contact">ติดต่อเรา</Link></Menu.Item>

                        {isAuthenticated ? (
                            <>
                                <Menu.Item key="dashboard" onClick={() => navigate("/dashboard")}>
                                    แดชบอร์ด
                                </Menu.Item>
                                <Menu.Item key="logout" onClick={handleLogout}>
                                    ออกจากระบบ
                                </Menu.Item>
                            </>
                        ) : (
                            <>
                                <Menu.Item key="signin">
                                    <Link to="/signin">ลงชื่อเข้าใช้</Link>
                                </Menu.Item>
                                <Menu.Item key="signup">
                                    <Link to="/signup">ลงทะเบียน</Link>
                                </Menu.Item>
                            </>
                        )}
                    </Menu>
                </Drawer>
            </Row>
        </Header>
    );
};

export default AppHeader;
