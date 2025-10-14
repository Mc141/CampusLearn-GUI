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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from "@mui/material";
import {
  School,
  Person,
  Add,
  Remove,
  ExpandMore,
  Assignment,
  CheckCircle,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  tutorModuleAssignmentService,
  TutorWithModuleDetails,
} from "../services/tutorModuleAssignmentService";

const TutorModuleAssignmentPage: React.FC = () => {
  const { user } = useAuth();
  const [tutors, setTutors] = useState<TutorWithModuleDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment dialog state
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] =
    useState<TutorWithModuleDetails | null>(null);
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Load tutors on component mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadTutors = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Request timeout - please try again"));
          }, 10000); // 10 second timeout
        });

        const dataPromise = tutorModuleAssignmentService.getAllApprovedTutors();

        const tutorsData = (await Promise.race([
          dataPromise,
          timeoutPromise,
        ])) as TutorWithModuleDetails[];

        clearTimeout(timeoutId);

        if (isMounted) {
          setTutors(tutorsData);
        }
      } catch (err) {
        console.error("Error loading tutors:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load tutors. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTutors();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleOpenAssignmentDialog = async (tutor: TutorWithModuleDetails) => {
    try {
      setSelectedTutor(tutor);
      setSelectedModuleId("");

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout - please try again"));
        }, 10000); // 10 second timeout
      });

      const dataPromise =
        tutorModuleAssignmentService.getAvailableModulesForTutor(tutor.id);

      const modules = (await Promise.race([
        dataPromise,
        timeoutPromise,
      ])) as any[];

      setAvailableModules(modules);
      setAssignmentDialogOpen(true);
    } catch (err) {
      console.error("Error loading available modules:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load available modules. Please try again."
      );
    }
  };

  const handleAssignModule = async () => {
    if (!selectedTutor || !selectedModuleId || !user) return;

    try {
      setAssignmentLoading(true);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout - please try again"));
        }, 10000); // 10 second timeout
      });

      const assignPromise = tutorModuleAssignmentService.assignTutorToModule(
        selectedTutor.id,
        selectedModuleId,
        user.id
      );

      await Promise.race([assignPromise, timeoutPromise]);

      // Reload tutors to update the list
      await loadTutors();

      setAssignmentDialogOpen(false);
      setSelectedTutor(null);
      setSelectedModuleId("");
    } catch (err) {
      console.error("Error assigning module:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to assign module. Please try again."
      );
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleRemoveModule = async (tutorId: string, moduleId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this tutor from the module?"
      )
    ) {
      return;
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout - please try again"));
        }, 10000); // 10 second timeout
      });

      const removePromise = tutorModuleAssignmentService.removeTutorFromModule(
        tutorId,
        moduleId
      );

      await Promise.race([removePromise, timeoutPromise]);

      // Reload tutors to update the list
      await loadTutors();
    } catch (err) {
      console.error("Error removing module:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove module assignment. Please try again."
      );
    }
  };

  const handleCloseDialog = () => {
    setAssignmentDialogOpen(false);
    setSelectedTutor(null);
    setSelectedModuleId("");
    setAvailableModules([]);
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
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Tutor Module Assignment
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Assign approved tutors to modules they can teach
        </Typography>
      </Box>

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h4"
                  color="primary"
                  sx={{ fontWeight: 600 }}
                >
                  {tutors.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved Tutors
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h4"
                  color="success.main"
                  sx={{ fontWeight: 600 }}
                >
                  {tutors.reduce(
                    (sum, tutor) => sum + tutor.approvedModules.length,
                    0
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Assignments
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: "center" }}>
                <Typography
                  variant="h4"
                  color="warning.main"
                  sx={{ fontWeight: 600 }}
                >
                  {
                    tutors.filter((tutor) => tutor.approvedModules.length === 0)
                      .length
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unassigned Tutors
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tutors List */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Approved Tutors ({tutors.length})
          </Typography>

          {tutors.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <School sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No approved tutors found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tutors need to apply and be approved before they can be assigned
                to modules.
              </Typography>
            </Paper>
          ) : (
            <List>
              {tutors.map((tutor, index) => (
                <React.Fragment key={tutor.id}>
                  <ListItem sx={{ px: 0, py: 2 }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: "primary.main" }}>
                        {tutor.firstName[0]}
                      </Avatar>
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
                            {tutor.firstName} {tutor.lastName}
                          </Typography>
                          <Chip
                            icon={<CheckCircle />}
                            label="Approved"
                            size="small"
                            color="success"
                          />
                          {tutor.studentNumber && (
                            <Chip
                              label={tutor.studentNumber}
                              size="small"
                              variant="outlined"
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
                            {tutor.email}
                          </Typography>

                          {/* Assigned Modules */}
                          <Accordion>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography variant="subtitle2">
                                Assigned Modules ({tutor.approvedModules.length}
                                )
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {tutor.approvedModules.length === 0 ? (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  No modules assigned yet.
                                </Typography>
                              ) : (
                                <Stack spacing={1}>
                                  {tutor.approvedModules.map((module) => (
                                    <Box
                                      key={module.id}
                                      sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        p: 1,
                                        border: 1,
                                        borderColor: "divider",
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Box>
                                        <Typography
                                          variant="body2"
                                          sx={{ fontWeight: 500 }}
                                        >
                                          {module.code} - {module.name}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          Level: {module.level}
                                        </Typography>
                                      </Box>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() =>
                                          handleRemoveModule(
                                            tutor.id,
                                            module.id
                                          )
                                        }
                                        title="Remove from module"
                                      >
                                        <Remove />
                                      </IconButton>
                                    </Box>
                                  ))}
                                </Stack>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        </Box>
                      }
                    />
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => handleOpenAssignmentDialog(tutor)}
                    >
                      Assign Module
                    </Button>
                  </ListItem>
                  {index < tutors.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog
        open={assignmentDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Assign Module to {selectedTutor?.firstName} {selectedTutor?.lastName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a module to assign to this tutor. They will be able to answer
            questions for topics in this module.
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>Select Module</InputLabel>
            <Select
              value={selectedModuleId}
              label="Select Module"
              onChange={(e) => setSelectedModuleId(e.target.value)}
            >
              {availableModules.map((module) => (
                <MenuItem key={module.id} value={module.id}>
                  {module.code} - {module.name} ({module.level})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {availableModules.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This tutor is already assigned to all available modules.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleAssignModule}
            variant="contained"
            disabled={assignmentLoading || !selectedModuleId}
          >
            {assignmentLoading ? "Assigning..." : "Assign Module"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TutorModuleAssignmentPage;
