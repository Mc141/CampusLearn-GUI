import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  School,
  PersonAdd,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { modulesService } from "../services/modulesService";
import { Module } from "../types";
import {
  validatePasswordStrength,
  PasswordStrength,
} from "../utils/passwordValidation";
import PasswordStrengthIndicator from "../components/PasswordStrengthIndicator";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as "student",
    studentNumber: "",
    modules: [] as string[],
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showStudentNumber, setShowStudentNumber] = useState(false);
  const [isStudentNumberAutoDetected, setIsStudentNumberAutoDetected] =
    useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const extractStudentNumberFromEmail = (email: string): string | null => {
    if (!email || !email.includes("@")) return null;

    const localPart = email.split("@")[0];

    // Check if the local part starts with numbers
    const match = localPart.match(/^(\d+)/);

    if (match) {
      return match[1];
    }

    return null;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "password") {
      const strength = validatePasswordStrength(value);
      setPasswordStrength(strength);
    }

    if (field === "email") {
      const studentNumber = extractStudentNumberFromEmail(value);
      if (studentNumber) {
        setShowStudentNumber(true);
        setIsStudentNumberAutoDetected(true);
        setFormData((prev) => ({ ...prev, studentNumber }));
      } else {
        setShowStudentNumber(false);
        setIsStudentNumberAutoDetected(false);
        setFormData((prev) => ({ ...prev, studentNumber: "" }));
      }
    }
  };

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setModulesLoading(true);
        const fetchedModules = await modulesService.getAllModules();
        setModules(fetchedModules);
      } catch (error) {
        console.error("Error fetching modules:", error);
        setError("Failed to load modules. Please refresh the page.");
      } finally {
        setModulesLoading(false);
      }
    };

    fetchModules();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!passwordStrength?.isValid) {
      setError("Password does not meet security requirements");
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(formData, formData.password);
      if (success) {
        navigate("/login", {
          state: {
            message:
              "Registration successful! Please check your email and click the confirmation link to activate your account.",
            email: formData.email,
          },
        });
      } else {
        setError("Registration failed. Please check your email domain.");
      }
    } catch (err) {
      setError("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 600,
            borderRadius: 3,
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <School sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              Join CampusLearn™
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Create your account to start learning
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
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
                  required
                  helperText="Must use @belgiumcampus.ac.za or @student.belgiumcampus.ac.za email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {passwordStrength && (
                  <PasswordStrengthIndicator
                    passwordStrength={passwordStrength}
                    showDetails={true}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  required
                  error={
                    formData.confirmPassword !== "" &&
                    formData.password !== formData.confirmPassword
                  }
                  helperText={
                    formData.confirmPassword !== "" &&
                    formData.password !== formData.confirmPassword
                      ? "Passwords do not match"
                      : ""
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Role" value="Student" disabled />
              </Grid>
              {showStudentNumber && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Student Number"
                    value={formData.studentNumber}
                    onChange={(e) =>
                      handleInputChange("studentNumber", e.target.value)
                    }
                    placeholder="BC2023001"
                    disabled={isStudentNumberAutoDetected}
                    helperText={
                      isStudentNumberAutoDetected
                        ? "Student number automatically detected from email"
                        : "Enter your student number"
                    }
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Modules</InputLabel>
                  <Select
                    multiple
                    value={formData.modules}
                    label="Modules"
                    disabled={modulesLoading}
                    onChange={(e) =>
                      handleInputChange("modules", e.target.value)
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Typography key={value} variant="body2">
                            {modules.find((m) => m.code === value)?.code}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  >
                    {modulesLoading ? (
                      <MenuItem disabled>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <CircularProgress size={16} />
                          <Typography variant="body2">
                            Loading modules...
                          </Typography>
                        </Box>
                      </MenuItem>
                    ) : (
                      modules.map((module) => (
                        <MenuItem key={module.id} value={module.code}>
                          {module.code} - {module.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={<PersonAdd />}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body2">
              Already have an account?{" "}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/login")}
                sx={{ textDecoration: "none" }}
              >
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
