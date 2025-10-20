import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Paper,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Quiz,
  Topic,
  Message,
  Notifications,
  TrendingUp,
  School,
  Add,
  QuestionAnswer,
  Assignment,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { topicsService } from "../services/topicsService";
import { questionsService } from "../services/questionsService";
import { notificationService } from "../services/notificationService";
import { messagingService } from "../services/messagingService";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscribedTopics, setSubscribedTopics] = useState<any[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    questionsAsked: 0,
    topicsSubscribed: 0,
    messagesReceived: 0,
    learningProgress: 0,
  });

  // Load student dashboard data
  useEffect(() => {
    let isMounted = true;

    const loadStudentData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Load subscribed topics
        const topics = await topicsService.getUserSubscribedTopics(user.id);
        if (!isMounted) return;
        setSubscribedTopics(topics.slice(0, 3));

        // Load recent questions by the student
        const studentQuestions = await questionsService.getQuestionsByStudent(
          user.id
        );
        if (!isMounted) return;
        setRecentQuestions(studentQuestions.slice(0, 2));

        // Load notifications
        const userNotifications = await notificationService.getNotifications(
          user.id,
          3
        );
        if (!isMounted) return;
        setNotifications(userNotifications);

        // Calculate stats
        const questionsCount = studentQuestions.length;
        const topicsCount = topics.length;

        // Get conversation count (as a proxy for messaging activity)
        const conversations = await messagingService.getUserConversations(
          user.id
        );
        const messagesCount = conversations.length;

        // Calculate learning progress (based on questions asked and topics subscribed)
        const progress = Math.min(
          100,
          Math.round((questionsCount * 10 + topicsCount * 5) / 2)
        );

        if (!isMounted) return;
        setStats({
          questionsAsked: questionsCount,
          topicsSubscribed: topicsCount,
          messagesReceived: messagesCount,
          learningProgress: progress,
        });
      } catch (err) {
        console.error("Error loading student dashboard data:", err);
        if (isMounted) {
          setError("Failed to load dashboard data. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStudentData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const dashboardStats = [
    {
      label: "Questions Asked",
      value: stats.questionsAsked,
      icon: <Quiz />,
      color: "primary",
    },
    {
      label: "Topics Subscribed",
      value: stats.topicsSubscribed,
      icon: <Topic />,
      color: "secondary",
    },
    {
      label: "Active Conversations",
      value: stats.messagesReceived,
      icon: <Message />,
      color: "success",
    },
    {
      label: "Learning Progress",
      value: stats.learningProgress,
      icon: <TrendingUp />,
      color: "warning",
    },
  ];

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome back, {user?.firstName}! 👋
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: "1.1rem" }}
            >
              Ready to continue your learning journey?
            </Typography>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {dashboardStats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background: `linear-gradient(90deg, ${
                        stat.color === "primary"
                          ? "#6366f1"
                          : stat.color === "secondary"
                          ? "#f59e0b"
                          : stat.color === "success"
                          ? "#10b981"
                          : "#3b82f6"
                      } 0%, ${
                        stat.color === "primary"
                          ? "#8b5cf6"
                          : stat.color === "secondary"
                          ? "#fbbf24"
                          : stat.color === "success"
                          ? "#34d399"
                          : "#60a5fa"
                      } 100%)`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: `${stat.color}.main`,
                          mr: 2,
                          width: 56,
                          height: 56,
                          boxShadow: `0 4px 12px ${
                            stat.color === "primary"
                              ? "rgba(99, 102, 241, 0.3)"
                              : stat.color === "secondary"
                              ? "rgba(245, 158, 11, 0.3)"
                              : stat.color === "success"
                              ? "rgba(16, 185, 129, 0.3)"
                              : "rgba(59, 130, 246, 0.3)"
                          }`,
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h3"
                          sx={{ fontWeight: 700, fontSize: "2rem" }}
                        >
                          {stat.value}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500 }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                    </Box>
                    {stat.label === "Learning Progress" && (
                      <LinearProgress
                        variant="determinate"
                        value={stat.value}
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* Recent Questions */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Recent Questions
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => navigate("/questions")}
                    >
                      Ask New
                    </Button>
                  </Box>
                  <List>
                    {recentQuestions.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 2 }}
                      >
                        No questions asked yet. Start by asking your first
                        question!
                      </Typography>
                    ) : (
                      recentQuestions.map((question, index) => (
                        <React.Fragment key={question.id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <QuestionAnswer color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={question.title}
                              secondary={
                                <Box>
                                  <Box
                                    sx={{
                                      fontSize: "0.875rem",
                                      color: "inherit",
                                      opacity: 0.7,
                                    }}
                                  >
                                    {question.content.substring(0, 100)}...
                                  </Box>
                                  <Box
                                    sx={{
                                      mt: 1,
                                      display: "flex",
                                      gap: 1,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {question.tags?.map((tag) => (
                                      <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                      />
                                    ))}
                                    <Chip
                                      label={question.status}
                                      size="small"
                                      color={
                                        question.status === "answered"
                                          ? "success"
                                          : "warning"
                                      }
                                    />
                                  </Box>
                                </Box>
                              }
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                navigate(`/topics/${question.topicId}`)
                              }
                            >
                              View
                            </Button>
                          </ListItem>
                          {index < recentQuestions.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Subscribed Topics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Subscribed Topics
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => navigate("/topics")}
                    >
                      Browse More
                    </Button>
                  </Box>
                  <List>
                    {subscribedTopics.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 2 }}
                      >
                        No topics subscribed yet. Browse topics to get started!
                      </Typography>
                    ) : (
                      subscribedTopics.map((topic, index) => (
                        <React.Fragment key={topic.id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <School color="secondary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={topic.title}
                              secondary={
                                <Box>
                                  <div
                                    style={{
                                      fontSize: "0.875rem",
                                      color: "inherit",
                                      opacity: 0.7,
                                    }}
                                  >
                                    {topic.description}
                                  </div>
                                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                                    <Chip
                                      label={topic.module_code}
                                      size="small"
                                      color="primary"
                                    />
                                    <Chip
                                      label={`${
                                        topic.subscriberCount || 0
                                      } subscribers`}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Chip
                                      label={
                                        topic.is_active ? "Active" : "Inactive"
                                      }
                                      size="small"
                                      color={
                                        topic.is_active ? "success" : "default"
                                      }
                                    />
                                  </Box>
                                </Box>
                              }
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/topics/${topic.id}`)}
                            >
                              View
                            </Button>
                          </ListItem>
                          {index < subscribedTopics.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Notifications */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Recent Notifications
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => navigate("/messages")}
                    >
                      <Notifications />
                    </IconButton>
                  </Box>
                  <List>
                    {notifications.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 2 }}
                      >
                        No notifications yet.
                      </Typography>
                    ) : (
                      notifications.map((notification, index) => (
                        <React.Fragment key={notification.id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <Notifications
                                color={
                                  notification.isRead ? "disabled" : "primary"
                                }
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={notification.title}
                              secondary={
                                <Box>
                                  <div
                                    style={{
                                      fontSize: "0.875rem",
                                      color: "inherit",
                                      opacity: 0.7,
                                    }}
                                  >
                                    {notification.message}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "inherit",
                                      opacity: 0.7,
                                    }}
                                  >
                                    {new Date(
                                      notification.createdAt
                                    ).toLocaleDateString()}
                                  </div>
                                </Box>
                              }
                            />
                            {notification.link && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(notification.link)}
                              >
                                View
                              </Button>
                            )}
                          </ListItem>
                          {index < notifications.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Quiz />}
                        onClick={() => navigate("/questions")}
                        sx={{ py: 2 }}
                      >
                        Ask Question
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Message />}
                        onClick={() => navigate("/messages")}
                        sx={{ py: 2 }}
                      >
                        View Messages
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Topic />}
                        onClick={() => navigate("/topics")}
                        sx={{ py: 2 }}
                      >
                        Browse Topics
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Assignment />}
                        onClick={() => navigate("/forum")}
                        sx={{ py: 2 }}
                      >
                        Visit Forum
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default StudentDashboard;
