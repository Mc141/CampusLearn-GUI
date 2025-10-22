import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  TextField,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
} from "@mui/material";
import {
  Quiz,
  PlayArrow,
  CheckCircle,
  Cancel,
  Timer,
  Refresh,
} from "@mui/icons-material";
import { quizService, TopicQuiz, QuizResult } from "../services/quizService";

interface QuizTakingInterfaceProps {
  quiz: TopicQuiz;
  onComplete: (result: QuizResult) => void;
  onClose: () => void;
}

const QuizTakingInterface: React.FC<QuizTakingInterfaceProps> = ({
  quiz,
  onComplete,
  onClose,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer effect
  useEffect(() => {
    if (quiz.time_limit && !showResult) {
      setTimeRemaining(quiz.time_limit * 60); // Convert to seconds

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz.time_limit, showResult]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    // Grade the quiz
    const quizResult = quizService.gradeQuiz(quiz, answers);
    setResult(quizResult);
    setShowResult(true);
    setIsSubmitting(false);
  };

  const handleRetake = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResult(false);
    setResult(null);
    setTimeRemaining(quiz.time_limit ? quiz.time_limit * 60 : null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  if (showResult && result) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Quiz color="primary" />
            <Typography variant="h6">Quiz Complete!</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Score Summary */}
            <Card>
              <CardContent>
                <Box textAlign="center">
                  <Typography
                    variant="h4"
                    color={result.passed ? "success.main" : "error.main"}
                  >
                    {result.percentage}%
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {result.passed
                      ? "Congratulations! You passed!"
                      : "Keep studying!"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {result.correctAnswers} out of {result.totalQuestions}{" "}
                    questions correct
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Passing score: {quiz.passing_score}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Question Review:
              </Typography>
              {quiz.questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const isCorrect =
                  result.answers.find((a) => a.questionId === question.id)
                    ?.correct || false;

                return (
                  <Card key={question.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Question {index + 1}:
                        </Typography>
                        {isCorrect ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Cancel color="error" />
                        )}
                      </Box>

                      <Typography variant="body1" gutterBottom>
                        {question.question}
                      </Typography>

                      <Box mb={1}>
                        <Typography variant="body2" color="text.secondary">
                          Your answer: {userAnswer?.toString() || "No answer"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={isCorrect ? "success.main" : "error.main"}
                        >
                          {isCorrect ? "Correct!" : "Incorrect"}
                        </Typography>
                      </Box>

                      {question.explanation && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Explanation:</strong> {question.explanation}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={handleRetake}
          >
            Retake Quiz
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Quiz color="primary" />
            <Typography variant="h6">{quiz.title}</Typography>
          </Box>
          {timeRemaining !== null && (
            <Chip
              icon={<Timer />}
              label={formatTime(timeRemaining)}
              color={timeRemaining < 60 ? "error" : "primary"}
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box>
          {/* Progress Bar */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </Typography>
              <Typography variant="body2">
                {Math.round(progress)}% Complete
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} />
          </Box>

          {/* Question */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {currentQuestion.question}
              </Typography>

              {currentQuestion.type === "multiple_choice" && (
                <FormControl component="fieldset">
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString() || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        currentQuestion.id,
                        parseInt(e.target.value)
                      )
                    }
                  >
                    {currentQuestion.options?.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={index.toString()}
                        control={<Radio />}
                        label={option}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}

              {currentQuestion.type === "true_false" && (
                <FormControl component="fieldset">
                  <RadioGroup
                    value={answers[currentQuestion.id]?.toString() || ""}
                    onChange={(e) =>
                      handleAnswerChange(
                        currentQuestion.id,
                        e.target.value === "true"
                      )
                    }
                  >
                    <FormControlLabel
                      value="true"
                      control={<Radio />}
                      label="True"
                    />
                    <FormControlLabel
                      value="false"
                      control={<Radio />}
                      label="False"
                    />
                  </RadioGroup>
                </FormControl>
              )}

              {currentQuestion.type === "fill_blank" && (
                <TextField
                  fullWidth
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  placeholder="Enter your answer..."
                  variant="outlined"
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <Box display="flex" gap={1}>
              {currentQuestionIndex === quiz.questions.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={<Quiz />}
                >
                  Submit Quiz
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuizTakingInterface;
