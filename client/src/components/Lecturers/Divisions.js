import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/Lecturers/Division.css';
import { useGetDivisionsQuery } from '../../features/lecturer/lecturerApiSlice';

const Divisions = () => {
    const { data: divisions = [], isLoading, error } = useGetDivisionsQuery();
    const navigate = useNavigate();

    const goHome = () => {
        navigate('/');
    };

    return (
        <div className="division-page">
            <div className="back-button-container">
                <button onClick={goHome} className="back-button">กลับไปหน้าหลัก</button>
            </div>
            <h1>สาขาวิชา (Divisions)</h1>
            {isLoading && <p style={{ textAlign: 'center' }}>กำลังโหลดข้อมูล...</p>}
            {error && <p style={{ textAlign: 'center', color: 'red' }}>ไม่สามารถโหลดข้อมูลสาขาได้</p>}
            <div className="division-grid">
                {divisions.map((division, index) => (
                    <Link to={`/divisions/${division.division_en}`} key={index} className="division-box">
                        <img src={`/division/${division.division_en}.jpg`} alt={division.division_th} className="division-icon" />
                        <div className="division-text">
                            <h2>อาจารย์{division.division_th}</h2>
                            <h3>{division.division_en} Lecturers</h3>
                            <h4>อาจารย์ {division.lecturerCount || 0} คน</h4>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Divisions;
