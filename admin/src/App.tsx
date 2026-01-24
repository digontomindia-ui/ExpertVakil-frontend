
import './App.css'
import AdminSidebarShell from './components/sidebar'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './config/auth'
import LoginPage from './app/auth/LoginPage'
import LawyerDetailsPage from './app/lawer/view-lawyer/LawyerDetailsPage'
import LawyerEditPage from './app/lawer/edit-lawyer/LawyerEditPage'
import ClientsDirectory from './app/Client/view-all/client'
import ClientDetailsPage from './app/Client/view/ClientDetailsPage'
import ClientEditPage from './app/Client/edit/ClientEditPage'
import NewsDetailsPage from './app/news/view/NewsDetailsPage'
import NewsEditPage from './app/news/edit/NewsEditPage'
import NewsPostPage from './app/news/post/NewsPostPage'
import NotificationsCenter from './app/notification/view-all/notifications'
import NotificationDetailsPage from './app/notification/view/NotificationDetailsPage'
import NotificationEditPage from './app/notification/edit/NotificationEditPage'
import NotificationPostPage from './app/notification/post/NotificationPostPage'
import BlogsCenter from './app/blog/view-all/blogs'
import BlogDetailsPage from './app/blog/view/BlogDetailsPage'
import BlogEditPage from './app/blog/edit/BlogEditPage'
import BlogPostPage from './app/blog/post/BlogPostPage'
import AdminsCenter from './app/admin/view-all/admins'
import AdminDetailsPage from './app/admin/view/AdminDetailsPage'
import AdminEditPage from './app/admin/edit/AdminEditPage'
import AdminPostPage from './app/admin/post/AdminPostPage'
import SubAdminsCenter from './app/subadmin/view-all/subadmins'
import SubAdminDetailsPage from './app/subadmin/view/SubAdminDetailsPage'
import SubAdminEditPage from './app/subadmin/edit/SubAdminEditPage'
import SubAdminPostPage from './app/subadmin/post/SubAdminPostPage'
import CasesDirectory from './app/Case-diary/viewall/cases'
import CaseDetailsPage from './app/Case-diary/view/CaseDetailsPage'
import CaseEditPage from './app/Case-diary/edit/CaseEditPage'
import LawyersDirectory from './app/lawer/all-lawyer/Laywers'
import ServicesCenter from './app/service/view-all/services'
import ServiceDetailsPage from './app/service/view/ServiceDetailsPage'
import ServiceEditPage from './app/service/edit/ServiceEditPage'
import ServicePostPage from './app/service/post/ServicePostPage'
import BookedServices from './app/service/booked/BookedServices'
import DeleteRequestsPage from './app/delete-requests/view-all/DeleteRequestsPage'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// App Routes Component
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminSidebarShell />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lawyers/:id"
        element={
          <ProtectedRoute>
            <LawyerDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lawyers/:id/edit"
        element={
          <ProtectedRoute>
            <LawyerEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lawyers"
        element={
          <ProtectedRoute>
            <LawyersDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <ClientsDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <ProtectedRoute>
            <ClientDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:id/edit"
        element={
          <ProtectedRoute>
            <ClientEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <CasesDirectory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <CaseDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id/edit"
        element={
          <ProtectedRoute>
            <CaseEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/new"
        element={
          <ProtectedRoute>
            <CaseEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/news"
        element={
          <ProtectedRoute>
            <AdminSidebarShell />
          </ProtectedRoute>
        }
      />
      <Route
        path="/news/post"
        element={
          <ProtectedRoute>
            <NewsPostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/news/:id"
        element={
          <ProtectedRoute>
            <NewsDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/news/:id/edit"
        element={
          <ProtectedRoute>
            <NewsEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications/post"
        element={
          <ProtectedRoute>
            <NotificationPostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications/:id"
        element={
          <ProtectedRoute>
            <NotificationDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications/:id/edit"
        element={
          <ProtectedRoute>
            <NotificationEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blogs"
        element={
          <ProtectedRoute>
            <BlogsCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blogs/post"
        element={
          <ProtectedRoute>
            <BlogPostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blogs/:id"
        element={
          <ProtectedRoute>
            <BlogDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/blogs/:id/edit"
        element={
          <ProtectedRoute>
            <BlogEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admins"
        element={
          <ProtectedRoute>
            <AdminsCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admins/post"
        element={
          <ProtectedRoute>
            <AdminPostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admins/:id"
        element={
          <ProtectedRoute>
            <AdminDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admins/:id/edit"
        element={
          <ProtectedRoute>
            <AdminEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subadmins"
        element={
          <ProtectedRoute>
            <SubAdminsCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <ServicesCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/post"
        element={
          <ProtectedRoute>
            <ServicePostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/booked"
        element={
          <ProtectedRoute>
            <BookedServices />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/:id"
        element={
          <ProtectedRoute>
            <ServiceDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services/edit/:id"
        element={
          <ProtectedRoute>
            <ServiceEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subadmins/post"
        element={
          <ProtectedRoute>
            <SubAdminPostPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subadmins/:id"
        element={
          <ProtectedRoute>
            <SubAdminDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subadmins/:id/edit"
        element={
          <ProtectedRoute>
            <SubAdminEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/delete-requests"
        element={
          <ProtectedRoute>
            <DeleteRequestsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
