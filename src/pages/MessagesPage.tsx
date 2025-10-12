import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Button,
  Paper,
  Divider,
  Badge,
  Alert,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { Message, Add } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { messagingService, Conversation } from "../services/messagingService";
import { tutorTopicAssignmentService } from "../services/tutorTopicAssignmentService";
import { topicsService } from "../services/topicsService";
import { RealtimeChat } from "../components/RealtimeChat";
import type { ChatMessage } from "../hooks/useRealtimeChat";

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New conversation dialog
  const [newConversationDialogOpen, setNewConversationDialogOpen] =
    useState(false);
  const [availableTutors, setAvailableTutors] = useState<any[]>([]);
  const [selectedTutor, setSelectedTutor] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);

  // Load conversations on component mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && user) {
      loadInitialMessages();
    }
  }, [selectedConversation, user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const conversationsData = await messagingService.getUserConversations(
        user.id
      );
      setConversations(conversationsData);
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadInitialMessages = async () => {
    if (!selectedConversation || !user) return;

    try {
      const messagesData = await messagingService.getMessagesBetweenUsers(
        user.id,
        selectedConversation.userId
      );

      // Convert messages to ChatMessage format
      const chatMessages: ChatMessage[] = messagesData.map((msg) => {
        const senderName =
          msg.senderId === user.id
            ? `${user.firstName} ${user.lastName}`
            : selectedConversation.userName;

        return messagingService.messageToChatMessage(msg, senderName);
      });

      setInitialMessages(chatMessages);

      // Mark messages as read
      await messagingService.markMessagesAsRead(
        selectedConversation.userId,
        user.id
      );

      // Reload conversations to update unread counts
      await loadConversations();
    } catch (err) {
      console.error("Error loading messages:", err);
      setError("Failed to load messages. Please try again.");
    }
  };

  const handleMessageUpdate = async (messages: ChatMessage[]) => {
    if (!selectedConversation || !user) return;

    try {
      // Store messages in database
      await messagingService.storeMessages(
        messages,
        user.id,
        selectedConversation.userId
      );

      // Reload conversations to update last message
      await loadConversations();
    } catch (err) {
      console.error("Error storing messages:", err);
    }
  };

  const handleStartNewConversation = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load available topics for the user
      const topics = await topicsService.getAllTopics();
      setAvailableTopics(topics);

      // Load available tutors for selected topic
      if (selectedTopic) {
        const tutors = await tutorTopicAssignmentService.getTutorsForTopic(
          selectedTopic
        );
        setAvailableTutors(tutors);
      }

      setNewConversationDialogOpen(true);
    } catch (err) {
      console.error("Error loading data for new conversation:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTopicChange = async (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedTutor("");

    try {
      const tutors = await tutorTopicAssignmentService.getTutorsForTopic(
        topicId
      );
      setAvailableTutors(tutors);
    } catch (err) {
      console.error("Error loading tutors for topic:", err);
    }
  };

  const handleCreateConversation = async () => {
    if (!user || !selectedTutor || !initialMessage.trim()) return;

    try {
      await messagingService.sendMessage({
        senderId: user.id,
        receiverId: selectedTutor,
        content: initialMessage.trim(),
      });

      setNewConversationDialogOpen(false);
      setSelectedTutor("");
      setInitialMessage("");
      setSelectedTopic("");
      setAvailableTutors([]);

      // Reload conversations to show the new conversation
      await loadConversations();
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError("Failed to create conversation. Please try again.");
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

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
          onClick={handleStartNewConversation}
        >
          New Conversation
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ height: "calc(100vh - 200px)" }}>
        {/* Conversations List */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Conversations ({conversations.length})
              </Typography>

              {conversations.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <Message
                    sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                  />
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    No conversations yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start a conversation with a tutor to get help with your
                    studies.
                  </Typography>
                </Paper>
              ) : (
                <List>
                  {conversations.map((conversation, index) => (
                    <React.Fragment key={conversation.userId}>
                      <ListItem
                        button
                        onClick={() => setSelectedConversation(conversation)}
                        selected={
                          selectedConversation?.userId === conversation.userId
                        }
                        sx={{ borderRadius: 1, mb: 1 }}
                      >
                        <ListItemIcon>
                          <Badge
                            badgeContent={conversation.unreadCount}
                            color="error"
                          >
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                              {conversation.userName[0]}
                            </Avatar>
                          </Badge>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 500 }}
                              >
                                {conversation.userName}
                              </Typography>
                              {conversation.topicTitle && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  • {conversation.topicTitle}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={
                            conversation.lastMessage && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {conversation.lastMessage.content}
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                      {index < conversations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                      {selectedConversation.userName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {selectedConversation.userName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedConversation.userEmail}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* RealtimeChat Component */}
                <Box sx={{ flex: 1 }}>
                  {user && (
                    <RealtimeChat
                      roomName={messagingService.generateRoomName(
                        user.id,
                        selectedConversation.userId
                      )}
                      username={`${user.firstName} ${user.lastName}`}
                      messages={initialMessages}
                      onMessage={handleMessageUpdate}
                    />
                  )}
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
                    sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}
                  />
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Select a conversation
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a conversation from the list to start messaging.
                  </Typography>
                </Box>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* New Conversation Dialog */}
      <Dialog
        open={newConversationDialogOpen}
        onClose={() => setNewConversationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Topic</InputLabel>
            <Select
              value={selectedTopic}
              label="Select Topic"
              onChange={(e) => handleTopicChange(e.target.value)}
            >
              {availableTopics.map((topic) => (
                <MenuItem key={topic.id} value={topic.id}>
                  {topic.title} ({topic.moduleCode})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Select Tutor</InputLabel>
            <Select
              value={selectedTutor}
              label="Select Tutor"
              onChange={(e) => setSelectedTutor(e.target.value)}
              disabled={!selectedTopic}
            >
              {availableTutors.map((tutor) => (
                <MenuItem key={tutor.id} value={tutor.id}>
                  {tutor.firstName} {tutor.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Initial Message"
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            margin="normal"
            placeholder="Introduce yourself and explain what help you need..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConversationDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateConversation}
            variant="contained"
            disabled={!selectedTutor || !initialMessage.trim()}
          >
            Start Conversation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessagesPage;
