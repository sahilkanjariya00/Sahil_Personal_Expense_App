import React from "react";
import { Stack as MuiStack, type StackProps } from "@mui/material";

export type AppStackProps = StackProps;

const AppStack: React.FC<AppStackProps> = (props) => {
  return <MuiStack {...props} />;
};

export default AppStack;
