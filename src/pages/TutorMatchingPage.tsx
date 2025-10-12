import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Badge,
} from "@mui/material";
import {
  People,
  School,
  CheckCircle,
  Schedule,
  Star,
  StarBorder,
  Message,
  Assignment,
  TrendingUp,
  PersonAdd,
  FilterList,
  Search,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockModules } from "../data/mockData";

interface TutorMatch {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorEmail: string;
  modules: string[];
  rating: number;
  responseTime: string;
  availability: string;
  experience: string;
  matchScore: number;
  isAvailable: boolean;
  lastActive: Date;
}

interface StudentRequest {
  id: string;
  studentId: string;
  studentName: string;
  module: string;
  topic: string;
  description: string;
  urgency: "low" | "medium" | "high";
  createdAt: Date;
  status: "pending" | "matched" | "completed";
  matchedTutor?: string;
}

const TutorMatchingPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [openMatchDialog, setOpenMatchDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StudentRequest | null>(
    null
  );

  const [tutorMatches] = useState<TutorMatch[]>([
    {
      id: "1",
      tutorId: "tutor1",
      tutorName: "Jane Smith",
      tutorEmail: "jane@belgiumcampus.ac.za",
      modules: ["1", "3"],
      rating: 4.8,
      responseTime: "2 hours",
      availability: "Weekdays 6-8 PM",
      experience: "2 years tutoring experience",
      matchScore: 95,
      isAvailable: true,
      lastActive: new Date("2024-01-20"),
    },
    {
      id: "2",
      tutorId: "tutor2",
      tutorName: "Mike Johnson",
      tutorEmail: "mike@belgiumcampus.ac.za",
      modules: ["2", "4"],
      rating: 4.6,
      responseTime: "4 hours",
      availability: "Weekends",
      experience: "1 year tutoring experience",
      matchScore: 87,
      isAvailable: true,
      lastActive: new Date("2024-01-19"),
    },
    {
      id: "3",
      tutorId: "tutor3",
      tutorName: "Sarah Wilson",
      tutorEmail: "sarah@belgiumcampus.ac.za",
      modules: ["1", "5"],
      rating: 4.9,
      responseTime: "1 hour",
      availability: "Flexible",
      experience: "3 years tutoring experience",
      matchScore: 92,
      isAvailable: false,
      lastActive: new Date("2024-01-18"),
    },
  ]);

  const [studentRequests] = useState<StudentRequest[]>([
    {
      id: "1",
      studentId: "student1",
      studentName: "John Doe",
      module: "BCS101",
      topic: "Machine Learning Algorithms",
      description:
        "I need help understanding supervised vs unsupervised learning",
      urgency: "high",
      createdAt: new Date("2024-01-20"),
      status: "pending",
    },
    {
      id: "2",
      studentId: "student2",
      studentName: "Alice Brown",
      module: "BIT101",
      topic: "React Hooks",
      description: "Struggling with useEffect and useState hooks",
      urgency: "medium",
      createdAt: new Date("2024-01-19"),
      status: "matched",
      matchedTutor: "Jane Smith",
    },
    {
      id: "3",
      studentId: "student3",
      studentName: "Bob Green",
      module: "BIT102",
      topic: "Database Design",
      description: "Need help with normalization and indexing",
      urgency: "low",
      createdAt: new Date("2024-01-18"),
      status: "completed",
      matchedTutor: "Mike Johnson",
    },
  ]);

  const [newRequest, setNewRequest] = useState({
    module: "",
    topic: "",
    description: "",
    urgency: "medium" as "low" | "medium" | "high",
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "matched":
        return "info";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  const handleCreateRequest = () => {
    // Simulate API call
    console.log("Creating tutor request:", newRequest);
    setOpenRequestDialog(false);
    setNewRequest({
      module: "",
      topic: "",
      description: "",
      urgency: "medium",
    });
  };

  const handleMatchTutor = (request: StudentRequest) => {
    setSelectedRequest(request);
    setOpenMatchDialog(true);
  };

  const handleConfirmMatch = (tutorId: string) => {
    // Simulate API call
    console.log(
      "Matching tutor:",
      tutorId,
      "with request:",
      selectedRequest?.id
    );
    setOpenMatchDialog(false);
    setSelectedRequest(null);
  };

  const renderTutorMatches = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Available Tutors
      </Typography>
      <Grid container spacing={2}>
        {tutorMatches.map((tutor) => (
          <Grid item xs={12} md={6} key={tutor.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                    {tutor.tutorName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {tutor.tutorName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tutor.experience}
                    </Typography>
                  </Box>
                  <Chip
                    label={tutor.isAvailable ? "Available" : "Busy"}
                    color={tutor.isAvailable ? "success" : "default"}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Match Score
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {tutor.matchScore}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={tutor.matchScore}
                    color={
                      tutor.matchScore >= 90
                        ? "success"
                        : tutor.matchScore >= 80
                        ? "warning"
                        : "error"
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h6" color="primary">
                        {tutor.rating}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rating
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h6" color="secondary">
                        {tutor.responseTime}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Response Time
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
                  {tutor.availability}
                </Typography>

                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}
                >
                  {tutor.modules.map((moduleId) => {
                    const module = mockModules.find((m) => m.id === moduleId);
                    return (
                      <Chip
                        key={moduleId}
                        label={module?.code || moduleId}
                        size="small"
                      />
                    );
                  })}
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Message />}
                    fullWidth
                    disabled={!tutor.isAvailable}
                  >
                    Contact
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<StarBorder />}
                  >
                    Favorite
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderStudentRequests = () => (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">Tutor Requests</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setOpenRequestDialog(true)}
        >
          Request Tutor
        </Button>
      </Box>

      <Grid container spacing={2}>
        {studentRequests.map((request) => (
          <Grid item xs={12} key={request.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {request.topic}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {request.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requested by {request.studentName} • {request.module}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip
                      label={request.urgency.toUpperCase()}
                      color={getUrgencyColor(request.urgency)}
                      size="small"
                    />
                    <Chip
                      label={request.status.toUpperCase()}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Created: {request.createdAt.toLocaleDateString()}
                    {request.matchedTutor &&
                      ` • Matched with: ${request.matchedTutor}`}
                  </Typography>
                  {request.status === "pending" && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleMatchTutor(request)}
                    >
                      Find Tutor
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderRequestDialog = () => (
    <Dialog
      open={openRequestDialog}
      onClose={() => setOpenRequestDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Request a Tutor</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Module</InputLabel>
          <Select
            value={newRequest.module}
            onChange={(e) =>
              setNewRequest((prev) => ({ ...prev, module: e.target.value }))
            }
            label="Module"
          >
            {mockModules.map((module) => (
              <MenuItem key={module.id} value={module.id}>
                {module.code} - {module.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Topic"
          value={newRequest.topic}
          onChange={(e) =>
            setNewRequest((prev) => ({ ...prev, topic: e.target.value }))
          }
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Description"
          value={newRequest.description}
          onChange={(e) =>
            setNewRequest((prev) => ({ ...prev, description: e.target.value }))
          }
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth>
          <InputLabel>Urgency</InputLabel>
          <Select
            value={newRequest.urgency}
            onChange={(e) =>
              setNewRequest((prev) => ({
                ...prev,
                urgency: e.target.value as any,
              }))
            }
            label="Urgency"
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenRequestDialog(false)}>Cancel</Button>
        <Button onClick={handleCreateRequest} variant="contained">
          Submit Request
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderMatchDialog = () => (
    <Dialog
      open={openMatchDialog}
      onClose={() => setOpenMatchDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Match Tutor for Request</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          {selectedRequest?.topic}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {selectedRequest?.description}
        </Typography>

        <Typography variant="h6" gutterBottom>
          Recommended Tutors
        </Typography>
        <Grid container spacing={2}>
          {tutorMatches.slice(0, 3).map((tutor) => (
            <Grid item xs={12} md={4} key={tutor.id}>
              <Card
                sx={{
                  cursor: "pointer",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {tutor.tutorName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {tutor.experience}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="body2">
                      Rating: {tutor.rating}
                    </Typography>
                    <Typography variant="body2">
                      Response: {tutor.responseTime}
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleConfirmMatch(tutor.tutorId)}
                    disabled={!tutor.isAvailable}
                  >
                    Match Tutor
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenMatchDialog(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Tutor Matching 🎯
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.1rem" }}
        >
          Connect students with the right tutors based on expertise and
          availability
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Available Tutors" />
            <Tab label="Student Requests" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {tabValue === 0 && renderTutorMatches()}
          {tabValue === 1 && renderStudentRequests()}
        </CardContent>
      </Card>

      {renderRequestDialog()}
      {renderMatchDialog()}
    </Box>
  );
};

export default TutorMatchingPage;



