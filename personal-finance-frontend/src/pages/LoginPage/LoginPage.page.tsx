import { Link, useLocation, useNavigate } from "react-router-dom";
import { Form, Field } from "react-final-form";
import { Stack, Button } from "@mui/material";
import useToast from "../../hooks/toast";
import { useAuth } from "../../hooks/authHook";
import { AppBox, AppPaper, AppTextField, AppTypography } from "../../stories";
import { loginAPI } from "../../APIs/Authapi";
import { BUTTON, ROUTES } from "../../Util/constants";

type ValuesType = { email: string; password: string };

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation() as any;
  const toast = useToast?.() ?? null; // safe if not added

  const from = location.state?.from?.pathname || ROUTES.default;

  const onSubmit = (values: ValuesType) => {
    loginAPI({email: values.email, password: values.password}).then((val)=>{
        login(val.data.access_token);
        toast?.success?.("Logged in");
        navigate(from, { replace: true });
    }).catch((e)=>{
        toast?.error?.(e.message || "Login failed");
    })
  };

  const validate = (v: ValuesType) => {
  const errs: Partial<Record<keyof ValuesType, string>> = {};
  if (!v.email) errs.email = "Email is required";
  if (!v.password) errs.password = "Password is required";
  // if (v.password && v.password.length < 6) errs.password = "Min 6 characters";
  return errs;
};

  return (
    <AppBox display="flex" alignItems="center" justifyContent="center" minHeight="80vh">
      <AppPaper sx={{ p: 3, minWidth: 360 }}>
        <AppTypography variant="h6" sx={{ mb: 2 }}>Sign in</AppTypography>
        <Form<ValuesType>
          onSubmit={onSubmit}
          validate={validate}
          initialValues={{ email: "", password: "" }}
          render={({ handleSubmit, submitting }) => (
            <form onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
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
                <Button type="submit" variant="contained" disabled={submitting}>
                  {BUTTON.LOGIN}
                </Button>
              </Stack>
            </form>
          )}
        />
        <AppTypography variant="body2" sx={{ textAlign: "center" }}>
          Don’t have an account?{" "}
          <Link to={ROUTES.register}>Create one</Link>
        </AppTypography>
      </AppPaper>
    </AppBox>
  );
};

export default LoginPage;
