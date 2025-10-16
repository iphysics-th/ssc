import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../../css/Lecturers/DivisionDetail.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

const DivisionDetail = () => {
    const [divisionDetails, setDivisionDetails] = useState([]);
    const { division_en } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${backendUrl}/api/lecturer/divisions/${division_en}`)
            .then(response => response.json())
            .then(data => {
                // Sort by bachelor_year
                const sortedData = data.sort((a, b) => a.bachelor_year - b.bachelor_year);
                setDivisionDetails(sortedData);
            })
            .catch(error => console.error('Error:', error));
    }, [division_en]);

    const getTitle = (lecturer) => {
        let title = '';

        // Add position title based on 'position_en'
        switch (lecturer.position_en) {
            case 'Lecturer':
                title += 'อ.';
                break;
            case 'Assistant Professor':
                title += 'ผศ.';
                break;
            case 'Associate Professor':
                title += 'รศ.';
                break;
            case 'Professor':
                title += 'ศ.';
                break;
            default:
                break;
        }

        // Append 'ดร.' if 'doctoral' is not '-'
        if (lecturer.doctoral !== '-') {
            title += 'ดร.';
        }

        return title;
    };


    const goBack = () => {
        navigate(-1);
    };

    return (
        <div className="division-detail">
            <div className="navigation">
                <button onClick={goBack} className="back-button">กลับไปหน้าก่อน</button>
            </div>
            {divisionDetails.length > 0 && (
                <div className="division-header">
                    <h1>{divisionDetails[0].division_th} <br></br>({division_en})</h1>
                </div>
            )}
            <ul className="lecturer-list">
                {divisionDetails.map((lecturer, index) => (
                    <li key={index} className="lecturer-item">
                        <Link to={`/divisions/${division_en}/${lecturer.name_en}`}>
                            <div className="profile-img-container">
                                <img
                                    src={`/lecturer/${lecturer.name_en}.jpg`}
                                    alt={lecturer.name_th}
                                    className="profile-pic"
                                />
                            </div>
                            <p className="lecturer-name">
                                {getTitle(lecturer)}{lecturer.name_th} {lecturer.surname_th}
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DivisionDetail;
