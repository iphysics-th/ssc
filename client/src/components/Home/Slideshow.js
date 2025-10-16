import React, { useState, useEffect } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import '../../css/Home/Slideshow.css';
import axios from 'axios'; // Import Axios


const defaultContent = "ศูนย์บริการวิชาการคณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏสงขลา";
const backendUrl = process.env.REACT_APP_BACKEND_URL; // Ensure this is defined in your .env file

const Slideshow = () => {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    const slideNumbers = ['slide1', 'slide2', 'slide3', 'slide4', 'slide5']; // Adjust based on your actual slides
    const fetchSlides = async () => {
      const fetchPromises = slideNumbers.map(slideNumber =>
        axios.get(`${backendUrl}/api/slide/${slideNumber}`).then(response => {
          const { data } = response;
          return {
            title: data.slideHeader,
            image: `${backendUrl}/${data.slideImage}`, // Adjust if necessary
            content: data.slideDetail || defaultContent,
            link: data.slideLink, // Store the slide link
          };
        }).catch(error => {
          console.error(`Error fetching slide ${slideNumber}:`, error);
          return null; // Handle error or return default content
        })
      );

      Promise.all(fetchPromises).then(fetchedSlides => {
        setSlides(fetchedSlides.filter(slide => slide !== null)); // Filter out any failed fetches or null values
      });
    };

    fetchSlides();
  }, []);

  return (
    <div className="slideshow-container">
      <Carousel
        autoPlay
        showThumbs={false}
        showStatus={false}
        dynamicHeight={false}
        emulateTouch
        interval={5000}
      >
        {slides.map((slide, index) => (
          <div key={index} className="carousel-slide">
            <img src={slide.image} alt={`Slide ${index + 1}`} />
            <div className="slide-text-container">
              <div className="slide-text">
                <h2 className="slide-title">{slide.title}</h2>
                <h4 className="slide-content">{slide.content}</h4>
                {/* Add the Read More link */}
                {slide.link && (
                  <a href={slide.link} target="_blank" rel="noopener noreferrer" className="slide-read-more">
                    อ่านเพิ่มเติม คลิกเลย!
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

export default Slideshow;
