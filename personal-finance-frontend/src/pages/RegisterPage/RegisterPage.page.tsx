import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Form, Field } from "react-final-form";
import {
  Link
} from "@mui/material";
import { AppBox, AppButton, AppPaper, AppStack, AppTextField, AppTypography } from "../../stories";
import { BUTTON, ROUTES } from "../../Util/constants";
import useToast from "../../hooks/toast";
import { registerApi } from "../../APIs/Authapi";

type ValuesType = { email: string; full_name: string; password: string; confirm: string };

const validate = (v: ValuesType) => {
  const errs: Partial<Record<keyof ValuesType, string>> = {};
  if (!v.email) errs.email = "Email is required";
  if (!v.full_name) errs.full_name = "Full name is required";
  if (!v.password) errs.password = "Password is required";
  if (v.password && v.password.length < 6) errs.password = "Min 6 characters";
  if (!v.confirm) errs.confirm = "Confirm your password";
  if (v.password && v.confirm && v.password !== v.confirm) errs.confirm = "Passwords do not match";
  return errs;
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const onSubmit = async (values: ValuesType) => {
    registerApi({email: values.email.trim(), full_name: values.full_name.trim(), password: values.password}).
    then(()=>{
        success("Account created. Please Sign in");
        navigate(ROUTES.login, { replace: true });
    }).
    catch((e)=>{
        error(e.message || "Registration failed");
    });
  };

  return (
    <AppBox display="flex" alignItems="center" justifyContent="center" minHeight="80vh">
      <AppPaper sx={{ p: 3, minWidth: 380 }}>
        <AppTypography variant="h6" sx={{ mb: 2 }}>Create an account</AppTypography>
        <Form<ValuesType>
          onSubmit={onSubmit}
          validate={validate}
          initialValues={{ email: "", full_name: "", password: "", confirm: "" }}
          render={({ handleSubmit, submitting, submitError }) => (
            <form onSubmit={handleSubmit} noValidate>
              <AppStack spacing={2}>
                <Field name="full_name">
                  {({ input, meta }) => (
                    <AppTextField
                      label="Full name"
                      value={input.value}
                      onChange={input.onChange}
                      error={Boolean(meta.touched && meta.error)}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>
                <Field name="email">
                  {({ input, meta }) => (
                    <AppTextField
                      label="Email"
                      type="email"
                      value={input.value}
                      onChange={input.onChange}
                      error={Boolean(meta.touched && meta.error)}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>
                <Field name="password">
                  {({ input, meta }) => (
                    <AppTextField
                      label="Password"
                      type="password"
                      value={input.value}
                      onChange={input.onChange}
                      error={Boolean(meta.touched && meta.error)}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>
                <Field name="confirm">
                  {({ input, meta }) => (
                    <AppTextField
                      label="Confirm password"
                      type="password"
                      value={input.value}
                      onChange={input.onChange}
                      error={Boolean(meta.touched && meta.error)}
                      helperText={meta.touched && meta.error}
                    />
                  )}
                </Field>

                {submitError && <AppTypography color="error">{submitError}</AppTypography>}

                <AppButton type="submit" variant="contained" disabled={submitting}>
                  Create account
                </AppButton>
                <AppTypography variant="body2" sx={{ textAlign: "center" }}>
                  Already have an account?{" "}
                  <Link component={RouterLink} to={ROUTES.login}>{BUTTON.SIGNIN}</Link>
                </AppTypography>
              </AppStack>
            </form>
          )}
        />
      </AppPaper>
    </AppBox>
  );
};

export default RegisterPage;
