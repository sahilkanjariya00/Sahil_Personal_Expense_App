import React from "react";
import { Typography as MuiTypography, type TypographyProps } from "@mui/material";

export type AppTypographyProps = TypographyProps;

const AppTypography: React.FC<AppTypographyProps> = (props) => {
  return <MuiTypography {...props} />;
};

export default AppTypography;
