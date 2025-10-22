import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Quiz,
  PlayArrow,
  Edit,
  Delete,
  Timer,
  School,
  Visibility,
} from "@mui/icons-material";
import { quizService, TopicQuiz } from "../services/quizService";
import { useAuth } from "../context/AuthContext";
import QuizCreationDialog from "./QuizCreationDialog";
import QuizTakingInterface from "./QuizTakingInterface";

interface QuizTabProps {
  topicId: string;
  canCreateQuiz?: boolean;
}

const QuizTab: React.FC<QuizTabProps> = ({ topicId, canCreateQuiz = true }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<TopicQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizCreationOpen, setQuizCreationOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<TopicQuiz | null>(null);
  const [canCreate, setCanCreate] = useState(false);

  // Load quizzes and check permissions
  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      const topicQuizzes = await quizService.getQuizzesForTopic(topicId);
      setQuizzes(topicQuizzes);

      // Check if user can create quizzes
      if (user && user.role === "tutor") {
        const canCreateQuiz = await quizService.canTutorCreateQuiz(
          topicId,
          user.id
        );
        setCanCreate(canCreateQuiz);
      } else {
        setCanCreate(false);
      }
    } catch (err) {
      console.error("Error loading quizzes:", err);
      setError("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [topicId, user]);

  const handleQuizCreated = () => {
    loadQuizzes(); // Reload quizzes
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm("Are you sure you want to delete this quiz?")) {
      return;
    }

    try {
      await quizService.deleteQuiz(quizId);
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
    } catch (err) {
      console.error("Error deleting quiz:", err);
      setError("Failed to delete quiz");
    }
  };

  const handleStartQuiz = (quiz: TopicQuiz) => {
    setSelectedQuiz(quiz);
  };

  const handleQuizComplete = (result: any) => {
    setSelectedQuiz(null);
    // Quiz results are not stored, just show feedback
    console.log("Quiz completed:", result);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const canDeleteQuiz = (quiz: TopicQuiz) => {
    return user && (user.role === "admin" || user.id === quiz.created_by);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">
          Interactive Quizzes ({quizzes.length})
        </Typography>
        {canCreateQuiz && canCreate && user && (
          <Button
            variant="contained"
            startIcon={<Quiz />}
            onClick={() => setQuizCreationOpen(true)}
          >
            Create Quiz
          </Button>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Quiz sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No quizzes available yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {canCreate
                ? "Create interactive quizzes to help students test their knowledge"
                : "Tutors will add quizzes for this topic soon"}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <List>
              {quizzes.map((quiz, index) => (
                <React.Fragment key={quiz.id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            {quiz.title}
                          </Typography>
                          <Chip
                            label={`${quiz.questions.length} Questions`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                          {quiz.time_limit && (
                            <Chip
                              icon={<Timer />}
                              label={`${quiz.time_limit} min`}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {quiz.description}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Passing Score: {quiz.passing_score}%
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Created {formatDate(quiz.created_at)}
                            </Typography>
                            {quiz.created_by_user && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                by {quiz.created_by_user.first_name}{" "}
                                {quiz.created_by_user.last_name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {user?.role === "student" && (
                          <Tooltip title="Take Quiz">
                            <Button
                              variant="contained"
                              startIcon={<PlayArrow />}
                              onClick={() => handleStartQuiz(quiz)}
                              size="small"
                            >
                              Start Quiz
                            </Button>
                          </Tooltip>
                        )}
                        {canDeleteQuiz(quiz) && (
                          <>
                            <Tooltip title="Delete Quiz">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteQuiz(quiz.id)}
                                color="error"
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < quizzes.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Quiz Creation Dialog */}
      <QuizCreationDialog
        open={quizCreationOpen}
        onClose={() => setQuizCreationOpen(false)}
        onSuccess={handleQuizCreated}
        topicId={topicId}
        userId={user?.id || ""}
      />

      {/* Quiz Taking Interface */}
      {selectedQuiz && (
        <QuizTakingInterface
          quiz={selectedQuiz}
          onComplete={handleQuizComplete}
          onClose={() => setSelectedQuiz(null)}
        />
      )}
    </Box>
  );
};

export default QuizTab;
