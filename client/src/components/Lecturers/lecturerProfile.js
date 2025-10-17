import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../css/Lecturers/lecturerProfile.css';
import { useGetLecturerProfileQuery } from '../../features/lecturer/lecturerApiSlice';


const LecturerProfile = () => {
    const { division_en, name_en } = useParams();
    const navigate = useNavigate();
    const { data: lecturer, isLoading, error } = useGetLecturerProfileQuery(
        { division: division_en, name: name_en },
        { skip: !division_en || !name_en }
    );

    const getThaiTitle = () => {
        if (!lecturer) {
            return '';
        }
        let title = '';
        switch (lecturer.position_en) {
            case 'Lecturer': title = 'อ.'; break;
            case 'Assistant Professor': title = 'ผศ.'; break;
            case 'Associate Professor': title = 'รศ.'; break;
            case 'Professor': title = 'ศ.'; break;
            default: break;
        }
        if (lecturer.doctoral !== '-') {
            title += 'ดร.';
        }
        return title  + lecturer.name_th + ' ' + lecturer.surname_th;
    };

    const getEnglishTitle = () => {
        if (!lecturer) {
            return '';
        }
        let title = '';
        switch (lecturer.position_en) {
            case 'Assistant Professor': title = 'Asst. Prof. '; break;
            case 'Associate Professor': title = 'Assoc. Prof. '; break;
            case 'Professor': title = 'Prof. '; break;
            default: break;
        }
        if (lecturer.doctoral !== '-') {
            title += 'Dr. ';
        }
        return title + lecturer.name_en + ' ' + lecturer.surname_en;
    };

    const renderList = (items) => {
        if (!items || items.length === 0 || (items.length === 1 && items[0] === '-')) {
            return null;
        }
        return (
            <ul>
                {items.map((item, index) => (
                    item !== '-' ? <li key={index}><h4>{item}</h4></li> : null
                ))}
            </ul>
        );
    };

    const goBack = () => {
        navigate(-1);
    };

    return (
        <>
            <div className="navigation">
                <button onClick={goBack} className="back-button">กลับไปหน้าก่อน</button>
            </div>
            {isLoading && <p style={{ textAlign: 'center' }}>กำลังโหลดข้อมูล...</p>}
            {error && <p style={{ textAlign: 'center', color: 'red' }}>ไม่สามารถโหลดข้อมูลอาจารย์ได้</p>}
            {lecturer && (
                <div className="lecturer-profile">
                    <div className="left-column">
                        <img src={`/lecturer/${lecturer.name_en}.jpg`} alt={lecturer.name_th} className="profile-pic" />
                    </div>
                    <div className="right-column">
                        <h1>{getThaiTitle()}</h1>
                        <h2>{getEnglishTitle()}</h2>
                        <h4>Contact: {lecturer.email}</h4>
                        <br></br>
                        <h3>ประวัติการศึกษา</h3>
                        <hr />
                        {renderList([lecturer.doctoral, lecturer.master, lecturer.bachelor])}
                        <br></br>
                        <h3>ความถนัด</h3>
                        <hr />
                        {renderList(lecturer.specialty)}
                        <br></br>
                        <h3>สังกัดหลักสูตร</h3>
                        <hr />
                        <h4>{lecturer.program}</h4>
                        <br></br>
                        <h3>ผลงานตีพิมพ์</h3>
                        <hr />
                        {renderList(lecturer.paper)}
                        <br></br>
                        <h3>สิทธิบัตร/อนุสิทธิบัตร/รางวัลที่เคยได้รับ</h3>
                        <hr />
                        {renderList(lecturer.patent)}
                        <br></br>
                        <h3>ผลงานร่วมกับภาคอุตสาหกรรมและชุมชน</h3>
                        <hr />
                        {renderList(lecturer.industrial)}
                        <br></br>
                        <h3>ทุนวิจัยที่เคยได้รับ</h3>
                        <hr />
                        {renderList(lecturer.grant)}
                        <br></br>
                    </div>
                </div>
            )}
        </>
    );
};

export default LecturerProfile;
