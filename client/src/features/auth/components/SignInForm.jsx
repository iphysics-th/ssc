import React, { useState, useEffect } from 'react';
import { Input, Button, notification } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google'; // Import Google Login component
import { Formik } from 'formik';
import { FcGoogle } from "react-icons/fc";
import * as Yup from 'yup';
import { useLoginMutation, useSocialAuthMutation } from '../authAPI';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import '../../../styles/variables.css';


const SignInSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Please input your Email!'),
  password: Yup.string().required('Please input your Password!'),
});

const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Destructure the mutateAsync function from the useLoginMutation hook for async operation
  const [loginUser] = useLoginMutation();
  const [socialAuth, { isLoading }] = useSocialAuthMutation(); // Assuming you have a similar mutation for social auth
  const [passwordShown, setPasswordShown] = useState(false);


  
  const onFinish = async (values) => {
    try {
      setLoading(true);
      // Adjusted to use email and password for the API call
      const userCredentials = {
        email: values.email, // Assuming the API expects an email field, adjust accordingly
        password: values.password,
      };
      // Call loginUser with userCredentials
      const result = await loginUser(userCredentials).unwrap();
      // Handle success state
      notification.success({
        message: 'LOGGED IN',
        description: 'คุณได้เข้าสู่ระบบ Sparkling Science Center',
      });
      // Navigate to the dashboard or another appropriate page
      navigate('/');
    } catch (error) {
      // Handle errors
      let errorMessage = 'An error occurred during sign-in';
      if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.error) {
        errorMessage = error.error;
      }
      notification.error({
        message: 'Sign-in Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };


  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }).then(res => res.json());

        // Now, send only the relevant information to your backend
        await socialAuth({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        }).unwrap();

        notification.success({
          message: 'Login Successful',
          description: 'You have successfully logged in with Google.',
        });
        navigate('/');
      } catch (error) {
        notification.error({
          message: 'Login Failed',
          description: `There was an error logging you in with Google: ${error.message}`,
        });
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      notification.error({
        message: 'Google Login Failed',
        description: 'There was an error logging you in with Google.',
      });
    },
});



  return (
    <div className="signup-page-container">
    <div className="signup-container">
      <div className="logo-container-mobile">
        <img src="/logo_ssc.svg" alt="Logo" className="logo" />
      </div>
      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={SignInSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await loginUser(values).unwrap();
            notification.success({
              message: 'LOGGED IN',
              description: 'คุณได้เข้าสู่ระบบ Sparkling Science Center',
            });
            navigate('/'); // Adjust as needed, e.g., to a dashboard page
          } catch (error) {
            let errorMessage = 'An error occurred during sign-in';
            if (error.data && error.data.message) {
              errorMessage = error.data.message;
            } else if (error.error) {
              errorMessage = error.error;
            }
            notification.error({
              message: 'Sign-in Failed',
              description: errorMessage,
            });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, touched, errors, isSubmitting }) => (
          <form onSubmit={handleSubmit} className="signup-form">
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              name="email"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.email}
              className={errors.email && touched.email ? 'input-error' : ''}
            />
            {errors.email && touched.email && <div className="input-feedback">{errors.email}</div>}

            <label htmlFor="password">Password</label>
            <Input.Password
              id="password"
              name="password"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.password}
              iconRender={visible => (visible ? <AiOutlineEye onClick={() => setPasswordShown(!passwordShown)} /> : <AiOutlineEyeInvisible onClick={() => setPasswordShown(!passwordShown)} />)}
              className={errors.password && touched.password ? 'input-error' : ''}
            />
            {errors.password && touched.password && <div className="input-feedback">{errors.password}</div>}

            <div className="form-action-buttons">
              <Button type="primary" htmlType="submit" disabled={isSubmitting} className="signup-btn">
                Sign In
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </div>
    <div className="social-auth-container">
    <div className="form-action-buttons">
              ลงชื่อเข้าใช้โดยบัญชี Gmail
              1. บุคคลากรที่มีอีเมล @skru.ac.th
              2. นักศึกษาที่มีอีเมล @parichat.skru.ac.th
              3. บุคคลทั่วไปที่มีบัญชี gmail
            </div>
            <div className="form-action-buttons">
              <Button startContent={<FcGoogle size={25} />} color='' onClick={googleLogin} > Sign in with Google</Button>
            </div>
            </div>
    </div>
  );
};

export default SignIn;
