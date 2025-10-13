import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const location = useLocation();

  // 简单检查localStorage中的认证信息
  const authToken = localStorage.getItem('auth_token');
  const userRole = localStorage.getItem('user_role');

  console.log('ProtectedRoute: 检查认证状态', {
    path: location.pathname,
    authToken: !!authToken,
    userRole,
    requiredRole
  });

  // 检查是否已认证
  if (!authToken) {
    console.log('ProtectedRoute: 未认证，重定向到登录页');
    if (requiredRole === 'admin') {
      return <Navigate to="/admin-login" state={{ from: location }} replace />;
    } else {
      return <Navigate to="/student-login" state={{ from: location }} replace />;
    }
  }

  // 检查角色权限
  if (requiredRole && userRole !== requiredRole) {
    console.log('ProtectedRoute: 角色不匹配', { userRole, requiredRole });
    if (requiredRole === 'admin') {
      return <Navigate to="/admin-login" replace />;
    } else {
      return <Navigate to="/student-login" replace />;
    }
  }

  console.log('ProtectedRoute: 认证和角色检查通过，渲染子组件');
  return <>{children}</>;
};

export default ProtectedRoute;
