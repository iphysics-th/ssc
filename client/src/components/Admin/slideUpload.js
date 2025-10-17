import React, { useEffect, useState } from 'react';
import { Button, Input, Form, message, Card } from 'antd';
import AdminProtected from "../../hooks/adminProtected";
import '../../css/Admin/slideUpload.css';
import {
  useLazyGetSlideQuery,
  useUpdateSlideMutation,
} from '../../features/slideshow/slideshowApiSlice';

const SlideUploadComponent = () => {
  const [slides, setSlides] = useState({});
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const [fetchSlide] = useLazyGetSlideQuery();
  const [updateSlide] = useUpdateSlideMutation();

  useEffect(() => {
    let isMounted = true;

    const fetchAllSlides = async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, async (_, index) => {
          const slideNumber = `slide${index + 1}`;
          try {
            const data = await fetchSlide(slideNumber).unwrap();
            return { slideNumber, data };
          } catch (error) {
            console.error(`Failed to fetch data for ${slideNumber}:`, error);
            return { slideNumber, data: null };
          }
        })
      );

      if (!isMounted) {
        return;
      }

      setSlides((prev) => {
        const nextState = { ...prev };
        results.forEach(({ slideNumber, data }) => {
          nextState[`${slideNumber}_header`] = data?.slideHeader || '';
          nextState[`${slideNumber}_des`] = data?.slideDetail || '';
          nextState[`${slideNumber}_link`] = data?.slideLink || '';
          nextState[`${slideNumber}_imagePath`] = data?.slideImage
            ? `${backendUrl}/${data.slideImage}`
            : null;
        });
        return nextState;
      });
    };

    fetchAllSlides();

    return () => {
      isMounted = false;
    };
  }, [backendUrl, fetchSlide]);

  const handleFileChange = (event, slideNumber) => {
    const file = event.target.files?.[0];
    if (file) {
      setSlides((prev) => ({
        ...prev,
        [`${slideNumber}_image`]: [file],
      }));
    }
  };

  const handleChange = (e, slideNumber, type) => {
    const { value } = e.target;
    setSlides((prev) => ({
      ...prev,
      [`${slideNumber}_${type}`]: value,
    }));
  };

  const refreshSlide = async (slideNumber) => {
    try {
      const data = await fetchSlide(slideNumber).unwrap();
      setSlides((prev) => ({
        ...prev,
        [`${slideNumber}_header`]: data?.slideHeader || '',
        [`${slideNumber}_des`]: data?.slideDetail || '',
        [`${slideNumber}_link`]: data?.slideLink || '',
        [`${slideNumber}_imagePath`]: data?.slideImage ? `${backendUrl}/${data.slideImage}` : null,
        [`${slideNumber}_image`]: undefined,
      }));
    } catch (error) {
      console.error(`Failed to refresh ${slideNumber}:`, error);
    }
  };

  const handleSave = async (slideNumber) => {
    const formData = new FormData();
    if (slides[`${slideNumber}_image`]?.[0]) {
      formData.append('image', slides[`${slideNumber}_image`][0]);
    }
    formData.append('slideHeader', slides[`${slideNumber}_header`] || '');
    formData.append('slideDetail', slides[`${slideNumber}_des`] || '');
    formData.append('slideLink', slides[`${slideNumber}_link`] || '');

    try {
      const response = await updateSlide({ slideNumber, formData }).unwrap();
      if (response?.success && response?.imageFileName) {
        message.success(`Slide ${slideNumber} and image ${response.imageFileName} updated successfully`);
      } else {
        message.success(`Slide ${slideNumber} updated successfully`);
      }
      await refreshSlide(slideNumber);
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
                    <img
                      src={slides[`${slideNumber}_imagePath`]}
                      alt={`Slide ${index + 1}`}
                      className="slide-image"
                    />
                  )}
                  <input
                    type="file"
                    name="image"
                    onChange={(event) => handleFileChange(event, slideNumber)}
                  />
                </Form.Item>
                <Form.Item label="หัวเรื่อง">
                  <Input
                    value={slides[`${slideNumber}_header`] || ''}
                    onChange={(e) => handleChange(e, slideNumber, 'header')}
                  />
                </Form.Item>
                <Form.Item label="รายละเอียด">
                  <Input
                    value={slides[`${slideNumber}_des`] || ''}
                    onChange={(e) => handleChange(e, slideNumber, 'des')}
                  />
                </Form.Item>
                <Form.Item label="ลิงก์">
                  <Input
                    value={slides[`${slideNumber}_link`] || ''}
                    onChange={(e) => handleChange(e, slideNumber, 'link')}
                  />
                </Form.Item>
                <Button type="primary" onClick={() => handleSave(slideNumber)}>
                  Save {slideNumber}
                </Button>
              </Form>
            </Card>
          );
        })}
      </div>
    </AdminProtected>
  );
};

export default SlideUploadComponent;
