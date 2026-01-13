import { memo, useState, useCallback, useMemo, type MouseEvent } from 'react'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import AccountCircle from '@mui/icons-material/AccountCircle'
import EditIcon from '@mui/icons-material/Edit'
import EditOffIcon from '@mui/icons-material/EditOff'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'
import Tooltip from '@mui/material/Tooltip'
import { logout } from '../../apis/logout'
import { useQueryClient } from 'react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { fetchRetry } from '../../common/fetch'
import { USERS_API } from '../../constants/api'
import { useGridEditContext } from '../../common/useGridEditContext'
import { patchUserSettings } from '../../apis/user_settings'
import { DEFAULT_LAYOUT } from '../../constants/defaults'

type MenuItemType = {
    text: string
    onClick?: () => Promise<void> | void
}

const deleteUserAccount = async (): Promise<void> => {
    return fetchRetry(
        `${USERS_API}/me`,
        {
            method: 'DELETE',
        },
        [204]
    ).then(() => logout())
}

const SETTING_MENU_ITEM_MAP = new Map<string, Array<string>>([
    ['/', ['refresh', 'settings', 'resetlayout', 'logout', 'delaccount']],
    ['/settings', ['logout', 'delaccount']],
])

const MenuAppBarComponent = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const location = useLocation()
    const { isEditMode, toggleEditMode } = useGridEditContext()
    const isDashboard = location.pathname === '/'

    const handleMenu = useCallback((event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }, [])

    const handleClose = useCallback(() => {
        setAnchorEl(null)
    }, [])

    const reload = useCallback(() => {
        queryClient.invalidateQueries()
        handleClose()
    }, [handleClose, queryClient])

    const redirect = useCallback(
        (path: string) => {
            navigate(path)
            handleClose()
        },
        [handleClose, navigate]
    )

    const menuItemArray = useMemo(
        () =>
            new Map<string, MenuItemType>([
                [
                    'resetlayout',
                    {
                        text: 'Reset Layout',
                        onClick: () =>
                            patchUserSettings({
                                widget_layout: DEFAULT_LAYOUT,
                            })
                                .then(() => window.location.reload())
                                .catch((error) => {
                                    console.error(
                                        'Failed to save widget layout:',
                                        error
                                    )
                                }),
                    },
                ],
                [
                    'refresh',
                    {
                        text: 'Refresh',
                        onClick: reload,
                    },
                ],
                [
                    'settings',
                    {
                        text: 'Settings',
                        onClick: () => redirect('/settings'),
                    },
                ],
                [
                    'logout',
                    {
                        text: 'Logout',
                        onClick: logout,
                    },
                ],
                [
                    'delaccount',
                    {
                        text: 'Delete Account',
                        onClick: deleteUserAccount,
                    },
                ],
            ]),
        [redirect, reload]
    )

    const menuItems = useMemo(
        () =>
            getMenuItems(
                location.pathname,
                SETTING_MENU_ITEM_MAP,
                menuItemArray
            ),
        [location.pathname, menuItemArray]
    )

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
                    {isDashboard && (
                        <Tooltip
                            title={
                                isEditMode
                                    ? 'Disable layout editing'
                                    : 'Enable layout editing'
                            }
                        >
                            <IconButton
                                size="large"
                                aria-label="toggle layout editing"
                                onClick={toggleEditMode}
                                color="inherit"
                            >
                                {isEditMode ? <EditOffIcon /> : <EditIcon />}
                            </IconButton>
                        </Tooltip>
                    )}
                    <IconButton
                        size="large"
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircle />
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        {menuItems.map((menuItem) => (
                            <MenuItem
                                onClick={menuItem.onClick}
                                key={menuItem.text}
                            >
                                {menuItem.text}
                            </MenuItem>
                        ))}
                    </Menu>
                </Toolbar>
            </AppBar>
        </Box>
    )
}

const getMenuItems = (
    path: string,
    settingMenuItemMap: Map<string, Array<string>>,
    menuItemArray: Map<string, MenuItemType>
): Array<MenuItemType> => {
    const menuItems: Array<MenuItemType> = []
    const items = settingMenuItemMap.get(path)
    items?.forEach((id) => {
        if (menuItemArray.has(id)) {
            menuItems.push(menuItemArray.get(id)!)
        }
    })
    return menuItems
}

const MenuAppBar = memo(MenuAppBarComponent)
MenuAppBar.displayName = 'MenuAppBar'

export default MenuAppBar
