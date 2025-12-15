import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// NEW IMPORTS for MUI Date Pickers
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Existing Imports
import Layout from "../components/Layout.jsx/Layout";
import DashboardPage from "../pages/DashboardPage";
import SettingsPage from "../pages/SettingPage";
import Home from "../pages/Home";
import QrCodeGenerator from "../components/QrCodeGenerator";
import LoginPage from "../pages/LoginPage";
import ExcelUploadPage from "../components/upload/UploadPage";
import EnatDashboard from "../components/Enat/EnatDashboard";
import FerrovitDashboard from "../components/Ferrovit/FerrovitDashboard";
import GlucomealDashboard from "../components/Glucomeal/GlucomealDashboard";
import PrivateRoute from "../components/PrivateRoute";
import NotificationPage from "../components/Noti/NotificationPage";
import BlogPage from "../components/blog/BlogPage";
import ReportingPage from "../components/Report/ReportingPage";
import OpenAds from "../components/openads/OpenAds";
import ChannelAds from "../components/channel/ChannelAds";
import UserTable from "../components/Users/UserPage";

export const RouterComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* PUBLIC ROUTES */}
      <Route path="/glucomeal" element={<Home />} />
      <Route path="/qr" element={<QrCodeGenerator />} />
      <Route path="/login" element={<LoginPage />} />

      {/* The LocalizationProvider is placed here, wrapping the PrivateRoute 
        section, ensuring all components inside the layout (including UserTable) 
        have access to the date context.
      */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Layout />
            </LocalizationProvider>
          </PrivateRoute>
        }
      >
        <Route index element={<ReportingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="upload" element={<ReportingPage />} />
        <Route path="noti" element={<NotificationPage />} />
        <Route path="blogs" element={<BlogPage />} />
        <Route path="ads" element={<OpenAds />} />
        <Route path="channel" element={<ChannelAds />} />
        <Route path="user" element={<UserTable />} />
      </Route>
    </Routes>
  );
};
