import React from "react";
import { Box, Button } from "@mui/material";
import AppTypography from "../Typography";

interface FileUploadProps {
  label?: string;
  onFileSelected: (file: File | null) => void;
}

const FileUpload = ({ label = "Upload File", onFileSelected }:FileUploadProps) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileSelected(file);
  };

  return (
    <Box>
      <input
        type="file"
        hidden
        ref={inputRef}
        accept="image/*,.pdf"
        onChange={handleChange}
      />
      <Button variant="outlined" onClick={handleClick}>
        {label}
      </Button>
      <AppTypography variant="caption" display="block" sx={{ mt: 1 }}>
        Supports Images (jpg, png) or PDF
      </AppTypography>
    </Box>
  );
};

export default FileUpload;
