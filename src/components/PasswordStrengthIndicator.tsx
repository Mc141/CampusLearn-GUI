import React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import { CheckCircle, Cancel, Security } from "@mui/icons-material";
import {
  PasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "../utils/passwordValidation";

interface PasswordStrengthIndicatorProps {
  passwordStrength: PasswordStrength;
  showDetails?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  passwordStrength,
  showDetails = true,
}) => {
  const { score, feedback, isValid, requirements } = passwordStrength;
  const strengthLabel = getPasswordStrengthLabel(score);
  const strengthColor = getPasswordStrengthColor(score);

  const requirementItems = [
    { key: "length", label: "At least 8 characters", met: requirements.length },
    {
      key: "uppercase",
      label: "One uppercase letter",
      met: requirements.uppercase,
    },
    {
      key: "lowercase",
      label: "One lowercase letter",
      met: requirements.lowercase,
    },
    { key: "number", label: "One number", met: requirements.number },
    {
      key: "specialChar",
      label: "One special character",
      met: requirements.specialChar,
    },
    {
      key: "noCommonWords",
      label: "Not a common password",
      met: requirements.noCommonWords,
    },
  ];

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Security sx={{ fontSize: 16, color: strengthColor }} />
        <Typography
          variant="body2"
          sx={{ color: strengthColor, fontWeight: 500 }}
        >
          Password Strength: {strengthLabel}
        </Typography>
        <Chip
          label={`${score}/6`}
          size="small"
          sx={{
            backgroundColor: strengthColor,
            color: "white",
            fontSize: "0.7rem",
            height: 20,
          }}
        />
      </Box>

      <LinearProgress
        variant="determinate"
        value={(score / 6) * 100}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(0,0,0,0.1)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: strengthColor,
            borderRadius: 3,
          },
        }}
      />

      {showDetails && (
        <List dense sx={{ mt: 1, p: 0 }}>
          {requirementItems.map((item) => (
            <ListItem key={item.key} sx={{ py: 0.25, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 24 }}>
                {item.met ? (
                  <CheckCircle sx={{ fontSize: 16, color: "#4caf50" }} />
                ) : (
                  <Cancel sx={{ fontSize: 16, color: "#f44336" }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography
                    variant="caption"
                    sx={{
                      color: item.met ? "#4caf50" : "#f44336",
                      fontSize: "0.75rem",
                    }}
                  >
                    {item.label}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {!isValid && feedback.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            color="error"
            sx={{ fontSize: "0.7rem" }}
          >
            Missing: {feedback.join(", ")}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PasswordStrengthIndicator;
