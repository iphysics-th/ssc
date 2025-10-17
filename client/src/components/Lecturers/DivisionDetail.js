import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import '../../css/Lecturers/DivisionDetail.css';
import { useGetDivisionDetailsQuery } from '../../features/lecturer/lecturerApiSlice';

const DivisionDetail = () => {
    const { division_en } = useParams();
    const navigate = useNavigate();
    const {
        data: divisionDetails = [],
        isLoading,
        error,
    } = useGetDivisionDetailsQuery(division_en, { skip: !division_en });

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
            {isLoading && <p style={{ textAlign: 'center' }}>กำลังโหลดข้อมูล...</p>}
            {error && <p style={{ textAlign: 'center', color: 'red' }}>ไม่สามารถโหลดข้อมูลอาจารย์ได้</p>}
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
