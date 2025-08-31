import React, { useEffect, useState } from 'react'
import { Box, Container, Paper, Typography, Stack, IconButton, Divider, Button, Chip } from "@mui/material";
import Grid from '@mui/material/GridLegacy';
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { Form, Field } from "react-final-form";
import arrayMutators from "final-form-arrays";
import { FieldArray } from "react-final-form-arrays";

import { FileUpload, AppSelect, AppDatePicker, AppTextField, AppButton } from '../../stories';
// import { createTransactionsBulk } from "../api/transactions";
import { fetchCategories, type CategoryPropsType } from '../../APIs/GetCategories';
import { createQueryUrl } from '../../Util/helper';
import { CATEGORIES } from '../../Util/Endpoint';
import { getReceiptTransaction } from '../../APIs/GetReceiptData';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../Util/constants';
import { createBulkTransaction, type CreateTransactionIn } from '../../APIs/GetTransactions';

// helpers
const REQUIRED = "Required";
const toRupeesString = (n: number | string) => Number(n).toFixed(2);

type RowForm = {
  type: "expense" | "income";
  date: string | null;
  category_id: number | null;
  description: string | null;
  amount: string | number | null; // rupees
};

type FormValues = { rows: RowForm[] };

type Option = string | { label: string; value: any };

const userId = 1; // until auth

function AddReceiptData() {
  const [loadingExtract, setLoadingExtract] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [pendingRows, setPendingRows] = React.useState<RowForm[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    callCategories();
  }, []);

  const callCategories = () => {
    setCatsLoading(true);
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
      setCatsLoading(false);
    }).catch(() => {
      setCatsLoading(false);
    });
  }

  const uploadBulkTransactions = (payload:CreateTransactionIn[]) => {
    createBulkTransaction(payload).then(()=>{
      // setPendingRows([]);
      navigate(ROUTES.default);
    }).catch(()=>{

    });
  }

  const onFileSelected = (file: File | null) => {
    if (!file) return;
    setError(null);
    setLoadingExtract(true);

    const payload = new FormData();
    payload.append("file", file);

    getReceiptTransaction(payload)
      .then((val) => {
        const drafts = val.data.transactions ?? [];

        if (!drafts.length) {
          setError("No items detected in receipt. You can still add rows manually.");
          setLoadingExtract(false);
          return;
        }

        // transform drafts → form rows
        const rows: RowForm[] = drafts.map(d => ({
          type: (d.type === "income" || d.type === "expense") ? d.type : "expense",
          date: d.date ?? null,
          category_id: null, // user selects
          description: d.description ?? "",
          amount: d.amount != null ? String(d.amount) : "",
        }));
        setPendingRows(rows);
        setLoadingExtract(false);
      }).catch(()=>{
        setLoadingExtract(false);
      })
  };

  const validateForm = (values: FormValues) => {
    const errors: any = {};
    if (!values.rows || values.rows.length === 0) {
      errors.rows = { _error: "Add at least one row" };
      return errors;
    }
    const rowsErrors = values.rows.map((r) => {
      const re: any = {};
      if (!r.type) re.type = REQUIRED;
      if (!r.date) re.date = REQUIRED;
      if (!r.category_id) re.category_id = REQUIRED;
      if (!r.amount || r.amount === "") re.amount = REQUIRED;
      else if (r.amount!="" && Number(r.amount) <= 0) re.amount = "Must be > 0";
      return re;
    });
    errors.rows = rowsErrors;
    return errors;
  };

  const onSubmit = async (values: FormValues) => {
    // map to bulk payload
    const payload:CreateTransactionIn[] = values.rows.map((r) => ({
      user_id: userId,
      type: r.type,
      date: r.date!, // validated
      category_id: (r.category_id as number),
      description: (r.description || "").trim(),
      amount: toRupeesString(r.amount as any),
    }));

    uploadBulkTransactions(payload);
    console.log(payload);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">Import from Receipt</Typography>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Form<FormValues>
          onSubmit={onSubmit}
          initialValues={{ rows: [] }}
          validate={validateForm}
          mutators={{ ...arrayMutators }}
          render={({ handleSubmit, form, values, submitting, pristine, submitError }) => {
            const push = (row: RowForm) => form.mutators.push("rows", row);
            const resetRows = (rows: RowForm[]) => form.change("rows", rows);

            const applyPending = () => {
              form.change("rows", pendingRows);
              // optional: keep pendingRows so the user can re-apply; or clear:
              // setPendingRows([]);
            };

            // const resetForm = () => {
            //   form.change("rows", []);
            //   setPendingRows([]);
            //   setError(null);
            // };

            return (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  {/* Upload */}
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="center"
                  >
                    <FileUpload
                      label={loadingExtract ? "Reading..." : "Upload Receipt"}
                      onFileSelected={onFileSelected}
                    />
                    <AppButton
                      variant="contained"
                      disabled={pendingRows.length === 0}
                      onClick={applyPending}
                    >
                      Show transactions
                    </AppButton>
                    {/* <AppButton
                      variant="outlined"
                      color="warning"
                      onClick={resetForm}
                    >
                      Reset Form
                    </AppButton> */}
                    <AppButton
                      variant="outlined"
                      color="secondary"
                      onClick={() => navigate(ROUTES.default)}
                    >
                      Back
                    </AppButton>
                    {pendingRows.length > 0 && (
                      <Chip
                        size="small"
                        color="primary"
                        label={`${pendingRows.length} items detected`}
                      />
                    )}
                  </Stack>
                  {error && (
                    <Typography variant="body2" color="error">
                      {error}
                    </Typography>
                  )}


                  <Divider />

                  {/* Rows */}
                  <FieldArray name="rows">
                    {({ fields }) => (
                      <Stack spacing={2}>
                        {fields.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            No rows yet. Upload a receipt or click “Add more record”.
                          </Typography>
                        )}

                        {fields.map((name, idx) => (
                          <Paper key={name} variant="outlined" sx={{ p: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              {/* Type */}
                              <Grid item xs={12} md={2}>
                                <Field name={`${name}.type`}>
                                  {({ input, meta }) => (
                                    <AppSelect
                                      {...input}
                                      options={["expense", "income"]}
                                      label={"Type"}
                                      value={input.value ?? ""}
                                      onChange={(e) => input.onChange(e.target.value)}
                                      required
                                      disabled
                                      error={meta.touched && meta.error ? true : false}
                                    />
                                  )}
                                </Field>
                              </Grid>

                              {/* Date */}
                              <Grid item xs={12} md={2}>
                                <Field name={`${name}.date`}>
                                  {({ input, meta }) => (
                                    <AppDatePicker
                                      label="Date"
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
                              </Grid>

                              {/* Category (id) */}
                              <Grid item xs={12} md={3}>
                                <Field name={`${name}.category_id`}>
                                  {({ input, meta }) => (
                                    <AppSelect
                                      options={categories}
                                      label={"Category"}
                                      value={input.value ?? ""}
                                      onChange={(e) => input.onChange(e.target.value)}
                                      required
                                      error={meta.touched && meta.error ? true : false}
                                    />
                                  )}
                                </Field>
                              </Grid>

                              {/* Description */}
                              <Grid item xs={12} md={3}>
                                <Field name={`${name}.description`}>
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
                              </Grid>

                              {/* Amount */}
                              <Grid item xs={12} md={2}>
                                <Field name={`${name}.amount`}>
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
                              </Grid>

                              {/* Delete */}
                              <Grid item xs={12}>
                                <Stack direction="row" justifyContent="flex-end">
                                  <IconButton aria-label="delete row" onClick={() => fields.remove(idx)}>
                                    <DeleteIcon />
                                  </IconButton>
                                </Stack>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}

                        {/* Add row */}
                        <Box>
                          <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              fields.push({
                                type: "expense",
                                date: null,
                                category_id: null,
                                description: "",
                                amount: "",
                              } as RowForm)
                            }
                          >
                            Add more record
                          </Button>
                        </Box>
                      </Stack>
                    )}
                  </FieldArray>

                  {/* Submit */}
                  <Stack direction="row" justifyContent="flex-end" spacing={2}>
                    <AppButton
                      variant="contained"
                      type="submit"
                      disabled={submitting || (values?.rows?.length ?? 0) === 0}
                    >
                      Submit
                    </AppButton>
                  </Stack>
                </Stack>
              </form>
            );
          }}
        />
      </Paper>
    </Container>
  );
}

export default AddReceiptData