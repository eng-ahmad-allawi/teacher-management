'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Subject as SubjectIcon,
  School as SchoolIcon,
  AccountBalance as AccountBalanceIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ClientOnly from './ClientOnly';

interface NavigationProps {
  title?: string;
}

export default function Navigation({ title }: NavigationProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();

  const menuItems = [
    { text: 'الصفحة الرئيسية', icon: <HomeIcon />, href: '/' },
    { text: 'إدارة المواد', icon: <SubjectIcon />, href: '/subjects' },
    { text: 'المعاهد والمدارس', icon: <SchoolIcon />, href: '/institutes-schools' },
    { text: 'إدارة الحسابات', icon: <AccountBalanceIcon />, href: '/accounts' },
    { text: 'إدارة المواعيد', icon: <EventIcon />, href: '/appointments' },
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const getPageTitle = () => {
    if (title) return title;

    if (pathname === '/') return 'تطبيق إدارة شؤون الأستاذ';
    if (pathname === '/subjects') return 'إدارة المواد';
    if (pathname === '/institutes-schools') return 'المعاهد والمدارس';
    if (pathname === '/accounts') return 'إدارة الحسابات';
    if (pathname.startsWith('/accounts/')) return 'تفاصيل الحساب';
    if (pathname === '/appointments') return 'إدارة المواعيد';
    if (pathname === '/settings') return 'الإعدادات';

    return 'تطبيق إدارة شؤون الأستاذ';
  };

  const isHomePage = pathname === '/';

  const drawer = (
    <Box sx={{ width: 280 }}>
      <Box sx={{ p: 2, textAlign: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          إدارة شؤون الأستاذ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          نظام إدارة شامل
        </Typography>
      </Box>
      
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItem
              component="div"
              onClick={() => setDrawerOpen(false)}
              className="menu-item transition-all hover-lift"
              sx={{
                mx: 1,
                borderRadius: 1,
                mb: 0.5,
                cursor: 'pointer',
                backgroundColor: pathname === item.href ? '#f8f9fa' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'translateX(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                },
                '&:active': {
                  backgroundColor: '#f0f0f0 !important',
                  transform: 'scale(0.98)'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: pathname === item.href ? '4px' : '0',
                  backgroundColor: 'primary.main',
                  transition: 'width 0.3s ease',
                }
              }}
            >
              <ListItemIcon sx={{ color: pathname === item.href ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                sx={{ 
                  '& .MuiListItemText-primary': {
                    fontWeight: pathname === item.href ? 600 : 400,
                    color: pathname === item.href ? 'primary.main' : 'text.primary'
                  }
                }}
              />
            </ListItem>
          </Link>
        ))}
        
        <Divider sx={{ my: 2 }} />
        
        <Link href="/settings" style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItem
            component="div"
            onClick={() => setDrawerOpen(false)}
            className="menu-item transition-all hover-lift"
            sx={{
              mx: 1,
              borderRadius: 1,
              mb: 0.5,
              cursor: 'pointer',
              backgroundColor: pathname === '/settings' ? '#f8f9fa' : 'transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: 'action.hover',
                transform: 'translateX(8px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              },
              '&:active': {
                backgroundColor: '#f0f0f0 !important',
                transform: 'scale(0.98)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: pathname === '/settings' ? '4px' : '0',
                backgroundColor: 'primary.main',
                transition: 'width 0.3s ease',
              }
            }}
          >
            <ListItemIcon sx={{ color: pathname === '/settings' ? 'primary.main' : 'text.secondary' }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="الإعدادات"
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: pathname === '/settings' ? 600 : 400,
                  color: pathname === '/settings' ? 'primary.main' : 'text.primary'
                }
              }}
            />
          </ListItem>
        </Link>
      </List>
    </Box>
  );

  return (
    <ClientOnly fallback={
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="فتح القائمة"
            edge="start"
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: '1.5rem',
              mr: '20px'
            }}
          >
            تطبيق إدارة شؤون الأستاذ
          </Typography>
        </Toolbar>
      </AppBar>
    }>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          {!isHomePage && (
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="العودة للرئيسية"
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Link>
          )}

          <IconButton
            color="inherit"
            aria-label="فتح القائمة"
            edge="start"
            onClick={handleDrawerToggle}
            className="btn-animated btn-press transition-all hover-scale"
            sx={{
              mr: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.1)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: isMobile ? '1.125rem' : '1.5rem',
              mr: '20px'
            }}
          >
            {getPageTitle()}
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '& .MuiBackdrop-root': {
            transition: 'opacity 0.3s ease',
          }
        }}
      >
        {drawer}
      </Drawer>
    </ClientOnly>
  );
}
