import React from "react";
import studentsData from "./data";  // Adjust path if necessary
import './EduResearch.css';  // Import the updated CSS
import { FilePdfTwoTone } from '@ant-design/icons';  // Import Ant Design icon

const EduResearch = () => {
  const categorizedData = studentsData.reduce((acc, student) => {
    const { major } = student;
    if (!acc[major]) {
      acc[major] = [];
    }
    acc[major].push(student);
    return acc;
  }, {});

  return (
    <div className="container">
      <h1>งานวิจัยในชั้นเรียน</h1>
      <h3>งานวิจัยในชั้นเรียนของนักศึกษาฝึกประสบการณ์วิชาชีพครูปีการศึกษา 2567</h3>
      {Object.keys(categorizedData).map((major) => (
        <div key={major} className="major-section">
          <h2>{major}</h2>
          <table>
            <thead>
              <tr>
                <th>รหัสนักศึกษา</th>
                <th>ชื่อ-สกุล</th>
                <th>ชื่องานวิจัยในชั้นเรียน</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              {categorizedData[major].map((student) => (
                <tr key={student.studentId}>
                  <td data-label="รหัสนักศึกษา">{student.studentId}</td>
                  <td data-label="ชื่อ-สกุล">{student.name}</td>
                  <td data-label="ชื่องานวิจัย">{student.researchTitle}</td>
                  <td data-label="ดาวน์โหลด">
                    <a href={student.link} target="_blank" rel="noopener noreferrer">
                      <FilePdfTwoTone className="icon" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default EduResearch;
