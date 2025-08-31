import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { AppButton, AppTypography } from '../../stories'
import { BUTTON } from '../../Util/constants';

type DeleteConfDialogType = {
    confirmOpen: boolean,
    setConfirmOpen: (val: boolean) => void,
    handleConfirmDelete: () => void;
}

const DeleteConfDialog = ({
    confirmOpen,
    setConfirmOpen,
    handleConfirmDelete
}: DeleteConfDialogType) => {
    return (
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Delete transaction?</DialogTitle>
            <DialogContent>
                <AppTypography variant="body2" sx={{ mt: 1 }}>
                    {"This transaction will be deleted."}
                </AppTypography>
            </DialogContent>
            <DialogActions>
                <AppButton onClick={() => setConfirmOpen(false)}>{BUTTON.NO}</AppButton>
                <AppButton color="error" variant="contained" onClick={() => handleConfirmDelete()}>
                    {BUTTON.YES_DELETE}
                </AppButton>
            </DialogActions>
        </Dialog>
    )
}

export default DeleteConfDialog