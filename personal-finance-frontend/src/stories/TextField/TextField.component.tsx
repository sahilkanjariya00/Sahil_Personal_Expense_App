import React from "react";
import { TextField as MuiTextField, type TextFieldProps } from "@mui/material";

export type AppTextFieldProps = TextFieldProps;

const AppTextField: React.FC<AppTextFieldProps> = (props) => {
  return <MuiTextField fullWidth margin="normal" {...props} />;
};

export default AppTextField;
