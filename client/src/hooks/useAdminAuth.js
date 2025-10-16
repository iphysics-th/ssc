import { useSelector } from "react-redux";

const useAdminAuth = () => {
  const { user } = useSelector((state) => state.auth);
  // Check if the user's roles array includes 'admin'
  const isAdmin = user && user.roles && user.roles.includes("admin");
  return { isAuthenticated: !!user, isAdmin };
};

export default useAdminAuth;
