import React, { useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme as useMuiTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Forum,
  Message,
  Person,
  Topic,
  Quiz,
  SmartToy,
  Notifications,
  Logout,
  School,
  LightMode,
  DarkMode,
  Assignment,
  CloudUpload,
  Settings,
  Help,
  TrendingUp,
  People,
  PersonAdd,
  AdminPanelSettings,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import NotificationCenter from "./NotificationCenter";

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    console.log("Logout button clicked");
    try {
      await logout();
      console.log("Logout successful");
      handleProfileMenuClose();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getNavigationItems = () => {
    const baseItems = [
      { text: "Dashboard", icon: <Dashboard />, path: "/" },
      { text: "Forum", icon: <Forum />, path: "/forum" },
      { text: "Messages", icon: <Message />, path: "/messages" },
      { text: "Profile", icon: <Person />, path: "/profile" },
      { text: "Topics", icon: <Topic />, path: "/topics" },
      { text: "Questions", icon: <Quiz />, path: "/questions" },
      { text: "AI Assistant", icon: <SmartToy />, path: "/chatbot" },
      { text: "Resources", icon: <CloudUpload />, path: "/resources" },
      { text: "Trending", icon: <TrendingUp />, path: "/trending" },
      { text: "FAQ", icon: <Help />, path: "/faq" },
    ];

    if (user?.role === "student") {
      baseItems.splice(1, 0, {
        text: "Tutor Matching",
        icon: <People />,
        path: "/tutor-matching",
      });
      baseItems.splice(2, 0, {
        text: "Apply as Tutor",
        icon: <School />,
        path: "/tutor-application",
      });
    }

    if (user?.role === "tutor") {
      baseItems.splice(1, 0, {
        text: "Tutor Matching",
        icon: <People />,
        path: "/tutor-matching",
      });
      baseItems.splice(2, 0, {
        text: "Escalations",
        icon: <Assignment />,
        path: "/tutor/escalations",
      });
    }

    if (user?.role === "admin") {
      baseItems.splice(1, 0, {
        text: "Forum Moderation",
        icon: <AdminPanelSettings />,
        path: "/forum/moderation",
      });
      baseItems.splice(2, 0, {
        text: "Tutor Applications",
        icon: <PersonAdd />,
        path: "/tutor-applications",
      });
      baseItems.splice(3, 0, {
        text: "Tutor Module Assignment",
        icon: <Assignment />,
        path: "/tutor-module-assignment",
      });
      baseItems.splice(3, 0, {
        text: "Admin Panel",
        icon: <School />,
        path: "/admin",
      });
      baseItems.push({
        text: "Escalation Management",
        icon: <Assignment />,
        path: "/admin/escalations",
      });
      baseItems.push({
        text: "Notifications",
        icon: <Settings />,
        path: "/notifications",
      });
    }

    // Add tutor registration for students
    if (user?.role === "student") {
      baseItems.push({
        text: "Become a Tutor",
        icon: <Assignment />,
        path: "/tutor-registration",
      });
    }

    return baseItems;
  };

  const drawer = (
    <div>
      <Toolbar
        sx={{
          background:
            theme.palette.mode === "light"
              ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              : "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
          color: "white",
          borderRadius: "0 20px 0 0",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <img
            src="/logo.svg"
            alt="CampusLearn"
            style={{ height: "32px", filter: "brightness(0) invert(1)" }}
          />
        </Box>
      </Toolbar>
      <List>
        {getNavigationItems().map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
              sx={{
                mx: 1,
                borderRadius: 3,
                mb: 0.5,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "light"
                      ? "rgba(99, 102, 241, 0.08)"
                      : "rgba(139, 92, 246, 0.2)",
                  transform: "translateX(4px)",
                },
                "&.Mui-selected": {
                  background:
                    theme.palette.mode === "light"
                      ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                      : "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
                  color: "white",
                  boxShadow:
                    theme.palette.mode === "light"
                      ? "0 4px 12px rgba(99, 102, 241, 0.3)"
                      : "0 4px 12px rgba(139, 92, 246, 0.4)",
                  "&:hover": {
                    background:
                      theme.palette.mode === "light"
                        ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
                        : "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
                    transform: "translateX(4px)",
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          background:
            theme.palette.mode === "light"
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(26, 26, 46, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom:
            theme.palette.mode === "light"
              ? "1px solid rgba(0,0,0,0.1)"
              : "1px solid rgba(255,255,255,0.1)",
          boxShadow:
            theme.palette.mode === "light"
              ? "0 1px 20px rgba(0,0,0,0.1)"
              : "0 1px 20px rgba(0,0,0,0.2)",
          color:
            theme.palette.mode === "light"
              ? theme.palette.text.primary
              : "white",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { md: "none" },
              color:
                theme.palette.mode === "light"
                  ? theme.palette.text.primary
                  : "white",
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getNavigationItems().find(
              (item) => item.path === location.pathname
            )?.text || "Dashboard"}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => setNotificationOpen(true)}
              sx={{
                color:
                  theme.palette.mode === "light"
                    ? theme.palette.text.primary
                    : "white",
              }}
            >
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              aria-label="toggle theme"
              sx={{
                color:
                  theme.palette.mode === "light"
                    ? theme.palette.text.primary
                    : "white",
              }}
            >
              {mode === "light" ? <DarkMode /> : <LightMode />}
            </IconButton>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem
                onClick={() => {
                  navigate("/profile");
                  handleProfileMenuClose();
                }}
              >
                <Person sx={{ mr: 1 }} />
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>

      <NotificationCenter
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </Box>
  );
};

export default Layout;
