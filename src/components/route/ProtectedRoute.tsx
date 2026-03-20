import { Navigate, useLocation } from "react-router-dom";
import { type ReactNode } from "react";
import type { Authority } from "@/type/CommonType";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Authority[];
  requireAuth?: boolean;
}

function isAuthority(value: string): value is Authority {
  return ["ADMIN", "USER", "INQUIRY"].includes(value);
}

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requireAuth = true,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { authority, loading, isAuthenticated } = useAuth();

  if (loading) {
    return null;
  }

  // 로그인이 필요한데 로그인되지 않은 경우
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 특정 권한이 필요한데 권한이 없는 경우
  if (
    allowedRoles.length > 0 &&
    authority &&
    (!isAuthority(authority) || !allowedRoles.includes(authority))
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;