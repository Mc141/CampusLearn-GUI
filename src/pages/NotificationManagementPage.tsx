import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Badge,
} from "@mui/material";
import {
  Notifications,
  Email,
  Sms,
  WhatsApp,
  Settings,
  Send,
  History,
  Schedule,
  CheckCircle,
  Error,
  Warning,
  Info,
  Add,
  Edit,
  Delete,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
  frequency: "instant" | "daily" | "weekly";
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: "email" | "sms" | "whatsapp";
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

const NotificationManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    whatsapp: true,
    push: true,
    frequency: "instant",
  });

  const [templates] = useState<NotificationTemplate[]>([
    {
      id: "1",
      name: "New Question Alert",
      type: "email",
      subject: "New Question in {{topic}}",
      content:
        "A new question has been posted in {{topic}} by {{student}}. Please review and respond.",
      variables: ["topic", "student"],
      isActive: true,
    },
    {
      id: "2",
      name: "Answer Received",
      type: "sms",
      subject: "",
      content:
        "Your question about {{topic}} has been answered by {{tutor}}. Check CampusLearn for details.",
      variables: ["topic", "tutor"],
      isActive: true,
    },
    {
      id: "3",
      name: "Weekly Summary",
      type: "whatsapp",
      subject: "",
      content:
        "Weekly summary: {{questions}} questions asked, {{answers}} answers provided. Keep up the great work!",
      variables: ["questions", "answers"],
      isActive: false,
    },
  ]);

  const [sendForm, setSendForm] = useState({
    recipient: "",
    template: "",
    variables: {} as Record<string, string>,
  });

  const handleSettingChange = (
    key: keyof NotificationSettings,
    value: boolean | string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSendNotification = async () => {
    // Simulate API call
    console.log("Sending notification:", sendForm);
    setOpenSendDialog(false);
    setSendForm({ recipient: "", template: "", variables: {} });
  };

  const renderSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notification Preferences
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Delivery Methods
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.email}
                    onChange={(e) =>
                      handleSettingChange("email", e.target.checked)
                    }
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Email sx={{ mr: 1 }} />
                    Email Notifications
                  </Box>
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sms}
                    onChange={(e) =>
                      handleSettingChange("sms", e.target.checked)
                    }
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Sms sx={{ mr: 1 }} />
                    SMS Notifications
                  </Box>
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.whatsapp}
                    onChange={(e) =>
                      handleSettingChange("whatsapp", e.target.checked)
                    }
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <WhatsApp sx={{ mr: 1 }} />
                    WhatsApp Notifications
                  </Box>
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.push}
                    onChange={(e) =>
                      handleSettingChange("push", e.target.checked)
                    }
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Notifications sx={{ mr: 1 }} />
                    Push Notifications
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Frequency Settings
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Notification Frequency</InputLabel>
            <Select
              value={settings.frequency}
              onChange={(e) => handleSettingChange("frequency", e.target.value)}
              label="Notification Frequency"
            >
              <MenuItem value="instant">Instant</MenuItem>
              <MenuItem value="daily">Daily Digest</MenuItem>
              <MenuItem value="weekly">Weekly Summary</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>
    </Box>
  );

  const renderTemplates = () => (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">Notification Templates</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenTemplateDialog(true)}
        >
          New Template
        </Button>
      </Box>

      <Grid container spacing={2}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} key={template.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">{template.name}</Typography>
                  <Chip
                    label={template.type.toUpperCase()}
                    color={
                      template.type === "email"
                        ? "primary"
                        : template.type === "sms"
                        ? "secondary"
                        : "success"
                    }
                    size="small"
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {template.subject && `Subject: ${template.subject}`}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {template.content}
                </Typography>

                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}
                >
                  {template.variables.map((variable) => (
                    <Chip
                      key={variable}
                      label={`{{${variable}}}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <FormControlLabel
                    control={<Switch checked={template.isActive} />}
                    label="Active"
                  />
                  <Box>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderSendNotification = () => (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">Send Notifications</Typography>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => setOpenSendDialog(true)}
        >
          Send Notification
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Use the notification system to send important updates, reminders, and
        announcements to users.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Email
                  color="primary"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                Email Stats
              </Typography>
              <Typography variant="h4" color="primary">
                1,234
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Emails sent this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Sms
                  color="secondary"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                SMS Stats
              </Typography>
              <Typography variant="h4" color="secondary">
                567
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SMS sent this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <WhatsApp
                  color="success"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                WhatsApp Stats
              </Typography>
              <Typography variant="h4" color="success">
                890
              </Typography>
              <Typography variant="body2" color="text.secondary">
                WhatsApp messages sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderSendDialog = () => (
    <Dialog
      open={openSendDialog}
      onClose={() => setOpenSendDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Send Notification</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Recipient"
          value={sendForm.recipient}
          onChange={(e) =>
            setSendForm((prev) => ({ ...prev, recipient: e.target.value }))
          }
          placeholder="Enter email, phone number, or select user"
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Template</InputLabel>
          <Select
            value={sendForm.template}
            onChange={(e) =>
              setSendForm((prev) => ({ ...prev, template: e.target.value }))
            }
            label="Template"
          >
            {templates.map((template) => (
              <MenuItem key={template.id} value={template.id}>
                {template.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Alert severity="info">
          The notification will be sent using the selected template with
          personalized content.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenSendDialog(false)}>Cancel</Button>
        <Button onClick={handleSendNotification} variant="contained">
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Notification Management 📱
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.1rem" }}
        >
          Manage notification settings and send communications to users
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Settings" />
            <Tab label="Templates" />
            <Tab label="Send Notifications" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {tabValue === 0 && renderSettings()}
          {tabValue === 1 && renderTemplates()}
          {tabValue === 2 && renderSendNotification()}
        </CardContent>
      </Card>

      {renderSendDialog()}
    </Box>
  );
};

export default NotificationManagementPage;


