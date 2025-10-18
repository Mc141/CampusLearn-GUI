import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Person,
  School,
  Assignment,
  CheckCircle,
  Cancel,
  Warning,
  TrendingUp,
  Message,
  Schedule,
  AutoAwesome,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  chatbotEscalationService,
  ChatbotEscalation,
  TutorWithAvailability,
} from "../services/chatbotEscalationService";
import { useNavigate } from "react-router-dom";

const AdminEscalationManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingEscalations, setPendingEscalations] = useState<
    ChatbotEscalation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    resolved: 0,
    cancelled: 0,
  });
  const [selectedEscalation, setSelectedEscalation] =
    useState<ChatbotEscalation | null>(null);
  const [availableTutors, setAvailableTutors] = useState<
    TutorWithAvailability[]
  >([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState("");

  useEffect(() => {
    if (user?.role === "admin") {
      loadPendingEscalations();
      loadStats();
    }
  }, [user?.role]);

  const loadPendingEscalations = async () => {
    try {
      setLoading(true);
      const data = await chatbotEscalationService.getPendingEscalations();
      setPendingEscalations(data);
    } catch (err) {
      console.error("Error loading pending escalations:", err);
      setError("Failed to load pending escalations");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await chatbotEscalationService.getEscalationStats();
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const loadAvailableTutors = async (moduleCode?: string) => {
    try {
      const tutors = await chatbotEscalationService.findAvailableTutors(
        moduleCode
      );
      setAvailableTutors(tutors);
    } catch (err) {
      console.error("Error loading available tutors:", err);
    }
  };

  const handleProcessPendingEscalations = async () => {
    try {
      setLoading(true);
      console.log("🔄 Admin triggered processing of pending escalations");
      await chatbotEscalationService.processPendingEscalations();

      // Reload data to show updated assignments
      await loadPendingEscalations();
      await loadStats();

      console.log("✅ Pending escalations processing completed");
    } catch (err) {
      console.error("Error processing pending escalations:", err);
      setError("Failed to process pending escalations");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTutor = async () => {
    if (!selectedEscalation || !selectedTutorId) return;

    try {
      const success = await chatbotEscalationService.assignTutorToEscalation(
        selectedEscalation.id,
        selectedTutorId
      );

      if (success) {
        setAssignDialogOpen(false);
        setSelectedEscalation(null);
        setSelectedTutorId("");
        await loadPendingEscalations();
        await loadStats();
      } else {
        setError("Failed to assign tutor");
      }
    } catch (err) {
      console.error("Error assigning tutor:", err);
      setError("Failed to assign tutor");
    }
  };

  const handleAutoAssign = async (escalation: ChatbotEscalation) => {
    try {
      const success = await chatbotEscalationService.autoAssignEscalation(
        escalation.id
      );
      if (success) {
        await loadPendingEscalations();
        await loadStats();
      } else {
        setError("No available tutors found for auto-assignment");
      }
    } catch (err) {
      console.error("Error auto-assigning:", err);
      setError("Failed to auto-assign tutor");
    }
  };

  const handleCancelEscalation = async (escalationId: string) => {
    try {
      const success = await chatbotEscalationService.cancelEscalation(
        escalationId
      );
      if (success) {
        await loadPendingEscalations();
        await loadStats();
      } else {
        setError("Failed to cancel escalation");
      }
    } catch (err) {
      console.error("Error cancelling escalation:", err);
      setError("Failed to cancel escalation");
    }
  };

  const handleOpenAssignDialog = async (escalation: ChatbotEscalation) => {
    setSelectedEscalation(escalation);
    await loadAvailableTutors(escalation.moduleCode);
    setAssignDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (user?.role !== "admin") {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. This page is only available to administrators.
        </Alert>
      </Box>
    );
  }

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
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Escalation Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage chatbot escalations and assign tutors to help students
        </Typography>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Assignment color="primary" />
                <Typography variant="h6">{stats.total}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Escalations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Schedule color="warning" />
                <Typography variant="h6">{stats.pending}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Pending Assignment
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Person color="info" />
                <Typography variant="h6">{stats.assigned}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Assigned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircle color="success" />
                <Typography variant="h6">{stats.resolved}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Cancel color="error" />
                <Typography variant="h6">{stats.cancelled}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Cancelled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Escalations */}
      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            Pending Escalations ({pendingEscalations.length})
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleProcessPendingEscalations}
            disabled={loading || pendingEscalations.length === 0}
            sx={{
              fontWeight: "bold",
              textTransform: "none",
              px: 3,
            }}
          >
            🔄 Process Pending Escalations
          </Button>
        </Box>

        {pendingEscalations.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No pending escalations.
            </Typography>
          </Box>
        ) : (
          <List>
            {pendingEscalations.map((escalation) => (
              <React.Fragment key={escalation.id}>
                <ListItem
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    bgcolor:
                      escalation.priority === "high"
                        ? "error.light"
                        : "background.paper",
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
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
                        <Typography variant="subtitle1" fontWeight="bold">
                          {escalation.student?.first_name}{" "}
                          {escalation.student?.last_name}
                        </Typography>
                        <Chip
                          label={escalation.priority}
                          color={getPriorityColor(escalation.priority) as any}
                          size="small"
                        />
                        {escalation.moduleCode && (
                          <Chip
                            label={escalation.moduleCode}
                            icon={<School />}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Question:</strong>{" "}
                          {escalation.originalQuestion}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          <strong>Reason:</strong> {escalation.escalationReason}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(escalation.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      startIcon={<AutoAwesome />}
                      onClick={() => handleAutoAssign(escalation)}
                      variant="outlined"
                      size="small"
                      color="primary"
                    >
                      Auto Assign
                    </Button>
                    <Button
                      startIcon={<Person />}
                      onClick={() => handleOpenAssignDialog(escalation)}
                      variant="outlined"
                      size="small"
                    >
                      Manual Assign
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      onClick={() => handleCancelEscalation(escalation.id)}
                      variant="outlined"
                      size="small"
                      color="error"
                    >
                      Cancel
                    </Button>
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Assign Tutor Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Tutor</DialogTitle>
        <DialogContent>
          {selectedEscalation && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Student Question:
              </Typography>
              <Typography
                variant="body2"
                sx={{ mb: 2, p: 1, bgcolor: "grey.100", borderRadius: 1 }}
              >
                {selectedEscalation.originalQuestion}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Module: {selectedEscalation.moduleCode || "General"}
              </Typography>
            </Box>
          )}

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Tutor</InputLabel>
            <Select
              value={selectedTutorId}
              onChange={(e) => setSelectedTutorId(e.target.value)}
              label="Select Tutor"
            >
              {availableTutors.map((tutor) => (
                <MenuItem key={tutor.id} value={tutor.id}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {tutor.firstName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {tutor.firstName} {tutor.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tutor.modules.join(", ")} • {tutor.currentEscalations}{" "}
                        active escalations
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAssignTutor}
            variant="contained"
            disabled={!selectedTutorId}
          >
            Assign Tutor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminEscalationManagement;
