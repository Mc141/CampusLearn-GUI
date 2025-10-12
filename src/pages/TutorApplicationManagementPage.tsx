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
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack,
} from "@mui/material";
import {
  Person,
  School,
  Work,
  Schedule,
  Psychology,
  CheckCircle,
  Cancel,
  ExpandMore,
  Visibility,
  FilterList,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  tutorApplicationService,
  TutorApplicationWithDetails,
} from "../services/tutorApplicationService";

const TutorApplicationManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<
    TutorApplicationWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<TutorApplicationWithDetails | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");

  // Load applications
  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        setError(null);

        const applicationsData =
          await tutorApplicationService.getAllApplications();
        setApplications(applicationsData);
      } catch (err) {
        console.error("Error loading applications:", err);
        setError("Failed to load applications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, []);

  const handleReviewApplication = async (status: "approved" | "rejected") => {
    if (!user || !selectedApplication) return;

    try {
      setLoading(true);
      await tutorApplicationService.reviewApplication(
        selectedApplication.id,
        user.id,
        status
      );

      // Refresh applications list
      const updatedApplications =
        await tutorApplicationService.getAllApplications();
      setApplications(updatedApplications);

      setReviewDialogOpen(false);
      setSelectedApplication(null);
    } catch (err) {
      console.error("Error reviewing application:", err);
      setError("Failed to review application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openReviewDialog = (application: TutorApplicationWithDetails) => {
    setSelectedApplication(application);
    setReviewDialogOpen(true);
  };

  const filteredApplications = applications.filter((app) => {
    if (filterStatus === "all") return true;
    return app.status === filterStatus;
  });

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Tutor Applications
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant={filterStatus === "all" ? "contained" : "outlined"}
            size="small"
            onClick={() => setFilterStatus("all")}
          >
            All ({applications.length})
          </Button>
          <Button
            variant={filterStatus === "pending" ? "contained" : "outlined"}
            size="small"
            onClick={() => setFilterStatus("pending")}
          >
            Pending (
            {applications.filter((app) => app.status === "pending").length})
          </Button>
          <Button
            variant={filterStatus === "approved" ? "contained" : "outlined"}
            size="small"
            onClick={() => setFilterStatus("approved")}
          >
            Approved (
            {applications.filter((app) => app.status === "approved").length})
          </Button>
          <Button
            variant={filterStatus === "rejected" ? "contained" : "outlined"}
            size="small"
            onClick={() => setFilterStatus("rejected")}
          >
            Rejected (
            {applications.filter((app) => app.status === "rejected").length})
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filteredApplications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Person sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No applications found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filterStatus === "all"
              ? "No tutor applications have been submitted yet."
              : `No ${filterStatus} applications found.`}
          </Typography>
        </Paper>
      ) : (
        <List>
          {filteredApplications.map((application, index) => (
            <React.Fragment key={application.id}>
              <ListItem sx={{ px: 0, py: 2 }}>
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    {application.user.firstName[0]}
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
                        {application.user.firstName} {application.user.lastName}
                      </Typography>
                      <Chip
                        label={application.status}
                        size="small"
                        color={
                          application.status === "approved"
                            ? "success"
                            : application.status === "rejected"
                            ? "error"
                            : "warning"
                        }
                      />
                      {application.user.studentNumber && (
                        <Chip
                          label={application.user.studentNumber}
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
                        {application.user.email}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Applied: {application.createdAt.toLocaleDateString()}
                        </Typography>
                        {application.reviewedAt && (
                          <>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              • Reviewed:{" "}
                              {application.reviewedAt.toLocaleDateString()}
                            </Typography>
                            {application.reviewer && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                • By: {application.reviewer.firstName}{" "}
                                {application.reviewer.lastName}
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>

                      {/* Modules */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Modules Applied For:
                        </Typography>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {application.modules.map((module) => (
                            <Chip
                              key={module.id}
                              label={`${module.code} - ${module.name}`}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>

                      {/* Application Details */}
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle2">
                            View Application Details
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={2}>
                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Work fontSize="small" />
                                Teaching Experience
                              </Typography>
                              <Typography variant="body2" sx={{ pl: 3 }}>
                                {application.experience}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <School fontSize="small" />
                                Academic Qualifications
                              </Typography>
                              <Typography variant="body2" sx={{ pl: 3 }}>
                                {application.qualifications}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Psychology fontSize="small" />
                                Motivation Statement
                              </Typography>
                              <Typography variant="body2" sx={{ pl: 3 }}>
                                {application.motivation}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  mb: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Schedule fontSize="small" />
                                Availability
                              </Typography>
                              <Typography variant="body2" sx={{ pl: 3 }}>
                                {application.availability}
                              </Typography>
                            </Box>
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    </Box>
                  }
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => openReviewDialog(application)}
                    title="Review application"
                  >
                    <Visibility />
                  </IconButton>
                  {application.status === "pending" && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleReviewApplication("approved")}
                        title="Approve application"
                        sx={{ color: "success.main" }}
                      >
                        <CheckCircle />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleReviewApplication("rejected")}
                        title="Reject application"
                        sx={{ color: "error.main" }}
                      >
                        <Cancel />
                      </IconButton>
                    </>
                  )}
                </Box>
              </ListItem>
              {index < filteredApplications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Review Application</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedApplication.user.firstName}{" "}
                {selectedApplication.user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedApplication.user.email} •{" "}
                {selectedApplication.user.studentNumber}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Modules Applied For:
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}
                  >
                    {selectedApplication.modules.map((module) => (
                      <Chip
                        key={module.id}
                        label={`${module.code} - ${module.name}`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Teaching Experience:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedApplication.experience}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Academic Qualifications:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedApplication.qualifications}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Motivation Statement:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {selectedApplication.motivation}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Availability:
                  </Typography>
                  <Typography variant="body2">
                    {selectedApplication.availability}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Close</Button>
          {selectedApplication?.status === "pending" && (
            <>
              <Button
                onClick={() => handleReviewApplication("rejected")}
                color="error"
                disabled={loading}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleReviewApplication("approved")}
                color="success"
                variant="contained"
                disabled={loading}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TutorApplicationManagementPage;
