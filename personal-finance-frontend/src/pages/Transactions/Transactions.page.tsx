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
  CloseIcon,
} from "../../stories";
import dayjs, { Dayjs } from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import { AddTransactionDialog } from "../../components";
import { fetchTransactions, type Transaction } from "../../APIs/GetTransactions";
import { ROUTES, ROWSPERPAGEOPTOINS } from "../../Util/constants";
import { TRANSACTIONS } from "../../Util/Endpoint";
import { createQueryUrl } from "../../Util/helper";
import { useNavigate } from "react-router-dom";



type Props = {
  rows: Transaction[];
  total: number;               
  page: number;                
  rowsPerPage: number;         
  onPageChange: (page: number) => void;        
  onRowsPerPageChange: (rowsPerPage: number) => void;
};

const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

const DateRangeFilters: React.FC<{
  from?: string;
  to?: string;
  onChange: (v: { from?: string; to?: string }) => void;
}> = ({ from, to, onChange }) => {

  const handleFromClear = ()=>{
    onChange({from: undefined, to});
  }

  const handleToClear = ()=>{
    onChange({from, to: undefined});
  }
  return (
    <AppStack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
      <Box sx={{ minWidth: 240 }}>
          <AppDatePicker
            label="From"
            value={from ? dayjs(from) : null}
            onChange={(v) => onChange({ from: v ? (v as Dayjs).format("YYYY-MM-DD") : undefined, to })}
            slotProps={{
              textField: {
                fullWidth: true,
                InputProps: from
                  ? {
                      endAdornment: (
                        <CloseIcon onChange={handleFromClear}/>
                      ),
                    }
                  : undefined,
              },
            }}
          />
      </Box>
      <Box sx={{ minWidth: 240 }}>
          <AppDatePicker
            label="To"
            value={to ? dayjs(to) : null}
            onChange={(v) => onChange({ from, to: v ? (v as Dayjs).format("YYYY-MM-DD") : undefined })}
            slotProps={{
              textField: {
                fullWidth: true,
                InputProps: to
                  ? {
                      endAdornment: (
                        <CloseIcon onChange={handleToClear}/>
                      ),
                    }
                  : undefined,
              },
            }}
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
        rowsPerPageOptions={ROWSPERPAGEOPTOINS}
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
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = React.useState(false);
  const [range, setRange] = React.useState<{ from?: string; to?: string }>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ROWSPERPAGEOPTOINS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [change, setChange] = useState<boolean>(true);

  useEffect(()=>{
    setIsLoading(true);
    callTransactions();
  },[page,limit,range, change])

  const callTransactions = () => {
    const params:any = {
      user_id: 1,
      page,
      limit,
    }
    if(range.from){
      params.from = range.from
    }
    if(range.to){
      params.to = range.to;
    }

    const url = createQueryUrl(TRANSACTIONS,params);

    fetchTransactions(url).then((val)=>{
      setIsLoading(false);
      setTransactions(val.data.items);
      setTotalRecords(val.data.total);
    }).catch(()=>{
      setIsLoading(false);
    });
  }

  const handlePageChange = (page:number) =>{
    setPage(page);
  }

  const handleLimitChange = (limit:number) =>{
    setLimit(limit);
  }


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AppStack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <AppTypography variant="h5">Transactions</AppTypography>
        <AppStack direction="row" spacing={1}>
          <AppButton
            variant="outlined"
            onClick={() => navigate(ROUTES.addReceiptData)}
          >
            Import from Receipt
          </AppButton>
          <AppButton variant="outlined" onClick={() => navigate("/summary")}>
            Go to Summary
          </AppButton>
          <AppButton variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Add income / expense
          </AppButton>
        </AppStack>
      </AppStack>

      <AppStack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 2 }}>
        <DateRangeFilters from={range.from} to={range.to} onChange={setRange} />
        <Box sx={{ flexGrow: 1 }} />
        <SummaryBar rows={transactions} />
      </AppStack>

      {isLoading ? (
        <AppTypography variant="body1">Loading…</AppTypography>
      ) : (
        <TransactionsTable 
          rows={transactions} 
          total={totalRecords} 
          page={page} 
          rowsPerPage={limit} 
          onPageChange={handlePageChange} 
          onRowsPerPageChange={handleLimitChange} />
      )}

      <AddTransactionDialog open={addOpen} onClose={() => setAddOpen(false)} onChange={setChange}/>
    </Container>
  );
};

export default TransactionsPage;

