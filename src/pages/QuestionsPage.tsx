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
  Badge,
} from "@mui/material";
import {
  Add,
  Quiz,
  QuestionAnswer,
  ThumbUp,
  Reply,
  Search,
  FilterList,
  TrendingUp,
  Schedule,
  CheckCircle,
  PersonOff,
} from "@mui/icons-material";
import { questionsService } from "../services/questionsService";

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

const QuestionsPage: React.FC = () => {
  const { user } = useAuth();
  const [questions] = useState(mockQuestions);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [newQuestion, setNewQuestion] = useState({
    title: "",
    content: "",
    topicId: "",
    isAnonymous: false,
    tags: [] as string[],
  });

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || question.status === selectedStatus;
    const topic = mockTopics.find((t) => t.id === question.topicId);
    const matchesModule = !selectedModule || topic?.module === selectedModule;
    return matchesSearch && matchesStatus && matchesModule;
  });

  const openQuestions = questions.filter((q) => q.status === "open");
  const answeredQuestions = questions.filter((q) => q.status === "answered");
  const myQuestions = questions.filter((q) => q.studentId === user?.id);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateQuestion = () => {
    // In a real app, this would save to backend
    console.log("Creating question:", newQuestion);
    setOpenDialog(false);
    setNewQuestion({
      title: "",
      content: "",
      topicId: "",
      isAnonymous: false,
      tags: [],
    });
  };

  const handleToggleVote = async (questionId: string) => {
    if (!user?.id) return;

    try {
      const result = await questionsService.toggleQuestionVote(
        questionId,
        user.id
      );
      // Update local state - you might want to implement proper state management here
      console.log(
        "Toggled vote for question:",
        questionId,
        "New count:",
        result.voteCount
      );
    } catch (err) {
      console.error("Error toggling question vote:", err);
    }
  };

  const handleAnswer = (questionId: string) => {
    // In a real app, this would open an answer dialog
    console.log("Answering question:", questionId);
  };

  const getQuestionsForTab = () => {
    switch (tabValue) {
      case 0:
        return filteredQuestions;
      case 1:
        return openQuestions;
      case 2:
        return answeredQuestions;
      case 3:
        return myQuestions;
      default:
        return filteredQuestions;
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
          Questions
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Ask Question
        </Button>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Filter by Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="answered">Answered</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
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
              <Tab label="All Questions" />
              <Tab label="Open" />
              <Tab label="Answered" />
              <Tab label="My Questions" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <List>
              {getQuestionsForTab().map((question, index) => {
                const topic = mockTopics.find((t) => t.id === question.topicId);
                return (
                  <React.Fragment key={question.id}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemIcon>
                        {question.status === "answered" ? (
                          <CheckCircle color="success" />
                        ) : question.status === "open" ? (
                          <Schedule color="warning" />
                        ) : (
                          <Quiz color="primary" />
                        )}
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
                              {question.title}
                            </span>
                            <Chip
                              label={question.status}
                              size="small"
                              color={
                                question.status === "answered"
                                  ? "success"
                                  : question.status === "open"
                                  ? "warning"
                                  : "default"
                              }
                            />
                            {question.isAnonymous && (
                              <Chip
                                label="Anonymous"
                                size="small"
                                variant="outlined"
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
                              {question.content}
                            </div>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mb: 1,
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
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                              }}
                            >
                              <Chip
                                label={topic?.module || "Unknown"}
                                size="small"
                                color="primary"
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Asked {question.createdAt.toLocaleDateString()}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  ml: "auto",
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleVote(question.id)}
                                >
                                  <ThumbUp fontSize="small" />
                                </IconButton>
                                <Typography variant="caption">
                                  {question.upvotes}
                                </Typography>
                                {user?.role === "tutor" &&
                                  question.status === "open" && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      startIcon={<Reply />}
                                      onClick={() => handleAnswer(question.id)}
                                    >
                                      Answer
                                    </Button>
                                  )}
                              </Box>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < getQuestionsForTab().length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <List>
              {openQuestions.map((question, index) => {
                const topic = mockTopics.find((t) => t.id === question.topicId);
                return (
                  <React.Fragment key={question.id}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemIcon>
                        <Schedule color="warning" />
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
                              {question.title}
                            </span>
                            <Chip label="Open" size="small" color="warning" />
                            {question.isAnonymous && (
                              <Chip
                                label="Anonymous"
                                size="small"
                                variant="outlined"
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
                              {question.content}
                            </div>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mb: 1,
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
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                              }}
                            >
                              <Chip
                                label={topic?.module || "Unknown"}
                                size="small"
                                color="primary"
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Asked {question.createdAt.toLocaleDateString()}
                              </Typography>
                              {user?.role === "tutor" && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<Reply />}
                                  onClick={() => handleAnswer(question.id)}
                                  sx={{ ml: "auto" }}
                                >
                                  Answer
                                </Button>
                              )}
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < openQuestions.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <List>
              {answeredQuestions.map((question, index) => {
                const topic = mockTopics.find((t) => t.id === question.topicId);
                return (
                  <React.Fragment key={question.id}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
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
                              {question.title}
                            </span>
                            <Chip
                              label="Answered"
                              size="small"
                              color="success"
                            />
                            {question.isAnonymous && (
                              <Chip
                                label="Anonymous"
                                size="small"
                                variant="outlined"
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
                              {question.content}
                            </div>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mb: 1,
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
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                              }}
                            >
                              <Chip
                                label={topic?.module || "Unknown"}
                                size="small"
                                color="primary"
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Answered{" "}
                                {question.createdAt.toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < answeredQuestions.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <List>
              {myQuestions.map((question, index) => {
                const topic = mockTopics.find((t) => t.id === question.topicId);
                return (
                  <React.Fragment key={question.id}>
                    <ListItem sx={{ px: 0, py: 2 }}>
                      <ListItemIcon>
                        {question.status === "answered" ? (
                          <CheckCircle color="success" />
                        ) : question.status === "open" ? (
                          <Schedule color="warning" />
                        ) : (
                          <Quiz color="primary" />
                        )}
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
                              {question.title}
                            </span>
                            <Chip
                              label={question.status}
                              size="small"
                              color={
                                question.status === "answered"
                                  ? "success"
                                  : question.status === "open"
                                  ? "warning"
                                  : "default"
                              }
                            />
                            {question.isAnonymous && (
                              <Chip
                                label="Anonymous"
                                size="small"
                                variant="outlined"
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
                              {question.content}
                            </div>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mb: 1,
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
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                              }}
                            >
                              <Chip
                                label={topic?.module || "Unknown"}
                                size="small"
                                color="primary"
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Asked {question.createdAt.toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < myQuestions.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Ask Question Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ask a Question</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Question Title"
            value={newQuestion.title}
            onChange={(e) =>
              setNewQuestion((prev) => ({ ...prev, title: e.target.value }))
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Question Content"
            multiline
            rows={4}
            value={newQuestion.content}
            onChange={(e) =>
              setNewQuestion((prev) => ({ ...prev, content: e.target.value }))
            }
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Topic</InputLabel>
            <Select
              value={newQuestion.topicId}
              label="Topic"
              onChange={(e) =>
                setNewQuestion((prev) => ({ ...prev, topicId: e.target.value }))
              }
            >
              {mockTopics.map((topic) => (
                <MenuItem key={topic.id} value={topic.id}>
                  {topic.title} ({topic.module})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tags (click to add/remove)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {[
                "accounting",
                "programming",
                "oop",
                "inheritance",
                "composition",
                "balance-sheet",
                "working-capital",
              ].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant={
                    newQuestion.tags.includes(tag) ? "filled" : "outlined"
                  }
                  onClick={() => {
                    setNewQuestion((prev) => ({
                      ...prev,
                      tags: prev.tags.includes(tag)
                        ? prev.tags.filter((t) => t !== tag)
                        : [...prev.tags, tag],
                    }));
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateQuestion} variant="contained">
            Ask Question
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionsPage;
