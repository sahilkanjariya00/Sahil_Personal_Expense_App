import type { AxiosResponse } from "axios";
import { get } from "../Util/axios";
import { HostEndpoint } from "../Util/Endpoint";

export type CategoryChartDataType = {
    labels: string[],
    values: number[],
    total: number
}

export type CategoryChartPropType = {
    user_id: number,
    from?: string,
    to?: string
}

export type CategoryMonthlyDataType = {
    labels: string[],
    values: number[],
    year: number
}

export type CategoryMonthlyPropType = {
    user_id: number,
    year: number
}

export const fetchCategoryChartData = (url: string): Promise<AxiosResponse<CategoryChartDataType>> => {
  return get(`${HostEndpoint}${url}`);
};


export const fetchMonthlyChartData = (url: string): Promise<AxiosResponse<CategoryMonthlyDataType>> => {
  return get(`${HostEndpoint}${url}`);
};
