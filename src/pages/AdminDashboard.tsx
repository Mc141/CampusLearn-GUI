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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import { mockTopics, mockQuestions, mockNotifications } from "../data/mockData";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [allTopics] = useState(mockTopics);
  const [allQuestions] = useState(mockQuestions);
  const [notifications] = useState(mockNotifications);
  const [recentUsers] = useState([
    {
      id: "1",
      name: "John Doe",
      email: "john@belgiumcampus.ac.za",
      role: "Student",
      status: "Active",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@belgiumcampus.ac.za",
      role: "Tutor",
      status: "Active",
    },
    {
      id: "3",
      name: "Mike Johnson",
      email: "mike@belgiumcampus.ac.za",
      role: "Student",
      status: "Pending",
    },
  ]);

  const stats = [
    { label: "Total Users", value: 156, icon: <People />, color: "primary" },
    { label: "Active Topics", value: 23, icon: <Topic />, color: "secondary" },
    {
      label: "Questions Asked",
      value: 89,
      icon: <QuestionAnswer />,
      color: "success",
    },
    {
      label: "Platform Usage",
      value: 87,
      icon: <TrendingUp />,
      color: "warning",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Admin Dashboard, {user?.firstName}! ⚙️
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
                <Button variant="outlined" size="small" startIcon={<Add />}>
                  Add User
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </Avatar>
                            {user.name}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            size="small"
                            color={
                              user.role === "Tutor" ? "secondary" : "primary"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            size="small"
                            color={
                              user.status === "Active" ? "success" : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <AdminPanelSettings />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    secondary="15% increase this month"
                  />
                  <LinearProgress
                    variant="determinate"
                    value={75}
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
                    secondary="Average 8.5 responses per topic"
                  />
                  <LinearProgress
                    variant="determinate"
                    value={85}
                    sx={{ width: 100 }}
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <QuestionAnswer />
                  </ListItemIcon>
                  <ListItemText
                    primary="Response Time"
                    secondary="Average 2.3 hours"
                  />
                  <LinearProgress
                    variant="determinate"
                    value={90}
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
                <Button variant="outlined" size="small" startIcon={<Add />}>
                  Create Topic
                </Button>
              </Box>
              <List>
                {allTopics.map((topic, index) => (
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
                                label={topic.module}
                                size="small"
                                color="primary"
                              />
                              <Chip
                                label={`${topic.subscribers.length} subscribers`}
                                size="small"
                                variant="outlined"
                              />
                              <Chip
                                label={topic.isActive ? "Active" : "Inactive"}
                                size="small"
                                color={topic.isActive ? "success" : "default"}
                              />
                            </Box>
                          </Box>
                        }
                      />
                      <IconButton size="small">
                        <AdminPanelSettings />
                      </IconButton>
                    </ListItem>
                    {index < allTopics.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
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
    </Box>
  );
};

export default AdminDashboard;
