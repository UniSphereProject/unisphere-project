import { createContext, useContext, useState } from "react";
import { cacheUserInfo, clearCachedUserInfo, getCachedUserInfo } from "../utils/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // On first load, check if a token/user already exist from a previous session
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(getCachedUserInfo());

  // `newUser` is the `user` object from the login response body
  // (it carries `role`, since the JWT itself doesn't).
  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    if (newUser) {
      cacheUserInfo(newUser);
      setUser(newUser);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    clearCachedUserInfo();
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    role: user?.role || null,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = () => useContext(AuthContext);