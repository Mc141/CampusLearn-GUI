import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Download,
  PictureAsPdf,
  VideoFile,
  AudioFile,
  Image,
  AttachFile,
} from "@mui/icons-material";
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
  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <PictureAsPdf color="error" sx={{ fontSize: 16 }} />;
      case "video":
        return <VideoFile color="primary" sx={{ fontSize: 16 }} />;
      case "audio":
        return <AudioFile color="secondary" sx={{ fontSize: 16 }} />;
      case "image":
        return <Image color="success" sx={{ fontSize: 16 }} />;
      default:
        return <AttachFile sx={{ fontSize: 16 }} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileDownload = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

        {/* Message Content */}
        {message.content && (
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
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              width: "100%",
              maxWidth: 300,
            }}
          >
            {message.attachments.map((attachment) => (
              <Box
                key={attachment.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  backgroundColor: isOwnMessage ? "primary.light" : "grey.50",
                  borderRadius: 1,
                  border: 1,
                  borderColor: isOwnMessage ? "primary.main" : "grey.300",
                }}
              >
                {getFileIcon(attachment.type)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {attachment.name}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mt: 0.5,
                    }}
                  >
                    <Chip
                      label={attachment.type.toUpperCase()}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                    {attachment.size && (
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(attachment.size)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Tooltip title="Download file">
                  <IconButton
                    size="small"
                    onClick={() =>
                      handleFileDownload(attachment.url, attachment.name)
                    }
                    sx={{
                      color: isOwnMessage
                        ? "primary.contrastText"
                        : "text.primary",
                      "&:hover": {
                        backgroundColor: isOwnMessage
                          ? "primary.dark"
                          : "grey.200",
                      },
                    }}
                  >
                    <Download sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};
