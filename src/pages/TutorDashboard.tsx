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
  Badge,
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
  CheckCircle,
  Schedule,
  People,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockTopics, mockQuestions, mockNotifications } from "../data/mockData";

const TutorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [managedTopics] = useState(mockTopics.slice(0, 3));
  const [pendingQuestions] = useState(
    mockQuestions.filter((q) => q.status === "open")
  );
  const [answeredQuestions] = useState(
    mockQuestions.filter((q) => q.status === "answered")
  );
  const [notifications] = useState(mockNotifications.slice(0, 3));

  const stats = [
    {
      label: "Questions Answered",
      value: 24,
      icon: <CheckCircle />,
      color: "success",
    },
    { label: "Topics Managed", value: 6, icon: <Topic />, color: "primary" },
    {
      label: "Students Helped",
      value: 18,
      icon: <People />,
      color: "secondary",
    },
    {
      label: "Response Rate",
      value: 95,
      icon: <TrendingUp />,
      color: "warning",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Tutor Dashboard, {user?.firstName}! 🎓
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar sx={{ bgcolor: `${stat.color}.main`, mr: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                  </Box>
                </Box>
                {stat.label === "Response Rate" && (
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
        {/* Pending Questions */}
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
                  Pending Questions
                </Typography>
                <Badge badgeContent={pendingQuestions.length} color="error">
                  <Schedule color="warning" />
                </Badge>
              </Box>
              <List>
                {pendingQuestions.map((question, index) => (
                  <React.Fragment key={question.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <QuestionAnswer color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={question.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
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
                      <Button size="small" variant="contained">
                        Answer
                      </Button>
                    </ListItem>
                    {index < pendingQuestions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Managed Topics */}
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
                  Managed Topics
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  href="/topics"
                >
                  Create Topic
                </Button>
              </Box>
              <List>
                {managedTopics.map((topic, index) => (
                  <React.Fragment key={topic.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={topic.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {topic.description}
                            </Typography>
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
                      <IconButton size="small">
                        <Assignment />
                      </IconButton>
                    </ListItem>
                    {index < managedTopics.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Answers */}
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
                  Recent Answers
                </Typography>
                <CheckCircle color="success" />
              </Box>
              <List>
                {answeredQuestions.map((question, index) => (
                  <React.Fragment key={question.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={question.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Answered {question.createdAt.toLocaleDateString()}
                            </Typography>
                            <Chip
                              label="Answered"
                              size="small"
                              color="success"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < answeredQuestions.length - 1 && <Divider />}
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
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {notification.createdAt.toLocaleDateString()}
                            </Typography>
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
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<QuestionAnswer />}
                    href="/questions"
                    sx={{ py: 2 }}
                  >
                    Answer Questions
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Topic />}
                    href="/topics"
                    sx={{ py: 2 }}
                  >
                    Manage Topics
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
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
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Assignment />}
                    href="/forum"
                    sx={{ py: 2 }}
                  >
                    Moderate Forum
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

export default TutorDashboard;
