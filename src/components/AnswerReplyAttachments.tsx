import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Download,
  Delete,
  InsertDriveFile,
  Image,
  VideoFile,
  AudioFile,
  Description,
  PictureAsPdf,
} from "@mui/icons-material";
import { AnswerReplyAttachment } from "../types";
import { answerReplyAttachmentService } from "../services/answerReplyAttachmentService";
import { useAuth } from "../context/AuthContext";

interface AnswerReplyAttachmentsProps {
  replyId: string;
  canDelete?: boolean;
}

const AnswerReplyAttachments: React.FC<AnswerReplyAttachmentsProps> = ({
  replyId,
  canDelete = true,
}) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<AnswerReplyAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttachments();
  }, [replyId]);

  const canDeleteAttachment = (attachment: AnswerReplyAttachment) => {
    return canDelete && user?.id === attachment.uploadedBy;
  };

  const loadAttachments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await answerReplyAttachmentService.getAttachmentsForReply(
        replyId
      );
      setAttachments(data);
    } catch (err) {
      console.error("Error loading attachments:", err);
      setError("Failed to load attachments");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachment: AnswerReplyAttachment) => {
    try {
      // Increment download count
      await answerReplyAttachmentService.incrementDownloadCount(attachment.id);

      // Create download link
      const link = document.createElement("a");
      link.href = attachment.url;
      link.download = attachment.fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Refresh attachments to show updated download count
      await loadAttachments();
    } catch (err) {
      console.error("Error downloading attachment:", err);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await answerReplyAttachmentService.deleteAttachment(attachmentId);
      await loadAttachments(); // Refresh the list
    } catch (err) {
      console.error("Error deleting attachment:", err);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <PictureAsPdf color="error" />;
      case "image":
        return <Image color="primary" />;
      case "video":
        return <VideoFile color="secondary" />;
      case "audio":
        return <AudioFile color="info" />;
      case "document":
        return <Description color="action" />;
      default:
        return <InsertDriveFile color="action" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 1, display: "block" }}
      >
        Attachments ({attachments.length})
      </Typography>
      <List dense sx={{ py: 0 }}>
        {attachments.map((attachment) => (
          <ListItem key={attachment.id} sx={{ px: 0, py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {getFileIcon(attachment.type)}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {attachment.title}
                  </Typography>
                  <Chip
                    label={attachment.type.toUpperCase()}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem", height: 20 }}
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(attachment.size)}
                  </Typography>
                  {attachment.downloads > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      • {attachment.downloads} downloads
                    </Typography>
                  )}
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={() => handleDownload(attachment)}
                  edge="end"
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
              {canDeleteAttachment(attachment) && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(attachment.id)}
                    edge="end"
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default AnswerReplyAttachments;
