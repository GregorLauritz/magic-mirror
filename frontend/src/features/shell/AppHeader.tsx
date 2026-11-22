import {
    Alert,
    AppBar,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Snackbar,
    Toolbar,
    Tooltip,
    Typography,
} from '@mui/material'
import AccountCircle from '@mui/icons-material/AccountCircle'
import EditIcon from '@mui/icons-material/Edit'
import EditOffIcon from '@mui/icons-material/EditOff'
import { useLocation } from 'react-router-dom'
import { useLayoutEditing } from '@/features/dashboard'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { showsLayoutToggle } from './menuModel'
import { useAppMenu } from './useAppMenu'

/** The top bar: the title, the layout toggle (dashboard) and the account menu. */
export const AppHeader = () => {
    const { pathname } = useLocation()
    const { isEditing, toggle } = useLayoutEditing()
    const menu = useAppMenu()

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        Magic Mirror
                    </Typography>
                    {showsLayoutToggle(pathname) && (
                        <Tooltip
                            title={
                                isEditing
                                    ? 'Disable layout editing'
                                    : 'Enable layout editing'
                            }
                        >
                            <IconButton
                                size="large"
                                aria-label="toggle layout editing"
                                onClick={toggle}
                                color="inherit"
                            >
                                {isEditing ? <EditOffIcon /> : <EditIcon />}
                            </IconButton>
                        </Tooltip>
                    )}
                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={menu.open}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={menu.anchor}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={menu.isOpen}
                        onClose={menu.close}
                    >
                        {menu.entries.map((entry) => (
                            <MenuItem
                                key={entry.action}
                                onClick={() => menu.select(entry)}
                            >
                                {entry.label}
                            </MenuItem>
                        ))}
                    </Menu>
                </Toolbar>
            </AppBar>

            {menu.confirmation && (
                <ConfirmDialog
                    open={menu.isConfirming}
                    title={menu.confirmation.title}
                    message={menu.confirmation.message}
                    confirmLabel={menu.confirmation.confirmLabel}
                    onConfirm={menu.confirm}
                    onCancel={menu.cancel}
                />
            )}
            <Snackbar
                open={menu.notice !== undefined}
                autoHideDuration={6000}
                onClose={menu.dismissNotice}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="error"
                    variant="filled"
                    onClose={menu.dismissNotice}
                >
                    {menu.notice}
                </Alert>
            </Snackbar>
        </Box>
    )
}
