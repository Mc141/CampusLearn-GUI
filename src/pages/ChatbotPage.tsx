import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Paper,
  Divider,
  Grid,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Send,
  SmartToy,
  Person,
  ThumbUp,
  ThumbDown,
  Refresh,
  Lightbulb,
  School,
  Quiz,
  Assignment,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockChatMessages } from "../data/mockData";

const ChatbotPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState(mockChatMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isFromAI: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(inputMessage),
        isFromAI: true,
        timestamp: new Date(),
        suggestions: generateSuggestions(inputMessage),
      };

      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();

    if (
      lowerInput.includes("accounting") ||
      lowerInput.includes("balance sheet")
    ) {
      return "I can help you with accounting concepts! A balance sheet shows a company's assets, liabilities, and equity at a specific point in time. The basic equation is Assets = Liabilities + Equity. Would you like me to explain any specific part in more detail?";
    }

    if (
      lowerInput.includes("programming") ||
      lowerInput.includes("oop") ||
      lowerInput.includes("inheritance")
    ) {
      return "Object-oriented programming (OOP) is a programming paradigm based on objects and classes. Inheritance allows a class to inherit properties and methods from another class. This promotes code reusability and helps create hierarchical relationships between classes.";
    }

    if (lowerInput.includes("help") || lowerInput.includes("assignment")) {
      return "I'm here to help with your academic questions! I can assist with study tips, explain concepts, help with assignments, and guide you to relevant resources. What specific topic would you like to explore?";
    }

    if (lowerInput.includes("study") || lowerInput.includes("tips")) {
      return "Here are some effective study tips: 1) Create a study schedule, 2) Use active recall techniques, 3) Take regular breaks, 4) Join study groups, 5) Practice with past papers. Would you like more detailed advice on any of these?";
    }

    return "I understand you're looking for help. While I can provide general guidance on academic topics, for specific questions about your assignments or complex concepts, I recommend reaching out to our peer tutors who specialize in your subject area.";
  };

  const generateSuggestions = (input: string): string[] => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("accounting")) {
      return [
        "Balance sheet",
        "Income statement",
        "Cash flow statement",
        "Working capital",
      ];
    }

    if (lowerInput.includes("programming")) {
      return [
        "OOP concepts",
        "Data structures",
        "Algorithms",
        "Debugging tips",
      ];
    }

    return [
      "Study tips",
      "Assignment help",
      "Module information",
      "Tutor matching",
    ];
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleFeedback = (messageId: string, isPositive: boolean) => {
    // In a real app, this would send feedback to the backend
    console.log(
      `Feedback for message ${messageId}: ${
        isPositive ? "positive" : "negative"
      }`
    );
  };

  const handleRefresh = () => {
    setMessages(mockChatMessages);
  };

  const quickActions = [
    {
      label: "Study Tips",
      icon: <Lightbulb />,
      action: "Can you give me some study tips?",
    },
    {
      label: "Assignment Help",
      icon: <Assignment />,
      action: "I need help with my assignment",
    },
    {
      label: "Module Info",
      icon: <School />,
      action: "Tell me about my modules",
    },
    { label: "Find Tutor", icon: <Quiz />, action: "Help me find a tutor" },
  ];

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
          AI Tutor Assistant
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
        >
          New Chat
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              height: "calc(100vh - 200px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent
              sx={{ flex: 1, display: "flex", flexDirection: "column", p: 0 }}
            >
              {/* Chat Header */}
              <Box
                sx={{
                  p: 3,
                  borderBottom: 1,
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  color: "white",
                  borderRadius: "16px 16px 0 0",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "white", color: "primary.main" }}>
                    <SmartToy />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      CampusLearn AI Assistant
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Your 24/7 academic support companion
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                <List>
                  {messages.map((message, index) => (
                    <React.Fragment key={message.id}>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemIcon>
                          {message.isFromAI ? (
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                              <SmartToy />
                            </Avatar>
                          ) : (
                            <Avatar sx={{ bgcolor: "secondary.main" }}>
                              <Person />
                            </Avatar>
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="body1" sx={{ mb: 1 }}>
                                {message.content}
                              </Typography>
                              {message.suggestions &&
                                message.suggestions.length > 0 && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 1,
                                      mb: 1,
                                    }}
                                  >
                                    {message.suggestions.map((suggestion) => (
                                      <Chip
                                        key={suggestion}
                                        label={suggestion}
                                        size="small"
                                        variant="outlined"
                                        onClick={() =>
                                          handleSuggestionClick(suggestion)
                                        }
                                        sx={{ cursor: "pointer" }}
                                      />
                                    ))}
                                  </Box>
                                )}
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {message.timestamp.toLocaleTimeString()}
                                </Typography>
                                {message.isFromAI && (
                                  <Box sx={{ display: "flex", gap: 0.5 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleFeedback(message.id, true)
                                      }
                                    >
                                      <ThumbUp fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() =>
                                        handleFeedback(message.id, false)
                                      }
                                    >
                                      <ThumbDown fontSize="small" />
                                    </IconButton>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < messages.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}

                  {isTyping && (
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          <SmartToy />
                        </Avatar>
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
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">
                              AI is typing...
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                </List>
                <div ref={messagesEndRef} />
              </Box>

              {/* Input */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Ask me anything about your studies..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isTyping}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    startIcon={<Send />}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid item xs={12} key={action.label}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={action.icon}
                      onClick={() => setInputMessage(action.action)}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                AI Capabilities
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <School color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Academic Support"
                    secondary="Answer questions about your modules"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Assignment color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Assignment Help"
                    secondary="Guidance on assignments and projects"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Lightbulb color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Study Tips"
                    secondary="Effective learning strategies"
                  />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Quiz color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Tutor Matching"
                    secondary="Connect with peer tutors"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatbotPage;
