import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
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

export const RouterComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* PRIVATE ROUTES */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<ReportingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="upload" element={<ReportingPage />} />
        <Route path="noti" element={<NotificationPage />} />
        <Route path="blogs" element={<BlogPage />} />
        <Route path="ferrovit" element={<FerrovitDashboard />} />
      </Route>

      {/* PUBLIC ROUTES */}
      <Route path="/glucomeal" element={<Home />} />
      <Route path="/qr" element={<QrCodeGenerator />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
};
