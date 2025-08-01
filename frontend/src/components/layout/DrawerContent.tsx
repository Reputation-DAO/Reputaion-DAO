import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { navItems } from './navItems';
import {
  Help as HelpIcon,
  QuestionAnswer as FAQIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const DrawerContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        py: 2,
        overflowY: 'auto',
        scrollbarWidth: 'none', // Firefox
        '&::-webkit-scrollbar': {
          display: 'none', // Chrome, Safari, Edge
        },
      }}
    >
      {/* Profile Section */}
      <Box
        sx={{
          p: 3,
          mt: 8,
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            JD
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body1"
              sx={{
                color: 'hsl(var(--foreground))',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              John Doe
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'hsl(var(--muted-foreground))',
                fontSize: '0.75rem',
              }}
            >
              Active Member
            </Typography>
          </Box>
          <IconButton
            sx={{
              color: 'hsl(var(--muted-foreground))',
              '&:hover': { color: 'hsl(var(--foreground))' },
              p: 0.5,
            }}
          >
            <SettingsIcon sx={{ fontSize: '18px' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, py: 2 }}>
        <List sx={{ p: 0 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 2, mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    px: 2,
                    minHeight: 'unset',
                    backgroundColor: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                    border: isActive ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid transparent',
                    '&:hover': {
                      backgroundColor: isActive
                        ? 'hsl(var(--primary) / 0.15)'
                        : 'hsl(var(--muted) / 0.5)',
                      border: '1px solid hsl(var(--primary) / 0.2)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      '& .MuiSvgIcon-root': {
                        fontSize: '20px',
                      },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.8)',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Help & FAQs Section */}
      <Box
        sx={{
          borderTop: '1px solid hsl(var(--border))',
          p: 2,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: 'hsl(var(--muted-foreground))',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            px: 2,
            mb: 1,
            display: 'block',
          }}
        >
          SUPPORT
        </Typography>
        <List sx={{ p: 0 }}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              sx={{
                borderRadius: 2,
                py: 1,
                px: 2,
                minHeight: 'unset',
                '&:hover': {
                  backgroundColor: 'hsl(var(--muted) / 0.5)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: 'hsl(var(--muted-foreground))',
                  '& .MuiSvgIcon-root': {
                    fontSize: '18px',
                  },
                }}
              >
                <HelpIcon />
              </ListItemIcon>
              <ListItemText
                primary="Help Center"
                primaryTypographyProps={{
                  sx: {
                    fontSize: '0.8rem',
                    color: 'hsl(var(--foreground) / 0.8)',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              sx={{
                borderRadius: 2,
                py: 1,
                px: 2,
                minHeight: 'unset',
                '&:hover': {
                  backgroundColor: 'hsl(var(--muted) / 0.5)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: 'hsl(var(--muted-foreground))',
                  '& .MuiSvgIcon-root': {
                    fontSize: '18px',
                  },
                }}
              >
                <FAQIcon />
              </ListItemIcon>
              <ListItemText
                primary="FAQs"
                primaryTypographyProps={{
                  sx: {
                    fontSize: '0.8rem',
                    color: 'hsl(var(--foreground) / 0.8)',
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  );
};

export default DrawerContent;
