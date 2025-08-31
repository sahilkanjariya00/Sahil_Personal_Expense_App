import type { AxiosResponse } from "axios";
import api from "../Util/axios";

export type LoginResponseType = {
  access_token: string;
  token_type: "bearer";
};

export type LoginPropsType = {
    email: string,
    password: string
}

// FastAPI's OAuth2PasswordRequestForm expects x-www-form-urlencoded: { username, password }
export const loginAPI = (pyaload: LoginPropsType): Promise<AxiosResponse<LoginResponseType>> => {
const body = new URLSearchParams();
  body.append("username", pyaload.email);
  body.append("password", pyaload.password);
  return api.post<LoginResponseType>("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};