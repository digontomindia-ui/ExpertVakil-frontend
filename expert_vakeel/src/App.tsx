import { useLocation, matchPath } from "react-router-dom";
import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import Footer from "./components/footer";
import Header from "./components/header";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Import sync utility for development
import './utils/syncClientProfile';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Small delay to ensure the page has rendered before scrolling
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' // Use instant instead of smooth for immediate scroll
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}

// API Configuration
const baseURL= "https://api.legalnetwork.in";

// Types
interface ApiResponse<T> { success: boolean; data: T; error?: string; }
type Id = string;

// API Service
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${baseURL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let data: ApiResponse<T>;
  try { data = await res.json(); } catch { throw new Error("Invalid server response"); }
  if (!res.ok || !data.success) throw new Error(data.error || "API request failed");
  return data.data;
}

export const apiService = {
  clients: {
    register: (data: Record<string, unknown>) => request("/api/clients", { method: "POST", body: JSON.stringify(data) }),
    login: (data: Record<string, unknown>) => request("/api/clients/login", { method: "POST", body: JSON.stringify(data) }),
    logout: () => request("/api/clients/logout", { method: "POST" }),
    getMe: () => request("/api/clients/me"),
    getAll: () => request("/api/clients"),
    getById: (id: Id) => request(`/api/clients/${id}`),
    update: (id: Id, data: Record<string, unknown>) => request(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: Id) => request(`/api/clients/${id}`, { method: "DELETE" }),
    deleteAll: () => request("/api/clients", { method: "DELETE" }),
  },
  users: {
    create: (data: Record<string, unknown>) => request("/api/users", { method: "POST", body: JSON.stringify(data) }),
    getAll: () => request("/api/users"),
    getById: (id: Id) => request(`/api/users/${id}`),
    update: (id: Id, data: Record<string, unknown>) => request(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: Id) => request(`/api/users/${id}`, { method: "DELETE" }),
    deleteAll: () => request("/api/users", { method: "DELETE" }),
  },
  queries: {
    create: (data: Record<string, unknown>) => request("/api/queries", { method: "POST", body: JSON.stringify(data) }),
    getAll: () => request("/api/queries"),
    getByUserId: (userId: Id) => request(`/api/queries/user/${userId}`),
    getById: (id: Id) => request(`/api/queries/${id}`),
    update: (id: Id, data: Record<string, unknown>) => request(`/api/queries/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: Id) => request(`/api/queries/${id}`, { method: "DELETE" }),
    deleteAll: () => request("/api/queries", { method: "DELETE" }),
  },
  support: {
    submit: (data: Record<string, unknown>) => request("/api/support", { method: "POST", body: JSON.stringify(data) }),
    getAll: () => request("/api/support"),
    getById: (id: Id) => request(`/api/support/${id}`),
    update: (id: Id, data: Record<string, unknown>) => request(`/api/support/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: Id) => request(`/api/support/${id}`, { method: "DELETE" }),
  },
  news: {
    create: (data: Record<string, unknown>) => request("/api/news", { method: "POST", body: JSON.stringify(data) }),
    getAll: (params?: Record<string, unknown>) => {
      const query = params ? `?${new URLSearchParams(params as any)}` : "";
      return request(`/api/news${query}`);
    },
    getById: (id: Id) => request(`/api/news/${id}`),
    update: (id: Id, data: Record<string, unknown>) => request(`/api/news/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: Id) => request(`/api/news/${id}`, { method: "DELETE" }),
    deleteAll: () => request("/api/news", { method: "DELETE" }),
    incrementViews: (id: Id) => request(`/api/news/${id}/views/increment`, { method: "POST" }),
  },
  general: {
    getApiInfo: () => request("/"),
    testProtected: () => request("/api/protected"),
  },
};

// App Shell
const HIDE_CHROME_PATTERNS = ["/login", "/signup", "/auth/login", "/auth/register"];

function AppShell() {
  const { pathname } = useLocation();
  const hideChrome = HIDE_CHROME_PATTERNS.some((p) => matchPath(p, pathname));

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {!hideChrome && <Header />}
      <main className="flex-1"><AppRoutes /></main>
      {!hideChrome && <Footer />}
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
