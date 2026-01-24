"use client";
import React, { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users as UsersIcon,
  PackageSearch,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  AmpersandIcon,
  MessageSquare,
} from "lucide-react";
import logo from '../assets/logo.jpg';
import * as Panels from "./panels"; // { Dashboard, Lawyers, Orders, Reports, Docs, Settings }
import { useAuth } from "../config/auth";
import { useNavigate } from "react-router-dom";

type PanelKey = keyof typeof Panels;

export default function AdminSidebarShell() {
  const { hasAccess, logout, user } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<PanelKey>("Dashboard");
  const [collapsed, setCollapsed] = useState(false);

  // Filter navigation based on user permissions
  const filteredNav = useMemo(() => {
    console.log('🔍 Filtering navigation for user:', user);
    const filtered = ALL_NAV.filter(navItem => {
      if (navItem.key === "Dashboard") {
        console.log(`✅ ${navItem.key}: Always allowed (Dashboard)`);
        return true; // Dashboard is always accessible
      }
      const allowed = hasAccess(navItem.key);
      console.log(`${allowed ? '✅' : '❌'} ${navItem.key}: ${allowed ? 'Allowed' : 'Denied'}`);
      return allowed;
    });
    console.log('📋 Final filtered navigation:', filtered.map(n => n.key));
    return filtered;
  }, [hasAccess, user]);

  const ActiveComponent = useMemo(() => {
    return (Panels[active] as React.ComponentType) || Panels.Dashboard;
  }, [active]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside
        className={`sticky top-0 z-20 h-screen border-r border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-all duration-300 ${collapsed ? "w-[84px]" : "w-72"
          }`}
      >
        {/* Brand + Collapse */}
        <div className="flex items-center justify-between px-3 py-3">
          <div className=" items-center gap-2">
            <img
              src={logo}
              alt="Logo"
              className="h-20 w-30 object-contain"
            />

          </div>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-xl border border-gray-200 bg-white p-2 hover:bg-gray-50"
            aria-label="Toggle sidebar"
            title="Toggle sidebar (Ctrl/Cmd + B)"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* User Role Badge */}
        {!collapsed && user && (
          <div className="mx-2 mt-3 mb-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                ? 'bg-green-100 text-green-800'
                : 'bg-blue-100 text-blue-800'
                }`}>
                {user.role === 'admin' ? '👑 Admin' : '🔧 SubAdmin'}
              </span>
              {user.role === 'subAdmin' && (
                <span className="text-xs text-gray-600">
                  {user.allowedTabs?.length || 0} tabs
                </span>
              )}
            </div>
            {user.role === 'subAdmin' && user.allowedTabs && user.allowedTabs.length > 0 && (
              <div className="mt-1 text-xs text-gray-600">
                Access: {user.allowedTabs.slice(0, 2).join(', ')}{user.allowedTabs.length > 2 ? '...' : ''}
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="mt-3 space-y-1 px-2">
          {filteredNav.length === 0 ? (
            !collapsed && (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-amber-600 font-medium">⚠️ No tabs accessible</p>
                <p className="text-xs text-gray-500 mt-1">Contact your admin</p>
              </div>
            )
          ) : (
            filteredNav.map(({ key, label, icon: Icon }) => {
              const isActive = key === active;
              return (
                <button
                  key={key}
                  onClick={() => setActive(key as PanelKey)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-gray-900 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"}`} />
                  {!collapsed && <span className="truncate">{label}</span>}

                  {collapsed && (
                    <span className="pointer-events-none absolute left-[72px] -translate-y-1/2 rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-md transition group-hover:opacity-100">
                      {label}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-3">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 ${collapsed ? "justify-center" : "justify-between"}`}
          >
            {!collapsed && <span className="text-gray-700">Logout</span>}
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1">
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="text-xs uppercase tracking-wider text-gray-500">Current</div>
              <div className="rounded-full bg-gray-900/10 px-3 py-1 text-sm font-medium text-gray-900">
                {active}
              </div>
            </div>
            <div className="hidden text-xs text-gray-500 sm:block">Toggle sidebar: Ctrl/⌘ + B</div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}

/**
 * IMPORTANT: SubAdmin allowedTabs Configuration
 *
 * When creating/updating a SubAdmin, use these EXACT key values in the allowedTabs array:
 * Valid keys: ["Lawyers", "Clients", "Cases", "News", "Queries", "Support", "Admins", "SubAdmins", "Blogs", "Notifications", "Services", "BookedServices", "DeleteRequests"]
 *
 * Example for a SubAdmin with access to Lawyers, Clients, News, and Support:
 * allowedTabs: ["Lawyers", "Clients", "News", "Support"]
 *
 * Note: "Dashboard" is always accessible and doesn't need to be in allowedTabs
 */
const ALL_NAV = [
  { key: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "Lawyers", label: "Lawyers", icon: UsersIcon },
  { key: "Clients", label: "Clients", icon: UsersIcon },
  { key: "Cases", label: "Case Diary", icon: PackageSearch },
  { key: "News", label: "News", icon: PackageSearch },
  { key: "Queries", label: "Queries", icon: BarChart3 },
  { key: "Support", label: "Support", icon: MessageSquare },
  { key: "Admins", label: "Admins", icon: AmpersandIcon },
  { key: "SubAdmins", label: "SubAdmins", icon: AmpersandIcon },
  { key: "Blogs", label: "Blogs", icon: AmpersandIcon },
  { key: "Notifications", label: "Notifications", icon: AmpersandIcon },
  { key: "Services", label: "Services", icon: PackageSearch },
  { key: "BookedServices", label: "Booked Services", icon: MessageSquare },
  { key: "DeleteRequests", label: "Delete Requests", icon: LogOut },
] as const;
