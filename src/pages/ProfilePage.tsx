import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  School,
  Assignment,
  TrendingUp,
  CheckCircle,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockModules } from "../data/mockData";

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    studentNumber: user?.studentNumber || "",
    modules: user?.modules || [],
  });
  const [openModuleDialog, setOpenModuleDialog] = useState(false);

  const handleSave = () => {
    // In a real app, this would save to backend
    console.log("Saving profile:", profileData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfileData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      studentNumber: user?.studentNumber || "",
      modules: user?.modules || [],
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const stats = [
    { label: "Questions Asked", value: 12, icon: <Assignment /> },
    { label: "Topics Subscribed", value: 5, icon: <School /> },
    { label: "Messages Sent", value: 28, icon: <Person /> },
    { label: "Learning Progress", value: 75, icon: <TrendingUp /> },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: "auto",
                    mb: 2,
                    fontSize: "2rem",
                  }}
                >
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </Typography>
                <Chip
                  label={
                    user?.role === "student"
                      ? "Student"
                      : user?.role === "tutor"
                      ? "Tutor"
                      : "Admin"
                  }
                  color={
                    user?.role === "student"
                      ? "primary"
                      : user?.role === "tutor"
                      ? "secondary"
                      : "warning"
                  }
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                {isEditing ? (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                      size="small"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      size="small"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => setIsEditing(true)}
                    size="small"
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Statistics
              </Typography>
              <List>
                {stats.map((stat, index) => (
                  <React.Fragment key={stat.label}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>{stat.icon}</ListItemIcon>
                      <ListItemText
                        primary={stat.label}
                        secondary={stat.value}
                      />
                    </ListItem>
                    {index < stats.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Personal Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profileData.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                {user?.role === "student" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Student Number"
                      value={profileData.studentNumber}
                      onChange={(e) =>
                        handleInputChange("studentNumber", e.target.value)
                      }
                      disabled={!isEditing}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      Modules
                    </Typography>
                    {isEditing && (
                      <Button
                        size="small"
                        onClick={() => setOpenModuleDialog(true)}
                      >
                        Edit Modules
                      </Button>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {profileData.modules.map((moduleId) => {
                      const module = mockModules.find((m) => m.id === moduleId);
                      return (
                        <Chip
                          key={moduleId}
                          label={module?.code || moduleId}
                          color="primary"
                          variant="outlined"
                        />
                      );
                    })}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Activity History */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Recent Activity
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Question answered"
                    secondary="How to calculate working capital? - 2 days ago"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Assignment color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="New question posted"
                    secondary="Inheritance vs Composition - 3 days ago"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <School color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Subscribed to topic"
                    secondary="Financial Statement Analysis - 1 week ago"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Module Selection Dialog */}
      <Dialog
        open={openModuleDialog}
        onClose={() => setOpenModuleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select Modules</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Modules</InputLabel>
            <Select
              multiple
              value={profileData.modules}
              label="Modules"
              onChange={(e) => handleInputChange("modules", e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={mockModules.find((m) => m.id === value)?.code}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            >
              {mockModules.map((module) => (
                <MenuItem key={module.id} value={module.id}>
                  {module.code} - {module.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModuleDialog(false)}>Cancel</Button>
          <Button
            onClick={() => setOpenModuleDialog(false)}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
