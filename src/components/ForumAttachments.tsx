import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  InsertDriveFile,
  Image,
  VideoFile,
  AudioFile,
  Description,
  Download,
  Delete,
  Visibility,
} from "@mui/icons-material";
import {
  forumAttachmentService,
  ForumAttachment,
} from "../services/forumAttachmentService";
import { useAuth } from "../context/AuthContext";

interface ForumAttachmentsProps {
  postId?: string;
  replyId?: string;
  canDelete?: boolean;
}

const ForumAttachments: React.FC<ForumAttachmentsProps> = ({
  postId,
  replyId,
  canDelete = true,
}) => {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<ForumAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load attachments
  const loadAttachments = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedAttachments = postId
        ? await forumAttachmentService.getAttachmentsForPost(postId)
        : await forumAttachmentService.getAttachmentsForReply(replyId!);

      setAttachments(fetchedAttachments);
    } catch (err) {
      console.error("Error loading forum attachments:", err);
      setError("Failed to load attachments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId || replyId) {
      loadAttachments();
    }
  }, [postId, replyId]);

  const handleDownload = async (attachment: ForumAttachment) => {
    try {
      await forumAttachmentService.incrementDownloadCount(attachment.id);
      window.open(attachment.url, "_blank");
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file");
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await forumAttachmentService.deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      console.error("Error deleting attachment:", err);
      setError("Failed to delete attachment");
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image color="primary" />;
      case "video":
        return <VideoFile color="secondary" />;
      case "audio":
        return <AudioFile color="success" />;
      case "pdf":
        return <Description color="error" />;
      default:
        return <InsertDriveFile color="action" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return "Unknown date";
    }
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const canDeleteAttachment = (attachment: ForumAttachment) => {
    return (
      user &&
      canDelete &&
      (user.role === "admin" ||
        user.id === attachment.uploaded_by ||
        user.id === attachment.uploaded_by_user?.id)
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (attachments.length === 0) {
    return null; // Don't show anything if no attachments
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Attachments List */}
      <Card variant="outlined">
        <CardContent sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, px: 2, py: 1 }}>
            Attachments ({attachments.length})
          </Typography>
          <List dense>
            {attachments.map((attachment, index) => (
              <React.Fragment key={attachment.id}>
                <ListItem sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getFileIcon(attachment.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {attachment.title}
                        </Typography>
                        <Chip
                          label={attachment.type.toUpperCase()}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(attachment.size)} •{" "}
                          {attachment.downloads} downloads
                        </Typography>
                        {attachment.uploaded_by_user && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            by {attachment.uploaded_by_user.first_name}{" "}
                            {attachment.uploaded_by_user.last_name}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(attachment)}
                        >
                          <Download />
                        </IconButton>
                      </Tooltip>
                      {canDeleteAttachment(attachment) && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteAttachment(attachment.id)
                            }
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < attachments.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForumAttachments;
