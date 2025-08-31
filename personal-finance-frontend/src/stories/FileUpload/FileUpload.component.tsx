import React from "react";
import AppTypography from "../Typography";
import AppBox from "../AppBox";
import AppButton from "../Button";

type FileUploadPropsType = {
  label?: string;
  onFileSelected: (file: File | null) => void;
}

const FileUpload = ({ label = "Upload File", onFileSelected }:FileUploadPropsType) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onFileSelected(file);
  };

  return (
    <AppBox>
      <input
        type="file"
        hidden
        ref={inputRef}
        accept="image/*,.pdf"
        onChange={handleChange}
      />
      <AppButton variant="outlined" onClick={handleClick}>
        {label}
      </AppButton>
      <AppTypography variant="caption" display="block" sx={{ mt: 1 }}>
        Supports Images (jpg, png) or PDF
      </AppTypography>
    </AppBox>
  );
};

export default FileUpload;
