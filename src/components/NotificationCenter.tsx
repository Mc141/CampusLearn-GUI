import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
} from "@mui/material";
import {
  Notifications,
  NotificationsActive,
  Email,
  Sms,
  Chat,
  CheckCircle,
  Schedule,
  QuestionAnswer,
  Message,
  Subject,
  School,
  Close,
  Send,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockNotifications } from "../data/mockData";

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const [notifications] = useState(mockNotifications);
  const [openSendDialog, setOpenSendDialog] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "system" as "question" | "answer" | "message" | "topic" | "system",
    method: "email" as "email" | "sms" | "whatsapp",
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (notificationId: string) => {
    // In a real app, this would update the backend
    console.log("Marking notification as read:", notificationId);
  };

  const handleMarkAllAsRead = () => {
    // In a real app, this would update the backend
    console.log("Marking all notifications as read");
  };

  const handleSendNotification = () => {
    // In a real app, this would send to backend
    console.log("Sending notification:", newNotification);
    setOpenSendDialog(false);
    setNewNotification({
      title: "",
      message: "",
      type: "system",
      method: "email",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "question":
        return <QuestionAnswer color="primary" />;
      case "answer":
        return <CheckCircle color="success" />;
      case "message":
        return <Message color="secondary" />;
      case "topic":
        return <Subject color="warning" />;
      default:
        return <School color="info" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "email":
        return <Email />;
      case "sms":
        return <Sms />;
      case "whatsapp":
        return <Chat />;
      default:
        return <Notifications />;
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <NotificationsActive />
              <Typography variant="h6">Notifications</Typography>
              {unreadCount > 0 && (
                <Badge badgeContent={unreadCount} color="error">
                  <Box />
                </Badge>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                onClick={() => setOpenSendDialog(true)}
                startIcon={<Send />}
              >
                Send
              </Button>
              <IconButton onClick={onClose}>
                <Close />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All as Read
            </Button>
          </Box>

          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.isRead
                      ? "transparent"
                      : "action.hover",
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: notification.isRead ? 400 : 600 }}
                        >
                          {notification.title}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Chip
                            label={notification.type}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {notification.createdAt.toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Chip
                            icon={<Email />}
                            label="Email"
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<Sms />}
                            label="SMS"
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<Chat />}
                            label="WhatsApp"
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                  />
                  {!notification.isRead && (
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <CheckCircle />
                    </IconButton>
                  )}
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
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
            label="Title"
            value={newNotification.title}
            onChange={(e) =>
              setNewNotification((prev) => ({ ...prev, title: e.target.value }))
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Message"
            multiline
            rows={3}
            value={newNotification.message}
            onChange={(e) =>
              setNewNotification((prev) => ({
                ...prev,
                message: e.target.value,
              }))
            }
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={newNotification.type}
              label="Type"
              onChange={(e) =>
                setNewNotification((prev) => ({
                  ...prev,
                  type: e.target.value as any,
                }))
              }
            >
              <MenuItem value="question">Question</MenuItem>
              <MenuItem value="answer">Answer</MenuItem>
              <MenuItem value="message">Message</MenuItem>
              <MenuItem value="topic">Topic</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Method</InputLabel>
            <Select
              value={newNotification.method}
              label="Method"
              onChange={(e) =>
                setNewNotification((prev) => ({
                  ...prev,
                  method: e.target.value as any,
                }))
              }
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSendDialog(false)}>Cancel</Button>
          <Button onClick={handleSendNotification} variant="contained">
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationCenter;
