import React from "react";
import { useNavigate } from "react-router-dom";
import UserAuth from "../app/hooks";

export default function Protected({ children }) {
  const navigate = useNavigate();
  const isAuthenticated = UserAuth();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]);

  return isAuthenticated ? <>{children}</> : null;
}
