import React, { useEffect, useState } from 'react';
import { Button, Input, Form, message, Card } from 'antd';
import axios from 'axios';
import AdminProtected from "../../hooks/adminProtected";
import '../../css/Admin/slideUpload.css'; // Import your CSS for styling

const SlideUploadComponent = () => {
  const [slides, setSlides] = useState({});
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchSlideData = async () => {
      for (let i = 1; i <= 5; i++) {
        const slideNumber = `slide${i}`;
        try {
          const { data } = await axios.get(`${backendUrl}/api/slide/${slideNumber}`);
          setSlides(prev => ({
            ...prev,
            [`${slideNumber}_header`]: data.slideHeader,
            [`${slideNumber}_des`]: data.slideDetail,
            [`${slideNumber}_link`]: data.slideLink,
            [`${slideNumber}_imagePath`]: data.slideImage ? `${backendUrl}/${data.slideImage}` : null,
          }));
        } catch (error) {
          console.error(`Failed to fetch data for ${slideNumber}:`, error);
        }
      }
    };

    fetchSlideData();
  }, [backendUrl]);

  const handleFileChange = (event, slideNumber) => {
    const file = event.target.files[0];
    if (file) {
      setSlides(prev => ({
        ...prev,
        [`${slideNumber}_image`]: [file], // Assuming we're mimicking the fileList structure
      }));
    }
  };

  const handleChange = (e, slideNumber, type) => {
    setSlides(prev => ({
      ...prev,
      [`${slideNumber}_${type}`]: e.target.value,
    }));
  };

  const handleSave = async (slideNumber) => {
    const formData = new FormData();
    if (slides[`${slideNumber}_image`]?.[0]) {
      formData.append('image', slides[`${slideNumber}_image`][0]);
    }
    formData.append('slideHeader', slides[`${slideNumber}_header`]);
    formData.append('slideDetail', slides[`${slideNumber}_des`]);
    formData.append('slideLink', slides[`${slideNumber}_link`]);

    try {
      const response = await axios.post(`${backendUrl}/api/slide/${slideNumber}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Assuming the backend sends a response with a specific field to indicate success
      // For example, we'll assume the backend sends a `success` boolean and possibly an `imageFileName`
      if (response.data && response.data.success && response.data.imageFileName) {
        message.success(`Slide ${slideNumber} and image ${response.data.imageFileName} updated successfully`);
      } else {
        // If the response does not indicate the expected success, show a generic success message
        message.success(`Slide ${slideNumber} updated successfully, but check image upload.`);
      }

      // Refetch slide data to show updated values
      const { data } = await axios.get(`${backendUrl}/api/slide/${slideNumber}`);
      setSlides(prev => ({
        ...prev,
        [`${slideNumber}_imagePath`]: data.slideImage ? `${backendUrl}/${data.slideImage}` : null,
      }));
    } catch (error) {
      console.error(`Failed to update ${slideNumber}:`, error);
      message.error(`Failed to update Slide ${slideNumber}`);
    }

  };

  return (
    <AdminProtected>
      <div className="slide-upload-container">
        {Array.from({ length: 5 }, (_, index) => {
          const slideNumber = `slide${index + 1}`;
          return (
            <Card key={slideNumber} title={`สไลด์รูปที่ ${index + 1}`} className="slide-card">
              <Form layout="vertical" className="slide-form">
                <Form.Item label="ภาพสไลด์">
                  {slides[`${slideNumber}_imagePath`] && (
                    <img src={slides[`${slideNumber}_imagePath`]} alt={`Slide ${index + 1}`} className="slide-image" />
                  )}
                  <input
                    type="file"
                    name="image"
                    onChange={(event) => handleFileChange(event, slideNumber)}
                  />
                </Form.Item>
                <Form.Item label="หัวเรื่อง">
                  <Input value={slides[`${slideNumber}_header`] || ''} onChange={(e) => handleChange(e, slideNumber, 'header')} />
                </Form.Item>
                <Form.Item label="รายละเอียด">
                  <Input value={slides[`${slideNumber}_des`] || ''} onChange={(e) => handleChange(e, slideNumber, 'des')} />
                </Form.Item>
                <Form.Item label="ลิงก์">
                  <Input value={slides[`${slideNumber}_link`] || ''} onChange={(e) => handleChange(e, slideNumber, 'link')} />
                </Form.Item>
                <Button type="primary" onClick={() => handleSave(slideNumber)}>Save {slideNumber}</Button>
              </Form>
            </Card>
          );
        })}
      </div>
    </AdminProtected>
  );
};

export default SlideUploadComponent;
