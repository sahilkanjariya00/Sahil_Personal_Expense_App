import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import AddIcon from "@mui/icons-material/Add";
import {
  AppTypography,
  AppButton,
  AppStack,
  AppDatePicker,
  CloseIcon,
  AppContainer,
  AppBox,
} from "../../stories";
import { AddTransactionDialog, TransactionsTable } from "../../components";
import { fetchTransactions, type Transaction } from "../../APIs/GetTransactions";
import { BUTTON, DATE_FORMATE, ROUTES, ROWSPERPAGEOPTOINS } from "../../Util/constants";
import { TRANSACTIONS } from "../../Util/Endpoint";
import { createQueryUrl, formatINR } from "../../Util/helper";

type DateRangeFiltersType = {
  from?: string;
  to?: string;
  onChange: (v: { from?: string; to?: string }) => void;
}

const DateRangeFilters = ({ from, to, onChange }: DateRangeFiltersType) => {
  const handleFromClear = () => {
    onChange({ from: undefined, to });
  }

  const handleToClear = () => {
    onChange({ from, to: undefined });
  }

  return (
    <AppStack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
      <AppBox sx={{ minWidth: 240 }}>
        <AppDatePicker
          label="From"
          value={from ? dayjs(from) : null}
          onChange={(v) => onChange({ from: v ? (v as Dayjs).format(DATE_FORMATE) : undefined, to })}
          slotProps={{
            textField: {
              fullWidth: true,
              InputProps: from
                ? {
                  endAdornment: (
                    <CloseIcon onChange={handleFromClear} />
                  ),
                }
                : undefined,
            },
          }}
        />
      </AppBox>
      <AppBox sx={{ minWidth: 240 }}>
        <AppDatePicker
          label="To"
          value={to ? dayjs(to) : null}
          onChange={(v) => onChange({ from, to: v ? (v as Dayjs).format(DATE_FORMATE) : undefined })}
          slotProps={{
            textField: {
              fullWidth: true,
              InputProps: to
                ? {
                  endAdornment: (
                    <CloseIcon onChange={handleToClear} />
                  ),
                }
                : undefined,
            },
          }}
        />
      </AppBox>
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

  useEffect(() => {
    setIsLoading(true);
    callTransactions();
  }, [page, limit, range, change])

  const callTransactions = () => {
    const params: any = {
      user_id: 1,
      page,
      limit,
    }
    if (range.from) {
      params.from = range.from
    }
    if (range.to) {
      params.to = range.to;
    }

    const url = createQueryUrl(TRANSACTIONS, params);

    fetchTransactions(url).then((val) => {
      setIsLoading(false);
      setTransactions(val.data.items);
      setTotalRecords(val.data.total);
    }).catch(() => {
      setIsLoading(false);
    });
  }

  const SummaryBar = ({ rows }: { rows: Transaction[] }) => {
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

  const handlePageChange = (page: number) => {
    setPage(page);
  }

  const handleLimitChange = (limit: number) => {
    setLimit(limit);
  }

  return (
    <AppContainer maxWidth="lg" sx={{ py: 4 }}>
      <AppStack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <AppTypography variant="h5">Transactions</AppTypography>
        <AppStack direction="row" spacing={1}>
          <AppButton
            variant="outlined"
            onClick={() => navigate(ROUTES.addReceiptData)}
          >
            {BUTTON.IMPORT_FROM_RECEIPT}
          </AppButton>
          <AppButton variant="outlined" onClick={() => navigate("/summary")}>
            {BUTTON.GO_TO_SUMMARY}
          </AppButton>
          <AppButton variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            {BUTTON.ADD_INCOME_EXPENSE}
          </AppButton>
        </AppStack>
      </AppStack>

      <AppStack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 2 }}>
        <DateRangeFilters from={range.from} to={range.to} onChange={setRange} />
        <AppBox sx={{ flexGrow: 1 }} />
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
          onRowsPerPageChange={handleLimitChange}/>
      )}

      <AddTransactionDialog open={addOpen} onClose={() => setAddOpen(false)} onChange={setChange} />
    </AppContainer>
  );
};

export default TransactionsPage;

