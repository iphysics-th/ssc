import React from 'react';
import '../../css/Home/AboutUs.css'; // Import the CSS file
import aboutUsImage from '../../assets/AboutUs.png';

const AboutUs = () => {
    return (
        <div className="about-us-container">
            <div className="image-container">
                <img src={aboutUsImage} alt="Sparkling Science Center" />
            </div>
            <div className="text-container">
                <h1>ศูนย์บริการวิชาการ <br></br>
                    "Sparkling Science Center"</h1>
                <h4>
                    ศูนย์บริการวิชาการ คณะวิทยาศาสตร์และเทคโนโลยี หรือ "Sparkling Science Center (SSC)" ก่อตั้งเมื่อปี 2566 มีพันธกิจคือการให้บริการวิชาการแก่หน่วยงานรัฐ ได้แก่ โรงเรียน มหาวิทยาลัย หน่วยวิจัยต่างๆ เป็นต้น รวมถึงหน่วยงานภาคเอกชน อาทิเช่น โรงงาน วิสาหกิจชุมชน เป็นต้น เพื่อให้องค์ความรู้ทางวิทยาศาสตร์และเทคโนโลยีสามารถเข้าถึงได้
                    <br></br>
                    ในปัจจุบัน ศูนย์บริการวิชาการคณะวิทยาศาสตร์และเทคโนโลยี ได้มีบริการกิจกรรมสำหรับโรงเรียนได้แก่ STEM-SSC และ SCICAMP-SSC ซึ่งเป็นกิจกรรมที่เน้นไปที่โรงเรียน โดยให้นักเรียนได้มาทำการทดลองที่ห้องปฏิบัติการระดับมหาวิทยาลัย และกิจกรรม "SCITEREST" หรือ "เติมวิทย์คิดสนุก" ที่จัดกิจกรรมพิเศษที่นักเรียนสามารถเข้าร่วมได้อย่างอิสระ นอกจากนี้ทาง SSC ยังมี "HAND-to-SCI" ซึ่งเป็นรูปแบบการให้คำปรึกษาแก่โรงเรียนหรือภาคอุตสาหกรรมโดยคณาจารย์ที่มีความรู้ความเชี่ยวชาญเฉพาะด้าน
                </h4>
            </div>
        </div>
    );
};

export default AboutUs;
