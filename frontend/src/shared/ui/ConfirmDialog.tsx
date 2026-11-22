import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material'

interface ConfirmDialogProps {
    readonly open: boolean
    readonly title: string
    readonly message: string
    readonly confirmLabel: string
    readonly cancelLabel?: string
    readonly onConfirm: () => void
    readonly onCancel: () => void
}

/** Asks before something that cannot be undone. Cancel has the focus. */
export const ConfirmDialog = ({
    open,
    title,
    message,
    confirmLabel,
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => (
    <Dialog
        open={open}
        onClose={onCancel}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
    >
        <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
        <DialogContent>
            <DialogContentText id="confirm-dialog-message">
                {message}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onCancel} autoFocus>
                {cancelLabel}
            </Button>
            <Button onClick={onConfirm} color="error">
                {confirmLabel}
            </Button>
        </DialogActions>
    </Dialog>
)
