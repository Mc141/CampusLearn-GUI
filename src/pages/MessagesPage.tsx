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
import { isSupabaseReady } from "../lib/supabase";
import type { ChatMessage } from "../hooks/useRealtimeChat";

const MessagesPage: React.FC = () => {
  const { user, isLoading } = useAuth();
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
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    // Wait for authentication to complete AND session to be ready
    if (user && !isLoading) {
      const loadConversations = async () => {
        try {
          setLoading(true);
          setError(null);

          // CRITICAL: Wait for Supabase session to be fully ready
          const isReady = await isSupabaseReady();
          if (!isReady) {
            console.log("Supabase session not ready, waiting...");
            // Wait a bit and try again
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const isReadyRetry = await isSupabaseReady();
            if (!isReadyRetry) {
              throw new Error(
                "Database connection not ready - please refresh the page"
              );
            }
          }

          console.log("Supabase session ready, loading conversations...");

          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error("Request timeout - please try again"));
            }, 30000); // 30 second timeout for conversations
          });

          const dataPromise = messagingService.getUserConversations(user.id);

          const conversationsData = (await Promise.race([
            dataPromise,
            timeoutPromise,
          ])) as Conversation[];

          clearTimeout(timeoutId);

          if (isMounted) {
            setConversations(conversationsData);
            console.log(
              "Conversations loaded successfully:",
              conversationsData.length
            );
          }
        } catch (err) {
          console.error("Error loading conversations:", err);
          if (isMounted) {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to load conversations. Please try again."
            );
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      loadConversations();
    } else if (!isLoading && !user) {
      // User is not authenticated
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, isLoading]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation && user) {
      loadInitialMessages();
    }
  }, [selectedConversation, user]);

  const loadInitialMessages = async () => {
    if (!selectedConversation || !user) return;

    try {
      // CRITICAL: Wait for Supabase session to be fully ready
      const isReady = await isSupabaseReady();
      if (!isReady) {
        console.log("Supabase session not ready for messages, waiting...");
        // Wait a bit and try again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const isReadyRetry = await isSupabaseReady();
        if (!isReadyRetry) {
          throw new Error(
            "Database connection not ready - please refresh the page"
          );
        }
      }

      console.log("Supabase session ready, loading messages...");

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout - please try again"));
        }, 30000); // 30 second timeout for messages
      });

      const dataPromise = messagingService.getMessagesBetweenUsers(
        user.id,
        selectedConversation.userId
      );

      const messagesData = (await Promise.race([
        dataPromise,
        timeoutPromise,
      ])) as any[];

      // Convert messages to ChatMessage format
      const chatMessages: ChatMessage[] = messagesData.map((msg) => {
        const senderName =
          msg.senderId === user.id
            ? `${user.firstName} ${user.lastName}`
            : selectedConversation.userName;

        return messagingService.messageToChatMessage(msg, senderName);
      });

      setInitialMessages(chatMessages);
      console.log("Messages loaded successfully:", chatMessages.length);

      // Mark messages as read
      await messagingService.markMessagesAsRead(
        selectedConversation.userId,
        user.id
      );

      // Reload conversations to update unread counts
      // Note: This will be handled by the parent useEffect
    } catch (err) {
      console.error("Error loading messages:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load messages. Please try again."
      );
    }
  };

  const handleMessageUpdate = async (messages: ChatMessage[]) => {
    if (!selectedConversation || !user) return;

    console.log(
      "🔄 handleMessageUpdate called with",
      messages.length,
      "messages"
    );

    // Retry logic for critical message storage
    let retries = 3;
    let lastError: any;

    while (retries > 0) {
      try {
        console.log(`🔄 Attempting to store messages (${4 - retries}/3)...`);

        // No timeout for message storage - it's critical
        await messagingService.storeMessages(
          messages,
          user.id,
          selectedConversation.userId
        );

        // If we get here, messages were stored successfully
        console.log("✅ Messages stored successfully");

        // Try to reload conversations, but don't fail if this doesn't work
        try {
          const conversationsData = await messagingService.getUserConversations(
            user.id
          );
          setConversations(conversationsData);
        } catch (conversationErr) {
          console.warn(
            "Failed to reload conversations, but messages were stored:",
            conversationErr
          );
          // Don't throw - messages were stored successfully
        }

        return; // Success - exit the retry loop
      } catch (err) {
        lastError = err;
        retries--;

        console.error(
          `❌ Message storage failed (${retries} retries left):`,
          err
        );

        if (retries > 0) {
          console.warn(
            `Message storage failed, retrying in 2 seconds... (${retries} retries left)`,
            err
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    // If we get here, all retries failed
    console.error("Failed to store messages after all retries:", lastError);
    setError(
      "Failed to save messages after multiple attempts. Please try sending again."
    );
  };

  const handleStartNewConversation = async () => {
    if (!user || isLoading) return;

    // Wait for authentication to be fully established
    if (!user.id) {
      setError("Please wait for authentication to complete");
      return;
    }

    // Simple check - just proceed and let the actual database calls handle errors
    console.log("Starting new conversation process...");

    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout - please try again"));
        }, 30000); // 30 second timeout for topics
      });

      const dataPromise = topicsService.getAllTopics();

      const topics = (await Promise.race([
        dataPromise,
        timeoutPromise,
      ])) as any[];

      setAvailableTopics(topics);

      // Load available tutors for selected topic
      if (selectedTopic) {
        try {
          const tutors = await tutorTopicAssignmentService.getTutorsForTopic(
            selectedTopic
          );
          setAvailableTutors(tutors);
        } catch (tutorErr) {
          console.error("Error loading tutors:", tutorErr);
          // Don't fail the entire dialog for tutor loading errors
        }
      }

      setNewConversationDialogOpen(true);
    } catch (err) {
      console.error("Error loading data for new conversation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTopicChange = async (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedTutor("");

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout - please try again"));
        }, 30000); // 30 second timeout for tutors
      });

      const dataPromise =
        tutorTopicAssignmentService.getTutorsForTopic(topicId);

      const tutors = (await Promise.race([
        dataPromise,
        timeoutPromise,
      ])) as any[];

      setAvailableTutors(tutors);
    } catch (err) {
      console.error("Error loading tutors for topic:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tutors. Please try again."
      );
    }
  };

  const handleCreateConversation = async () => {
    if (!user || !selectedTutor || !initialMessage.trim()) return;

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Request timeout - please try again"));
        }, 10000); // 10 second timeout
      });

      const sendPromise = messagingService.sendMessage({
        senderId: user.id,
        receiverId: selectedTutor,
        content: initialMessage.trim(),
      });

      await Promise.race([sendPromise, timeoutPromise]);

      setNewConversationDialogOpen(false);
      setSelectedTutor("");
      setInitialMessage("");
      setSelectedTopic("");
      setAvailableTutors([]);

      // Reload conversations to show the new conversation
      const conversationsPromise = messagingService.getUserConversations(
        user.id
      );
      const conversationsData = (await Promise.race([
        conversationsPromise,
        timeoutPromise,
      ])) as Conversation[];

      setConversations(conversationsData);
    } catch (err) {
      console.error("Error creating conversation:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create conversation. Please try again."
      );
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
          disabled={isLoading || !user}
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
