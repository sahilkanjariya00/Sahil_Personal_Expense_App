import type { AxiosResponse } from "axios"
import { post } from "../Util/axios"
import { HostEndpoint, RECEIPT } from "../Util/Endpoint"

export type ReceiptTransactionType = {
    type: string,
    date: string | null,                          
    description: string,
    amount: number,
    confidence: { amount: number, description: number, date: number }
}

export type ReceiptDataType = {
    transactions: ReceiptTransactionType[],
    raw_json: string,
    diagnostics:{
        source: string,
        date_detected: string,
        items: number,
        total: number
    }
}

export const getReceiptTransaction = (payload: FormData): Promise<AxiosResponse<ReceiptDataType>> => {
    return post(`${HostEndpoint}${RECEIPT}`, payload);
};
