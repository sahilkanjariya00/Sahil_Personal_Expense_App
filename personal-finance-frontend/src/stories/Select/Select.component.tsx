import React from "react";
import { FormControl, InputLabel, MenuItem, Select as MuiSelect, type SelectProps } from "@mui/material";

export type Option = string | { label: string; value: any };

export type AppSelectProps = Omit<SelectProps, "label"> & {
  label: string;
  options: Option[];
};

const AppSelect: React.FC<AppSelectProps> = ({ label, options, ...props }) => {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <MuiSelect label={label} {...props}>
        {options.map((opt, idx) => {
          const value = typeof opt === "string" ? opt : opt.value;
          const text = typeof opt === "string" ? opt : opt.label;
          return (
            <MenuItem key={typeof value === "string" ? value : `${value}-${idx}`} value={value}>
              {text}
            </MenuItem>
          );
        })}
      </MuiSelect>
    </FormControl>
  );
};

export default AppSelect;
