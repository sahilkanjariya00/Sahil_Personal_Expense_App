import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { PickerValue } from "@mui/x-date-pickers/internals";
import type { DateValidationError, PickerChangeHandlerContext } from "@mui/x-date-pickers/models";
import type { Dayjs } from "dayjs";

export type AppDatePickerPropsType = {
  label: string;
  value: Dayjs | null;
  onChange: (value: PickerValue, context: PickerChangeHandlerContext<DateValidationError>) => void;
  slotProps?: Object;
  allowClear?: boolean;
}

const AppDatePicker = ({ label, value, onChange, slotProps, ...props }: AppDatePickerPropsType) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDatePicker
        label={label}
        value={value}
        onChange={onChange}
        slotProps={slotProps}
        {...props}
      />
    </LocalizationProvider>
  );
};

export default AppDatePicker;
