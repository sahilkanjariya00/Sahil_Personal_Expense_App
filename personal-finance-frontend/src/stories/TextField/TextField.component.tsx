import { TextField as MuiTextField, type TextFieldProps } from "@mui/material";

export type AppTextFieldProps = TextFieldProps;

const AppTextField = (props: AppTextFieldProps) => {
  return <MuiTextField fullWidth margin="normal" {...props} />;
};

export default AppTextField;
