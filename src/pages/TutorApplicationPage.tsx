import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  School,
  Person,
  Work,
  Schedule,
  Psychology,
  CheckCircle,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  tutorApplicationService,
  CreateTutorApplicationData,
} from "../services/tutorApplicationService";
import { modulesService } from "../services/modulesService";
import { Module } from "../types";

const TutorApplicationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasPendingApplication, setHasPendingApplication] = useState(false);

  const [formData, setFormData] = useState<CreateTutorApplicationData>({
    experience: "",
    qualifications: "",
    motivation: "",
    availability: "",
    moduleIds: [],
  });

  // Load modules and check for pending applications
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [modulesData, pendingApplication] = await Promise.all([
          modulesService.getAllModules(),
          tutorApplicationService.hasPendingApplication(user?.id || ""),
        ]);

        setModules(modulesData);
        setHasPendingApplication(pendingApplication);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load application data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handleInputChange = (
    field: keyof CreateTutorApplicationData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModuleChange = (event: any) => {
    const value = event.target.value;
    setSelectedModules(typeof value === "string" ? value.split(",") : value);
    handleInputChange(
      "moduleIds",
      typeof value === "string" ? value.split(",") : value
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (
      !formData.experience ||
      !formData.qualifications ||
      !formData.motivation ||
      !formData.availability
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (selectedModules.length === 0) {
      setError("Please select at least one module.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await tutorApplicationService.createApplication(user.id, formData);

      setSuccess(true);
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
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

  if (hasPendingApplication) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          You already have a pending tutor application. Please wait for admin
          review.
        </Alert>
        <Button variant="contained" onClick={() => navigate("/profile")}>
          Go to Profile
        </Button>
      </Box>
    );
  }

  if (success) {
    return (
      <Box>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CheckCircle sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 2 }}>
            Application Submitted Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your tutor application has been submitted and is pending admin
            review. You will be notified once it's been reviewed.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/profile")}>
            Go to Profile
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Tutor Application
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Apply to become a peer tutor and help fellow students succeed. Fill out
        the form below with your academic background, teaching experience, and
        motivation.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Experience */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Teaching Experience"
                  multiline
                  rows={4}
                  value={formData.experience}
                  onChange={(e) =>
                    handleInputChange("experience", e.target.value)
                  }
                  placeholder="Describe your teaching or tutoring experience. Include any relevant experience helping peers, teaching assistantships, or volunteer work."
                  required
                  InputProps={{
                    startAdornment: (
                      <Work sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>

              {/* Qualifications */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Academic Qualifications"
                  multiline
                  rows={3}
                  value={formData.qualifications}
                  onChange={(e) =>
                    handleInputChange("qualifications", e.target.value)
                  }
                  placeholder="List your academic achievements, relevant coursework, grades, or certifications that qualify you to tutor."
                  required
                  InputProps={{
                    startAdornment: (
                      <School sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>

              {/* Motivation */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Motivation Statement"
                  multiline
                  rows={4}
                  value={formData.motivation}
                  onChange={(e) =>
                    handleInputChange("motivation", e.target.value)
                  }
                  placeholder="Explain why you want to become a peer tutor. What drives you to help other students? How do you plan to contribute to the learning community?"
                  required
                  InputProps={{
                    startAdornment: (
                      <Psychology sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>

              {/* Availability */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Availability"
                  multiline
                  rows={3}
                  value={formData.availability}
                  onChange={(e) =>
                    handleInputChange("availability", e.target.value)
                  }
                  placeholder="Describe your availability for tutoring sessions. Include preferred times, days of the week, and any constraints."
                  required
                  InputProps={{
                    startAdornment: (
                      <Schedule sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>

              {/* Module Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Modules You Can Tutor</InputLabel>
                  <Select
                    multiple
                    value={selectedModules}
                    onChange={handleModuleChange}
                    label="Modules You Can Tutor"
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => {
                          const module = modules.find((m) => m.id === value);
                          return (
                            <Chip
                              key={value}
                              label={
                                module
                                  ? `${module.code} - ${module.name}`
                                  : value
                              }
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                    required
                  >
                    {modules.map((module) => (
                      <MenuItem key={module.id} value={module.id}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {module.code} - {module.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {module.level} • {module.description}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Select all modules you feel confident tutoring. You can tutor
                  multiple modules.
                </Typography>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Box
                  sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/profile")}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={submitting}
                    startIcon={<Person />}
                  >
                    {submitting ? "Submitting..." : "Submit Application"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TutorApplicationPage;
