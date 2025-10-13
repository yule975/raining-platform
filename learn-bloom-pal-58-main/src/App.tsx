import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SessionProvider } from "./contexts/SessionContext";
import { LoadingProvider } from "./contexts/LoadingContext";
import { GlobalLoadingIndicator } from "./components/ui/GlobalLoadingIndicator";
import Layout from "./components/Layout";
import StudentLayout from "./components/StudentLayout";
import Login from "./pages/Login";
import StudentLogin from "./pages/StudentLogin";
import AdminLogin from "./pages/AdminLogin";
// import SimpleAdminLogin from "./pages/SimpleAdminLogin";
import Invitation from "./pages/Invitation";
import Dashboard from "./pages/Dashboard";
import SessionSelection from "./pages/SessionSelection";
import Courses from "./pages/Courses";
import MyLearning from "./pages/MyLearning";
import CourseDetail from "./pages/CourseDetail";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import CourseManagement from "./pages/CourseManagement";
import StudentManagement from "./pages/StudentManagement";
import SessionManagement from "./pages/SessionManagement";
import AssignmentManagement from "./pages/admin/AssignmentManagement";
import StudentAssignments from "./pages/student/StudentAssignments";
import DataDebug from "./pages/DataDebug";
import SupabaseTest from "./pages/SupabaseTest";
import SystemSetup from "./pages/SystemSetup";
import LoginDebug from "./pages/LoginDebug";

import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import SimpleProtectedRoute from "./components/SimpleProtectedRoute";
import NetworkStatus, { NetworkIndicator } from "./components/NetworkStatus";
import { SessionStatusService } from "./services/sessionStatusService";

const queryClient = new QueryClient();

function App() {
  // 初始化期次状态自动更新服务
  useEffect(() => {
    SessionStatusService.startAutoUpdate();
    
    // 组件卸载时停止服务
    return () => {
      SessionStatusService.stopAutoUpdate();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LoadingProvider>
          <AuthProvider>
            <SessionProvider>
              <TooltipProvider>
              <GlobalLoadingIndicator />
              <NetworkStatus />
              <NetworkIndicator />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
            {/* Login Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/login-debug" element={<LoginDebug />} />
            <Route path="/invitation" element={<Invitation />} />
            
            {/* System Setup Route */}
            <Route path="/setup" element={<SystemSetup />} />
            
            {/* Student Session Selection */}
            <Route path="/student/session-selection" element={
              <ProtectedRoute requiredRole="student">
                <SessionSelection />
              </ProtectedRoute>
            } />
            
            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute requiredRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="course/:courseId" element={<CourseDetail />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="my-learning" element={<MyLearning />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<CourseManagement />} />
              <Route path="dashboard" element={<Admin />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="sessions" element={<SessionManagement />} />
              <Route path="assignments" element={<AssignmentManagement />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="debug" element={<DataDebug />} />
              <Route path="supabase-test" element={<SupabaseTest />} />

              <Route path="users" element={<Admin />} />
              <Route path="analytics" element={<Admin />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Root redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              </TooltipProvider>
            </SessionProvider>
          </AuthProvider>
        </LoadingProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;