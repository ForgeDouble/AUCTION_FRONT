import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string; // 로그인된 경우 리다이렉트할 경로
}

const PublicRoute = ({ children, redirectTo = "/" }: PublicRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  // 로딩 중일 때는 아무것도 렌더링하지 않음
  if (loading) {
    return null;
  }

  // 이미 로그인된 경우 지정된 경로로 리다이렉트
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // 로그인되지 않은 경우 자식 컴포넌트 렌더링 (로그인 페이지 등)
  return <>{children}</>;
};

export default PublicRoute;
