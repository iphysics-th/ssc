import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../../css/Home/Slideshow.css";

const BANNER_MS = 10000; // 10 s for main banner
const IMAGE_MS = 10000;  // 10 s per image
const FADE_MS = 1000;    // 1 s fade duration

// Import all images from /src/assets/images/slide
const heroModules = require.context(
  "../../assets/images/slide",
  false,
  /\.(jpe?g|png|webp)$/i
);
const heroFiles = heroModules.keys().map(
  (k) => heroModules(k).default || heroModules(k)
);

export default function Slideshow({
  videoFile = "ssc-banner.mp4",
  bannerFile = "ssc-banner.png",
  maxWidth = 1400,
}) {
  const [phase, setPhase] = useState("video"); // "video" | "banner" | "images"
  const [imageIndex, setImageIndex] = useState(0);
  const [videoEpoch, setVideoEpoch] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const videoRef = useRef(null);
  const phaseStart = useRef(Date.now());
  const intervalRef = useRef(null);

  // ----------------- Static paths -----------------
  const videoSrc = useMemo(() => `/slide/${videoFile}`, [videoFile]);
  const bannerSrc = useMemo(() => `/slide/${bannerFile}`, [bannerFile]);

  // Random rotation images
  const rotationImages = useMemo(() => {
    const shuffled = [...heroFiles].sort(() => Math.random() - 0.5);
    return shuffled;
  }, []);

  // ----------------- Play video -----------------
  useEffect(() => {
    if (phase === "video" && videoRef.current) {
      const vid = videoRef.current;
      vid.muted = true;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // fallback if autoplay blocked
          setTimeout(() => {
            setPhase("banner");
            phaseStart.current = Date.now();
          }, 100);
        });
      }
    }
  }, [phase]);

  // ----------------- Video end handler -----------------
  const handleVideoEnd = () => {
    setPhase("banner");
    setFadeKey((k) => k + 1); // trigger fade
    phaseStart.current = Date.now();
  };

  // ----------------- Autoplay logic -----------------
  useEffect(() => {
    if (phase === "video") return;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - phaseStart.current;

      if (phase === "banner" && elapsed >= BANNER_MS) {
        if (rotationImages.length > 0) {
          setPhase("images");
          setImageIndex(0);
          setFadeKey((k) => k + 1);
          phaseStart.current = now;
        } else {
          setPhase("video");
          setVideoEpoch((v) => v + 1);
          setFadeKey((k) => k + 1);
          phaseStart.current = now;
        }
      } else if (phase === "images" && elapsed >= IMAGE_MS) {
        const next = imageIndex + 1;
        if (next < rotationImages.length) {
          setImageIndex(next);
          setFadeKey((k) => k + 1);
          phaseStart.current = now;
        } else {
          setPhase("video");
          setVideoEpoch((v) => v + 1);
          setFadeKey((k) => k + 1);
          phaseStart.current = now;
        }
      }
    }, 500);

    return () => clearInterval(intervalRef.current);
  }, [phase, imageIndex, rotationImages.length]);

  // ----------------- Manual navigation -----------------
  const goPrev = () => {
    if (phase !== "images") return;
    const len = rotationImages.length;
    const next = imageIndex === 0 ? len - 1 : imageIndex - 1;
    setImageIndex(next);
    setFadeKey((k) => k + 1);
    phaseStart.current = Date.now();
  };

  const goNext = () => {
    if (phase !== "images") return;
    const len = rotationImages.length;
    const next = imageIndex === len - 1 ? 0 : imageIndex + 1;
    setImageIndex(next);
    setFadeKey((k) => k + 1);
    phaseStart.current = Date.now();
  };

  // ----------------- Render -----------------
  return (
    <div
      className="ssc-hero"
      style={{ maxWidth, margin: "0 auto", position: "relative" }}
    >
      {/* MEDIA FADE CONTAINER */}
      <div key={fadeKey} className="fade-container">
        {phase === "video" && (
          <video
            key={`video-${videoEpoch}`}
            ref={videoRef}
            src={videoSrc}
            className="ssc-hero__media fade-in"
            muted
            playsInline
            onEnded={handleVideoEnd}
            onError={handleVideoEnd}
          />
        )}

        {phase === "banner" && (
          <img
            src={bannerSrc}
            alt="Main banner"
            className="ssc-hero__media fade-in"
          />
        )}

        {phase === "images" && rotationImages.length > 0 && (
          <img
            src={rotationImages[imageIndex]}
            alt={`Slide ${imageIndex + 1}`}
            className="ssc-hero__media fade-in"
          />
        )}
      </div>

      {/* CONTROLS */}
      {phase === "images" && rotationImages.length > 1 && (
        <>
          <button
            className="ssc-hero__btn ssc-hero__btn--left"
            onClick={goPrev}
            aria-label="Previous"
          >
            <FaChevronLeft />
          </button>
          <button
            className="ssc-hero__btn ssc-hero__btn--right"
            onClick={goNext}
            aria-label="Next"
          >
            <FaChevronRight />
          </button>
        </>
      )}
    </div>
  );
}
