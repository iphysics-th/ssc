// src/hooks/userAuth.js
import { useSelector } from "react-redux";

const useAuth = () => {
  const { user } = useSelector((state) => state.auth);
  return !!user; // Returns true if user exists, false otherwise
};

export default useAuth;
