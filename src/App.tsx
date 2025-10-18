import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForumPage from "./pages/ForumPage";
import ChatbotPage from "./pages/ChatbotPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import TopicsPage from "./pages/TopicsPage";
import QuestionsPage from "./pages/QuestionsPage";
import TutorRegistrationPage from "./pages/TutorRegistrationPage";
import ResourceManagementPage from "./pages/ResourceManagementPage";
import NotificationManagementPage from "./pages/NotificationManagementPage";
import FAQManagementPage from "./pages/FAQManagementPage";
import TrendingTopicsPage from "./pages/TrendingTopicsPage";
import TutorMatchingPage from "./pages/TutorMatchingPage";
import TopicDetailsPage from "./pages/TopicDetailsPage";
import TutorApplicationPage from "./pages/TutorApplicationPage";
import TutorApplicationManagementPage from "./pages/TutorApplicationManagementPage";
import TutorModuleAssignmentPage from "./pages/TutorModuleAssignmentPage";
import PostDetailsPage from "./pages/PostDetailsPage";
import ForumModerationPage from "./pages/ForumModerationPage";
import TutorEscalationDashboard from "./pages/TutorEscalationDashboard";
import AdminEscalationManagement from "./pages/AdminEscalationManagement";

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <NotificationProvider>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              user.role === "student" ? (
                <StudentDashboard />
              ) : user.role === "tutor" ? (
                <TutorDashboard />
              ) : (
                <AdminDashboard />
              )
            }
          />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/post/:postId" element={<PostDetailsPage />} />
          <Route
            path="/forum/moderation"
            element={
              user?.role === "admin" ? (
                <ForumModerationPage />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/topics/:topicId" element={<TopicDetailsPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route
            path="/tutor-registration"
            element={<TutorRegistrationPage />}
          />
          <Route path="/resources" element={<ResourceManagementPage />} />
          <Route
            path="/notifications"
            element={<NotificationManagementPage />}
          />
          <Route path="/faq" element={<FAQManagementPage />} />
          <Route path="/trending" element={<TrendingTopicsPage />} />
          <Route path="/tutor-matching" element={<TutorMatchingPage />} />
          <Route path="/tutor-application" element={<TutorApplicationPage />} />
          <Route
            path="/tutor-applications"
            element={<TutorApplicationManagementPage />}
          />
          <Route
            path="/tutor-module-assignment"
            element={<TutorModuleAssignmentPage />}
          />
          <Route
            path="/tutor/escalations"
            element={
              user?.role === "tutor" ? (
                <TutorEscalationDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin/escalations"
            element={
              user?.role === "admin" ? (
                <AdminEscalationManagement />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </NotificationProvider>
  );
};

export default App;
