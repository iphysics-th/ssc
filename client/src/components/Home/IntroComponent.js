import React from 'react';
import '../../css/Home/IntroComponent.css'; // Import the CSS for styling

const IntroComponent = ({ preIntro, mainIntro }) => {
  return (
    <div className="intro-container">
      <h3 className="pre-intro">{preIntro}</h3>
      <h1 className="main-intro">{mainIntro}</h1>
    </div>
  );
};

export default IntroComponent;
