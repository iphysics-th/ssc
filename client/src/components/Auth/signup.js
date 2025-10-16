import React, { useState, useEffect } from 'react';
import { Input, Button, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google'; // Import Google Login component
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useSignUpMutation, useSocialAuthMutation } from '../../redux/auth/authApi'; // Adjust this import
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import '../../css/Auth/signup.css'; // Assuming you create a Signup.css for styling

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

const SignupSchema = Yup.object().shape({
  username: Yup.string().required('Please input your Username!'),
  email: Yup.string().email('Invalid email').required('Please input your Email!'),
  password: Yup.string().min(6, 'Too Short!').required('Please input your Password!'),
  verification: Yup.string().required('Verification is required'),
});

const SignUp = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Use the signUp mutation here
  const [signUpUser, { isLoading }] = useSignUpMutation();
  const [socialAuth] = useSocialAuthMutation(); // Assuming you have a similar mutation for social auth
  const [passwordShown, setPasswordShown] = useState(false);
  const [randomNumber, setRandomNumber] = useState('');
  const [verificationInput, setVerificationInput] = useState('');


  useEffect(() => {
    // Generate a random number on component mount
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit random number
    setRandomNumber(randomNumber);
  }, []);

  const onSubmit = async (values, { setSubmitting }) => {
    // Assuming you've correctly configured the reCAPTCHA and have the site key
    const recaptchaToken = window.grecaptcha.getResponse();
    if (!recaptchaToken) {
      notification.error({
        message: 'Verification Failed',
        description: 'Please complete the reCAPTCHA challenge.',
      });
      setSubmitting(false);
      return;
    }

    try {
      const userCredentials = {
        ...values,
        recaptchaToken, // Include the reCAPTCHA token in the user credentials
      };
      await signUpUser(userCredentials).unwrap();
      notification.success({
        message: 'Signed Up Successfully',
        description: 'Welcome to the Sparkling Science Center!',
      });
      navigate('/signin');
    } catch (error) {
      // Handle sign-up error
    } finally {
      setSubmitting(false);
      window.grecaptcha.reset(); // Reset the reCAPTCHA after form submission
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Send the ID token directly to your backend
        await socialAuth({ token: response.id_token }).unwrap();

        notification.success({
          message: 'Login Successful',
          description: 'You have successfully logged in with Google.',
        });

        navigate('/');
      } catch (error) {
        notification.error({
          message: 'Login Failed',
          description: 'There was an error logging you in with Google.',
        });
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      notification.error({
        message: 'Google Login Failed',
        description: 'There was an error logging you in with Google.',
      });
    }
  });

  return (
    <div className="signup-container">
      <div className="logo-container-mobile">
        <img src="/logo_ssc.svg" alt="Logo" className="logo" />
      </div>
      <Formik
        initialValues={{ username: '', email: '', password: '', verification: '' }} // Include verification initial value
        validationSchema={SignupSchema}
        // Inside your Formik component
        onSubmit={async (values, { setSubmitting }) => {
          if (values.verification !== randomNumber.toString()) {
            // If verification fails, display an error and stop form submission
            notification.error({
              message: 'Verification Failed',
              description: 'The verification number does not match.',
            });
            setSubmitting(false);
            return;
          }

          try {
            const userCredentials = {
              username: values.username,
              email: values.email,
              password: values.password,

            };
            await signUpUser(userCredentials).unwrap();
            notification.success({
              message: 'Signed Up Successfully',
              description: 'Welcome to the Sparkling Science Center!',
            });
            navigate('/signin');
          } catch (error) {
            notification.error({
              message: 'Sign-up Failed',
              description: error.data?.message || 'An error occurred during sign-up',
            });
          } finally {
            setSubmitting(false);
          }
        }}

      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit} className="signup-form">
            {/* Username Input */}
            <label htmlFor="username">Username</label>
            <Input
              id="username"
              type="text"
              name="username"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.username}
              className={errors.username && touched.username ? 'error' : ''}
            />
            {errors.username && touched.username && <div className="input-feedback">{errors.username}</div>}
            {/* Email Input */}
            <label htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              name="email"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.email}
              className={errors.email && touched.email ? 'error' : ''}
            />
            {errors.email && touched.email && <div className="input-feedback">{errors.email}</div>}
            {/* Password Input */}
            <label htmlFor="password">Password</label>
            <Input
              id="password"
              type={passwordShown ? "text" : "password"}
              name="password"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.password}
              className={errors.password && touched.password ? 'error' : ''}
              suffix={
                passwordShown ? (
                  <AiOutlineEyeInvisible onClick={() => setPasswordShown(false)} />
                ) : (
                  <AiOutlineEye onClick={() => setPasswordShown(true)} />
                )
              }
            />
            {errors.password && touched.password && <div className="input-feedback">{errors.password}</div>}
            {/* Verification Number Field */}
            <label htmlFor="verification">รหัสยืนยัน</label>
            <div>กรุณากรอกรหัสยืนยัน: <strong>{randomNumber}</strong></div>
            <Input
              id="verification"
              type="text"
              name="verification"
              onChange={handleChange}
              onBlur={handleBlur}
              value={values.verification}
              className={errors.verification && touched.verification ? 'error' : ''}
            />
            {errors.verification && touched.verification && <div className="input-feedback">{errors.verification}</div>}

            {/* Submit Button */}
            <div className="form-action-buttons">
              <Button type="primary" htmlType="submit" disabled={isSubmitting} className="signup-btn">
                Sign Up
              </Button>
              <Button onClick={() => googleLogin()} className="social-login-buttons">
                Login with Google
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </div>
  );
};


export default SignUp;
