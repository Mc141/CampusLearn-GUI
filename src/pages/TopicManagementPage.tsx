import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Grid,
} from "@mui/material";
import {
  Search,
  Visibility,
  VisibilityOff,
  QuestionAnswer,
  Person,
  School,
  Schedule,
  ThumbUp,
  CheckCircle,
  Topic,
  Reply,
  Quiz,
} from "@mui/icons-material";
import { topicsService, TopicWithDetails } from "../services/topicsService";
import {
  questionsService,
  QuestionWithDetails,
} from "../services/questionsService";
import { answersService, AnswerWithDetails } from "../services/answersService";
import {
  answerReplyService,
  AnswerReplyWithAuthor,
} from "../services/answerReplyService";
import { quizService, TopicQuiz } from "../services/quizService";

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
      id={`management-tabpanel-${index}`}
      aria-labelledby={`management-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TopicManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [topics, setTopics] = useState<TopicWithDetails[]>([]);
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [answers, setAnswers] = useState<AnswerWithDetails[]>([]);
  const [replies, setReplies] = useState<AnswerReplyWithAuthor[]>([]);
  const [quizzes, setQuizzes] = useState<TopicQuiz[]>([]);

  // Moderation dialog states
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [moderationReason, setModerationReason] = useState("");
  const [moderationTarget, setModerationTarget] = useState<{
    type: "topic" | "question" | "answer" | "reply" | "quiz";
    id: string;
    title: string;
    isModerated: boolean;
  } | null>(null);

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [topicsData, questionsData, answersData, repliesData, quizzesData] =
        await Promise.all([
          topicsService.getAllTopicsForModeration(),
          questionsService.getAllQuestionsForModeration(),
          answersService.getAllAnswersForModeration(),
          answerReplyService.getAllAnswerRepliesForModeration(),
          quizService.getQuizzesForModeration(),
        ]);

      setTopics(topicsData);
      setQuestions(questionsData);
      setAnswers(answersData);
      setReplies(repliesData);
      setQuizzes(quizzesData);
    } catch (err) {
      console.error("Error loading management data:", err);
      setError("Failed to load management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter functions
  const getFilteredTopics = () => {
    const filtered = topics.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.moduleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.createdByUser.firstName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        t.createdByUser.lastName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    return {
      active: filtered.filter((t) => !t.isModerated),
      moderated: filtered.filter((t) => t.isModerated),
    };
  };

  const getFilteredQuestions = () => {
    const filtered = questions.filter(
      (q) =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.student.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      active: filtered.filter((q) => !q.isModerated),
      moderated: filtered.filter((q) => q.isModerated),
    };
  };

  const getFilteredAnswers = () => {
    const filtered = answers.filter(
      (a) =>
        a.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tutor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tutor.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      active: filtered.filter((a) => !a.isModerated),
      moderated: filtered.filter((a) => a.isModerated),
    };
  };

  const getFilteredReplies = () => {
    const filtered = replies.filter(
      (r) =>
        r.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.authorName &&
          r.authorName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return {
      active: filtered.filter((r) => !r.isModerated),
      moderated: filtered.filter((r) => r.isModerated),
    };
  };

  const getFilteredQuizzes = () => {
    const filtered = quizzes.filter(
      (q) =>
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.description &&
          q.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.created_by_user &&
          q.created_by_user.first_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (q.created_by_user &&
          q.created_by_user.last_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );

    return {
      active: filtered.filter((q) => !q.is_moderated),
      moderated: filtered.filter((q) => q.is_moderated),
    };
  };

  // Moderation handlers
  const handleModerate = (
    type: "topic" | "question" | "answer" | "reply" | "quiz",
    id: string,
    title: string,
    isModerated: boolean
  ) => {
    setModerationTarget({ type, id, title, isModerated });
    setModerationReason("");
    setModerationDialogOpen(true);
  };

  const confirmModeration = async () => {
    if (!moderationTarget) return;

    try {
      const { type, id, isModerated } = moderationTarget;

      switch (type) {
        case "topic":
          await topicsService.moderateTopic(id, !isModerated);
          setTopics((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, isModerated: !isModerated } : t
            )
          );
          break;
        case "question":
          await questionsService.moderateQuestion(id, !isModerated);
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === id ? { ...q, isModerated: !isModerated } : q
            )
          );
          break;
        case "answer":
          await answersService.moderateAnswer(id, !isModerated);
          setAnswers((prev) =>
            prev.map((a) =>
              a.id === id ? { ...a, isModerated: !isModerated } : a
            )
          );
          break;
        case "reply":
          await answerReplyService.moderateReply(id, !isModerated);
          setReplies((prev) =>
            prev.map((r) =>
              r.id === id ? { ...r, isModerated: !isModerated } : r
            )
          );
          break;
        case "quiz":
          await quizService.moderateQuiz(id, !isModerated);
          setQuizzes((prev) =>
            prev.map((q) =>
              q.id === id ? { ...q, is_moderated: !isModerated } : q
            )
          );
          break;
      }

      setModerationDialogOpen(false);
      setModerationTarget(null);
      setModerationReason("");
    } catch (err) {
      console.error("Error moderating content:", err);
      setError("Failed to moderate content");
    }
  };

  // Render topic card
  const renderTopicCard = (topic: TopicWithDetails) => (
    <Card key={topic.id} sx={{ mb: 2, opacity: topic.isModerated ? 0.6 : 1 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="h6" component="h3" gutterBottom>
            {topic.title}
          </Typography>
          <Box display="flex" gap={1}>
            {topic.isModerated && (
              <Chip
                label="Hidden"
                color="error"
                size="small"
                icon={<VisibilityOff />}
              />
            )}
            <Chip
              label={topic.isActive ? "Active" : "Inactive"}
              color={topic.isActive ? "success" : "default"}
              size="small"
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {topic.description}
        </Typography>

        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <School fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {topic.moduleCode}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {topic.createdByUser.firstName} {topic.createdByUser.lastName}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {topic.createdAt.toLocaleDateString()}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <ThumbUp fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {topic.subscriberCount} subscribers
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <QuestionAnswer fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {topic.tutorCount} tutors
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          color={topic.isModerated ? "success" : "error"}
          startIcon={topic.isModerated ? <Visibility /> : <VisibilityOff />}
          onClick={() =>
            handleModerate(
              "topic",
              topic.id,
              topic.title,
              topic.isModerated || false
            )
          }
        >
          {topic.isModerated ? "Restore" : "Hide"}
        </Button>
      </CardActions>
    </Card>
  );

  // Render question card
  const renderQuestionCard = (question: QuestionWithDetails) => (
    <Card
      key={question.id}
      sx={{ mb: 2, opacity: question.isModerated ? 0.6 : 1 }}
    >
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="h6" component="h3" gutterBottom>
            {question.title}
          </Typography>
          <Box display="flex" gap={1}>
            {question.isModerated && (
              <Chip
                label="Hidden"
                color="error"
                size="small"
                icon={<VisibilityOff />}
              />
            )}
            <Chip
              label={question.status}
              color={question.status === "open" ? "warning" : "success"}
              size="small"
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {question.content}
        </Typography>

        <Box display="flex" gap={1} mb={2} flexWrap="wrap">
          {question.tags.map((tag, index) => (
            <Chip key={index} label={tag} size="small" variant="outlined" />
          ))}
        </Box>

        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {question.isAnonymous
                ? "Anonymous"
                : `${question.student.firstName} ${question.student.lastName}`}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <School fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {question.topic?.moduleCode || "Unknown Module"}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {question.createdAt.toLocaleDateString()}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <ThumbUp fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {question.upvotes}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <QuestionAnswer fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {question.answerCount} answers
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          color={question.isModerated ? "success" : "error"}
          startIcon={question.isModerated ? <Visibility /> : <VisibilityOff />}
          onClick={() =>
            handleModerate(
              "question",
              question.id,
              question.title,
              question.isModerated || false
            )
          }
        >
          {question.isModerated ? "Restore" : "Hide"}
        </Button>
      </CardActions>
    </Card>
  );

  // Render answer card
  const renderAnswerCard = (answer: AnswerWithDetails) => (
    <Card key={answer.id} sx={{ mb: 2, opacity: answer.isModerated ? 0.6 : 1 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="subtitle1" component="h3" gutterBottom>
            Answer by {answer.tutor.firstName} {answer.tutor.lastName}
          </Typography>
          <Box display="flex" gap={1}>
            {answer.isModerated && (
              <Chip
                label="Hidden"
                color="error"
                size="small"
                icon={<VisibilityOff />}
              />
            )}
            {answer.isAccepted && (
              <Chip
                label="Accepted"
                color="success"
                size="small"
                icon={<CheckCircle />}
              />
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {answer.content}
        </Typography>

        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {answer.tutor.firstName} {answer.tutor.lastName}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {answer.createdAt.toLocaleDateString()}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <ThumbUp fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {answer.upvotes}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          color={answer.isModerated ? "success" : "error"}
          startIcon={answer.isModerated ? <Visibility /> : <VisibilityOff />}
          onClick={() =>
            handleModerate(
              "answer",
              answer.id,
              `Answer by ${answer.tutor.firstName}`,
              answer.isModerated || false
            )
          }
        >
          {answer.isModerated ? "Restore" : "Hide"}
        </Button>
      </CardActions>
    </Card>
  );

  // Render reply card
  const renderReplyCard = (reply: AnswerReplyWithAuthor) => (
    <Card key={reply.id} sx={{ mb: 2, opacity: reply.isModerated ? 0.6 : 1 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="subtitle2" component="h3" gutterBottom>
            Reply by {reply.authorName || "Anonymous"}
          </Typography>
          <Box display="flex" gap={1}>
            {reply.isModerated && (
              <Chip
                label="Hidden"
                color="error"
                size="small"
                icon={<VisibilityOff />}
              />
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {reply.content}
        </Typography>

        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {reply.authorName || "Anonymous"}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {reply.createdAt.toLocaleDateString()}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <ThumbUp fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {reply.upvotes}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          color={reply.isModerated ? "success" : "error"}
          startIcon={reply.isModerated ? <Visibility /> : <VisibilityOff />}
          onClick={() =>
            handleModerate(
              "reply",
              reply.id,
              `Reply by ${reply.authorName}`,
              reply.isModerated || false
            )
          }
        >
          {reply.isModerated ? "Restore" : "Hide"}
        </Button>
      </CardActions>
    </Card>
  );

  // Render quiz card
  const renderQuizCard = (quiz: TopicQuiz) => (
    <Card key={quiz.id} sx={{ mb: 2, opacity: quiz.is_moderated ? 0.6 : 1 }}>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Typography variant="subtitle1" component="h3" gutterBottom>
            {quiz.title}
          </Typography>
          <Box display="flex" gap={1}>
            {quiz.is_moderated && (
              <Chip
                label="Hidden"
                color="error"
                size="small"
                icon={<VisibilityOff />}
              />
            )}
            <Chip
              label={`${quiz.questions.length} Questions`}
              size="small"
              variant="outlined"
              color="primary"
            />
            {quiz.time_limit && (
              <Chip
                label={`${quiz.time_limit} min`}
                size="small"
                variant="outlined"
                color="secondary"
              />
            )}
          </Box>
        </Box>

        {quiz.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {quiz.description}
          </Typography>
        )}

        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Person fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {quiz.created_by_user
                ? `${quiz.created_by_user.first_name} ${quiz.created_by_user.last_name}`
                : "Unknown Author"}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {quiz.created_at.toLocaleDateString()}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Quiz fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Passing: {quiz.passing_score}%
            </Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions>
        <Button
          size="small"
          color={quiz.is_moderated ? "success" : "error"}
          startIcon={quiz.is_moderated ? <Visibility /> : <VisibilityOff />}
          onClick={() =>
            handleModerate(
              "quiz",
              quiz.id,
              quiz.title,
              quiz.is_moderated || false
            )
          }
        >
          {quiz.is_moderated ? "Restore" : "Hide"}
        </Button>
      </CardActions>
    </Card>
  );

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Topic Management
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Comprehensive management of topics, questions, answers, and replies.
        Hide inappropriate content or restore previously hidden content.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search topics, questions, answers, replies, or authors..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab
            label={`Topics (${
              getFilteredTopics().active.length +
              getFilteredTopics().moderated.length
            })`}
          />
          <Tab
            label={`Questions (${
              getFilteredQuestions().active.length +
              getFilteredQuestions().moderated.length
            })`}
          />
          <Tab
            label={`Answers (${
              getFilteredAnswers().active.length +
              getFilteredAnswers().moderated.length
            })`}
          />
          <Tab
            label={`Replies (${
              getFilteredReplies().active.length +
              getFilteredReplies().moderated.length
            })`}
          />
          <Tab
            label={`Quizzes (${
              getFilteredQuizzes().active.length +
              getFilteredQuizzes().moderated.length
            })`}
          />
        </Tabs>
      </Box>

      {/* Topics Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Topics ({getFilteredTopics().active.length})
          </Typography>
          {getFilteredTopics().active.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No active topics found
              </Typography>
            </Paper>
          ) : (
            getFilteredTopics().active.map(renderTopicCard)
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Hidden Topics ({getFilteredTopics().moderated.length})
          </Typography>
          {getFilteredTopics().moderated.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No hidden topics found
              </Typography>
            </Paper>
          ) : (
            getFilteredTopics().moderated.map(renderTopicCard)
          )}
        </Box>
      </TabPanel>

      {/* Questions Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Questions ({getFilteredQuestions().active.length})
          </Typography>
          {getFilteredQuestions().active.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No active questions found
              </Typography>
            </Paper>
          ) : (
            getFilteredQuestions().active.map(renderQuestionCard)
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Hidden Questions ({getFilteredQuestions().moderated.length})
          </Typography>
          {getFilteredQuestions().moderated.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No hidden questions found
              </Typography>
            </Paper>
          ) : (
            getFilteredQuestions().moderated.map(renderQuestionCard)
          )}
        </Box>
      </TabPanel>

      {/* Answers Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Answers ({getFilteredAnswers().active.length})
          </Typography>
          {getFilteredAnswers().active.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No active answers found
              </Typography>
            </Paper>
          ) : (
            getFilteredAnswers().active.map(renderAnswerCard)
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Hidden Answers ({getFilteredAnswers().moderated.length})
          </Typography>
          {getFilteredAnswers().moderated.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No hidden answers found
              </Typography>
            </Paper>
          ) : (
            getFilteredAnswers().moderated.map(renderAnswerCard)
          )}
        </Box>
      </TabPanel>

      {/* Replies Tab */}
      <TabPanel value={activeTab} index={3}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Replies ({getFilteredReplies().active.length})
          </Typography>
          {getFilteredReplies().active.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No active replies found
              </Typography>
            </Paper>
          ) : (
            getFilteredReplies().active.map(renderReplyCard)
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Hidden Replies ({getFilteredReplies().moderated.length})
          </Typography>
          {getFilteredReplies().moderated.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No hidden replies found
              </Typography>
            </Paper>
          ) : (
            getFilteredReplies().moderated.map(renderReplyCard)
          )}
        </Box>
      </TabPanel>

      {/* Quizzes Tab */}
      <TabPanel value={activeTab} index={4}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Quizzes ({getFilteredQuizzes().active.length})
          </Typography>
          {getFilteredQuizzes().active.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No active quizzes found
              </Typography>
            </Paper>
          ) : (
            getFilteredQuizzes().active.map(renderQuizCard)
          )}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Hidden Quizzes ({getFilteredQuizzes().moderated.length})
          </Typography>
          {getFilteredQuizzes().moderated.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">
                No hidden quizzes found
              </Typography>
            </Paper>
          ) : (
            getFilteredQuizzes().moderated.map(renderQuizCard)
          )}
        </Box>
      </TabPanel>

      {/* Moderation Dialog */}
      <Dialog
        open={moderationDialogOpen}
        onClose={() => setModerationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {moderationTarget?.isModerated ? "Restore Content" : "Hide Content"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {moderationTarget?.isModerated
              ? `Are you sure you want to restore "${moderationTarget.title}"?`
              : `Are you sure you want to hide "${moderationTarget?.title}"?`}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            placeholder="Enter reason for moderation action..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModerationDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmModeration}
            color={moderationTarget?.isModerated ? "success" : "error"}
            variant="contained"
          >
            {moderationTarget?.isModerated ? "Restore" : "Hide"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TopicManagementPage;
