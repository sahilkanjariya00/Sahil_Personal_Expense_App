import React from "react";
import { InputLabel, MenuItem, Select as MuiSelect, type SelectProps } from "@mui/material";

export type AppSelectProps = SelectProps & {
  label: string;
  options: string[];
};

const AppSelect: React.FC<AppSelectProps> = ({ label, options, ...props }) => {
  return (
     <>
      <InputLabel>{label}</InputLabel>
      <MuiSelect label={label} {...props}>
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </MuiSelect>
      </>
  );
};

export default AppSelect;
