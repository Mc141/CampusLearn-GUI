import React, { useState, useEffect } from "react";
import {
  Box,
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
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  School,
  People,
  QuestionAnswer,
  TrendingUp,
  Search,
  FilterList,
  Remove,
  Edit,
  Delete,
  Visibility,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { topicsService, TopicWithDetails } from "../services/topicsService";
import { modulesService } from "../services/modulesService";
import { questionsService } from "../services/questionsService";
import { tutorTopicAssignmentService } from "../services/tutorTopicAssignmentService";
import { Module } from "../types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const TopicsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TopicWithDetails[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState({
    title: "",
    description: "",
    module: "",
  });
  const [editingTopic, setEditingTopic] = useState<TopicWithDetails | null>(
    null
  );
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());

  // Load data from database
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Request timeout - please try again"));
          }, 30000); // 30 second timeout for topics
        });

        const dataPromise = Promise.all([
          topicsService.getAllTopics(),
          modulesService.getAllModules(),
        ]);

        const [topicsData, modulesData] = (await Promise.race([
          dataPromise,
          timeoutPromise,
        ])) as [any, any];

        clearTimeout(timeoutId);

        if (!isMounted) return;

        setTopics(topicsData);
        setModules(modulesData);

        // Load user subscriptions
        if (user) {
          try {
            const subscribedTopics =
              await topicsService.getUserSubscribedTopics(user.id);
            if (isMounted) {
              const subscriptionIds = new Set(
                subscribedTopics.map((topic) => topic.id)
              );
              setSubscriptions(subscriptionIds);
            }
          } catch (subErr) {
            console.error("Error loading subscriptions:", subErr);
            // Don't fail the entire page for subscription errors
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load topics. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user]);

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule =
      !selectedModule || topic.moduleCode === selectedModule;
    const isNotModerated = !topic.isModerated; // Hide moderated topics
    return matchesSearch && matchesModule && isNotModerated;
  });

  const subscribedTopics = topics.filter((topic) =>
    subscriptions.has(topic.id) && !topic.isModerated
  );
  const managedTopics = topics.filter((topic) => 
    topic.createdBy === user?.id && !topic.isModerated
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTopic = async () => {
    if (!user || !newTopic.title || !newTopic.description || !newTopic.module) {
      return;
    }

    try {
      setLoading(true);
      const createdTopic = await topicsService.createTopic(
        {
          title: newTopic.title,
          description: newTopic.description,
          moduleCode: newTopic.module,
        },
        user.id
      );

      // Refresh topics list
      const updatedTopics = await topicsService.getAllTopics();
      setTopics(updatedTopics);

      setOpenDialog(false);
      setNewTopic({ title: "", description: "", module: "" });
    } catch (err) {
      console.error("Error creating topic:", err);
      setError("Failed to create topic. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDialogSubmit = () => {
    if (editingTopic) {
      handleUpdateTopic();
    } else {
      handleCreateTopic();
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingTopic(null);
    setNewTopic({ title: "", description: "", module: "" });
  };

  const handleSubscribe = async (topicId: string) => {
    if (!user) return;

    try {
      await topicsService.subscribeToTopic(topicId, user.id);
      // Update local subscription state
      setSubscriptions((prev) => new Set([...prev, topicId]));
      // Refresh topics list
      const updatedTopics = await topicsService.getAllTopics();
      setTopics(updatedTopics);
    } catch (err) {
      console.error("Error subscribing to topic:", err);
      setError("Failed to subscribe to topic. Please try again.");
    }
  };

  const handleUnsubscribe = async (topicId: string) => {
    if (!user) return;

    try {
      await topicsService.unsubscribeFromTopic(topicId, user.id);
      // Update local subscription state
      setSubscriptions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(topicId);
        return newSet;
      });
      // Refresh topics list
      const updatedTopics = await topicsService.getAllTopics();
      setTopics(updatedTopics);
    } catch (err) {
      console.error("Error unsubscribing from topic:", err);
      setError("Failed to unsubscribe from topic. Please try again.");
    }
  };

  const handleEditTopic = (topic: TopicWithDetails) => {
    setEditingTopic(topic);
    setNewTopic({
      title: topic.title,
      description: topic.description,
      module: topic.moduleCode,
    });
    setOpenDialog(true);
  };

  const handleUpdateTopic = async () => {
    if (
      !user ||
      !editingTopic ||
      !newTopic.title ||
      !newTopic.description ||
      !newTopic.module
    ) {
      return;
    }

    try {
      setLoading(true);
      await topicsService.updateTopic(editingTopic.id, user.id, {
        title: newTopic.title,
        description: newTopic.description,
        moduleCode: newTopic.module,
      });

      // Refresh topics list
      const updatedTopics = await topicsService.getAllTopics();
      setTopics(updatedTopics);

      setOpenDialog(false);
      setEditingTopic(null);
      setNewTopic({ title: "", description: "", module: "" });
    } catch (err) {
      console.error("Error updating topic:", err);
      setError("Failed to update topic. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!user) return;

    if (
      window.confirm(
        "Are you sure you want to delete this topic? This action cannot be undone."
      )
    ) {
      try {
        setLoading(true);
        await topicsService.deleteTopic(topicId, user.id);

        // Refresh topics list
        const updatedTopics = await topicsService.getAllTopics();
        setTopics(updatedTopics);
      } catch (err) {
        console.error("Error deleting topic:", err);
        setError("Failed to delete topic. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const getTopicsForTab = () => {
    switch (tabValue) {
      case 0:
        return filteredTopics;
      case 1:
        return subscribedTopics;
      case 2:
        return managedTopics;
      default:
        return filteredTopics;
    }
  };

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

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Topics
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          disabled={loading}
        >
          Create Topic
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter by Module</InputLabel>
                <Select
                  value={selectedModule}
                  label="Filter by Module"
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <MenuItem value="">All Modules</MenuItem>
                  {modules.map((module) => (
                    <MenuItem key={module.id} value={module.code}>
                      {module.code} - {module.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="All Topics" />
              <Tab label="Subscribed" />
              <Tab label="Managed" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <List>
              {getTopicsForTab().map((topic, index) => (
                <React.Fragment key={topic.id}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <School color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <span
                            style={{ fontWeight: 500, fontSize: "1.25rem" }}
                          >
                            {topic.title}
                          </span>
                          <Chip
                            label={topic.moduleCode}
                            size="small"
                            color="primary"
                          />
                          {topic.isActive ? (
                            <Chip label="Active" size="small" color="success" />
                          ) : (
                            <Chip
                              label="Inactive"
                              size="small"
                              color="default"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <div
                            style={{
                              fontSize: "0.875rem",
                              color: "inherit",
                              opacity: 0.7,
                              marginBottom: "8px",
                            }}
                          >
                            {topic.description}
                          </div>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                            }}
                          >
                            <Chip
                              icon={<People />}
                              label={`${topic.subscriberCount} subscribers`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              icon={<QuestionAnswer />}
                              label={`${topic.tutorCount} tutors`}
                              size="small"
                              variant="outlined"
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Created {topic.createdAt.toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {subscriptions.has(topic.id) ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Remove />}
                          onClick={() => handleUnsubscribe(topic.id)}
                        >
                          Unsubscribe
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => handleSubscribe(topic.id)}
                        >
                          Subscribe
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/topics/${topic.id}`)}
                      >
                        View
                      </Button>
                      {(user?.role === "admin" || user?.role === "tutor") &&
                        topic.createdBy === user?.id && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleEditTopic(topic)}
                              title="Edit topic"
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteTopic(topic.id)}
                              title="Delete topic"
                            >
                              <Delete />
                            </IconButton>
                          </>
                        )}
                    </Box>
                  </ListItem>
                  {index < getTopicsForTab().length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <List>
              {subscribedTopics.map((topic, index) => (
                <React.Fragment key={topic.id}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <Add color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <span
                            style={{ fontWeight: 500, fontSize: "1.25rem" }}
                          >
                            {topic.title}
                          </span>
                          <Chip
                            label={topic.moduleCode}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <div
                            style={{
                              fontSize: "0.875rem",
                              color: "inherit",
                              opacity: 0.7,
                              marginBottom: "8px",
                            }}
                          >
                            {topic.description}
                          </div>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                            }}
                          >
                            <Chip
                              icon={<People />}
                              label={`${topic.subscribers.length} subscribers`}
                              size="small"
                              variant="outlined"
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Subscribed {topic.createdAt.toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Remove />}
                      onClick={() => handleUnsubscribe(topic.id)}
                    >
                      Unsubscribe
                    </Button>
                  </ListItem>
                  {index < subscribedTopics.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <List>
              {managedTopics.map((topic, index) => (
                <React.Fragment key={topic.id}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <School color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <span
                            style={{ fontWeight: 500, fontSize: "1.25rem" }}
                          >
                            {topic.title}
                          </span>
                          <Chip
                            label={topic.moduleCode}
                            size="small"
                            color="primary"
                          />
                          {topic.isActive ? (
                            <Chip label="Active" size="small" color="success" />
                          ) : (
                            <Chip
                              label="Inactive"
                              size="small"
                              color="default"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <div
                            style={{
                              fontSize: "0.875rem",
                              color: "inherit",
                              opacity: 0.7,
                              marginBottom: "8px",
                            }}
                          >
                            {topic.description}
                          </div>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                            }}
                          >
                            <Chip
                              icon={<People />}
                              label={`${topic.subscribers.length} subscribers`}
                              size="small"
                              variant="outlined"
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Created {topic.createdAt.toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Box sx={{ display: "flex", gap: 1 }}>
                      {(user?.role === "admin" || user?.role === "tutor") && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleEditTopic(topic)}
                            title="Edit topic"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTopic(topic.id)}
                            title="Delete topic"
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/topics/${topic.id}`)}
                      >
                        View
                      </Button>
                    </Box>
                  </ListItem>
                  {index < managedTopics.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Create Topic Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingTopic ? "Edit Topic" : "Create New Topic"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Topic Title"
            value={newTopic.title}
            onChange={(e) =>
              setNewTopic((prev) => ({ ...prev, title: e.target.value }))
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={4}
            value={newTopic.description}
            onChange={(e) =>
              setNewTopic((prev) => ({ ...prev, description: e.target.value }))
            }
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Module</InputLabel>
            <Select
              value={newTopic.module}
              label="Module"
              onChange={(e) =>
                setNewTopic((prev) => ({ ...prev, module: e.target.value }))
              }
            >
              {modules.map((module) => (
                <MenuItem key={module.id} value={module.code}>
                  {module.code} - {module.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button
            onClick={handleDialogSubmit}
            variant="contained"
            disabled={loading}
          >
            {editingTopic ? "Update Topic" : "Create Topic"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TopicsPage;
