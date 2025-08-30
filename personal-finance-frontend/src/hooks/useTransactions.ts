import { useQuery } from "@tanstack/react-query";
import { fetchTransactions, type ListParams, type TransactionsResponse } from "../APIs/GetTransactions";

export function useTransactions(params: ListParams) {
  const { user_id, from, to, type, category_id, page = 1, limit = 10 } = params;

  return useQuery<TransactionsResponse>({
    queryKey: ["transactions", { user_id, from, to, type, category_id, page, limit }],
    queryFn: () => fetchTransactions({ user_id, from, to, type, category_id, page, limit }),
    // keepPreviousData: true,  // smooth pagingss
    staleTime: 30_000,
  });
}
