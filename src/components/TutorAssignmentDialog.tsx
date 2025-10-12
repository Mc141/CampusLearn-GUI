import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Person, School, Add, Remove } from "@mui/icons-material";
import {
  tutorTopicAssignmentService,
  TutorWithDetails,
} from "../services/tutorTopicAssignmentService";
import { useAuth } from "../context/AuthContext";

interface TutorAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  topicId: string;
  topicTitle: string;
  onTutorsUpdated: () => void;
}

const TutorAssignmentDialog: React.FC<TutorAssignmentDialogProps> = ({
  open,
  onClose,
  topicId,
  topicTitle,
  onTutorsUpdated,
}) => {
  const { user } = useAuth();
  const [assignedTutors, setAssignedTutors] = useState<TutorWithDetails[]>([]);
  const [availableTutors, setAvailableTutors] = useState<TutorWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tutors when dialog opens
  useEffect(() => {
    if (open) {
      loadTutors();
    }
  }, [open, topicId]);

  const loadTutors = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assigned, available] = await Promise.all([
        tutorTopicAssignmentService.getTutorsForTopic(topicId),
        tutorTopicAssignmentService.getAvailableTutorsForTopic(topicId),
      ]);

      setAssignedTutors(assigned);
      setAvailableTutors(available);
    } catch (err) {
      console.error("Error loading tutors:", err);
      setError("Failed to load tutors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTutor = async (tutorId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      await tutorTopicAssignmentService.assignTutorToTopic(topicId, tutorId);
      await loadTutors(); // Reload to update lists
      onTutorsUpdated(); // Notify parent component
    } catch (err) {
      console.error("Error assigning tutor:", err);
      setError("Failed to assign tutor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTutor = async (tutorId: string) => {
    try {
      setLoading(true);
      await tutorTopicAssignmentService.removeTutorFromTopic(topicId, tutorId);
      await loadTutors(); // Reload to update lists
      onTutorsUpdated(); // Notify parent component
    } catch (err) {
      console.error("Error removing tutor:", err);
      setError("Failed to remove tutor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Tutors for "{topicTitle}"</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress />
          </Box>
        )}

        {/* Assigned Tutors */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Assigned Tutors ({assignedTutors.length})
          </Typography>
          {assignedTutors.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No tutors assigned to this topic yet.
            </Typography>
          ) : (
            <List>
              {assignedTutors.map((tutor) => (
                <ListItem key={tutor.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: "success.main" }}>
                      {tutor.firstName[0]}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={`${tutor.firstName} ${tutor.lastName}`}
                    secondary={tutor.email}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Remove />}
                    onClick={() => handleRemoveTutor(tutor.id)}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Available Tutors */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Available Tutors ({availableTutors.length})
          </Typography>
          {availableTutors.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No available tutors for this topic's module.
            </Typography>
          ) : (
            <List>
              {availableTutors.map((tutor) => (
                <ListItem key={tutor.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {tutor.firstName[0]}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={`${tutor.firstName} ${tutor.lastName}`}
                    secondary={tutor.email}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleAssignTutor(tutor.id)}
                    disabled={loading}
                  >
                    Assign
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TutorAssignmentDialog;
