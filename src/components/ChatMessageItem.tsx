import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import type { ChatMessage } from "../hooks/useRealtimeChat";

interface ChatMessageItemProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showHeader: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isOwnMessage,
  showHeader,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        mt: 1,
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
      }}
    >
      <Box
        sx={{
          maxWidth: "75%",
          width: "fit-content",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          alignItems: isOwnMessage ? "flex-end" : "flex-start",
        }}
      >
        {showHeader && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              flexDirection: isOwnMessage ? "row-reverse" : "row",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {message.user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            py: 1,
            px: 1.5,
            borderRadius: 2,
            maxWidth: "100%",
            backgroundColor: isOwnMessage ? "primary.main" : "grey.100",
            color: isOwnMessage ? "primary.contrastText" : "text.primary",
            wordBreak: "break-word",
          }}
        >
          <Typography variant="body2">{message.content}</Typography>
        </Box>
      </Box>
    </Box>
  );
};
