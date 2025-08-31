import React, { useEffect, useState } from "react";
import { Field, Form } from "react-final-form";
import FormControl from "@mui/material/FormControl";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import useToast from "../../hooks/toast";
import { AppButton, AppDatePicker, AppIconButton, AppSelect, AppTextField } from "../../stories";
import { createTransaction, type CreateTransactionIn } from "../../APIs/GetTransactions";
import { fetchCategories, type CategoryPropsType } from "../../APIs/GetCategories";
import { CATEGORIES } from "../../Util/Endpoint";
import { createQueryUrl } from "../../Util/helper";
import { BUTTON, DATE_FORMATE, EXPENSE_TYPE, REQUIRED } from "../../Util/constants";

type AddDialogProps = {
  open: boolean;
  onClose: () => void;
  onChange: React.Dispatch<React.SetStateAction<boolean>>;
};

type Option = string | { label: string; value: any };

type TxnType = "income" | "expense";

const AddTransactionDialog = ({ open, onClose, onChange }: AddDialogProps) => {
  const {success, error: errort} = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Option[]>([]);

  useEffect(() => {
    callCategories();
  }, [])

  const callCategories = () => {
    const params: CategoryPropsType = {
      include_global: true,
    }

    const url = createQueryUrl(CATEGORIES, params);
    fetchCategories(url).then((val) => {
      const newCategories: Option[] = val.data.map((cat: any) => ({
        value: cat.id,
        label: cat.name,
      }));

      setCategories(newCategories);
    }).catch((err) => {
      errort(err.message||"Error");
    });
  }

  const callCreateTransaction = (payload: CreateTransactionIn) => {
    createTransaction(payload).then(() => {
      setLoading(false);
      onChange(prev => !prev);
      success("Transaction saved!");
      onClose();
    }).catch((err) => {
      errort(err.message||"Error");
      setLoading(false);
    });
  }

  const onSubmit = async (values: any) => {
    setLoading(true);
    const payload: CreateTransactionIn = {
      type: values.type as TxnType,
      date: values.date as string,
      description: values.description?.trim() || "",
      amount_minor: Number(values.amount * 100),
      user_id: 1,
    }

    if (values.type == "expense" && values.category >= 0) {
      payload.category_id = values.category;
    }

    callCreateTransaction(payload);
  };

  const validate = (values: any) => {
    const errors: Record<string, string> = {};
    if (!values.type) errors.type = REQUIRED;
    if (!values.date) errors.date = REQUIRED;
    if (!values.category && values.type == "expense") errors.category = REQUIRED;
    if (!values.amount) errors.amount = REQUIRED;
    else if (Number(values.amount) <= 0) errors.amount = "Must be > 0";
    return errors;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Add Transaction
        <AppIconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8 }} aria-label="close">
          <CloseIcon />
        </AppIconButton>
      </DialogTitle>
      <Form
        onSubmit={onSubmit}
        initialValues={{ type: "expense", date: dayjs().format(DATE_FORMATE) }}
        validate={validate}
        render={({ handleSubmit, submitting, values }) => (
          <form onSubmit={handleSubmit} noValidate>
            <DialogContent>
              {/* Type toggle as Select for simplicity */}
              <Field name={"type"}>
                {({ input, meta }) => (
                  <FormControl fullWidth margin="normal">
                    <AppSelect
                      {...input}
                      required
                      label={"Type"}
                      options={EXPENSE_TYPE}
                      value={input.value ?? ""}
                      onChange={(e) => input.onChange(e.target.value)}
                      error={meta.touched && meta.error ? true : false}
                    />
                  </FormControl>
                )}
              </Field>

              <Field name={"date"}>
                {({ input, meta }) => (
                  <AppDatePicker
                    label={"Date"}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: "normal",
                        // required,
                        error: meta.touched && !!meta.error,
                        helperText: meta.touched && meta.error ? meta.error : "",
                      },
                    }}
                    value={input.value ? dayjs(input.value) : null}
                    onChange={(v) => input.onChange(v ? (v as Dayjs).format(DATE_FORMATE) : "")}
                  />
                )}
              </Field>

              {values.type == EXPENSE_TYPE[0] ? <Field name={"category"}>
                {({ input, meta }) => (
                  <FormControl fullWidth margin="normal">
                    <AppSelect
                      {...input}
                      required
                      label={"Category"}
                      options={categories}
                      value={input.value ?? ""}
                      onChange={(e) => input.onChange(e.target.value)}
                      error={meta.touched && meta.error ? true : false}
                    />
                  </FormControl>
                )}
              </Field> : <></>}

              <Field name={"description"}>
                {({ input, meta }) => (
                  <AppTextField
                    {...input}
                    multiline
                    fullWidth
                    margin="normal"
                    label={"Description"}
                    error={meta.touched && meta.error ? true : false}
                    helperText={meta.touched && meta.error ? meta.error : ""}
                  />
                )}
              </Field>

              <Field name={"amount"}>
                {({ input, meta }) => (
                  <AppTextField
                    {...input}
                    required
                    fullWidth
                    type={"number"}
                    margin="normal"
                    label={"Amount (INR)"}
                    error={meta.touched && meta.error ? true : false}
                    helperText={meta.touched && meta.error ? meta.error : ""}
                  />
                )}
              </Field>
            </DialogContent>
            <DialogActions>
              <AppButton onClick={onClose} color="inherit">{BUTTON.CANCEL}</AppButton>
              <AppButton type="submit" variant="contained" disabled={submitting || loading}>
                {loading ? BUTTON.SAVING : BUTTON.SAVE}
              </AppButton>
            </DialogActions>
          </form>
        )}
      />
    </Dialog>
  );
};

export default AddTransactionDialog;