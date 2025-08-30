import type { AxiosResponse } from "axios";
import  { get } from "../Util/axios";
import {  HostEndpoint } from "../Util/Endpoint";

export type Category = { id: number; name: string; user_id?: number | null };

export type CategoryPropsType = {include_global: boolean, user_id?: number, q?: string}

export const fetchCategories = (url: string): Promise<AxiosResponse<Category[]>> => {
  return get(`${HostEndpoint}${url}`);
};
