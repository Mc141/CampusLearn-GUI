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
  Switch,
  FormControlLabel,
  FormGroup,
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
  GitHub,
  Language,
  LocationOn,
  Business,
  Description,
  Notifications,
  NotificationsOff,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockModules } from "../data/mockData";
import { userProfileService } from "../services/userProfileService";
import ProfilePictureUpload from "../components/ProfilePictureUpload";

const ProfilePage: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    studentNumber: user?.studentNumber || "",
    modules: user?.modules || [],
    githubUsername: user?.githubUsername || "",
    githubProfileUrl: user?.githubProfileUrl || "",
    githubBio: user?.githubBio || "",
    githubLocation: user?.githubLocation || "",
    githubWebsite: user?.githubWebsite || "",
    githubCompany: user?.githubCompany || "",
    emailNotifications: user?.emailNotifications ?? true,
    smsNotifications: user?.smsNotifications ?? false,
    notificationPreferences: user?.notificationPreferences || {
      new_messages: true,
      tutor_escalations: true,
      forum_replies: true,
      topic_replies: true,
      new_topics: true,
      new_answers: true,
    },
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(
    user?.profilePicture || null
  );
  const [openModuleDialog, setOpenModuleDialog] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      console.log("💾 DEBUG: Saving profile with data:", {
        userId: user.id,
        emailNotifications: profileData.emailNotifications,
        smsNotifications: profileData.smsNotifications,
        notificationPreferences: profileData.notificationPreferences,
      });

      await userProfileService.updateUserProfile(user.id, {
        ...profileData,
        profilePicture: profilePicture,
      });
      console.log("✅ Profile saved successfully");
      // Refresh user profile to get updated data
      await refreshUserProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("❌ Error saving profile:", error);
      // You could add a toast notification here
    }
  };

  const handleCancel = () => {
    setProfileData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      studentNumber: user?.studentNumber || "",
      modules: user?.modules || [],
      githubUsername: user?.githubUsername || "",
      githubProfileUrl: user?.githubProfileUrl || "",
      githubBio: user?.githubBio || "",
      githubLocation: user?.githubLocation || "",
      githubWebsite: user?.githubWebsite || "",
      githubCompany: user?.githubCompany || "",
      emailNotifications: user?.emailNotifications ?? true,
      smsNotifications: user?.smsNotifications ?? false,
      notificationPreferences: user?.notificationPreferences || {
        new_messages: true,
        tutor_escalations: true,
        forum_replies: true,
        topic_replies: true,
        new_topics: true,
        new_answers: true,
      },
    });
    setProfilePicture(user?.profilePicture || null);
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: any) => {
    console.log("🔄 DEBUG: Profile field changed:", { field, value });
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  // Extract student number from email
  const extractStudentNumber = (email: string): string | null => {
    if (!email) return null;

    // Check if it's a student email
    if (
      email.includes("@student.belgiumcampus.ac.za") ||
      email.includes("@belgiumcampus.ac.za")
    ) {
      const numberPart = email.split("@")[0];
      // Check if the part before @ is a number
      if (/^\d+$/.test(numberPart)) {
        return numberPart;
      }
    }
    return null;
  };

  const studentNumber = extractStudentNumber(user?.email || "");

  const handleFetchGitHubProfile = async () => {
    if (!profileData.githubUsername) return;

    try {
      const githubData = await userProfileService.fetchGitHubProfile(
        profileData.githubUsername
      );
      setProfileData((prev) => ({
        ...prev,
        ...githubData,
      }));
    } catch (error) {
      console.error("Error fetching GitHub profile:", error);
      // You could add a toast notification here
    }
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
                {/* Profile Picture Upload */}
                <ProfilePictureUpload
                  currentPicture={profilePicture}
                  onPictureChange={setProfilePicture}
                  userId={user?.id || ""}
                  isEditing={isEditing}
                  userInitials={`${user?.firstName?.[0] || ""}${
                    user?.lastName?.[0] || ""
                  }`}
                />
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
                {studentNumber && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Student Number"
                      value={studentNumber}
                      disabled
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

          {/* GitHub Profile */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <GitHub />
                GitHub Profile
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GitHub Username"
                    value={profileData.githubUsername}
                    onChange={(e) =>
                      handleInputChange("githubUsername", e.target.value)
                    }
                    disabled={!isEditing}
                    helperText={
                      isEditing
                        ? "Enter your GitHub username to fetch profile data"
                        : ""
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  {isEditing && profileData.githubUsername && (
                    <Button
                      variant="outlined"
                      onClick={handleFetchGitHubProfile}
                      sx={{ mt: 1 }}
                      startIcon={<GitHub />}
                    >
                      Fetch GitHub Data
                    </Button>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="GitHub Profile URL"
                    value={profileData.githubProfileUrl}
                    onChange={(e) =>
                      handleInputChange("githubProfileUrl", e.target.value)
                    }
                    disabled={!isEditing}
                    helperText="Your GitHub profile URL"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    value={profileData.githubBio}
                    onChange={(e) =>
                      handleInputChange("githubBio", e.target.value)
                    }
                    disabled={!isEditing}
                    multiline
                    rows={2}
                    helperText="Your GitHub bio/description"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={profileData.githubLocation}
                    onChange={(e) =>
                      handleInputChange("githubLocation", e.target.value)
                    }
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={profileData.githubWebsite}
                    onChange={(e) =>
                      handleInputChange("githubWebsite", e.target.value)
                    }
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <Language sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company"
                    value={profileData.githubCompany}
                    onChange={(e) =>
                      handleInputChange("githubCompany", e.target.value)
                    }
                    disabled={!isEditing}
                    InputProps={{
                      startAdornment: (
                        <Business sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Notifications />
                Notification Preferences
              </Typography>

              <Grid container spacing={3}>
                {/* Global Email/SMS Settings */}
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 500, mb: 2 }}
                  >
                    Global Settings
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={profileData.emailNotifications}
                          onChange={(e) =>
                            handleInputChange(
                              "emailNotifications",
                              e.target.checked
                            )
                          }
                          disabled={!isEditing}
                        />
                      }
                      label="Email Notifications"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={profileData.smsNotifications}
                          onChange={(e) =>
                            handleInputChange(
                              "smsNotifications",
                              e.target.checked
                            )
                          }
                          disabled={!isEditing}
                        />
                      }
                      label="SMS Notifications"
                    />
                  </FormGroup>
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
