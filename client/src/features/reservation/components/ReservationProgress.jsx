import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"
import "../../../css/Reservation/ReservationProgress.css"

import ReservationSetup from "../../../components/Reservation/ReservationSetup"
import SelectDate from "../pages/SelectDate"
import SelectSubjects from "../pages/SelectSubjects"
import UserInfo from "../pages/UserInfo"
import ReviewSummary from "../pages/ReviewSummary"
import Success from "../pages/Success"

const steps = [
  { title: "รายละเอียดอบรม", Component: ReservationSetup },
  { title: "เลือกวันที่", Component: SelectDate },
  { title: "เลือกวิชา", Component: SelectSubjects },
  { title: "ข้อมูลผู้จอง", Component: UserInfo },
  { title: "ตรวจสอบข้อมูล", Component: ReviewSummary },
  { title: "เสร็จสิ้น", Component: Success },
]

const clampStep = (value) => Math.min(Math.max(value, 0), steps.length - 1)

export default function ReservationProgress({ initialStep = 0 }) {
  const [currentStep, setCurrentStep] = useState(clampStep(initialStep))
  const [direction, setDirection] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const stepRefs = useRef(steps.map(() => React.createRef()))

  useEffect(() => {
    setCurrentStep(clampStep(initialStep))
    setDirection(0)
  }, [initialStep])

  const goToStep = (target) => {
    const nextIndex = clampStep(target)
    if (nextIndex === currentStep) return
    setDirection(nextIndex > currentStep ? 1 : -1)
    setCurrentStep(nextIndex)
  }

  const invokeNext = async () => {
    if (isTransitioning || currentStep >= steps.length - 1) return
    setIsTransitioning(true)
    try {
      const ref = stepRefs.current[currentStep]?.current
      if (ref?.next) {
        await ref.next()
      } else {
        goToStep(currentStep + 1)
      }
    } finally {
      setIsTransitioning(false)
    }
  }

  const invokePrev = async () => {
    if (isTransitioning || currentStep === 0) return
    setIsTransitioning(true)
    try {
      const ref = stepRefs.current[currentStep]?.current
      if (ref?.prev) {
        await ref.prev()
      } else {
        goToStep(currentStep - 1)
      }
    } finally {
      setIsTransitioning(false)
    }
  }

  const progressPercent = ((currentStep + 1) / steps.length) * 100
  const StepComponent = steps[currentStep].Component
  const activeRef = stepRefs.current[currentStep]

  return (
    <div className="reservation-wrapper">
      <div className="progress-bar-container">
        <div className="progress-label">
          ขั้นตอน {currentStep + 1} / {steps.length} — {steps[currentStep].title}
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="card-stack-container">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="reservation-card"
          >
            <StepComponent
              ref={activeRef}
              onNext={() => goToStep(currentStep + 1)}
              onPrev={() => goToStep(currentStep - 1)}
              embedded
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="card-nav-buttons">
        <button
          className="nav-btn prev"
          onClick={invokePrev}
          disabled={currentStep === 0 || isTransitioning}
        >
          <FaArrowLeft /> ย้อนกลับ
        </button>
        <button
          className="nav-btn next"
          onClick={invokeNext}
          disabled={currentStep === steps.length - 1 || isTransitioning}
        >
          ถัดไป <FaArrowRight />
        </button>
      </div>
    </div>
  )
}

const cardVariants = {
  enter: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 120 : -120,
    rotateY: direction > 0 ? 8 : -8,
    scale: 0.96,
    filter: "blur(6px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    rotateY: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.45,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction < 0 ? 120 : -120,
    rotateY: direction < 0 ? 8 : -8,
    scale: 0.96,
    filter: "blur(6px)",
  }),
}
