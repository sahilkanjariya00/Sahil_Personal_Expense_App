import type { AxiosResponse } from "axios";
import { del, get, patch, post } from "../Util/axios";
import { BULK, HostEndpoint, TRANSACTIONS } from "../Util/Endpoint";

type TxnType = "income" | "expense";

export type Transaction = {
  id: string;
  type: TxnType;
  date: string; // ISO (YYYY-MM-DD)
  category:
  | "Food"
  | "Transport"
  | "Entertainment"
  | "Utilites"
  | "Eucation"
  | "Household"
  | "Electronics"
  | "Family"
  | "Personal Care";
  description: string;
  amount: number; // INR
  category_id: number;
};

export type TransactionsResponse = {
  items: Transaction[];
  page: number; // 1-based
  limit: number; // page size
  total: number;
};

export type ListParams = {
  user_id: number;
  from?: string; // "YYYY-MM-DD"
  to?: string; // "YYYY-MM-DD"
  type?: TxnType;
  category_id?: number;
  page?: number; // 1-based
  limit?: number; // 10/20/50/100
};

export type CreateTransactionIn = {
  user_id: number;
  type: "expense" | "income";
  date: string; // "YYYY-MM-DD"
  category_id?: number; // REQUIRED
  description?: string;
  amount?: string; // rupees string e.g. "250.00"  (or use amount_minor instead)
  amount_minor?: number; // paise e.g. 25000
};

export type CreateTransactionResponse = {
  id: number;
  type: "expense" | "income";
  date: string;
  category_id: number;
  description: string;
  amount_minor: number;
  user_id: number;
  created_at: string;
  updated_at: string;
};

export type BulkCreateTransactionIn = {
  items: CreateTransactionIn[];
}

export type UpdateTransactionPropsType = {
  type?: "expense" | "income";
  date?: string; // "YYYY-MM-DD"
  category_id?: number; // REQUIRED
  description?: string;
  amount?: string; // rupees string e.g. "250.00"  (or use amount_minor instead)
  amount_minor?: number; 
}

export const fetchTransactions = (url: string): Promise<AxiosResponse<TransactionsResponse>> => {
  return get(`${HostEndpoint}${url}`);
};

export const createTransaction = (pyaload: CreateTransactionIn): Promise<AxiosResponse<CreateTransactionResponse>> => {
  return post(`${HostEndpoint}${TRANSACTIONS}`, pyaload);
};

export const createBulkTransaction = (pyaload: CreateTransactionIn[]): Promise<AxiosResponse<CreateTransactionResponse[]>> => {
  return post(`${HostEndpoint}${TRANSACTIONS}${BULK}`, pyaload);
};


export const updateTransaction = (pyaload: UpdateTransactionPropsType): Promise<AxiosResponse<CreateTransactionResponse>> => {
  return patch(`${HostEndpoint}${TRANSACTIONS}${BULK}`, pyaload);
};

export const deleteTransaction = (transactionId: string): Promise<AxiosResponse<any>> => {
  return del(`${HostEndpoint}${TRANSACTIONS}/${transactionId}`);
};