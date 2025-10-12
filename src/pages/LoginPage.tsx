import React, { useState } from "react";
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
  Divider,
} from "@mui/material";
import { School, Login as LoginIcon } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      email: "student@belgiumcampus.ac.za",
      password: "password",
      role: "Student",
    },
    { email: "tutor@belgiumcampus.ac.za", password: "password", role: "Tutor" },
    { email: "admin@belgiumcampus.ac.za", password: "password", role: "Admin" },
  ];

  return (
    <Container maxWidth="sm">
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
          elevation={0}
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 400,
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
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
              CampusLearn™
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Peer-Powered Learning Platform
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              placeholder="your.email@belgiumcampus.ac.za"
              autoComplete="email"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
            />
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
              startIcon={<LoginIcon />}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Typography variant="body2">
              Don't have an account?{" "}
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate("/register")}
                sx={{ textDecoration: "none" }}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Demo Accounts
            </Typography>
          </Divider>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {demoAccounts.map((account) => (
              <Button
                key={account.role}
                variant="outlined"
                size="small"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
                sx={{ justifyContent: "flex-start", textTransform: "none" }}
              >
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {account.role}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {account.email}
                  </Typography>
                </Box>
              </Button>
            ))}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
