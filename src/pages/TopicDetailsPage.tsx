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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack,
} from "@mui/material";
import {
  ArrowBack,
  School,
  QuestionAnswer,
  Person,
  ThumbUp,
  CheckCircle,
  Add,
  ExpandMore,
  Edit,
  Delete,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  questionsService,
  QuestionWithDetails,
  CreateQuestionData,
} from "../services/questionsService";
import TopicResources from "../components/TopicResources";
import {
  answersService,
  AnswerWithDetails,
  CreateAnswerData,
} from "../services/answersService";
import { topicsService, TopicWithDetails } from "../services/topicsService";
import {
  tutorTopicAssignmentService,
  TutorWithDetails,
} from "../services/tutorTopicAssignmentService";
import TutorAssignmentDialog from "../components/TutorAssignmentDialog";
import { messagingService } from "../services/messagingService";

const TopicDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();

  const [topic, setTopic] = useState<TopicWithDetails | null>(null);
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [assignedTutors, setAssignedTutors] = useState<TutorWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Question form state
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState<CreateQuestionData>({
    title: "",
    content: "",
    isAnonymous: false,
    tags: [],
  });

  // Answer form state
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );
  const [newAnswer, setNewAnswer] = useState<CreateAnswerData>({
    content: "",
  });

  // Tutor assignment dialog state
  const [tutorAssignmentDialogOpen, setTutorAssignmentDialogOpen] =
    useState(false);

  // Load topic and questions
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadData = async () => {
      if (!topicId) return;

      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Request timeout - please try again"));
          }, 10000); // 10 second timeout
        });

        const dataPromise = (async () => {
          // Load topic details
          const topics = await topicsService.getAllTopics();
          const currentTopic = topics.find((t) => t.id === topicId);

          if (!currentTopic) {
            throw new Error("Topic not found");
          }

          if (!isMounted) return null;

          setTopic(currentTopic);

          // Load questions and assigned tutors for this topic
          const [questionsData, tutorsData] = await Promise.all([
            questionsService.getQuestionsByTopic(topicId),
            tutorTopicAssignmentService.getTutorsForTopic(topicId),
          ]);

          if (!isMounted) return null;

          setQuestions(questionsData);
          setAssignedTutors(tutorsData);
          return currentTopic;
        })();

        await Promise.race([dataPromise, timeoutPromise]);
        clearTimeout(timeoutId);
      } catch (err) {
        console.error("Error loading topic details:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load topic details. Please try again."
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
  }, [topicId]);

  const handleAskQuestion = async () => {
    if (!user || !topicId || !newQuestion.title || !newQuestion.content) {
      return;
    }

    try {
      setLoading(true);
      await questionsService.createQuestion(topicId, user.id, newQuestion);

      // Refresh questions list
      const updatedQuestions = await questionsService.getQuestionsByTopic(
        topicId
      );
      setQuestions(updatedQuestions);

      setQuestionDialogOpen(false);
      setNewQuestion({ title: "", content: "", isAnonymous: false, tags: [] });
    } catch (err) {
      console.error("Error creating question:", err);
      setError("Failed to create question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerQuestion = async () => {
    if (!user || !selectedQuestionId || !newAnswer.content) {
      return;
    }

    try {
      setLoading(true);
      await answersService.createAnswer(selectedQuestionId, user.id, newAnswer);

      // Refresh questions list to show new answer
      const updatedQuestions = await questionsService.getQuestionsByTopic(
        topicId!
      );
      setQuestions(updatedQuestions);

      setAnswerDialogOpen(false);
      setSelectedQuestionId(null);
      setNewAnswer({ content: "" });
    } catch (err) {
      console.error("Error creating answer:", err);
      setError("Failed to create answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    try {
      await questionsService.upvoteQuestion(questionId);

      // Refresh questions list
      const updatedQuestions = await questionsService.getQuestionsByTopic(
        topicId!
      );
      setQuestions(updatedQuestions);
    } catch (err) {
      console.error("Error upvoting question:", err);
    }
  };

  const handleUpvoteAnswer = async (answerId: string) => {
    try {
      await answersService.upvoteAnswer(answerId);

      // Refresh questions list
      const updatedQuestions = await questionsService.getQuestionsByTopic(
        topicId!
      );
      setQuestions(updatedQuestions);
    } catch (err) {
      console.error("Error upvoting answer:", err);
    }
  };

  const handleAcceptAnswer = async (answerId: string, questionId: string) => {
    try {
      await answersService.acceptAnswer(answerId, questionId);

      // Refresh questions list
      const updatedQuestions = await questionsService.getQuestionsByTopic(
        topicId!
      );
      setQuestions(updatedQuestions);
    } catch (err) {
      console.error("Error accepting answer:", err);
    }
  };

  const openAnswerDialog = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setAnswerDialogOpen(true);
  };

  const canTutorAnswer = async (questionId: string): Promise<boolean> => {
    if (!user || user.role !== "tutor") return false;

    try {
      // Get the question to find the topic
      const question = questions.find((q) => q.id === questionId);
      if (!question) return false;

      // Check if tutor is assigned to this topic
      return await tutorTopicAssignmentService.canTutorAnswerForTopic(
        question.topicId,
        user.id
      );
    } catch (error) {
      console.error("Error checking if tutor can answer:", error);
      return false;
    }
  };

  const handleTutorsUpdated = async () => {
    // Reload assigned tutors
    if (topicId) {
      try {
        const tutorsData = await tutorTopicAssignmentService.getTutorsForTopic(
          topicId
        );
        setAssignedTutors(tutorsData);
      } catch (err) {
        console.error("Error reloading tutors:", err);
      }
    }
  };

  const handleStartConversation = async (tutorId: string) => {
    if (!user || !topic) return;

    try {
      await messagingService.sendMessage({
        senderId: user.id,
        receiverId: tutorId,
        content: `Hi! I need help with the topic "${topic.title}". Could you please assist me?`,
      });

      // Navigate to messages page
      navigate("/messages");
    } catch (err) {
      console.error("Error starting conversation:", err);
      setError("Failed to start conversation. Please try again.");
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

  if (error || !topic) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Topic not found"}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/topics")}>
          Back to Topics
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate("/topics")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {topic.title}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Chip label={topic.moduleCode} size="small" color="primary" />
            {topic.isActive ? (
              <Chip label="Active" size="small" color="success" />
            ) : (
              <Chip label="Inactive" size="small" color="default" />
            )}
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setQuestionDialogOpen(true)}
          disabled={loading}
        >
          Ask Question
        </Button>
      </Box>

      {/* Topic Description */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Description
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {topic.description}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Chip
              icon={<Person />}
              label={`${topic.subscriberCount} subscribers`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<QuestionAnswer />}
              label={`${assignedTutors.length} assigned tutors`}
              size="small"
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              Created by {topic.createdByUser.firstName}{" "}
              {topic.createdByUser.lastName} on{" "}
              {topic.createdAt.toLocaleDateString()}
            </Typography>
          </Box>

          {/* Assigned Tutors */}
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              {assignedTutors.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Assigned Tutors:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {assignedTutors.map((tutor) => (
                      <Box
                        key={tutor.id}
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Chip
                          label={`${tutor.firstName} ${tutor.lastName}`}
                          size="small"
                          variant="outlined"
                        />
                        {user?.role === "student" && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleStartConversation(tutor.id)}
                            sx={{ minWidth: "auto", p: 0.5 }}
                          >
                            Message
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
            {(user?.role === "admin" || topic?.createdBy === user?.id) && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setTutorAssignmentDialogOpen(true)}
              >
                Manage Tutors
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Learning Resources */}
      <Box sx={{ mb: 4 }}>
        <TopicResources
          topicId={topicId}
          canUpload={user?.role === "tutor" || user?.role === "admin"}
        />
      </Box>

      {/* Questions */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Questions ({questions.length})
      </Typography>

      {questions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <QuestionAnswer
            sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No questions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Be the first to ask a question about this topic!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setQuestionDialogOpen(true)}
          >
            Ask First Question
          </Button>
        </Paper>
      ) : (
        <List>
          {questions.map((question, index) => (
            <React.Fragment key={question.id}>
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemIcon>
                  <QuestionAnswer color="primary" />
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
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {question.title}
                      </Typography>
                      <Chip
                        label={question.status}
                        size="small"
                        color={
                          question.status === "answered"
                            ? "success"
                            : question.status === "closed"
                            ? "default"
                            : "warning"
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
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {question.content}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleUpvoteQuestion(question.id)}
                        >
                          <ThumbUp fontSize="small" />
                        </IconButton>
                        <Typography variant="caption">
                          {question.upvotes} upvotes
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {question.answerCount} answers
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • Asked by{" "}
                          {question.isAnonymous
                            ? "Anonymous"
                            : `${question.student.firstName} ${question.student.lastName}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {question.createdAt.toLocaleDateString()}
                        </Typography>
                      </Box>

                      {/* Answers */}
                      {question.answers.length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle2">
                              {question.answers.length} Answer
                              {question.answers.length !== 1 ? "s" : ""}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={2}>
                              {question.answers.map((answer) => (
                                <Card key={answer.id} variant="outlined">
                                  <CardContent>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mb: 1,
                                      }}
                                    >
                                      <Avatar sx={{ width: 24, height: 24 }}>
                                        {answer.tutor.firstName[0]}
                                      </Avatar>
                                      <Typography variant="subtitle2">
                                        {answer.tutor.firstName}{" "}
                                        {answer.tutor.lastName}
                                      </Typography>
                                      {answer.isAccepted && (
                                        <Chip
                                          icon={<CheckCircle />}
                                          label="Accepted"
                                          size="small"
                                          color="success"
                                        />
                                      )}
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {answer.createdAt.toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      {answer.content}
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 1,
                                        alignItems: "center",
                                      }}
                                    >
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleUpvoteAnswer(answer.id)
                                        }
                                      >
                                        <ThumbUp fontSize="small" />
                                      </IconButton>
                                      <Typography variant="caption">
                                        {answer.upvotes} upvotes
                                      </Typography>
                                      {user?.role === "student" &&
                                        question.studentId === user.id &&
                                        !answer.isAccepted && (
                                          <Button
                                            size="small"
                                            onClick={() =>
                                              handleAcceptAnswer(
                                                answer.id,
                                                question.id
                                              )
                                            }
                                          >
                                            Accept Answer
                                          </Button>
                                        )}
                                    </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      )}

                      {/* Answer Button for Tutors */}
                      {user?.role === "tutor" && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openAnswerDialog(question.id)}
                          sx={{ mt: 1 }}
                          disabled={
                            !assignedTutors.some(
                              (tutor) => tutor.id === user.id
                            )
                          }
                        >
                          {assignedTutors.some((tutor) => tutor.id === user.id)
                            ? "Answer Question"
                            : "Not Assigned to Topic"}
                        </Button>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < questions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Ask Question Dialog */}
      <Dialog
        open={questionDialogOpen}
        onClose={() => setQuestionDialogOpen(false)}
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
            label="Question Details"
            multiline
            rows={4}
            value={newQuestion.content}
            onChange={(e) =>
              setNewQuestion((prev) => ({ ...prev, content: e.target.value }))
            }
            margin="normal"
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newQuestion.isAnonymous}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    isAnonymous: e.target.checked,
                  }))
                }
              />
            }
            label="Ask anonymously"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAskQuestion}
            variant="contained"
            disabled={loading || !newQuestion.title || !newQuestion.content}
          >
            Ask Question
          </Button>
        </DialogActions>
      </Dialog>

      {/* Answer Question Dialog */}
      <Dialog
        open={answerDialogOpen}
        onClose={() => setAnswerDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Answer Question</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Your Answer"
            multiline
            rows={6}
            value={newAnswer.content}
            onChange={(e) =>
              setNewAnswer((prev) => ({ ...prev, content: e.target.value }))
            }
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnswerDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAnswerQuestion}
            variant="contained"
            disabled={loading || !newAnswer.content}
          >
            Submit Answer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tutor Assignment Dialog */}
      <TutorAssignmentDialog
        open={tutorAssignmentDialogOpen}
        onClose={() => setTutorAssignmentDialogOpen(false)}
        topicId={topicId!}
        topicTitle={topic.title}
        onTutorsUpdated={handleTutorsUpdated}
      />
    </Box>
  );
};

export default TopicDetailsPage;
