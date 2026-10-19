import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles.css";

import ReviewLanding from "./pages/customer/ReviewLanding";
import ThanksPage from "./pages/customer/ThanksPage";
import RecoveryFlow from "./pages/customer/RecoveryFlow";
import CouponClaimed from "./pages/customer/CouponClaimed";
import Privacy from "./pages/Privacy";

import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import RequireAuth from "./pages/auth/RequireAuth";
import ConfigGate from "./components/ConfigGate";
import { UiProvider } from "./components/ui";

import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Onboarding from "./pages/dashboard/Onboarding";
import Admin from "./pages/dashboard/Admin";
import ReviewsPage from "./pages/dashboard/Reviews";
import NegativePage from "./pages/dashboard/Negative";
import CouponsPage from "./pages/dashboard/Coupons";
import PlatformsPage from "./pages/dashboard/Platforms";
import QrCodesPage from "./pages/dashboard/QrCodes";
import SettingsPage from "./pages/dashboard/Settings";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigGate>
    <UiProvider>
    <BrowserRouter>
      <Routes>
        {/* Public customer flow */}
        <Route path="/r/:businessSlug" element={<ReviewLanding />} />
        <Route path="/r/:businessSlug/thanks" element={<ThanksPage />} />
        <Route path="/r/:businessSlug/recovery" element={<RecoveryFlow />} />
        <Route path="/r/:businessSlug/coupon" element={<CouponClaimed />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Authenticated dashboard */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Overview />} />
          <Route path="new" element={<Onboarding />} />
          <Route path="admin" element={<Admin />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="negative" element={<NegativePage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="platforms" element={<PlatformsPage />} />
          <Route path="qr" element={<QrCodesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<div className="p-8 text-center">404</div>} />
      </Routes>
    </BrowserRouter>
    </UiProvider>
    </ConfigGate>
  </React.StrictMode>
);
