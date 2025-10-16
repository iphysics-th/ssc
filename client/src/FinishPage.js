import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { jsPDF } from "jspdf";

const FinishPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Logic to generate PDF
    try {
      const doc = new jsPDF();
      // Add content to the PDF using doc.text(...)
      // For example: doc.text("Reservation Completed", 10, 10);

      // Save the PDF
      doc.save("ReservationSummary.pdf");

      // Show a success message
      message.success('Reservation completed and PDF generated.');
    } catch (error) {
      message.error('Failed to generate PDF.');
    }

    // Navigate to a different page or show a completion message
    navigate('/');
  }, [navigate]);

  return (
    <div>
      <h2>Finishing Reservation...</h2>
      {/* You can add additional content or styling here */}
    </div>
  );
};

export default FinishPage;
