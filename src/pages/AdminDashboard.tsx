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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  People,
  Topic,
  Message,
  Notifications,
  TrendingUp,
  School,
  Add,
  QuestionAnswer,
  Assignment,
  AdminPanelSettings,
  Security,
  Analytics,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { topicsService } from "../services/topicsService";
import { questionsService } from "../services/questionsService";
import { notificationService } from "../services/notificationService";
import { messagingService } from "../services/messagingService";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTopics: 0,
    questionsAsked: 0,
    platformUsage: 0,
  });

  // Load admin dashboard data
  useEffect(() => {
    let isMounted = true;

    const loadAdminData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Load all topics
        const topics = await topicsService.getAllTopics();
        if (!isMounted) return;
        setAllTopics(topics.slice(0, 5));

        // Load all questions
        const questions = await questionsService.getAllQuestions();
        if (!isMounted) return;
        setAllQuestions(questions.slice(0, 5));

        // Load recent users
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email, role, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        if (usersError) throw usersError;
        if (!isMounted) return;
        setRecentUsers(users || []);

        // Load notifications
        const userNotifications = await notificationService.getNotifications(
          user.id,
          5
        );
        if (!isMounted) return;
        setNotifications(userNotifications);

        // Calculate stats
        const { data: userCount, error: userCountError } = await supabase
          .from("users")
          .select("id", { count: "exact" });

        if (userCountError) throw userCountError;

        const activeTopicsCount = topics.filter(
          (topic) => topic.is_active
        ).length;
        const questionsCount = questions.length;

        // Calculate platform usage (based on active users and engagement)
        const platformUsage = Math.min(
          100,
          Math.round(
            (activeTopicsCount * 10 +
              questionsCount * 5 +
              (userCount?.length || 0) * 2) /
              3
          )
        );

        if (!isMounted) return;
        setStats({
          totalUsers: userCount?.length || 0,
          activeTopics: activeTopicsCount,
          questionsAsked: questionsCount,
          platformUsage: platformUsage,
        });
      } catch (err) {
        console.error("Error loading admin dashboard data:", err);
        if (isMounted) {
          setError("Failed to load dashboard data. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const dashboardStats = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: <People />,
      color: "primary",
    },
    {
      label: "Active Topics",
      value: stats.activeTopics,
      icon: <Topic />,
      color: "secondary",
    },
    {
      label: "Questions Asked",
      value: stats.questionsAsked,
      icon: <QuestionAnswer />,
      color: "success",
    },
    {
      label: "Platform Usage",
      value: stats.platformUsage,
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
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Admin Dashboard, {user?.firstName}! ⚙️
          </Typography>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {dashboardStats.map((stat, index) => (
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
                    {stat.label === "Platform Usage" && (
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
            {/* Recent Users */}
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
                      Recent Users
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => navigate("/admin/users")}
                    >
                      Manage Users
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No users found.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          recentUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                    {`${user.first_name?.[0] || ""}${
                                      user.last_name?.[0] || ""
                                    }`}
                                  </Avatar>
                                  {`${user.first_name || ""} ${
                                    user.last_name || ""
                                  }`}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={user.role}
                                  size="small"
                                  color={
                                    user.role === "tutor"
                                      ? "secondary"
                                      : user.role === "admin"
                                      ? "error"
                                      : "primary"
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  sx={{ fontSize: "0.75rem" }}
                                >
                                  {user.email}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    navigate(`/admin/users/${user.id}`)
                                  }
                                >
                                  <AdminPanelSettings />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Platform Analytics */}
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
                      Platform Analytics
                    </Typography>
                    <Analytics color="primary" />
                  </Box>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <People />
                      </ListItemIcon>
                      <ListItemText
                        primary="User Growth"
                        secondary={`${stats.totalUsers} total users registered`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, stats.totalUsers * 2)}
                        sx={{ width: 100 }}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Topic />
                      </ListItemIcon>
                      <ListItemText
                        primary="Topic Engagement"
                        secondary={`${stats.activeTopics} active topics`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, stats.activeTopics * 5)}
                        sx={{ width: 100 }}
                      />
                    </ListItem>
                    <Divider />
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <QuestionAnswer />
                      </ListItemIcon>
                      <ListItemText
                        primary="Question Activity"
                        secondary={`${stats.questionsAsked} questions asked`}
                      />
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, stats.questionsAsked * 2)}
                        sx={{ width: 100 }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* All Topics Management */}
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
                      All Topics
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => navigate("/topics")}
                    >
                      Manage Topics
                    </Button>
                  </Box>
                  <List>
                    {allTopics.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 2 }}
                      >
                        No topics found.
                      </Typography>
                    ) : (
                      allTopics.map((topic, index) => (
                        <React.Fragment key={topic.id}>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon>
                              <School color="primary" />
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
                                        topic.subscriber_count || 0
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
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/topics/${topic.id}`)}
                            >
                              <AdminPanelSettings />
                            </IconButton>
                          </ListItem>
                          {index < allTopics.length - 1 && <Divider />}
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* System Notifications */}
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
                      System Notifications
                    </Typography>
                    <Security color="primary" />
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

            {/* Admin Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Admin Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<People />}
                        onClick={() => navigate("/admin/users")}
                        sx={{ py: 2 }}
                      >
                        Manage Users
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Topic />}
                        onClick={() => navigate("/topics")}
                        sx={{ py: 2 }}
                      >
                        Manage Topics
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Security />}
                        onClick={() => navigate("/admin/security")}
                        sx={{ py: 2 }}
                      >
                        Security Settings
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Analytics />}
                        onClick={() => navigate("/admin/analytics")}
                        sx={{ py: 2 }}
                      >
                        View Analytics
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

export default AdminDashboard;
