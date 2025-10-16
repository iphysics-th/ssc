import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/Lecturers/Division.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL;
const Divisions = () => {
    const [divisions, setDivisions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${backendUrl}/api/lecturer/divisions`)
            .then(response => response.json())
            .then(data => {
                // Sort divisions by division_th in Thai dictionary order
                const sortedData = data.sort((a, b) => a.division_th.localeCompare(b.division_th, 'th'));
                setDivisions(sortedData);
            })
            .catch(error => console.error('Error fetching divisions:', error));
    }, []);

    const goHome = () => {
        navigate('/');
    };

    return (
        <div className="division-page">
            <div className="back-button-container">
                <button onClick={goHome} className="back-button">กลับไปหน้าหลัก</button>
            </div>
            <h1>สาขาวิชา (Divisions)</h1>
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
