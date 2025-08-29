import React from "react";
import { Button as MuiButton, type ButtonProps } from "@mui/material";

export type AppButtonProps = ButtonProps;

const AppButton: React.FC<AppButtonProps> = (props) => {
  return <MuiButton {...props} />;
};

export default AppButton;
