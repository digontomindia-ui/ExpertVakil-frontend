import { Routes, Route } from "react-router-dom";
import Home from "../Home/Home";
import LogIn from "../Auth/Login/Login";
import SignUp from "../Auth/Signup/Signup";
import FindProfilePage from "../app/Profile/findprofile";
import ProfileView from "../app/Profile/profileview";
import ChatPage from "../app/Chat/chatpage";
import AboutPage from "../app/About/about";
import SupportPage from "../app/Support/support";
import Querydetails from "../app/Query/Querydetails";
// import Query from "../app/Query/Querypage";
import QueryPage from "../app/Query/Querypage";
import BlogListing from "../app/Blog/BlogListing";
import BlogDetail from "../app/Blog/BlogDetail";
import ServiceList from "../app/Service/ServiceList";
import ServiceDetail from "../app/Service/ServiceDetail";
import MyBookings from "../app/Service/MyBookings";
import PrivacyPolicyLegalNetwork from "../app/Privacy/Privacy";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LogIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/findprofile" element={<FindProfilePage />} />
      <Route path="/profileview" element={<ProfileView />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/queries/:id" element={<Querydetails />} />
      <Route path="/querypage" element={<QueryPage />} />
      <Route path="/blogs" element={<BlogListing />} />
      <Route path="/blog/:id" element={<BlogDetail />} />
      <Route path="/services" element={<ServiceList />} />
      <Route path="/service/:id" element={<ServiceDetail />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/privacypolicy" element={<PrivacyPolicyLegalNetwork />} />
    </Routes>
  );
}
