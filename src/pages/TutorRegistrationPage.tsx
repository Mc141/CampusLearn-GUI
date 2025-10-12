import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import {
  School,
  CheckCircle,
  Assignment,
  Person,
  Email,
  Security,
  Upload,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { mockModules } from "../data/mockData";

const TutorRegistrationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentNumber: "",
    modules: [] as string[],
    experience: "",
    qualifications: "",
    motivation: "",
    availability: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    "Personal Information",
    "Academic Background",
    "Teaching Experience",
    "Availability & Motivation",
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.includes(moduleId)
        ? prev.modules.filter((id) => id !== moduleId)
        : [...prev.modules, moduleId],
    }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real app, this would submit to backend
      console.log("Tutor registration submitted:", formData);

      // Show success message and redirect
      alert(
        "Tutor registration submitted successfully! You will be notified once approved."
      );
      navigate("/");
    } catch (err) {
      setError("Failed to submit registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  helperText="Must be @belgiumcampus.ac.za email"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Student Number"
                  value={formData.studentNumber}
                  onChange={(e) =>
                    handleInputChange("studentNumber", e.target.value)
                  }
                  required
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Modules You Can Tutor
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose the modules you have expertise in and would like to tutor:
            </Typography>
            <Grid container spacing={2}>
              {mockModules.map((module) => (
                <Grid item xs={12} sm={6} md={4} key={module.id}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      border: formData.modules.includes(module.id) ? 2 : 1,
                      borderColor: formData.modules.includes(module.id)
                        ? "primary.main"
                        : "divider",
                      "&:hover": {
                        borderColor: "primary.main",
                      },
                    }}
                    onClick={() => handleModuleToggle(module.id)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {module.code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {module.name}
                      </Typography>
                      <Chip
                        label={module.level}
                        size="small"
                        color="secondary"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Teaching Experience"
              multiline
              rows={4}
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
              placeholder="Describe your teaching or tutoring experience..."
              helperText="Include any previous tutoring, teaching, or mentoring experience"
            />
            <TextField
              fullWidth
              label="Qualifications & Skills"
              multiline
              rows={3}
              value={formData.qualifications}
              onChange={(e) =>
                handleInputChange("qualifications", e.target.value)
              }
              placeholder="List your relevant qualifications, certifications, or special skills..."
              sx={{ mt: 2 }}
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Availability"
              multiline
              rows={3}
              value={formData.availability}
              onChange={(e) =>
                handleInputChange("availability", e.target.value)
              }
              placeholder="When are you available to tutor? (e.g., Weekdays 6-8 PM, Weekends)"
              helperText="Please specify your preferred tutoring hours"
            />
            <TextField
              fullWidth
              label="Motivation Statement"
              multiline
              rows={4}
              value={formData.motivation}
              onChange={(e) => handleInputChange("motivation", e.target.value)}
              placeholder="Why do you want to become a peer tutor? What do you hope to contribute?"
              sx={{ mt: 2 }}
              helperText="This helps us understand your commitment to helping fellow students"
            />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <School sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Become a Peer Tutor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Help your fellow students succeed by sharing your knowledge and
          expertise
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                {renderStepContent(index)}
                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    variant="outlined"
                  >
                    Back
                  </Button>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      variant="contained"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  ) : (
                    <Button onClick={handleNext} variant="contained">
                      Next
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <CheckCircle
              color="success"
              sx={{ mr: 1, verticalAlign: "middle" }}
            />
            What Happens Next?
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Assignment color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Application Review"
                secondary="Our team will review your application within 2-3 business days"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Email color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Notification"
                secondary="You'll receive an email notification about your application status"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Security color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Training"
                secondary="Approved tutors will receive training materials and guidelines"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TutorRegistrationPage;


