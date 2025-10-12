import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, TextField, IconButton, Paper, Typography } from "@mui/material";
import { Send } from "@mui/icons-material";
import { ChatMessageItem } from "./ChatMessageItem";
import { useChatScroll } from "../hooks/useChatScroll";
import { type ChatMessage, useRealtimeChat } from "../hooks/useRealtimeChat";

interface RealtimeChatProps {
  roomName: string;
  username: string;
  onMessage?: (messages: ChatMessage[]) => void;
  messages?: ChatMessage[];
}

/**
 * Realtime chat component
 * @param roomName - The name of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat: React.FC<RealtimeChatProps> = ({
  roomName,
  username,
  onMessage,
  messages: initialMessages = [],
}) => {
  const { containerRef, scrollToBottom } = useChatScroll();

  const {
    messages: realtimeMessages,
    sendMessage,
    isConnected,
  } = useRealtimeChat({
    roomName,
    username,
  });
  const [newMessage, setNewMessage] = useState("");

  // Merge realtime messages with initial messages
  const allMessages = useMemo(() => {
    const mergedMessages = [...initialMessages, ...realtimeMessages];
    // Remove duplicates based on message id
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) =>
        index === self.findIndex((m) => m.id === message.id)
    );
    // Sort by creation date
    const sortedMessages = uniqueMessages.sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );

    return sortedMessages;
  }, [initialMessages, realtimeMessages]);

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages);
    }
  }, [allMessages, onMessage]);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [allMessages, scrollToBottom]);

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !isConnected) return;

      sendMessage(newMessage);
      setNewMessage("");
    },
    [newMessage, isConnected, sendMessage]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: "background.paper",
        color: "text.primary",
      }}
    >
      {/* Messages */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {allMessages.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : null}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {allMessages.map((message, index) => {
            const prevMessage = index > 0 ? allMessages[index - 1] : null;
            const showHeader =
              !prevMessage || prevMessage.user.name !== message.user.name;

            return (
              <Box
                key={message.id}
                sx={{
                  animation: "fadeIn 0.3s ease-in-out",
                  "@keyframes fadeIn": {
                    from: { opacity: 0, transform: "translateY(10px)" },
                    to: { opacity: 1, transform: "translateY(0)" },
                  },
                }}
              >
                <ChatMessageItem
                  message={message}
                  isOwnMessage={message.user.name === username}
                  showHeader={showHeader}
                />
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Message Input */}
      <Paper
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          display: "flex",
          width: "100%",
          gap: 1,
          borderTop: 1,
          borderColor: "divider",
          p: 2,
          borderRadius: 0,
        }}
      >
        <TextField
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: 6,
            },
          }}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
          variant="outlined"
          size="small"
        />
        {isConnected && newMessage.trim() && (
          <IconButton
            type="submit"
            disabled={!isConnected}
            color="primary"
            sx={{
              animation: "slideIn 0.3s ease-in-out",
              "@keyframes slideIn": {
                from: { opacity: 0, transform: "translateX(10px)" },
                to: { opacity: 1, transform: "translateX(0)" },
              },
            }}
          >
            <Send />
          </IconButton>
        )}
      </Paper>
    </Box>
  );
};
