import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
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
import { fetchTransactions, type Transaction } from "../../APIs/GetTransactions";
import { useTransactions } from "../../hooks/useTransactions";



type Props = {
  rows: Transaction[];
  total: number;               // total matching rows from API
  page: number;                // 1-based page from API
  rowsPerPage: number;         // limit
  onPageChange: (page: number) => void;          // expects 1-based page
  onRowsPerPageChange: (rowsPerPage: number) => void;
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

const TransactionsTable = ({
  rows, total, page, rowsPerPage, onPageChange, onRowsPerPageChange
}:Props) => {
  const muiPage = Math.max(0, page - 1);
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
                <TableCell>{t.category ?? "—"}</TableCell>
                <TableCell>{t.description || "—"}</TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: t.type === "expense" ? "error.main" : "success.main" }}
                >
                  {t.type === "expense"
                    ? `- ${formatINR(Number(t.amount))}`
                    : `+ ${formatINR(Number(t.amount))}`}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={total}
        page={muiPage}
        rowsPerPage={rowsPerPage}
        onPageChange={(_e, newMuiPage) => onPageChange(newMuiPage + 1)} 
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </Paper>
  );
};

const SummaryBar = ({rows}: {rows:Transaction[]}) => {
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

const TransactionsPage = () => {
  const [addOpen, setAddOpen] = React.useState(false);
  const [range, setRange] = React.useState<{ from?: string; to?: string }>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // const { data: rows = [], isLoading } = useTransactions(range.from, range.to);
  const { data, isLoading } = useTransactions({
    user_id: 1,
    from: range.from,
    to: range.to,
    page,
    limit,
  });

  console.log(data);

  // useEffect(()=>{
  //   getTransactionData();
  // },[]);

  // const getTransactionData = ()=>{
  //   const data = {
  //       user_id: 1,
  //       page: 1,                // 1-based
  //       limit: 5
  //   }
  //   fetchTransactions(data).then((resp)=>{
  //     console.log(resp);
  //   }).catch(()=>{

  //   });
  // }

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
        <SummaryBar rows={data?.items||[]} />
      </AppStack>

      {isLoading ? (
        <AppTypography variant="body1">Loading…</AppTypography>
      ) : (
        <TransactionsTable rows={data?.items||[]} total={0} page={0} rowsPerPage={0} onPageChange={function (page: number): void {
            throw new Error("Function not implemented.");
          } } onRowsPerPageChange={function (rowsPerPage: number): void {
            throw new Error("Function not implemented.");
          } } />
      )}

      <AddTransactionDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </Container>
  );
};

export default TransactionsPage;
