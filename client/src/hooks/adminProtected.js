import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from './useAdminAuth'; // Adjust the path as necessary
import { message } from 'antd';

export default function AdminProtected({ children }) {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAdminAuth();

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      // If the user is logged in but not an admin, show a notification
      message.error('To see this content, you need "Admin" status');
      navigate("/");
    } else if (!isAuthenticated) {
      // If the user is not logged in at all, redirect to sign-in
      navigate("/signin");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  return isAuthenticated && isAdmin ? <>{children}</> : null;
}
