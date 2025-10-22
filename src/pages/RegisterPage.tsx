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
} from "@mui/material";
import { School, PersonAdd } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { modulesService } from "../services/modulesService";
import { Module } from "../types";

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
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch modules from database on component mount
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

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(formData, formData.password);
      if (success) {
        // Redirect to login page with confirmation message
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
                  placeholder="577963@student.belgiumcampus.ac.za"
                  helperText="Must use @belgiumcampus.ac.za or @student.belgiumcampus.ac.za email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  required
                />
              </Grid>
              {/* Role selection removed; default to student */}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Role" value="Student" disabled />
              </Grid>
              {true && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Student Number"
                    value={formData.studentNumber}
                    onChange={(e) =>
                      handleInputChange("studentNumber", e.target.value)
                    }
                    placeholder="BC2023001"
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
