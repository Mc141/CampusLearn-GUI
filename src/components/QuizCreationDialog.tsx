import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Chip,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
} from "@mui/material";
import {
  Quiz,
  ExpandMore,
  Add,
  Delete,
  Edit,
  RadioButtonChecked,
  CheckBox,
  ShortText,
} from "@mui/icons-material";
import {
  quizService,
  QuizQuestion,
  CreateQuizData,
} from "../services/quizService";

interface QuizCreationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  topicId: string;
  userId: string;
}

const QuizCreationDialog: React.FC<QuizCreationDialogProps> = ({
  open,
  onClose,
  onSuccess,
  topicId,
  userId,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | undefined>();
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const addQuestion = (type: QuizQuestion["type"]) => {
    const newQuestion: QuizQuestion = {
      id: `q${Date.now()}`,
      type,
      question: "",
      options: type === "multiple_choice" ? ["", "", "", ""] : undefined,
      correctAnswer:
        type === "true_false" ? true : type === "multiple_choice" ? 0 : [""],
      explanation: "",
    };
    setQuestions([...questions, newQuestion]);
    setExpandedQuestion(newQuestion.id);
  };

  const updateQuestion = (
    questionId: string,
    updates: Partial<QuizQuestion>
  ) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
    );
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId));
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    }
  };

  const addOption = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, ""],
      });
    }
  };

  const updateOption = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.options && question.options.length > 2) {
      const newOptions = question.options.filter(
        (_, index) => index !== optionIndex
      );
      updateQuestion(questionId, {
        options: newOptions,
        correctAnswer:
          question.correctAnswer === optionIndex ? 0 : question.correctAnswer,
      });
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a quiz title");
      return;
    }

    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.question.trim()) {
        setError("All questions must have text");
        return;
      }

      if (question.type === "multiple_choice") {
        const validOptions = question.options?.filter((opt) => opt.trim());
        if (!validOptions || validOptions.length < 2) {
          setError("Multiple choice questions must have at least 2 options");
          return;
        }
      }

      if (question.type === "fill_blank") {
        const correctAnswers = Array.isArray(question.correctAnswer)
          ? question.correctAnswer
          : [question.correctAnswer];
        if (!correctAnswers.some((ans) => ans?.toString().trim())) {
          setError(
            "Fill-in-the-blank questions must have at least one correct answer"
          );
          return;
        }
      }
    }

    try {
      setLoading(true);
      setError(null);

      const quizData: CreateQuizData = {
        title,
        description,
        questions,
        time_limit: timeLimit,
        passing_score: passingScore,
      };

      await quizService.createQuiz(topicId, quizData, userId);

      // Reset form
      setTitle("");
      setDescription("");
      setTimeLimit(undefined);
      setPassingScore(70);
      setQuestions([]);
      setExpandedQuestion(null);

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating quiz:", err);
      setError("Failed to create quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle("");
      setDescription("");
      setTimeLimit(undefined);
      setPassingScore(70);
      setQuestions([]);
      setExpandedQuestion(null);
      setError(null);
      onClose();
    }
  };

  const getQuestionIcon = (type: QuizQuestion["type"]) => {
    switch (type) {
      case "multiple_choice":
        return <RadioButtonChecked color="primary" />;
      case "true_false":
        return <CheckBox color="secondary" />;
      case "fill_blank":
        return <ShortText color="success" />;
      default:
        return <Quiz color="action" />;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Quiz color="primary" />
          <Typography variant="h6">Create Quiz</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Quiz Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            disabled={loading}
            required
            placeholder="Enter quiz title..."
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            disabled={loading}
            placeholder="Optional description of what this quiz covers..."
          />

          <Box display="flex" gap={2}>
            <TextField
              label="Time Limit (minutes)"
              type="number"
              value={timeLimit || ""}
              onChange={(e) =>
                setTimeLimit(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              disabled={loading}
              placeholder="Optional"
              sx={{ width: 200 }}
            />
            <TextField
              label="Passing Score (%)"
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
              disabled={loading}
              sx={{ width: 200 }}
            />
          </Box>

          <Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Typography variant="h6">
                Questions ({questions.length})
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => addQuestion("multiple_choice")}
                  size="small"
                >
                  Multiple Choice
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => addQuestion("true_false")}
                  size="small"
                >
                  True/False
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => addQuestion("fill_blank")}
                  size="small"
                >
                  Fill Blank
                </Button>
              </Box>
            </Box>

            {questions.map((question, index) => (
              <Accordion
                key={question.id}
                expanded={expandedQuestion === question.id}
                onChange={() =>
                  setExpandedQuestion(
                    expandedQuestion === question.id ? null : question.id
                  )
                }
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1} width="100%">
                    {getQuestionIcon(question.type)}
                    <Typography variant="subtitle1">
                      Question {index + 1}:{" "}
                      {question.question || "Untitled Question"}
                    </Typography>
                    <Chip
                      label={question.type.replace("_", " ").toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                    <Box flexGrow={1} />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteQuestion(question.id);
                      }}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                      label="Question"
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          question: e.target.value,
                        })
                      }
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Enter your question..."
                    />

                    {question.type === "multiple_choice" && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Options:
                        </Typography>
                        {question.options?.map((option, optionIndex) => (
                          <Box
                            key={optionIndex}
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={1}
                          >
                            <Radio
                              checked={question.correctAnswer === optionIndex}
                              onChange={() =>
                                updateQuestion(question.id, {
                                  correctAnswer: optionIndex,
                                })
                              }
                            />
                            <TextField
                              value={option}
                              onChange={(e) =>
                                updateOption(
                                  question.id,
                                  optionIndex,
                                  e.target.value
                                )
                              }
                              fullWidth
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            {question.options &&
                              question.options.length > 2 && (
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    deleteOption(question.id, optionIndex)
                                  }
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              )}
                          </Box>
                        ))}
                        <Button
                          startIcon={<Add />}
                          onClick={() => addOption(question.id)}
                          size="small"
                        >
                          Add Option
                        </Button>
                      </Box>
                    )}

                    {question.type === "true_false" && (
                      <FormControl>
                        <Typography variant="subtitle2" gutterBottom>
                          Correct Answer:
                        </Typography>
                        <RadioGroup
                          value={question.correctAnswer}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              correctAnswer: e.target.value === "true",
                            })
                          }
                        >
                          <FormControlLabel
                            value={true}
                            control={<Radio />}
                            label="True"
                          />
                          <FormControlLabel
                            value={false}
                            control={<Radio />}
                            label="False"
                          />
                        </RadioGroup>
                      </FormControl>
                    )}

                    {question.type === "fill_blank" && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Correct Answers (one per line):
                        </Typography>
                        <TextField
                          value={
                            Array.isArray(question.correctAnswer)
                              ? question.correctAnswer.join("\n")
                              : question.correctAnswer || ""
                          }
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              correctAnswer: e.target.value
                                .split("\n")
                                .filter((ans) => ans.trim()),
                            })
                          }
                          fullWidth
                          multiline
                          rows={3}
                          placeholder="Enter correct answers, one per line..."
                        />
                      </Box>
                    )}

                    <TextField
                      label="Explanation (optional)"
                      value={question.explanation || ""}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          explanation: e.target.value,
                        })
                      }
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Explain why this is the correct answer..."
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}

            {questions.length === 0 && (
              <Box textAlign="center" py={4}>
                <Quiz sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No questions added yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add questions to create your quiz
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !title.trim() || questions.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <Quiz />}
        >
          {loading ? "Creating..." : "Create Quiz"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuizCreationDialog;
