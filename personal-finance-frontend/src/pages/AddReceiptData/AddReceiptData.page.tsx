import React, { useEffect, useState } from 'react'
import { Box, Container, Paper, Typography, Stack, IconButton, Divider, Button } from "@mui/material";
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

// helpers
const REQUIRED = "Required";
const isPositive = (v: any) => (v != null && Number(v) > 0 ? undefined : "Must be > 0");
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

  const onFileSelected = async (file: File | null, pushRow: (v: RowForm) => void, resetRows: (rows: RowForm[]) => void) => {
    if (!file) return;
    setError(null);
    setLoadingExtract(true);

    const payload = new FormData();
    payload.append("file", file);

    // getReceiptTransaction(payload)
    //   .then((val) => {
        // const drafts = val.data.transactions ?? [];
        const drafts = [
          {
            "type": "expense",
            "date": "2023-10-02",
            "description": "Foretakeresisteret",
            "amount": 60,
            "confidence": {
              "amount": 0.9,
              "description": 0.8,
              "date": 0.7
            }
          },
          {
            "type": "expense",
            "date": "2023-10-02",
            "description": "TRANKE APRIKOSER",
            "amount": 10.9,
            "confidence": {
              "amount": 0.9,
              "description": 0.8,
              "date": 0.7
            }
          },
          {
            "type": "expense",
            "date": "2023-10-02",
            "description": "COUSOUS",
            "amount": 3206,
            "confidence": {
              "amount": 0.9,
              "description": 0.8,
              "date": 0.7
            }
          },
          {
            "type": "expense",
            "date": "2023-10-02",
            "description": "SREAL ISOG",
            "amount": 33.3,
            "confidence": {
              "amount": 0.9,
              "description": 0.8,
              "date": 0.7
            }
          },
          {
            "type": "expense",
            "date": "2023-10-02",
            "description": "VAREUK JUP",
            "amount": 2023,
            "confidence": {
              "amount": 0.9,
              "description": 0.8,
              "date": 0.7
            }
          },
          {
            "type": "expense",
            "date": "2023-10-02",
            "description": "KONTAKTLASS",
            "amount": 4,
            "confidence": {
              "amount": 0.9,
              "description": 0.8,
              "date": 0.7
            }
          },
          {
            "type": "expense",
            "date": "2023-10-02",
            "description": "ARD:00059",
            "amount": 57800002110,
            "confidence": {
              "amount": 0.9,
              "description": 0.8,
              "date": 0.7
            }
          }
        ]

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
        console.log(rows);
        resetRows(rows);
        setLoadingExtract(false);
      // }).catch(()=>{
      //   setLoadingExtract(false);
      // })
  };

  const validateForm = (values: FormValues) => {
    console.log(values);
    const errors: any = {};
    if (!values.rows || values.rows.length === 0) {
      errors.rows = { _error: "Add at least one row" };
      return errors;
    }
    const rowsErrors = values.rows.map((r) => {
      const re: any = {};
      if (!r.type) re.type = REQUIRED;
      if (!r.date) re.date = REQUIRED;
      if (!r.category_id && r.type == "expense") re.category_id = REQUIRED;
      // if (!r.description || !String(r.description).trim()) re.description = REQUIRED;
      if (!r.amount || r.amount == "") re.amount = "Required";
      else if (Number(r.amount) <= 0) re.amount = "Must be > 0";
      return re;
    });
    errors.rows = rowsErrors;
    console.log(errors);
    return errors;
  };

  const onSubmit = async (values: FormValues) => {
    // map to bulk payload
    const payload = values.rows.map((r) => ({
      user_id: userId,
      type: r.type,
      date: r.date!, // validated
      category_id: r.type === "income" ? null : (r.category_id as number),
      description: (r.description || "").trim() || null,
      amount: toRupeesString(r.amount as any),
    }));
    // await createTransactionsBulk(payload); // assumes backend endpoint exists
    console.log(payload);
    // you can navigate back or show a success message
    alert("Transactions saved!");
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

            return (
              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={2}>
                  {/* Upload */}
                  <Box>
                    <FileUpload
                      label={loadingExtract ? "Reading..." : "Upload Receipt"}
                      onFileSelected={(f) => onFileSelected(f, push, resetRows)}
                    />
                    {error && (
                      <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                        {error}
                      </Typography>
                    )}
                  </Box>

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
                                      label="Type"
                                      value={input.value || "expense"}
                                      options={["expense", "income"]}
                                      onChange={(e: any) => input.onChange(e.target.value)}
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
                                <Field name={`${name}.amount`} validate={isPositive}>
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