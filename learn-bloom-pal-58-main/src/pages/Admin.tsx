import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AdminDashboard from "@/components/admin/AdminDashboard";
import CourseManagement from "@/components/admin/CourseManagement";
import StudentManagement from "@/components/admin/StudentManagement";
import AssignmentManagement from "@/components/admin/AssignmentManagement";
import AnalyticsCenter from "@/components/admin/AnalyticsCenter";
import SystemSettings from "@/components/admin/SystemSettings";
import SessionManagement from "./SessionManagement";

const Admin = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // 根据当前路径确定要显示的组件
  const getActiveComponent = () => {
    if (currentPath === "/admin" || currentPath === "/admin/") return "dashboard";
    if (currentPath.includes("/courses")) return "courses";
    if (currentPath.includes("/students")) return "students";
    if (currentPath.includes("/assignments")) return "assignments";
    if (currentPath.includes("/sessions")) return "sessions";
    if (currentPath.includes("/analytics")) return "analytics";
    if (currentPath.includes("/settings")) return "settings";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getActiveComponent());

  // 当路径变化时更新活跃标签页
  useEffect(() => {
    setActiveTab(getActiveComponent());
  }, [currentPath]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "courses":
        return <CourseManagement />;
      case "students":
        return <StudentManagement />;
      case "assignments":
        return <AssignmentManagement />;
      case "sessions":
        return <SessionManagement />;
      case "analytics":
        return <AnalyticsCenter />;
      case "settings":
        return <SystemSettings />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Content based on current route */}
      {renderContent()}
    </div>
  );
};

export default Admin;