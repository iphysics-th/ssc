import React, { useState, useEffect } from 'react';
import { Button, notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google'; // Import Google Login component
import { FcGoogle } from "react-icons/fc";
import { useLoginMutation, useSocialAuthMutation } from '../../redux/auth/authApi'; // Adjust path as necessary
import '../../css/Auth/socialsignin.css'; // Reuse the same CSS for consistency



const SocialSignIn = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    // Destructure the mutateAsync function from the useLoginMutation hook for async operation
    const [loginUser] = useLoginMutation();
    const [socialAuth, { isLoading }] = useSocialAuthMutation(); // Assuming you have a similar mutation for social auth



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

        <div className="social-auth-container">
    <div className="logo-container-mobile">
        <img src="/logo_ssc.svg" alt="Logo2" className="logo2" />
    </div>
    <div className="auth-panels">
        <div className="left-panel">
            <h3>ลงชื่อเข้าใช้โดย Google</h3>
            <h4>1. บุคคลากรที่มีอีเมล @skru.ac.th</h4>
            <h4>2. นักศึกษาที่มีอีเมล @parichat.skru.ac.th</h4>
            <h4>3. บุคคลทั่วไปที่มีบัญชี @gmail.com</h4>
        </div>
        <div className="right-panel">
            <div className="form-action-buttons">
            <Button onClick={googleLogin} icon={<FcGoogle size={25} />} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Sign in with Google
            </Button>
            </div>
        </div>
    </div>
</div>


    );
};

export default SocialSignIn;
