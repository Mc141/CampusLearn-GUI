import React, { useState } from "react";
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
import { mockTopics, mockQuestions, mockNotifications } from "../data/mockData";

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [subscribedTopics] = useState(mockTopics.slice(0, 3));
  const [recentQuestions] = useState(mockQuestions.slice(0, 2));
  const [notifications] = useState(mockNotifications.slice(0, 3));

  const stats = [
    { label: "Questions Asked", value: 12, icon: <Quiz />, color: "primary" },
    {
      label: "Topics Subscribed",
      value: 5,
      icon: <Topic />,
      color: "secondary",
    },
    {
      label: "Messages Received",
      value: 8,
      icon: <Message />,
      color: "success",
    },
    {
      label: "Learning Progress",
      value: 75,
      icon: <TrendingUp />,
      color: "warning",
    },
  ];

  return (
    <Box>
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
        {stats.map((stat, index) => (
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
                  href="/questions"
                >
                  Ask New
                </Button>
              </Box>
              <List>
                {recentQuestions.map((question, index) => (
                  <React.Fragment key={question.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <QuestionAnswer color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={question.title}
                        secondary={
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: "0.875rem",
                                color: "inherit",
                                opacity: 0.7,
                              }}
                            >
                              {question.content.substring(0, 100)}...
                            </Typography>
                            <Box
                              sx={{
                                mt: 1,
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                              }}
                            >
                              {question.tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentQuestions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
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
                  href="/topics"
                >
                  Browse More
                </Button>
              </Box>
              <List>
                {subscribedTopics.map((topic, index) => (
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
                                label={topic.module}
                                size="small"
                                color="primary"
                              />
                              <Chip
                                label={`${topic.subscribers.length} subscribers`}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < subscribedTopics.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
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
                <IconButton size="small">
                  <Notifications />
                </IconButton>
              </Box>
              <List>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Notifications
                          color={notification.isRead ? "disabled" : "primary"}
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
                              {notification.createdAt.toLocaleDateString()}
                            </div>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
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
                    href="/questions"
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
                    href="/messages"
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
                    href="/topics"
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
                    href="/forum"
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
    </Box>
  );
};

export default StudentDashboard;
