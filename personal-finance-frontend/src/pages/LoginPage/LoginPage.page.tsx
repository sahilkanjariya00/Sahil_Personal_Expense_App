import { useLocation, useNavigate } from "react-router-dom";
import { Form, Field } from "react-final-form";
import { Stack, Button } from "@mui/material";
import { AppBox, AppPaper, AppTextField, AppTypography } from "../../stories";
import useToast from "../../hooks/toast";
import { useAuth } from "../../hooks/authHook";
import { BUTTON, ROUTES } from "../../Util/constants";
import { loginAPI } from "../../APIs/Authapi";

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
        toast?.error?.(e?.response?.data?.detail || "Login failed");
    })
  };

  return (
    <AppBox display="flex" alignItems="center" justifyContent="center" minHeight="80vh">
      <AppPaper sx={{ p: 3, minWidth: 360 }}>
        <AppTypography variant="h6" sx={{ mb: 2 }}>Sign in</AppTypography>
        <Form<ValuesType>
          onSubmit={onSubmit}
          initialValues={{ email: "", password: "" }}
          render={({ handleSubmit, submitting }) => (
            <form onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <Field name="email">
                  {({ input }) => (
                    <AppTextField label="Email" type="email" value={input.value} onChange={input.onChange} />
                  )}
                </Field>
                <Field name="password">
                  {({ input }) => (
                    <AppTextField label="Password" type="password" value={input.value} onChange={input.onChange} />
                  )}
                </Field>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {BUTTON.LOGIN}
                </Button>
              </Stack>
            </form>
          )}
        />
      </AppPaper>
    </AppBox>
  );
};

export default LoginPage;
