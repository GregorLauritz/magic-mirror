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
import { useAuth } from '@/features/auth'
import { useQueryClient } from 'react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { useResetLayout, useLayoutEditing } from '@/features/dashboard'
import { useResetLocalData } from '@/features/settings'

type MenuItemType = {
    text: string
    onClick?: () => Promise<void> | void
}

const SETTING_MENU_ITEM_MAP = new Map<string, Array<string>>([
    ['/', ['refresh', 'settings', 'resetlayout', 'logout', 'clearlocaldata']],
    ['/settings', ['logout', 'clearlocaldata']],
])

const MenuAppBarComponent = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const location = useLocation()
    const { isEditing: isEditMode, toggle: toggleEditMode } = useLayoutEditing()
    const isDashboard = location.pathname === '/'
    const resetLayout = useResetLayout()
    const resetLocalData = useResetLocalData()
    const { signOut } = useAuth()

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

    const logout = useCallback(async () => {
        await signOut()
        navigate('/')
        handleClose()
    }, [signOut, navigate, handleClose])

    const menuItemArray = useMemo(
        () =>
            new Map<string, MenuItemType>([
                [
                    'resetlayout',
                    {
                        text: 'Reset Layout',
                        onClick: () => {
                            resetLayout()
                            handleClose()
                        },
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
                    'clearlocaldata',
                    {
                        text: 'Clear Local Data',
                        onClick: resetLocalData,
                    },
                ],
            ]),
        [redirect, reload, resetLayout, resetLocalData, logout, handleClose]
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
