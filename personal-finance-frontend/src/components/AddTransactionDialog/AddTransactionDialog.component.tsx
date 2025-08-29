import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "../../pages/Transactions/Transactions.page";
import { AppButton, AppDatePicker, AppSelect, AppTextField } from "../../stories";
import dayjs, { Dayjs } from "dayjs";
import { Field, Form } from "react-final-form";
import FormControl from "@mui/material/FormControl";
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type AddDialogProps = {
  open: boolean;
  onClose: () => void;
};

const CATEGORIES: Transaction["category"][] = [
  "Food",
  "Transport",
  "Entertainment",
  "Utilites",
  "Eucation",
  "Household",
  "Electronics",
  "Family",
  "Personal Care",
];

type TxnType = "income" | "expense";

const AddTransactionDialog: React.FC<AddDialogProps> = ({ open, onClose }) => {
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

    function saveTxns(txns: Transaction[]) {
      localStorage.setItem(LS_KEY, JSON.stringify(txns));
    }

    async function apiCreateTransaction(payload: Omit<Transaction, "id">): Promise<Transaction> {
      const all = loadTxns();
      const tx: Transaction = { id: crypto.randomUUID(), ...payload };
      const next = [tx, ...all];
      saveTxns(next);
      return tx;
    }

    const useCreateTransaction = ()=> {
        const qc = useQueryClient();
        return useMutation({
            mutationFn: apiCreateTransaction,
            onSuccess: (_newTx, _vars) => {
                // Invalidate all ranges (simplest)
                qc.invalidateQueries({ queryKey: ["transactions"] });
            },
        });
    }
    
    const createMutation = useCreateTransaction();
  const onSubmit = async (values: any) => {
    const payload = {
      type: values.type as TxnType,
      date: values.date as string,
      category: values.category as Transaction["category"],
      description: values.description?.trim() || "",
      amount: Number(values.amount),
    } as Omit<Transaction, "id">;

    await createMutation.mutateAsync(payload);
    onClose();
  };

  const validate = (values: any) => {
    const errors: Record<string, string> = {};
    if (!values.type) errors.type = "Required";
    if (!values.date) errors.date = "Required";
    if (!values.category) errors.category = "Required";
    if (!values.amount) errors.amount = "Required";
    else if (Number(values.amount) <= 0) errors.amount = "Must be > 0";
    return errors;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Add Transaction
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Form
        onSubmit={onSubmit}
        initialValues={{ type: "expense", date: dayjs().format("YYYY-MM-DD") }}
        validate={validate}
        render={({ handleSubmit, submitting, pristine }) => (
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {/* Type toggle as Select for simplicity */}
              <Field name={"type"}>
                  {({ input, meta }) => (
                    <FormControl fullWidth margin="normal">
                      <AppSelect
                        {...input}
                        options={["expense", "income"]}
                        label={"Type"}
                        value={input.value ?? ""}
                        onChange={(e) => input.onChange(e.target.value)}
                        required
                        error={meta.touched && meta.error ? true : false}
                      />
                    </FormControl>
                  )}
                </Field>

              <Field name={"date"}>
                    {({ input, meta }) => (
                        <AppDatePicker
                            label={"Date"}
                            value={input.value ? dayjs(input.value) : null}
                            onChange={(v) => input.onChange(v ? (v as Dayjs).format("YYYY-MM-DD") : "")}
                            slotProps={{
                                textField: {
                                fullWidth: true,
                                margin: "normal",
                                // required,
                                error: meta.touched && !!meta.error,
                                helperText: meta.touched && meta.error ? meta.error : "",
                                },
                            }}
                        />
                    )}
                </Field>

              <Field name={"category"}>
                    {({ input, meta }) => (
                    <FormControl fullWidth margin="normal">
                        <AppSelect
                        {...input}
                        options={CATEGORIES}
                        label={"Category"}
                        value={input.value ?? ""}
                        onChange={(e) => input.onChange(e.target.value)}
                        required
                        error={meta.touched && meta.error ? true : false}
                        />
                    </FormControl>
                    )}
                </Field>

              <Field name={"description"}>
                    {({ input, meta }) => (
                    <AppTextField
                        {...input}
                        label={"Description"}
                        required
                        fullWidth
                        margin="normal"
                        multiline
                        error={meta.touched && meta.error ? true : false}
                        helperText={meta.touched && meta.error ? meta.error : ""}
                    />
                    )}
                </Field>

              <Field name={"amount"}>
                {({ input, meta }) => (
                <AppTextField
                    {...input}
                    label={"Amount (INR)"}
                    type={"number"}
                    required
                    fullWidth
                    margin="normal"
                    error={meta.touched && meta.error ? true : false}
                    helperText={meta.touched && meta.error ? meta.error : ""}
                />
                )}
            </Field>
            </DialogContent>
            <DialogActions>
              <AppButton onClick={onClose} color="inherit">Cancel</AppButton>
              <AppButton type="submit" variant="contained" disabled={submitting || createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save"}
              </AppButton>
            </DialogActions>
          </form>
        )}
      />
    </Dialog>
  );
};

export default AddTransactionDialog;