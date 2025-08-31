import { InputAdornment } from '@mui/material'
import ClearIcon from "@mui/icons-material/Clear";
import AppIconButton from '../AppIconButton';

function CloseIcon({ onChange }: { onChange: () => void }) {
  return (
    <InputAdornment position="end">
      <AppIconButton
        size="small"
        onClick={onChange}
        aria-label="clear date"
      >
        <ClearIcon fontSize="small" />
      </AppIconButton>
    </InputAdornment>
  )
}

export default CloseIcon