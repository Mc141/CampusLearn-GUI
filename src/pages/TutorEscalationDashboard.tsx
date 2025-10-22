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
  CardActions,
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  chatbotEscalationService,
  ChatbotEscalation,
} from "../services/chatbotEscalationService";
import { useNavigate } from "react-router-dom";

const TutorEscalationDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [escalations, setEscalations] = useState<ChatbotEscalation[]>([]);
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
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadEscalations();
      loadStats();
    }
  }, [user?.id]);

  const loadEscalations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await chatbotEscalationService.getEscalationsForTutor(
        user.id
      );
      setEscalations(data);
    } catch (err) {
      console.error("Error loading escalations:", err);
      setError("Failed to load escalations");
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

  const handleProcessPendingEscalations = async () => {
    try {
      setLoading(true);
      console.log(" Tutor triggered processing of pending escalations");
      await chatbotEscalationService.processPendingEscalations();

      // Reload data to show any new assignments
      await loadEscalations();
      await loadStats();

      console.log(" Pending escalations processing completed");
    } catch (err) {
      console.error("Error processing pending escalations:", err);
      setError("Failed to process pending escalations");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveEscalation = async () => {
    if (!selectedEscalation) return;

    try {
      const success = await chatbotEscalationService.resolveEscalation(
        selectedEscalation.id
      );
      if (success) {
        setResolveDialogOpen(false);
        setSelectedEscalation(null);
        setResolveNote("");
        await loadEscalations();
        await loadStats();
      } else {
        setError("Failed to resolve escalation");
      }
    } catch (err) {
      console.error("Error resolving escalation:", err);
      setError("Failed to resolve escalation");
    }
  };

  const handleOpenMessageThread = (escalation: ChatbotEscalation) => {
    if (escalation.messageThreadId) {
      navigate(`/messages?conversation=${escalation.messageThreadId}`);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "assigned":
        return "info";
      case "resolved":
        return "success";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;
      return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
    } catch (error) {
      return "Invalid Date";
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Tutor Escalation Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage chatbot escalations and help students with complex
              questions
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleProcessPendingEscalations}
            disabled={loading}
            sx={{
              fontWeight: "bold",
              textTransform: "none",
              px: 3,
            }}
          >
            Check for New Assignments
          </Button>
        </Box>
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
                Pending
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

      {/* Escalations List */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Your Assigned Escalations
        </Typography>

        {escalations.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No escalations assigned to you yet.
            </Typography>
          </Box>
        ) : (
          <List>
            {escalations.map((escalation) => (
              <React.Fragment key={escalation.id}>
                <ListItem
                  sx={{
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    bgcolor:
                      escalation.status === "assigned"
                        ? "action.hover"
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
                          label={escalation.status}
                          color={getStatusColor(escalation.status) as any}
                          size="small"
                        />
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
                          {escalation.assignedAt && (
                            <>
                              {" "}
                              • Assigned: {formatDate(escalation.assignedAt)}
                            </>
                          )}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {escalation.messageThreadId && (
                      <Button
                        startIcon={<Message />}
                        onClick={() => handleOpenMessageThread(escalation)}
                        variant="outlined"
                        size="small"
                      >
                        Open Chat
                      </Button>
                    )}
                    {escalation.status === "assigned" && (
                      <Button
                        startIcon={<CheckCircle />}
                        onClick={() => {
                          setSelectedEscalation(escalation);
                          setResolveDialogOpen(true);
                        }}
                        variant="contained"
                        size="small"
                        color="success"
                      >
                        Resolve
                      </Button>
                    )}
                  </Box>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>

      {/* Resolve Dialog */}
      <Dialog
        open={resolveDialogOpen}
        onClose={() => setResolveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Resolve Escalation</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to mark this escalation as resolved?
          </Typography>
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
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Resolution Notes (Optional)"
            value={resolveNote}
            onChange={(e) => setResolveNote(e.target.value)}
            placeholder="Add any notes about how this was resolved..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleResolveEscalation}
            variant="contained"
            color="success"
          >
            Mark as Resolved
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TutorEscalationDashboard;
