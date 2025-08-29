import React from "react";
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { 
  AppTypography, 
  AppButton, 
  AppStack, 
  AppDatePicker,
} from "../../stories";
import dayjs, { Dayjs } from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import { useQuery } from "@tanstack/react-query";
import { AddTransactionDialog } from "../../components";

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

const LS_KEY = "pfa-txns";

function loadTxns(): Transaction[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function apiListTransactions(params: {
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}): Promise<Transaction[]> {
  // simulate server-side filtering
  const all = loadTxns();
  const { from, to } = params;
  return all.filter((t) => {
    const d = t.date;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  });
}

function useTransactions(from?: string, to?: string) {
  return useQuery({
    queryKey: ["transactions", { from, to }],
    queryFn: () => apiListTransactions({ from, to }),
    staleTime: 5 * 60 * 1000,
  });
}

const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

const DateRangeFilters: React.FC<{
  from?: string;
  to?: string;
  onChange: (v: { from?: string; to?: string }) => void;
}> = ({ from, to, onChange }) => {
  return (
    <AppStack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
      <Box sx={{ minWidth: 240 }}>
          <AppDatePicker
            label="From"
            value={from ? dayjs(from) : null}
            onChange={(v) => onChange({ from: v ? (v as Dayjs).format("YYYY-MM-DD") : undefined, to })}
          />
      </Box>
      <Box sx={{ minWidth: 240 }}>
          <AppDatePicker
            label="To"
            value={to ? dayjs(to) : null}
            onChange={(v) => onChange({ from, to: v ? (v as Dayjs).format("YYYY-MM-DD") : undefined })}
          />
      </Box>
    </AppStack>
  );
};

const TransactionsTable: React.FC<{ rows: Transaction[] }> = ({ rows }) => {
  return (
    <Paper variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Description</TableCell>
            <TableCell align="right">Amount (INR)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                No transactions found for this range.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>{t.date}</TableCell>
                <TableCell sx={{ textTransform: "capitalize" }}>{t.type}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>{t.description || "—"}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: t.type === "expense" ? "error.main" : "success.main" }}>
                  {t.type === "expense" ? `- ${formatINR(t.amount)}` : `+ ${formatINR(t.amount)}`}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Paper>
  );
};

const SummaryBar: React.FC<{ rows: Transaction[] }> = ({ rows }) => {
  const income = rows.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const net = income - expense;
  return (
    <AppStack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
      <AppTypography variant="body1"><strong>Total Income:</strong> {formatINR(income)}</AppTypography>
      <AppTypography variant="body1"><strong>Total Expense:</strong> {formatINR(expense)}</AppTypography>
      <AppTypography variant="body1"><strong>Net:</strong> {formatINR(net)}</AppTypography>
    </AppStack>
  );
};

const TransactionsPage: React.FC = () => {
  const [addOpen, setAddOpen] = React.useState(false);
  const [range, setRange] = React.useState<{ from?: string; to?: string }>({});

  const { data: rows = [], isLoading } = useTransactions(range.from, range.to);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AppStack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <AppTypography variant="h5">Transactions</AppTypography>
        <AppButton variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
          Add income / expense
        </AppButton>
      </AppStack>

      <AppStack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 2 }}>
        <DateRangeFilters from={range.from} to={range.to} onChange={setRange} />
        <Box sx={{ flexGrow: 1 }} />
        <SummaryBar rows={rows} />
      </AppStack>

      {isLoading ? (
        <AppTypography variant="body1">Loading…</AppTypography>
      ) : (
        <TransactionsTable rows={rows} />
      )}

      <AddTransactionDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </Container>
  );
};

export default TransactionsPage;
