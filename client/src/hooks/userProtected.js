import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserAuth from "../app/hooks";
import { useLoadUserQuery } from "../features/auth/authApiSlice";

export default function Protected({ children }) {
  const navigate = useNavigate();
  const isAuthenticated = UserAuth();
  const { isLoading, isFetching } = useLoadUserQuery(undefined, {
    skip: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isFetching && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, isLoading, isFetching, navigate]);

  if (isLoading || isFetching) {
    return null;
  }

  return isAuthenticated ? <>{children}</> : null;
}
