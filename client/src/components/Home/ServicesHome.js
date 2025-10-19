import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Home/ServicesHome.css';

const ServicesHome = () => {
  const navigate = useNavigate();
  const services = [
    { img: '/services/stem-ssc.png', text: 'จองอบรมวิทยาศาสตร์<br />สำหรับนักเรียน <br /><br /> (STEM-SSC)', link: '/reservation' },
    { img: '/services/scicamp-ssc.png', text: 'จองค่ายวิทยาศาสตร์ <br /><br />(SCICAMP-SSC)', link: '/reservation' },
    { img: '/services/sciterest-ssc.png', text: 'ตรวจสอบสถานะการจอง <br /><br />(ใช้หมายเลขการจอง 9 หลัก)', link: '/reservecheck' },
    {
      img: '/services/hand-to-sci-2.jpg',
      text: 'ตารางคำนวณ<br />การอบรมสำหรับนักเรียน <br /><br />(Fee calculation)',
      link: '/utility/calculation.jpg',
      external: true // 👈 Custom flag to indicate external link
    },
  ];

  return (
    <div className="services-container">
      {services.map((service, index) => {
        const content = (
          <div
            className="service-item"
            style={{ backgroundImage: `url(${service.img})` }}
          >
            <div className="overlay">
              <span
                className="service-text"
                dangerouslySetInnerHTML={{ __html: service.text }}
              />
            </div>
          </div>
        );

        return service.external ? (
          <a
            key={index}
            href={service.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            {content}
          </a>
        ) : (
          <div
            key={index}
            onClick={() => navigate(service.link)}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default ServicesHome;
