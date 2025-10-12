import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Paper,
  Divider,
  Grid,
  TextField,
  Chip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Send,
  AttachFile,
  Person,
  Message,
  Search,
  Add,
  MoreVert,
  CheckCircle,
  Schedule,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockMessages } from "../data/mockData";

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [messages] = useState(mockMessages);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [newMessage, setNewMessage] = useState("");
  const [openNewMessage, setOpenNewMessage] = useState(false);

  // Group messages by conversation
  const conversations = messages.reduce((acc, message) => {
    const otherUserId =
      message.senderId === user?.id ? message.receiverId : message.senderId;
    if (!acc[otherUserId]) {
      acc[otherUserId] = [];
    }
    acc[otherUserId].push(message);
    return acc;
  }, {} as Record<string, typeof messages>);

  // Get conversation partners
  const conversationPartners = Object.keys(conversations).map((userId) => {
    const conversationMessages = conversations[userId];
    const lastMessage = conversationMessages[conversationMessages.length - 1];
    const unreadCount = conversationMessages.filter(
      (m) => !m.isRead && m.receiverId === user?.id
    ).length;

    return {
      userId,
      lastMessage,
      unreadCount,
      messageCount: conversationMessages.length,
    };
  });

  const selectedMessages = selectedConversation
    ? conversations[selectedConversation] || []
    : [];

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // In a real app, this would send to backend
      console.log("Sending message:", newMessage, "to:", selectedConversation);
      setNewMessage("");
    }
  };

  const handleNewMessage = () => {
    // In a real app, this would open a user selection dialog
    console.log("Starting new conversation");
    setOpenNewMessage(false);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Messages
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenNewMessage(true)}
        >
          New Message
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ height: "calc(100vh - 200px)" }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent
              sx={{
                p: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                <TextField
                  fullWidth
                  placeholder="Search conversations..."
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <Search sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Box>
              <Box sx={{ flex: 1, overflow: "auto" }}>
                <List>
                  {conversationPartners.map((partner, index) => (
                    <React.Fragment key={partner.userId}>
                      <ListItem
                        button
                        selected={selectedConversation === partner.userId}
                        onClick={() => setSelectedConversation(partner.userId)}
                        sx={{ py: 2 }}
                      >
                        <ListItemIcon>
                          <Badge
                            badgeContent={partner.unreadCount}
                            color="error"
                          >
                            <Avatar>
                              {partner.userId === "1"
                                ? "JD"
                                : partner.userId === "2"
                                ? "JS"
                                : "U"}
                            </Avatar>
                          </Badge>
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
                              <span
                                style={{ fontWeight: 500, fontSize: "1rem" }}
                              >
                                {partner.userId === "1"
                                  ? "John Doe"
                                  : partner.userId === "2"
                                  ? "Jane Smith"
                                  : "User"}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  color: "inherit",
                                  opacity: 0.7,
                                }}
                              >
                                {partner.lastMessage.createdAt.toLocaleDateString()}
                              </span>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <div
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  maxWidth: 200,
                                  fontSize: "0.875rem",
                                  color: "inherit",
                                  opacity: 0.7,
                                }}
                              >
                                {partner.lastMessage.content}
                              </div>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mt: 0.5,
                                }}
                              >
                                <Chip
                                  label={`${partner.messageCount} messages`}
                                  size="small"
                                  variant="outlined"
                                />
                                {partner.unreadCount > 0 && (
                                  <Chip
                                    label={`${partner.unreadCount} unread`}
                                    size="small"
                                    color="error"
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                        <IconButton size="small">
                          <MoreVert />
                        </IconButton>
                      </ListItem>
                      {index < conversationPartners.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Message Thread */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {selectedConversation ? (
              <>
                {/* Message Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar>
                        {selectedConversation === "1"
                          ? "JD"
                          : selectedConversation === "2"
                          ? "JS"
                          : "U"}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          {selectedConversation === "1"
                            ? "John Doe"
                            : selectedConversation === "2"
                            ? "Jane Smith"
                            : "User"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedConversation === "1"
                            ? "Student"
                            : selectedConversation === "2"
                            ? "Tutor"
                            : "User"}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton size="small">
                        <AttachFile />
                      </IconButton>
                      <IconButton size="small">
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                  {selectedMessages.map((message, index) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: "flex",
                        justifyContent:
                          message.senderId === user?.id
                            ? "flex-end"
                            : "flex-start",
                        mb: 2,
                      }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: "70%",
                          bgcolor:
                            message.senderId === user?.id
                              ? "primary.main"
                              : "grey.100",
                          color:
                            message.senderId === user?.id
                              ? "white"
                              : "text.primary",
                        }}
                      >
                        <Typography variant="body1">
                          {message.content}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mt: 1,
                          }}
                        >
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {message.createdAt.toLocaleTimeString()}
                          </Typography>
                          {message.senderId === user?.id && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              {message.isRead ? (
                                <CheckCircle fontSize="small" />
                              ) : (
                                <Schedule fontSize="small" />
                              )}
                            </Box>
                          )}
                        </Box>
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {message.attachments.map((attachment) => (
                                <Chip
                                  key={attachment.id}
                                  label={attachment.name}
                                  size="small"
                                  icon={<AttachFile />}
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}
                      </Paper>
                    </Box>
                  ))}
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <IconButton>
                      <AttachFile />
                    </IconButton>
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      startIcon={<Send />}
                    >
                      Send
                    </Button>
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Message
                    sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    Select a conversation to start messaging
                  </Typography>
                </Box>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* New Message Dialog */}
      <Dialog
        open={openNewMessage}
        onClose={() => setOpenNewMessage(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Search users..."
            margin="normal"
            InputProps={{
              startAdornment: (
                <Search sx={{ mr: 1, color: "text.secondary" }} />
              ),
            }}
          />
          <List>
            <ListItem button onClick={() => setSelectedConversation("1")}>
              <ListItemIcon>
                <Avatar>JD</Avatar>
              </ListItemIcon>
              <ListItemText primary="John Doe" secondary="Student" />
            </ListItem>
            <ListItem button onClick={() => setSelectedConversation("2")}>
              <ListItemIcon>
                <Avatar>JS</Avatar>
              </ListItemIcon>
              <ListItemText primary="Jane Smith" secondary="Tutor" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewMessage(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessagesPage;
