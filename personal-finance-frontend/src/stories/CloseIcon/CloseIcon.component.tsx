import React from 'react'
import { IconButton, InputAdornment } from '@mui/material'
import ClearIcon from "@mui/icons-material/Clear";

function CloseIcon({onChange}:{onChange:()=>void}) {
  return (
    <InputAdornment position="end">
        <IconButton
        size="small"
        onClick={onChange}
        aria-label="clear date"
        >
        <ClearIcon fontSize="small" />
        </IconButton>
    </InputAdornment>
  )
}

export default CloseIcon