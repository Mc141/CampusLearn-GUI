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
  Badge,
  Alert,
  CircularProgress,
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
import { useNavigate } from "react-router-dom";
import { tutorTopicAssignmentService } from "../services/tutorTopicAssignmentService";
import { questionsService } from "../services/questionsService";

const TutorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignedTopics, setAssignedTopics] = useState<any[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tutor data
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadTutorData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Request timeout - please try again"));
          }, 15000); // 15 second timeout for multiple requests
        });

        const dataPromise = (async () => {
          // Load assigned topics
          const topics = await tutorTopicAssignmentService.getTopicsForTutor(
            user.id
          );

          if (!isMounted) return null;

          setAssignedTopics(topics);

          // Load questions for assigned topics
          const allQuestions: any[] = [];
          for (const topic of topics) {
            try {
              const questions = await questionsService.getQuestionsByTopic(
                topic.id
              );
              allQuestions.push(...questions);
            } catch (err) {
              console.error(
                `Error loading questions for topic ${topic.id}:`,
                err
              );
            }
          }

          if (!isMounted) return null;

          // Filter questions by status
          setPendingQuestions(allQuestions.filter((q) => q.status === "open"));
          setAnsweredQuestions(
            allQuestions.filter((q) => q.status === "answered")
          );
          return topics;
        })();

        await Promise.race([dataPromise, timeoutPromise]);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error("Error loading tutor data:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load tutor data. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTutorData();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user]);

  const stats = [
    {
      label: "Questions Answered",
      value: answeredQuestions.length,
      icon: <CheckCircle />,
      color: "success",
    },
    {
      label: "Assigned Topics",
      value: assignedTopics.length,
      icon: <Topic />,
      color: "primary",
    },
    {
      label: "Pending Questions",
      value: pendingQuestions.length,
      icon: <Schedule />,
      color: "warning",
    },
    {
      label: "Response Rate",
      value:
        answeredQuestions.length > 0
          ? Math.round(
              (answeredQuestions.length /
                (answeredQuestions.length + pendingQuestions.length)) *
                100
            )
          : 0,
      icon: <TrendingUp />,
      color: "info",
    },
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
                {pendingQuestions.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2 }}
                  >
                    No pending questions for your assigned topics.
                  </Typography>
                ) : (
                  pendingQuestions.map((question, index) => (
                    <React.Fragment key={question.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <QuestionAnswer color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={question.title}
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
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
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() =>
                            navigate(`/topics/${question.topicId}`)
                          }
                        >
                          Answer
                        </Button>
                      </ListItem>
                      {index < pendingQuestions.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Assigned Topics */}
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
                  Assigned Topics
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Topic />}
                  onClick={() => navigate("/topics")}
                >
                  View All Topics
                </Button>
              </Box>
              <List>
                {assignedTopics.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2 }}
                  >
                    No topics assigned yet. Contact an admin to get assigned to
                    topics.
                  </Typography>
                ) : (
                  assignedTopics.map((topic, index) => (
                    <React.Fragment key={topic.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <School color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={topic.title}
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {topic.description}
                              </Typography>
                              <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                                <Chip
                                  label={topic.module_code}
                                  size="small"
                                  color="primary"
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
                      {index < assignedTopics.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                )}
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
                {answeredQuestions.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 2 }}
                  >
                    No answered questions yet.
                  </Typography>
                ) : (
                  answeredQuestions.map((question, index) => (
                    <React.Fragment key={question.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={question.title}
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Answered{" "}
                                {question.createdAt.toLocaleDateString()}
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
                      {index < answeredQuestions.length - 1 && <Divider />}
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
                    startIcon={<QuestionAnswer />}
                    onClick={() => navigate("/topics")}
                    sx={{ py: 2 }}
                  >
                    Answer Questions
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
                    View Topics
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
                    startIcon={<Assignment />}
                    onClick={() => navigate("/forum")}
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
