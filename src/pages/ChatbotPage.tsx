import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Send,
  SmartToy,
  Person,
  TrendingUp,
  School,
  Help,
  Clear,
  Refresh,
  Warning,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { chatbotService, ChatbotMessage } from "../services/chatbotService";
import {
  chatbotConversationService,
  ChatbotConversation,
} from "../services/chatbotConversationService";
import MarkdownRenderer from "../components/MarkdownRenderer";

const ChatbotPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] =
    useState<ChatbotConversation | null>(null);
  const [contextWarning, setContextWarning] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [pendingEscalation, setPendingEscalation] = useState<{
    messageId: string;
    tutorModule?: string;
    selectedModule?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Available modules for escalation
  const availableModules = [
    { code: "BCS101", name: "Programming Fundamentals" },
    { code: "BCS102", name: "Data Structures & Algorithms" },
    { code: "BCS201", name: "Software Engineering" },
    { code: "BCS202", name: "Database Management" },
    { code: "DIP101", name: "Diploma Foundation" },
    { code: "BCom", name: "Business Commerce" },
    { code: "General", name: "General Academic Support" },
  ];

  // Load or create conversation on mount
  useEffect(() => {
    if (user?.id) {
      loadConversation();
    }
  }, [user?.id]);

  const loadConversation = async () => {
    if (!user?.id) return;

    console.log("🔄 Loading conversation for user:", user.id);

    try {
      // Try to get active conversation
      let conversation = await chatbotConversationService.getActiveConversation(
        user.id
      );

      console.log("📋 Active conversation result:", conversation);

      if (!conversation) {
        console.log("🆕 No active conversation found, creating new one");
        // Create new conversation
        conversation = await chatbotConversationService.createConversation(
          user.id
        );
        if (!conversation) {
          setError("Failed to create conversation");
          return;
        }
        console.log("✅ New conversation created:", conversation);
      } else {
        console.log("✅ Found existing conversation:", conversation);
      }

      setCurrentConversation(conversation);

      // Load messages
      console.log("📨 Loading messages for conversation:", conversation.id);
      const messageRecords = await chatbotConversationService.getMessages(
        conversation.id
      );
      console.log("📝 Raw message records:", messageRecords);

      const chatbotMessages =
        chatbotConversationService.convertToChatbotMessages(messageRecords);
      console.log("💬 Converted chatbot messages:", chatbotMessages);

      // If no messages, add welcome message
      if (chatbotMessages.length === 0) {
        console.log("👋 No messages found, adding welcome message");
        const welcomeMessage: ChatbotMessage = {
          id: crypto.randomUUID(),
          content: `Hello ${
            user?.firstName || "there"
          }! I'm your CampusLearn AI Assistant. I can help you with:\n\n• Academic questions and study tips\n• Platform navigation\n• Finding tutors and resources\n• Module-specific guidance\n\nWhat can I help you with today?`,
          isFromBot: true,
        };
        setMessages([welcomeMessage]);
      } else {
        console.log("📚 Setting messages from database:", chatbotMessages);
        setMessages(chatbotMessages);
      }

      // Check for context warnings
      checkContextLimits(conversation.messageCount);
    } catch (error) {
      console.error("💥 Error loading conversation:", error);
      setError("Failed to load conversation");
    }
  };

  const checkContextLimits = (messageCount: number) => {
    if (chatbotConversationService.shouldShowWarning(messageCount)) {
      const remaining =
        chatbotConversationService.getRemainingMessages(messageCount);
      setContextWarning(
        `⚠️ Context limit warning: Only ${remaining} messages remaining before starting a new chat.`
      );
    } else if (chatbotConversationService.hasReachedLimit(messageCount)) {
      setContextWarning(
        "🚫 Context limit reached! Please start a new chat to continue."
      );
    } else {
      setContextWarning(null);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    console.log(
      "🔄 Messages changed, scrolling to bottom. Message count:",
      messages.length
    );
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentConversation) return;

    // Check word limit (300 words)
    const wordCount = inputMessage.trim().split(/\s+/).length;
    if (wordCount > 300) {
      setError("Message too long. Please keep it under 300 words.");
      return;
    }

    // Check if context limit reached
    if (currentConversation.contextLimitReached) {
      setError("Context limit reached. Please start a new chat.");
      return;
    }

    const userMessage: ChatbotMessage = {
      id: crypto.randomUUID(),
      content: inputMessage,
      isFromBot: false,
      escalatedToTutor: false,
      tutorModule: undefined,
      confidenceScore: undefined,
    };

    // Add user message to state
    setMessages((prev) => [...prev, userMessage]);

    // Save user message to database
    await chatbotConversationService.addMessage(currentConversation.id, {
      content: inputMessage,
      isFromBot: false,
      escalatedToTutor: false,
    });

    const messageToSend = inputMessage;
    setInputMessage("");
    setLoading(true);
    setError(null);

    try {
      const response = await chatbotService.sendMessage(
        messageToSend,
        user,
        messages,
        currentConversation.id
      );

      const botMessage: ChatbotMessage = {
        id: crypto.randomUUID(),
        content: response.text,
        isFromBot: true,
        escalatedToTutor: response.escalated || false,
        tutorModule: response.tutorModule,
        confidenceScore: response.confidence,
        needsEscalationConfirmation: response.needsEscalationConfirmation,
      };

      // Add bot message to state
      console.log("🤖 Adding bot message to state:", botMessage);
      setMessages((prev) => {
        const newMessages = [...prev, botMessage];
        console.log("📝 Updated messages state:", newMessages);
        return newMessages;
      });

      // Clear loading state immediately after showing the message
      setLoading(false);

      // Save bot message to database
      await chatbotConversationService.addMessage(currentConversation.id, {
        content: response.text,
        isFromBot: true,
        escalatedToTutor: response.escalated || false,
        tutorModule: response.tutorModule,
        confidenceScore: response.confidence,
      });

      // If escalation confirmation is needed, store the pending escalation
      if (response.needsEscalationConfirmation) {
        setPendingEscalation({
          messageId: botMessage.id,
          tutorModule: response.tutorModule,
        });
      }

      // Update conversation and check limits
      const updatedConversation =
        await chatbotConversationService.getActiveConversation(user?.id || "");
      if (updatedConversation) {
        setCurrentConversation(updatedConversation);
        checkContextLimits(updatedConversation.messageCount);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (currentConversation?.contextLimitReached) {
      setError("Context limit reached. Please start a new chat.");
      return;
    }
    setInputMessage(suggestion);
  };

  const handleEscalationConfirm = async (confirm: boolean) => {
    if (!pendingEscalation || !currentConversation || !user?.id) return;

    console.log("🔄 Escalation confirmation:", {
      confirm,
      pendingEscalation,
      currentConversation: currentConversation.id,
      userId: user.id,
    });

    try {
      if (confirm) {
        console.log("✅ User confirmed escalation - triggering escalation...");

        // User confirmed escalation - trigger the actual escalation
        const tutorAssigned = await chatbotService.handleEscalation(
          currentConversation.id,
          user.id,
          "User confirmed escalation request",
          pendingEscalation.selectedModule || pendingEscalation.tutorModule,
          0.8 // High confidence since user explicitly confirmed
        );

        console.log(
          "🎯 Escalation triggered successfully, tutor assigned:",
          tutorAssigned
        );

        // Update the message to show escalation result
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === pendingEscalation.messageId
              ? {
                  ...msg,
                  escalatedToTutor: tutorAssigned,
                  needsEscalationConfirmation: false,
                  content: msg.content.replace(
                    "Please confirm if you'd like me to do this.",
                    tutorAssigned
                      ? `✅ **Escalation confirmed!** I've connected you with a human tutor for ${
                          pendingEscalation.selectedModule ||
                          pendingEscalation.tutorModule
                        }. You should receive a message from them shortly.`
                      : `⚠️ **Escalation submitted!** Unfortunately, there are currently no tutors available for ${
                          pendingEscalation.selectedModule ||
                          pendingEscalation.tutorModule
                        }. Your request has been queued and you'll be notified when a tutor becomes available.`
                  ),
                }
              : msg
          )
        );
      } else {
        // User declined escalation - update the message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === pendingEscalation.messageId
              ? {
                  ...msg,
                  needsEscalationConfirmation: false,
                  content: msg.content.replace(
                    "Please confirm if you'd like me to do this.",
                    "❌ **Escalation declined.** No problem! Feel free to ask me anything else or try again later if you need human assistance."
                  ),
                }
              : msg
          )
        );
      }

      // Clear pending escalation
      setPendingEscalation(null);
    } catch (error) {
      console.error("Error handling escalation confirmation:", error);
      setError("Failed to process escalation. Please try again.");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    if (!currentConversation) return;

    try {
      await chatbotConversationService.clearConversation(
        currentConversation.id
      );

      // Reset to welcome message
      const welcomeMessage: ChatbotMessage = {
        id: crypto.randomUUID(),
        content: `Hello ${
          user?.firstName || "there"
        }! I'm your CampusLearn AI Assistant. I can help you with:\n\n• Academic questions and study tips\n• Platform navigation\n• Finding tutors and resources\n• Module-specific guidance\n\nWhat can I help you with today?`,
        isFromBot: true,
      };
      setMessages([welcomeMessage]);
      setContextWarning(null);
      setShowClearDialog(false);
    } catch (error) {
      console.error("Error clearing chat:", error);
      setError("Failed to clear chat");
    }
  };

  const handleStartNewChat = async () => {
    if (!user?.id) return;

    try {
      // Deactivate current conversation
      if (currentConversation) {
        await chatbotConversationService.deactivateConversation(
          currentConversation.id
        );
      }

      // Create new conversation
      const newConversation =
        await chatbotConversationService.createConversation(user.id);
      if (!newConversation) {
        setError("Failed to create new conversation");
        return;
      }

      setCurrentConversation(newConversation);

      // Reset to welcome message
      const welcomeMessage: ChatbotMessage = {
        id: crypto.randomUUID(),
        content: `Hello ${
          user?.firstName || "there"
        }! I'm your CampusLearn AI Assistant. I can help you with:\n\n• Academic questions and study tips\n• Platform navigation\n• Finding tutors and resources\n• Module-specific guidance\n\nWhat can I help you with today?`,
        isFromBot: true,
      };
      setMessages([welcomeMessage]);
      setContextWarning(null);
      setError(null);
    } catch (error) {
      console.error("Error starting new chat:", error);
      setError("Failed to start new chat");
    }
  };

  const quickActions = [
    {
      icon: <School />,
      label: "Module Help",
      query: "I need help with my modules",
    },
    {
      icon: <Person />,
      label: "Find Tutor",
      query: "How do I find a tutor for my subject?",
    },
    {
      icon: <TrendingUp />,
      label: "Study Tips",
      query: "Give me some study tips",
    },
    {
      icon: <Help />,
      label: "Platform Help",
      query: "How do I use CampusLearn?",
    },
  ];

  const wordCount = inputMessage
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const canSendMessage =
    !isLoading &&
    inputMessage.trim() &&
    wordCount <= 300 &&
    !currentConversation?.contextLimitReached;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, flexShrink: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              <SmartToy />
            </Avatar>
            <Box>
              <Typography variant="h6">CampusLearn AI Assistant</Typography>
              <Typography variant="body2" color="text.secondary">
                Your 24/7 academic support companion
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              startIcon={<Clear />}
              onClick={() => setShowClearDialog(true)}
              disabled={
                !currentConversation || currentConversation.messageCount === 0
              }
            >
              Clear Chat
            </Button>
            {currentConversation?.contextLimitReached && (
              <Button
                startIcon={<Refresh />}
                onClick={handleStartNewChat}
                variant="contained"
              >
                Start New Chat
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
        {/* Context Warning */}
        {contextWarning && (
          <Alert
            severity={
              currentConversation?.contextLimitReached ? "error" : "warning"
            }
            sx={{ mb: 2 }}
            icon={<Warning />}
          >
            {contextWarning}
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent: message.isFromBot ? "flex-start" : "flex-end",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                maxWidth: "80%",
              }}
            >
              {message.isFromBot && (
                <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                  <SmartToy fontSize="small" />
                </Avatar>
              )}

              <Paper
                sx={{
                  p: 2,
                  maxWidth: "70%",
                  minWidth: "fit-content",
                  bgcolor: message.isFromBot ? "grey.100" : "primary.main",
                  color: message.isFromBot
                    ? "text.primary"
                    : "primary.contrastText",
                  "& .MuiTypography-root": {
                    color: message.isFromBot
                      ? "text.primary"
                      : "primary.contrastText",
                  },
                }}
              >
                <MarkdownRenderer
                  content={message.content}
                  isUserMessage={!message.isFromBot}
                />

                {message.needsEscalationConfirmation && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ mb: 2, textAlign: "center" }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Please select the module you need help with:
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                          value={pendingEscalation?.selectedModule || ""}
                          onChange={(e) => {
                            if (pendingEscalation) {
                              setPendingEscalation({
                                ...pendingEscalation,
                                selectedModule: e.target.value,
                              });
                            }
                          }}
                          displayEmpty
                        >
                          <MenuItem value="" disabled>
                            Select Module
                          </MenuItem>
                          {availableModules.map((module) => (
                            <MenuItem key={module.code} value={module.code}>
                              {module.code} - {module.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "center",
                      }}
                    >
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleEscalationConfirm(true)}
                        disabled={
                          pendingEscalation?.messageId !== message.id ||
                          !pendingEscalation?.selectedModule
                        }
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.9rem",
                          textTransform: "none",
                          px: 3,
                          py: 1,
                          background:
                            "linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)",
                          boxShadow: "0 3px 5px 2px rgba(76, 175, 80, .3)",
                          "&:hover": {
                            background:
                              "linear-gradient(45deg, #388e3c 30%, #1b5e20 90%)",
                            boxShadow: "0 4px 8px 2px rgba(76, 175, 80, .4)",
                          },
                          "&:disabled": {
                            background: "rgba(0, 0, 0, 0.12)",
                            color: "rgba(0, 0, 0, 0.26)",
                            boxShadow: "none",
                          },
                        }}
                      >
                        ✅ Yes, connect me with a tutor
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => handleEscalationConfirm(false)}
                        disabled={pendingEscalation?.messageId !== message.id}
                        sx={{
                          fontWeight: "bold",
                          fontSize: "0.9rem",
                          textTransform: "none",
                          px: 3,
                          py: 1,
                          borderWidth: 2,
                          "&:hover": {
                            borderWidth: 2,
                            backgroundColor: "rgba(255, 152, 0, 0.04)",
                          },
                          "&:disabled": {
                            borderColor: "rgba(0, 0, 0, 0.12)",
                            color: "rgba(0, 0, 0, 0.26)",
                          },
                        }}
                      >
                        ❌ No, I'll try something else
                      </Button>
                    </Box>
                  </Box>
                )}

                {message.escalatedToTutor && (
                  <Alert severity="info" sx={{ mt: 1, fontSize: "0.875rem" }}>
                    This question has been escalated to a human tutor for{" "}
                    {message.tutorModule || "your module"}.
                  </Alert>
                )}
              </Paper>

              {!message.isFromBot && (
                <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                  <Person fontSize="small" />
                </Avatar>
              )}
            </Box>
          </Box>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
                <SmartToy fontSize="small" />
              </Avatar>
              <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">AI is thinking...</Typography>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider", flexShrink: 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Quick Actions:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {quickActions.map((action, index) => (
              <Chip
                key={index}
                icon={action.icon}
                label={action.label}
                onClick={() => handleSuggestionClick(action.query)}
                disabled={currentConversation?.contextLimitReached}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Input */}
      <Paper sx={{ p: 2, borderRadius: 0, flexShrink: 0 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              placeholder={
                currentConversation?.contextLimitReached
                  ? "Context limit reached. Please start a new chat."
                  : "Ask me anything about CampusLearn, your modules, or academic support..."
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || currentConversation?.contextLimitReached}
              multiline
              maxRows={3}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  paddingRight: 1,
                },
              }}
            />
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
            >
              <Typography variant="caption" color="text.secondary">
                {wordCount}/300 words
              </Typography>
              {wordCount > 300 && (
                <Typography variant="caption" color="error">
                  Message too long
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={handleSendMessage}
            disabled={!canSendMessage}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              width: 48,
              height: 48,
              flexShrink: 0,
              "&:hover": {
                bgcolor: "primary.dark",
              },
              "&:disabled": {
                bgcolor: "grey.300",
              },
            }}
          >
            <Send />
          </IconButton>
        </Box>
      </Paper>

      {/* Clear Chat Dialog */}
      <Dialog open={showClearDialog} onClose={() => setShowClearDialog(false)}>
        <DialogTitle>Clear Chat History</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to clear all messages in this chat? This
            action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDialog(false)}>Cancel</Button>
          <Button onClick={handleClearChat} color="error" variant="contained">
            Clear Chat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatbotPage;
