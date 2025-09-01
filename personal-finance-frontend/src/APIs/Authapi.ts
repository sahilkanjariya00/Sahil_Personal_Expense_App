import type { AxiosResponse } from "axios";
import api, { post } from "../Util/axios";
import { AUTH, HostEndpoint, LOGIN, REGISTER } from "../Util/Endpoint";

export type LoginResponseType = {
  access_token: string;
  token_type: "bearer";
};

export type LoginPropsType = {
    email: string,
    password: string
}

export type RegisterPayloadType = {
  email: string; 
  full_name: string; 
  password: string
}

// FastAPI's OAuth2PasswordRequestForm expects x-www-form-urlencoded: { username, password }
export const loginAPI = (pyaload: LoginPropsType): Promise<AxiosResponse<LoginResponseType>> => {
  const body = new URLSearchParams();
  body.append("username", pyaload.email);
  body.append("password", pyaload.password);

  return api.post<LoginResponseType>(`${AUTH}${LOGIN}`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export async function registerApi(payload: RegisterPayloadType) {
  return post(`${HostEndpoint}${AUTH}${REGISTER}`,payload);
}