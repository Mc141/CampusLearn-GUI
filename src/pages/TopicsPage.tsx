import React, { useState } from "react";
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
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockTopics, mockModules } from "../data/mockData";

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
  const [topics] = useState(mockTopics);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [newTopic, setNewTopic] = useState({
    title: "",
    description: "",
    module: "",
  });

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = !selectedModule || topic.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const subscribedTopics = topics.filter((topic) =>
    topic.subscribers.includes(user?.id || "")
  );
  const managedTopics = topics.filter((topic) =>
    topic.tutors.includes(user?.id || "")
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTopic = () => {
    // In a real app, this would save to backend
    console.log("Creating topic:", newTopic);
    setOpenDialog(false);
    setNewTopic({ title: "", description: "", module: "" });
  };

  const handleSubscribe = (topicId: string) => {
    // In a real app, this would update the backend
    console.log("Subscribing to topic:", topicId);
  };

  const handleUnsubscribe = (topicId: string) => {
    // In a real app, this would update the backend
    console.log("Unsubscribing from topic:", topicId);
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

  return (
    <Box>
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
                  {mockModules.map((module) => (
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
                            label={topic.module}
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
                            <Chip
                              icon={<QuestionAnswer />}
                              label={`${topic.tutors.length} tutors`}
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
                      {topic.subscribers.includes(user?.id || "") ? (
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
                      {topic.tutors.includes(user?.id || "") && (
                        <>
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                          <IconButton size="small">
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
                            label={topic.module}
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
                            label={topic.module}
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
                      <IconButton size="small">
                        <Edit />
                      </IconButton>
                      <IconButton size="small">
                        <Delete />
                      </IconButton>
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
        <DialogTitle>Create New Topic</DialogTitle>
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
              {mockModules.map((module) => (
                <MenuItem key={module.id} value={module.code}>
                  {module.code} - {module.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTopic} variant="contained">
            Create Topic
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TopicsPage;
