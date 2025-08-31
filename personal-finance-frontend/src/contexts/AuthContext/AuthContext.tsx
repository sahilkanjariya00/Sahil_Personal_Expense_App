import React from "react";
import { clearToken, getToken, isLoggedIn, setToken } from "../../Util/helper";

type AuthContextType = {
  token: string | null;
  login: (access_token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

export const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTok] = React.useState<string | null>(getToken());

  const login = (access_token: string) => {
      setToken(access_token);
      setTok(access_token);
  };


  const logout = () => {
    clearToken();
    setTok(null);
  };

  const value: AuthContextType = {
    token,
    login,
    logout,
    isAuthenticated: isLoggedIn(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
