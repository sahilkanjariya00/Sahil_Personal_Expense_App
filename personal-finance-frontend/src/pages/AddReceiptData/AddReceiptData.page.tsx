import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Form, Field } from "react-final-form";
import arrayMutators from "final-form-arrays";
import { FieldArray } from "react-final-form-arrays";
import { Divider, Chip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import dayjs, { Dayjs } from 'dayjs';
import {
  FileUpload,
  AppSelect,
  AppDatePicker,
  AppTextField,
  AppButton,
  AppContainer,
  AppPaper,
  AppIconButton,
  AppGrid,
  AppStack,
  AppTypography,
  AppBox
} from '../../stories';
import { fetchCategories, type CategoryPropsType } from '../../APIs/GetCategories';
import { getReceiptTransaction } from '../../APIs/GetReceiptData';
import { createBulkTransaction, type CreateTransactionIn } from '../../APIs/GetTransactions';
import { createQueryUrl } from '../../Util/helper';
import { CATEGORIES } from '../../Util/Endpoint';
import { BUTTON, REQUIRED, ROUTES } from '../../Util/constants';

// helpers
const toRupeesString = (n: number | string) => Number(n).toFixed(2);

type RowFormType = {
  type: "expense" | "income";
  date: string | null;
  category_id: number | null;
  description: string | null;
  amount: string | number | null; // rupees
};

type FormValuesType = { rows: RowFormType[] };

type Option = string | { label: string; value: any };

const userId = 1; // until auth

const AddReceiptData = () => {
  const navigate = useNavigate();
  const [loadingExtract, setLoadingExtract] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [pendingRows, setPendingRows] = React.useState<RowFormType[]>([]);

  useEffect(() => {
    callCategories();
  }, []);

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
    }).catch(() => {
    });
  }

  const uploadBulkTransactions = (payload: CreateTransactionIn[]) => {
    createBulkTransaction(payload).then(() => {
      navigate(ROUTES.default);
    }).catch(() => {

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
        const rows: RowFormType[] = drafts.map(d => ({
          type: "expense",
          date: d.date ?? null,
          category_id: null,
          description: d.description ?? "",
          amount: d.amount != null ? String(d.amount) : "",
        }));
        setPendingRows(rows);
        setLoadingExtract(false);
      }).catch(() => {
        setLoadingExtract(false);
      })
  };

  const validateForm = (values: FormValuesType) => {
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
      else if (r.amount != "" && Number(r.amount) <= 0) re.amount = "Must be > 0";
      return re;
    });
    errors.rows = rowsErrors;
    return errors;
  };

  const onSubmit = async (values: FormValuesType) => {
    // map to bulk payload
    const payload: CreateTransactionIn[] = values.rows.map((r) => ({
      user_id: userId,
      type: r.type,
      date: r.date!, // validated
      category_id: (r.category_id as number),
      description: (r.description || "").trim(),
      amount: toRupeesString(r.amount as any),
    }));

    uploadBulkTransactions(payload);
  };

  return (
    <AppContainer maxWidth="lg" sx={{ py: 4 }}>
      <AppStack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <AppTypography variant="h5">Import from Receipt</AppTypography>
      </AppStack>

      <AppPaper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Form<FormValuesType>
          onSubmit={onSubmit}
          initialValues={{ rows: [] }}
          validate={validateForm}
          mutators={{ ...arrayMutators }}
          render={({ handleSubmit, form, values, submitting, }) => {
            // const push = (row: RowFormType) => form.mutators.push("rows", row);
            // const resetRows = (rows: RowFormType[]) => form.change("rows", rows);

            const applyPending = () => {
              form.change("rows", pendingRows);

            };

            // const resetForm = () => {
            //   form.change("rows", []);
            //   setPendingRows([]);
            //   setError(null);
            // };

            return (
              <form onSubmit={handleSubmit} noValidate>
                <AppStack spacing={2}>
                  {/* Upload */}
                  <AppStack
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
                      {BUTTON.SHOW_TRANSACTIONS}
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
                      {BUTTON.BACK}
                    </AppButton>
                    {pendingRows.length > 0 && (
                      <Chip
                        size="small"
                        color="primary"
                        label={`${pendingRows.length} items detected`}
                      />
                    )}
                  </AppStack>
                  {error && (
                    <AppTypography variant="body2" color="error">
                      {error}
                    </AppTypography>
                  )}


                  <Divider />

                  {/* Rows */}
                  <FieldArray name="rows">
                    {({ fields }) => (
                      <AppStack spacing={2}>
                        {fields.length === 0 && (
                          <AppTypography variant="body2" color="text.secondary">
                            No rows yet. Upload a receipt or click “Add more record”.
                          </AppTypography>
                        )}

                        {fields.map((name, idx) => (
                          <AppPaper key={name} variant="outlined" sx={{ p: 2 }}>
                            <AppGrid container spacing={2} alignItems="center">
                              {/* Type */}
                              <AppGrid item xs={12} md={2}>
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
                              </AppGrid>

                              {/* Date */}
                              <AppGrid item xs={12} md={2}>
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
                              </AppGrid>

                              {/* Category (id) */}
                              <AppGrid item xs={12} md={3}>
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
                              </AppGrid>

                              {/* Description */}
                              <AppGrid item xs={12} md={3}>
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
                              </AppGrid>

                              {/* Amount */}
                              <AppGrid item xs={12} md={2}>
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
                              </AppGrid>

                              {/* Delete */}
                              <AppGrid item xs={12}>
                                <AppStack direction="row" justifyContent="flex-end">
                                  <AppIconButton aria-label="delete row" onClick={() => fields.remove(idx)}>
                                    <DeleteIcon />
                                  </AppIconButton>
                                </AppStack>
                              </AppGrid>
                            </AppGrid>
                          </AppPaper>
                        ))}

                        {/* Add row */}
                        <AppBox>
                          <AppButton
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() =>
                              fields.push({
                                type: "expense",
                                date: null,
                                category_id: null,
                                description: "",
                                amount: "",
                              } as RowFormType)
                            }
                          >
                            {BUTTON.ADD_MORE_RECORD}
                          </AppButton>
                        </AppBox>
                      </AppStack>
                    )}
                  </FieldArray>

                  {/* Submit */}
                  <AppStack direction="row" justifyContent="flex-end" spacing={2}>
                    <AppButton
                      variant="contained"
                      type="submit"
                      disabled={submitting || (values?.rows?.length ?? 0) === 0}
                    >
                      {BUTTON.SAVE}
                    </AppButton>
                  </AppStack>
                </AppStack>
              </form>
            );
          }}
        />
      </AppPaper>
    </AppContainer>
  );
}

export default AddReceiptData