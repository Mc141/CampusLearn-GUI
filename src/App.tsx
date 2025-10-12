import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForumPage from "./pages/ForumPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import TopicsPage from "./pages/TopicsPage";
import QuestionsPage from "./pages/QuestionsPage";
import ChatbotPage from "./pages/ChatbotPage";
import TutorRegistrationPage from "./pages/TutorRegistrationPage";
import ResourceManagementPage from "./pages/ResourceManagementPage";
import NotificationManagementPage from "./pages/NotificationManagementPage";
import FAQManagementPage from "./pages/FAQManagementPage";
import TrendingTopicsPage from "./pages/TrendingTopicsPage";
import TutorMatchingPage from "./pages/TutorMatchingPage";

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

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
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/topics" element={<TopicsPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/tutor-registration" element={<TutorRegistrationPage />} />
        <Route path="/resources" element={<ResourceManagementPage />} />
        <Route path="/notifications" element={<NotificationManagementPage />} />
        <Route path="/faq" element={<FAQManagementPage />} />
        <Route path="/trending" element={<TrendingTopicsPage />} />
        <Route path="/tutor-matching" element={<TutorMatchingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

export default App;
