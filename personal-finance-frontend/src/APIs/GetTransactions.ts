import type { AxiosResponse } from "axios";
import api from "../Util/axios";
import { HostEndpoint, TRANSACTIONS } from "../Util/Endpoint";

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
};

export type TransactionsResponse = {
  items: Transaction[];
  page: number;                 // 1-based
  limit: number;                // page size
  total: number;
};

export type ListParams = {
  user_id: number;
  from?: string;                // "YYYY-MM-DD"
  to?: string;                  // "YYYY-MM-DD"
  type?: TxnType;
  category_id?: number;
  page?: number;                // 1-based
  limit?: number;               // 10/20/50/100
};

export async function fetchTransactions(params: ListParams) {
  const { data } = await api.get<TransactionsResponse>("/transactions", { params });
  return data;
}