import React from 'react';
import { BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import { Layout } from 'antd';
import ReservationSetup from './components/Reservation/ReservationSetup';
import DateSelection from './components/Reservation/DateSelection';
import SubjectSelection from './components/Reservation/SubjectSelection';
import UserInfoForm from './components/Reservation/UserInfoForm';
import SummaryPage from './components/Reservation/SummaryPage';
import Services from './components/Services/Services';
import STEMSSCDetail from './components/Services/STEMSSC';
import ReserveCheck from './components/Reservation/ReserveCheck'; // Import the ReserveCheck component
import { FormDataProvider } from './contexts/FormDataContext';
import Divisions from './components/Lecturers/Divisions';
import DivisionDetail from './components/Lecturers/DivisionDetail';
import LecturerProfile from './components/Lecturers/lecturerProfile';
import SignUp from './components/Auth/signup';
import SignIn from './components/Auth/signin';
import SocialSignIn from './components/Auth/socialsignin';
import SlideUploadComponent from './components/Admin/slideUpload';
import ReservationTable from './components/Admin/reservationData';
import StepNavigation from './components/Reservation/StepNavigation'; // Adjust the path as needed
import EduResearch from './components/Page/EduResearch/EduResearch';
import Dashboard from './components/Dashboard/Dashboard';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import Home from './Home';
import './App.css';


// Placeholder components for new pages
const Instrument = () => <div>Instrument Page Content</div>;
const ContactUs = () => <div>Contact Us Page Content</div>;


const { Content} = Layout;


const App = () => {

  return (
    <Router>
      <FormDataProvider>
      <AppHeader />
        <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Content style={{ padding: '0 0px', marginTop: 20, marginBottom: 20 }}>
            <StepNavigation />
            <Routes>
            <Route path="/" element={<Home />} />
              <Route path="/service" element={<Services />} />
              <Route path="/divisions" element={<Divisions />} />
              <Route path="/divisions/:division_en" element={<DivisionDetail />} />
              <Route path="/divisions/:division_en/:name_en" element={<LecturerProfile />} />
              <Route path="/instrument" element={<Instrument />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/time" element={<ReservationSetup />} />
              <Route path="/dates" element={<DateSelection />} />
              <Route path="/subjects" element={<SubjectSelection />} />
              <Route path="/user-info" element={<UserInfoForm />} />
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reservecheck" element={<ReserveCheck />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SocialSignIn />} />
              <Route path="/adminsignin" element={<SignIn />} />
              <Route path="/slideupload" element={<SlideUploadComponent />} />
              <Route path="/reservation-table" element={<ReservationTable />} />
              <Route path="/stem-ssc" element={<STEMSSCDetail />} />
              <Route path="/edu-research" element={<EduResearch />} />
            </Routes>
          </Content>
          <AppFooter />
        </Layout>
      </FormDataProvider>
    </Router>
  );
};

export default App;
