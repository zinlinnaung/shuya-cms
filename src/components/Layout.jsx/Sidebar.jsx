// Sidebar.jsx
import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import { Link, useLocation } from "react-router-dom";
import { logout } from "../utils/auth";
import NotificationAddIcon from "@mui/icons-material/NotificationAdd";
import BookIcon from "@mui/icons-material/Book";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import SmartDisplayIcon from "@mui/icons-material/SmartDisplay";
import GroupIcon from "@mui/icons-material/Group";

export const drawerWidth = 240;

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1090px)");

  // Colors matching the dashboard theme
  const selectedColor = "#ec407a"; // pink (#ec407a) for selected background
  const hoverColor = "#f48fb1"; // lighter pink (#f48fb1) for hover
  const textColor = "#d81b60"; // darker pink (#d81b60) for text/icons
  const sidebarBg = "#fff0f5"; // very light pink background (#fff0f5)
  const headerBg = "#fce4ec"; // soft pale pink for header (#fce4ec)

  const menuItems = [
    // { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard/upload" },
    {
      text: "Notification",
      icon: <NotificationAddIcon />,
      path: "/dashboard/noti",
    },
    {
      text: "Blogs",
      icon: <BookIcon />,
      path: "/dashboard/blogs",
    },
    {
      text: "Open Ads",
      icon: <LiveTvIcon />,
      path: "/dashboard/ads",
    },
    {
      text: "Channel Ads",
      icon: <SmartDisplayIcon />,
      path: "/dashboard/channel",
    },
    {
      text: "Users",
      icon: <GroupIcon />,
      path: "/dashboard/user",
    },
  ];

  const handleDrawerToggle = () => setOpen(!open);

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Top Section: Logo + Navigation */}
      <Box>
        <Box
          sx={{
            p: 2,
            textAlign: "center",
            // borderBottom: "1px solid #f48fb1",
            backgroundColor: "#f48fb1",
          }}
        >
          <Typography variant="h6" fontWeight="bold" color={textColor}>
            Shuya Dashboard
          </Typography>
        </Box>

        <List sx={{ mt: 2 }}>
          {menuItems.map(({ text, icon, path }) => (
            <ListItem
              button
              key={text}
              component={Link}
              to={path}
              selected={location.pathname === path}
              onClick={isMobile ? handleDrawerToggle : undefined}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: selectedColor,
                  "& .MuiListItemText-primary": {
                    fontWeight: "bold",
                    color: "#fff",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "#fff",
                  },
                },
                "&:hover": {
                  backgroundColor: hoverColor,
                  "& .MuiListItemText-primary": {
                    color: "#fff",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "#fff",
                  },
                },
                "& .MuiListItemText-root": {
                  color: textColor,
                },
                "& .MuiListItemIcon-root": {
                  color: textColor,
                },
              }}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Bottom Section: Logout */}
      <Box>
        <List>
          <ListItem
            button
            onClick={logout}
            sx={{
              "&:hover": {
                backgroundColor: hoverColor,
                "& .MuiListItemText-primary": {
                  color: "#fff",
                },
                "& .MuiListItemIcon-root": {
                  color: "#fff",
                },
              },
              "& .MuiListItemText-root": {
                color: textColor,
              },
              "& .MuiListItemIcon-root": {
                color: textColor,
              },
            }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            color: textColor,
            position: "fixed",
            top: 10,
            left: 10,
            zIndex: 1301,
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? open : true}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: sidebarBg,
            color: textColor,
          },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
