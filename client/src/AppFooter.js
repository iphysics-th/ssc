import React from 'react';
import { Layout } from 'antd';


const { Footer } = Layout;

const AppFooter = () => {

    return (
        <Footer style={{ backgroundColor: '#13547e', color: 'white', textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#ffd000' }}>Sparking Science Center ©2024</p>
            <p>ศูนย์บริการวิชาการ คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏสงขลา</p>
            <p><a href="https://lin.ee/bbaLyu7" style={{ color: '#00ff7f' }}>ติดต่อ SSC ผ่านช่องทาง LINE OA</a></p>
        </Footer>
    );
};

export default AppFooter;