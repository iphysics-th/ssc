import React from 'react';
import Slideshow from './components/Home/Slideshow';
import IntroComponent from './components/Home/IntroComponent'; // Import the IntroComponent
import AboutUs from './components/Home/AboutUs'; // Make sure this component is created
import ServicesHome from './components/Home/ServicesHome';

const Home = () => {
  return (
    <>
      <Slideshow />

      <IntroComponent 
        preIntro="เกี่ยวกับเรา"
        mainIntro="Who is 'SSC'"
      />
      <AboutUs />
      <IntroComponent 
        preIntro="Our services"
        mainIntro="บริการของเรา"
      />
      <ServicesHome />
      <IntroComponent 
        preIntro="What's new"
        mainIntro="ข่าวสารอัพเดท"
      />
      {/* Add more sections as needed */}
    </>
  );
};

export default Home;
