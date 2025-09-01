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
import useToast from "../../hooks/toast";
import { useAuth } from "../../hooks/authHook";
import { AddTransactionDialog, DeleteConfDialog, TransactionsTable } from "../../components";
import { deleteTransaction, fetchTransactions, type Transaction } from "../../APIs/GetTransactions";
import { BUTTON, DATE_FORMATE, ROUTES, ROWSPERPAGEOPTOINS } from "../../Util/constants";
import { TRANSACTIONS } from "../../Util/Endpoint";
import { createQueryUrl, formatINR } from "../../Util/helper";

type DateRangeFiltersType = {
  from?: string;
  to?: string;
  onChange: (v: { from?: string; to?: string }) => void;
}

const DateRangeFilters = ({ from, to, onChange }: DateRangeFiltersType) => {
  const handleFromChange = (v: Dayjs | null) => {
  if (!v) {
      // clearing FROM keeps TO as-is
      onChange({ from: undefined, to });
      return;
    }
    const newFrom = v.startOf("day");
    // if TO exists and new FROM > TO, clamp TO up to FROM
    if (to && dayjs(to).isBefore(newFrom, "day")) {
      onChange({
        from: newFrom.format(DATE_FORMATE),
        to: newFrom.format(DATE_FORMATE),
      });
    } else {
      onChange({
        from: newFrom.format(DATE_FORMATE),
        to,
      });
    }
  };

const handleToChange = (v: Dayjs | null) => {
  if (!v) {
      // clearing TO keeps FROM as-is
      onChange({ from, to: undefined });
      return;
    }
    const newTo = v.endOf("day"); // endOf not strictly necessary if you store dates only
    // if FROM exists and TO < FROM, clamp FROM down to TO
    if (from && dayjs(from).isAfter(newTo, "day")) {
      onChange({
        from: newTo.format(DATE_FORMATE),
        to: newTo.format(DATE_FORMATE),
      });
    } else {
      onChange({
        from,
        to: newTo.format(DATE_FORMATE),
      });
    }
  };

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
          onChange={(v) => handleFromChange(v as Dayjs | null)}
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
          onChange={(v) => handleToChange(v as Dayjs | null)}
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
  const { logout } = useAuth();
  const { success, error: errort } = useToast();
  const [addOpen, setAddOpen] = React.useState(false);
  const [range, setRange] = React.useState<{ from?: string; to?: string }>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(ROWSPERPAGEOPTOINS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [change, setChange] = useState<boolean>(true);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [selected, setSelected] = useState<Transaction>();

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

  const handleConfirmDelete = () => {
    if(selected){
      deleteTransaction(selected.id).then(()=>{
        setConfirmOpen(false);
        setChange(prev => !prev);
        setSelected(undefined);
        success("Transaction deleted!");
      }).catch((err)=>{
        errort(err.message||"");
      });
    }
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

  const handleDeleteClick = (transaction: Transaction) => {
    setSelected(transaction);
    setConfirmOpen(true);
  }

  const handleEditClick = (transaction: Transaction) => {
    setSelected(transaction);
    setAddOpen(true);
  }

  const handleCloseTransactionDialog = () => {
    setAddOpen(false);
    setSelected(undefined);
  }

  const handleLogOut = () => {
    logout();
    navigate(ROUTES.login);
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
          <AppButton variant="contained" onClick={()=>handleLogOut()}>
            {BUTTON.LOGOUT}
          </AppButton>
        </AppStack>
      </AppStack>

      <AppStack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 2 }}>
        <DateRangeFilters from={range.from} to={range.to} onChange={setRange} />
        <AppBox sx={{ flexGrow: 1 }} />
        {/* <SummaryBar rows={transactions} /> */}
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
          onRowsPerPageChange={handleLimitChange}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}/>
      )}

      <AddTransactionDialog 
        open={addOpen} 
        onClose={handleCloseTransactionDialog} 
        onChange={setChange} 
        mode={selected!=undefined? "edit":"create"}
        initial={selected}/>
      
      <DeleteConfDialog 
        confirmOpen={confirmOpen}
        setConfirmOpen={setConfirmOpen} 
        handleConfirmDelete={handleConfirmDelete} />
    </AppContainer>
  );
};

export default TransactionsPage;

