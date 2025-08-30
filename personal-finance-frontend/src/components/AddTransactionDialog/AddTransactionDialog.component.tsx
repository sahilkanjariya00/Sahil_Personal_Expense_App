import React, { useEffect, useState } from "react";
import { AppButton, AppDatePicker, AppSelect, AppTextField } from "../../stories";
import dayjs, { Dayjs } from "dayjs";
import { Field, Form } from "react-final-form";
import FormControl from "@mui/material/FormControl";
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { createTransaction, type CreateTransactionIn } from "../../APIs/GetTransactions";
import { fetchCategories, type CategoryPropsType } from "../../APIs/GetCategories";
import { CATEGORIES } from "../../Util/Endpoint";
import { createQueryUrl } from "../../Util/helper";

type AddDialogProps = {
  open: boolean;
  onClose: () => void;
  onChange: React.Dispatch<React.SetStateAction<boolean>>;
};

type Option = string | { label: string; value: any };

type TxnType = "income" | "expense";

const AddTransactionDialog: React.FC<AddDialogProps> = ({ open, onClose, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Option[]>([]);

  useEffect(()=>{
    callCategories();
  },[])

  const onSubmit = async (values: any) => {
    setLoading(true);
    const payload:CreateTransactionIn = {
      type: values.type as TxnType,
      date: values.date as string,
      description: values.description?.trim() || "",
      amount_minor: Number(values.amount*100),
      user_id: 1,
    }

    if(values.type == "expense" && values.category>=0){
      payload.category_id = values.category;
    }

    // console.log(payload, values);
    callCreateTransaction(payload);
  };

  const callCreateTransaction = (payload: CreateTransactionIn) => {
    createTransaction(payload).then(()=>{
      setLoading(false);
      onChange(prev=>!prev);
      onClose();
    }).catch(()=>{
      setLoading(false);
    });
  } 

  const callCategories =  ()=>{
    const params:CategoryPropsType = {
      include_global: true,
    }

    const url = createQueryUrl(CATEGORIES,params);
    fetchCategories(url).then((val)=>{
      const newCategories: Option[] = val.data.map((cat: any) => ({
        value: cat.id,
        label: cat.name,
      }));
      
      setCategories(newCategories);
    }).catch(()=>{

    });
  }

  const validate = (values: any) => {
    const errors: Record<string, string> = {};
    if (!values.type) errors.type = "Required";
    if (!values.date) errors.date = "Required";
    if (!values.category && values.type == "expense") errors.category = "Required";
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
        render={({ handleSubmit, submitting, pristine, values }) => (
          <form onSubmit={handleSubmit} noValidate>
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

              {values.type == "expense"?<Field name={"category"}>
                    {({ input, meta }) => (
                    <FormControl fullWidth margin="normal">
                        <AppSelect
                        {...input}
                        options={categories}
                        label={"Category"}
                        value={input.value ?? ""}
                        onChange={(e) => input.onChange(e.target.value)}
                        required
                        error={meta.touched && meta.error ? true : false}
                        />
                    </FormControl>
                    )}
                </Field>:<></>}

              <Field name={"description"}>
                    {({ input, meta }) => (
                    <AppTextField
                        {...input}
                        label={"Description"}
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
              <AppButton type="submit" variant="contained" disabled={submitting || loading}>
                {loading ? "Saving..." : "Save"}
              </AppButton>
            </DialogActions>
          </form>
        )}
      />
    </Dialog>
  );
};

export default AddTransactionDialog;