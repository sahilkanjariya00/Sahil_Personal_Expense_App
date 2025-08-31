import React, { createContext, useCallback, useMemo, useState } from "react";
import { Snackbar, Alert, type AlertColor } from "@mui/material";

type ToastState = {
  open: boolean;
  message: string;
  severity: AlertColor; // "success" | "info" | "warning" | "error"
};

type ToastAPI = {
  show: (message: string, severity?: AlertColor) => void;
  success: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  error: (message: string) => void;
  close: () => void;
};

type ToastProviderType = {
  children: React.ReactNode
}

export const ToastContext = createContext<ToastAPI | null>(null);

export const ToastProvider = ({ children }:ToastProviderType) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  const close = useCallback(() => setToast((t) => ({ ...t, open: false })), []);

  const show = useCallback((message: string, severity: AlertColor = "info") => {
    // Guard against non-strings
    setToast({ open: true, message: String(message), severity });
  }, []);

  const api = useMemo<ToastAPI>(() => ({
    show,
    success: (m: string) => show(m, "success"),
    info:    (m: string) => show(m, "info"),
    warning: (m: string) => show(m, "warning"),
    error:   (m: string) => show(m, "error"),
    close,
  }), [show, close]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        open={toast.open}
        onClose={close}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={close} severity={toast.severity} sx={{ width: "100%" }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
