// panels.js
import AdminsCenter from "../app/admin/view-all/admins";
import BlogsCenter from "../app/blog/view-all/blogs";
import CasesDirectory from "../app/Case-diary/viewall/cases";
import ClientsDirectory from "../app/Client/view-all/client";
import DashboardPage from "../app/dashboard/Dashboard";
import LawyersDirectory from "../app/lawer/all-lawyer/Laywers"; // <-- fixed path & spelling
import NewsCenter from "../app/news/view-all/news";
import NotificationsCenter from "../app/notification/view-all/notifications";
import QueriesCenter from "../app/query/query";
import ServicesCenter from "../app/service/view-all/services";
import BookedServicesPage from "../app/service/booked/BookedServices";
import SubAdminsCenter from "../app/subadmin/view-all/subadmins";
import SupportViewall from "../app/support/Viewall";
import DeleteRequestsPage from "../app/delete-requests/view-all/DeleteRequestsPage";

export function Dashboard() {
  return <DashboardPage />;
}

export function Lawyers() {
  return <LawyersDirectory />;
}

export function News() {
  return <NewsCenter />;
}

export function Queries() {
  return <QueriesCenter />;
}

export function Admins() {
  return <AdminsCenter />;
}

export function SubAdmins() {
  return <SubAdminsCenter />;
}

export function Blogs() {
  return <BlogsCenter />;
}

export function Notifications() {
  return <NotificationsCenter />;
}

export function Clients() {
  return <ClientsDirectory />;
}

export function Cases() {
  return <CasesDirectory />;
}

export function Support() {
  return <SupportViewall />;
}

export function Services() {
  return <ServicesCenter />;
}

export function BookedServices() {
  return <BookedServicesPage />;
}

export function DeleteRequests() {
  return <DeleteRequestsPage />;
}

// Note: SupportDetails and SupportAnswer are used within the SupportViewall component
// They are not meant to be standalone panels
