

import { useEffect, useState } from 'react';
import { UsersAPI, NewsAPI, QueriesAPI, ClientsAPI, BlogsAPI, NotificationsAPI, AdminsAPI, SubAdminsAPI } from '../../config/api';
import { useAuth } from '../../config/auth';
import { Link } from 'react-router-dom';

// Utility function to parse various date formats
function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  try {
    // Handle Firestore timestamp format
    if (typeof dateValue === 'object' && dateValue._seconds) {
      return new Date(dateValue._seconds * 1000);
    }

    // Handle string dates
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Handle Date objects
    if (dateValue instanceof Date) {
      return dateValue;
    }

    return null;
  } catch {
    return null;
  }
}

// Utility function to get relative time
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 0) return 'In the future';
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    lawyers: { count: 0, loading: true, error: null as string | null },
    clients: { count: 0, loading: true, error: null as string | null },
    news: { count: 0, loading: true, error: null as string | null },
    blogs: { count: 0, loading: true, error: null as string | null },
    notifications: { count: 0, loading: true, error: null as string | null },
    queries: { count: 0, loading: true, error: null as string | null },
    admins: { count: 0, loading: true, error: null as string | null },
    subadmins: { count: 0, loading: true, error: null as string | null },
    recentLawyers: { data: [] as any[], loading: true, error: null as string | null }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all data in parallel
        const [
          lawyersResponse,
          clientsResponse,
          newsResponse,
          blogsResponse,
          notificationsResponse,
          queriesResponse,
          adminsResponse,
          subadminsResponse
        ] = await Promise.allSettled([
          UsersAPI.list(),
          ClientsAPI.list(),
          NewsAPI.list(),
          BlogsAPI.list(),
          NotificationsAPI.list(),
          QueriesAPI.listAll(),
          AdminsAPI.list(),
          SubAdminsAPI.list()
        ]);

        // Update lawyers data
        if (lawyersResponse.status === 'fulfilled' && lawyersResponse.value.success) {
          const lawyersData = lawyersResponse.value.data || [];
          const sortedLawyers = lawyersData
            .sort((a: any, b: any) => {
              const aDate = parseDate(a.createdAt)?.getTime() || 0;
              const bDate = parseDate(b.createdAt)?.getTime() || 0;
              return bDate - aDate; // Most recent first
            })
            .slice(0, 5); // Get top 5 recent lawyers

          setDashboardData(prev => ({
            ...prev,
            lawyers: {
              count: lawyersData.length,
              loading: false,
              error: null
            },
            recentLawyers: {
              data: sortedLawyers,
              loading: false,
              error: null
            }
          }));
        } else {
          setDashboardData(prev => ({
            ...prev,
            lawyers: {
              count: 0,
              loading: false,
              error: lawyersResponse.status === 'rejected' ? lawyersResponse.reason.message : 'Failed to load lawyers'
            },
            recentLawyers: {
              data: [],
              loading: false,
              error: lawyersResponse.status === 'rejected' ? lawyersResponse.reason.message : 'Failed to load recent lawyers'
            }
          }));
        }

        // Update news data
        if (newsResponse.status === 'fulfilled' && newsResponse.value.success) {
          setDashboardData(prev => ({
            ...prev,
            news: {
              count: newsResponse.value.data?.length || 0,
              loading: false,
              error: null
            }
          }));
        } else {
          setDashboardData(prev => ({
            ...prev,
            news: {
              count: 0,
              loading: false,
              error: newsResponse.status === 'rejected' ? newsResponse.reason.message : 'Failed to load news'
            }
          }));
        }

        // Update clients data
        if (clientsResponse.status === 'fulfilled' && clientsResponse.value.success) {
          setDashboardData(prev => ({
            ...prev,
            clients: {
              count: clientsResponse.value.data?.length || 0,
              loading: false,
              error: null
            }
          }));
        } else {
          setDashboardData(prev => ({
            ...prev,
            clients: {
              count: 0,
              loading: false,
              error: clientsResponse.status === 'rejected' ? clientsResponse.reason.message : 'Failed to load clients'
            }
          }));
        }

        // Update blogs data
        if (blogsResponse.status === 'fulfilled' && blogsResponse.value.success) {
          setDashboardData(prev => ({
            ...prev,
            blogs: {
              count: blogsResponse.value.data?.length || 0,
              loading: false,
              error: null
            }
          }));
        } else {
          setDashboardData(prev => ({
            ...prev,
            blogs: {
              count: 0,
              loading: false,
              error: blogsResponse.status === 'rejected' ? blogsResponse.reason.message : 'Failed to load blogs'
            }
          }));
        }

        // Update notifications data
        if (notificationsResponse.status === 'fulfilled' && notificationsResponse.value.success) {
          setDashboardData(prev => ({
            ...prev,
            notifications: {
              count: notificationsResponse.value.data?.length || 0,
              loading: false,
              error: null
            }
          }));
        } else {
          setDashboardData(prev => ({
            ...prev,
            notifications: {
              count: 0,
              loading: false,
              error: notificationsResponse.status === 'rejected' ? notificationsResponse.reason.message : 'Failed to load notifications'
            }
          }));
        }

        // Update queries data
        if (queriesResponse.status === 'fulfilled' && queriesResponse.value.success) {
          setDashboardData(prev => ({
            ...prev,
            queries: {
              count: queriesResponse.value.data?.length || 0,
              loading: false,
              error: null
            }
          }));
        } else {
          setDashboardData(prev => ({
            ...prev,
            queries: {
              count: 0,
              loading: false,
              error: queriesResponse.status === 'rejected' ? queriesResponse.reason.message : 'Failed to load queries'
            }
          }));
        }

        // Update admins data
        if (adminsResponse.status === 'fulfilled' && adminsResponse.value.success) {
          setDashboardData(prev => ({
            ...prev,
            admins: {
              count: adminsResponse.value.data?.length || 0,
              loading: false,
              error: null
            }
          }));
        } else {
          setDashboardData(prev => ({
            ...prev,
            admins: {
              count: 0,
              loading: false,
              error: adminsResponse.status === 'rejected' ? adminsResponse.reason.message : 'Failed to load admins'
            }
          }));
        }

        // Update subadmins data
        if (subadminsResponse.status === 'fulfilled' && subadminsResponse.value.success) {
          setDashboardData(prev => ({
            ...prev,
            subadmins: {
              count: subadminsResponse.value.data?.length || 0,
              loading: false,
              error: null
            }
          }));
        } else {
          setDashboardData(prev => ({
            ...prev,
            subadmins: {
              count: 0,
              loading: false,
              error: subadminsResponse.status === 'rejected' ? subadminsResponse.reason.message : 'Failed to load sub-admins'
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set error state for all if general error
        setDashboardData({
          lawyers: { count: 0, loading: false, error: 'Failed to load data' },
          clients: { count: 0, loading: false, error: 'Failed to load data' },
          news: { count: 0, loading: false, error: 'Failed to load data' },
          blogs: { count: 0, loading: false, error: 'Failed to load data' },
          notifications: { count: 0, loading: false, error: 'Failed to load data' },
          queries: { count: 0, loading: false, error: 'Failed to load data' },
          admins: { count: 0, loading: false, error: 'Failed to load data' },
          subadmins: { count: 0, loading: false, error: 'Failed to load data' },
          recentLawyers: { data: [], loading: false, error: 'Failed to load data' }
        });
      }
    };

    fetchDashboardData();
  }, []);

  const dashboardItems = [
    {
      title: "Lawyers",
      count: dashboardData.lawyers.count,
      loading: dashboardData.lawyers.loading,
      error: dashboardData.lawyers.error,
      progressWidth: "75%"
    },
    {
      title: "Clients",
      count: dashboardData.clients.count,
      loading: dashboardData.clients.loading,
      error: dashboardData.clients.error,
      progressWidth: "85%"
    },
    {
      title: "News",
      count: dashboardData.news.count,
      loading: dashboardData.news.loading,
      error: dashboardData.news.error,
      progressWidth: "60%"
    },
    {
      title: "Blogs",
      count: dashboardData.blogs.count,
      loading: dashboardData.blogs.loading,
      error: dashboardData.blogs.error,
      progressWidth: "45%"
    },
    {
      title: "Notifications",
      count: dashboardData.notifications.count,
      loading: dashboardData.notifications.loading,
      error: dashboardData.notifications.error,
      progressWidth: "30%"
    },
    {
      title: "Queries",
      count: dashboardData.queries.count,
      loading: dashboardData.queries.loading,
      error: dashboardData.queries.error,
      progressWidth: "55%"
    },
    {
      title: "Admins",
      count: dashboardData.admins.count,
      loading: dashboardData.admins.loading,
      error: dashboardData.admins.error,
      progressWidth: "20%"
    },
    {
      title: "Sub-Admins",
      count: dashboardData.subadmins.count,
      loading: dashboardData.subadmins.loading,
      error: dashboardData.subadmins.error,
      progressWidth: "15%"
    }
  ];

  // Calculate totals for summary
  const totalUsers = dashboardData.lawyers.count + dashboardData.clients.count;
  const totalContent = dashboardData.news.count + dashboardData.blogs.count + dashboardData.notifications.count;
  const totalAdmins = dashboardData.admins.count + dashboardData.subadmins.count;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Overview of your legal management system</p>
        </div>
        <div className="text-sm text-gray-600">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* User Permissions Debug Panel */}
      {user && (
        <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                <span>👤</span> Your Account Permissions
              </h3>
              <p className="text-sm text-indigo-700 mt-1">View your current role and access levels</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              user.role === 'admin' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {user.role === 'admin' ? '👑 Admin' : '🔧 Sub-Admin'}
            </span>
          </div>
          
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-indigo-100">
              <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">User Info</div>
              <div className="mt-2 space-y-1">
                <div className="text-sm"><span className="font-medium">Name:</span> {user.name}</div>
                <div className="text-sm"><span className="font-medium">Email:</span> {user.email}</div>
                <div className="text-sm"><span className="font-medium">ID:</span> <code className="text-xs bg-gray-100 px-1 rounded">{user.id}</code></div>
              </div>
            </div>
            
            <div className="rounded-xl bg-white p-4 shadow-sm border border-indigo-100">
              <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Allowed Tabs</div>
              <div className="mt-2">
                {user.role === 'admin' ? (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <span className="text-lg">✓</span>
                    <span className="font-medium">Full Access to All Tabs</span>
                  </div>
                ) : user.allowedTabs && user.allowedTabs.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {user.allowedTabs.map((tab, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs font-medium border border-indigo-200"
                      >
                        {tab}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                    ⚠️ No tabs assigned! Contact admin.
                  </div>
                )}
              </div>
              {user.role === 'subAdmin' && user.allowedTabs && (
                <div className="mt-2 text-xs text-gray-600">
                  Total: {user.allowedTabs.length} tab(s) accessible
                </div>
              )}
            </div>
          </div>
          
          {user.role === 'subAdmin' && (!user.allowedTabs || user.allowedTabs.length === 0) && (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="text-sm text-amber-800">
                <strong>⚠️ Limited Access:</strong> You don't have access to any tabs yet. Please contact your administrator to assign tabs to your account.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-700">Total Users</div>
          <div className="mt-1 text-2xl font-bold text-blue-900">{totalUsers}</div>
          <div className="mt-2 text-xs text-blue-600">
            {dashboardData.lawyers.count} Lawyers + {dashboardData.clients.count} Clients
          </div>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="text-sm font-medium text-green-700">Content Items</div>
          <div className="mt-1 text-2xl font-bold text-green-900">{totalContent}</div>
          <div className="mt-2 text-xs text-green-600">
            {dashboardData.news.count} News + {dashboardData.blogs.count} Blogs + {dashboardData.notifications.count} Notifications
          </div>
        </div>
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
          <div className="text-sm font-medium text-purple-700">Admin Team</div>
          <div className="mt-1 text-2xl font-bold text-purple-900">{totalAdmins}</div>
          <div className="mt-2 text-xs text-purple-600">
            {dashboardData.admins.count} Admins + {dashboardData.subadmins.count} Sub-Admins
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardItems.map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">{item.title}</div>
            <div className="mt-2 text-3xl font-bold">
              {item.loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : item.error ? (
                <span className="text-red-500 text-lg">Error</span>
              ) : (
                item.count
              )}
            </div>
            {item.error && (
              <div className="mt-1 text-xs text-red-500">{item.error}</div>
            )}
            <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-gray-800" style={{ width: item.progressWidth }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Recent Lawyer Onboarding</h3>
          <Link to="/lawyers" className="text-sm text-blue-600 hover:text-blue-800">
            View all lawyers →
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {dashboardData.recentLawyers.loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 animate-pulse rounded bg-gray-200"></div>
                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200"></div>
                  </div>
                  <div className="h-6 w-20 animate-pulse rounded bg-gray-200"></div>
                </div>
              ))}
            </div>
          ) : dashboardData.recentLawyers.error ? (
            <div className="py-8 text-center">
              <div className="text-red-500">Failed to load recent activities</div>
              <div className="text-sm text-gray-500 mt-1">{dashboardData.recentLawyers.error}</div>
            </div>
          ) : dashboardData.recentLawyers.data.length === 0 ? (
            <div className="py-8 text-center">
              <div className="text-gray-500">No lawyers onboarded yet</div>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.recentLawyers.data.map((lawyer: any, index: number) => {
                const joinDate = parseDate(lawyer.createdAt);
                const timeAgo = joinDate ? getTimeAgo(joinDate) : 'Unknown';

                return (
                  <div key={lawyer.id || index} className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
                        {lawyer.fullName ? lawyer.fullName.charAt(0).toUpperCase() : 'L'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {lawyer.fullName || 'Unknown Lawyer'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lawyer.email || 'No email'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {timeAgo}
                      </div>
                      <div className="text-xs text-gray-500">
                        {joinDate ? joinDate.toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard