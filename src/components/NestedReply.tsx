import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Collapse,
  Avatar,
  Chip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  ThumbUp,
  Reply,
  ExpandMore,
  ExpandLess,
  Person,
  VisibilityOff,
} from "@mui/icons-material";
import { ForumReply } from "../types";
import { useAuth } from "../context/AuthContext";
import { forumService } from "../services/forumService";
import { formatDistanceToNow } from "date-fns";
import ForumFileUpload from "./ForumFileUpload";
import ForumAttachments from "./ForumAttachments";
import { forumAttachmentService } from "../services/forumAttachmentService";

interface NestedReplyProps {
  reply: ForumReply;
  postId: string;
  onReplyAdded: () => void;
  maxDepth?: number;
}

const NestedReply: React.FC<NestedReplyProps> = ({
  reply,
  postId,
  onReplyAdded,
  maxDepth = 5,
}) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false); // All replies start collapsed by default
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isAnonymousReply, setIsAnonymousReply] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [replyFileUploadStatus, setReplyFileUploadStatus] = useState<{
    [key: string]: "pending" | "uploading" | "completed" | "error";
  }>({});

  const canReply = reply.depth < maxDepth;

  const handleToggleVote = async () => {
    if (!user?.id) return;

    try {
      const result = await forumService.toggleReplyVote(reply.id, user.id);
      onReplyAdded(); // Refresh to show updated upvotes
    } catch (error) {
      console.error("Error toggling reply vote:", error);
    }
  };

  const handleReply = () => {
    setShowReplyDialog(true);
  };

  const submitReply = async () => {
    if (!replyContent.trim() || !user) return;

    try {
      setIsSubmittingReply(true);
      const newReply = await forumService.createForumReply(
        {
          postId: postId,
          content: replyContent,
          isAnonymous: isAnonymousReply,
          parentReplyId: reply.id,
        },
        user.id
      );

      // Handle attachments if any were uploaded
      if (replyAttachments.length > 0 && newReply.id) {
        // Update file status to uploading
        const newStatus = { ...replyFileUploadStatus };
        replyAttachments.forEach((file) => {
          newStatus[file.name] = "uploading";
        });
        setReplyFileUploadStatus(newStatus);

        // Upload files to the created reply
        await forumAttachmentService.uploadFilesToReply(
          newReply.id,
          replyAttachments,
          user.id,
          (progress) => {
            console.log(
              `Upload progress for ${progress.fileName}: ${progress.progress}%`
            );
            // Update status based on progress
            if (progress.status === "completed") {
              setReplyFileUploadStatus((prev) => ({
                ...prev,
                [progress.fileName]: "completed",
              }));
            } else if (progress.status === "error") {
              setReplyFileUploadStatus((prev) => ({
                ...prev,
                [progress.fileName]: "error",
              }));
            }
          }
        );
      }

      // Reset form
      setReplyContent("");
      setIsAnonymousReply(false);
      setReplyAttachments([]);
      setReplyFileUploadStatus({});
      setShowReplyDialog(false);
      onReplyAdded(); // Refresh to show new reply
    } catch (err) {
      console.error("Error submitting reply:", err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const renderReplyContent = () => (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ p: 2 }}>
        {/* Reply Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
            {reply.isAnonymous ? (
              <Person fontSize="small" />
            ) : (
              <Typography variant="caption">
                {reply.authorName?.charAt(0) || "?"}
              </Typography>
            )}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {reply.isAnonymous ? "Anonymous" : reply.authorName || "Unknown"}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {formatDistanceToNow(reply.createdAt)} ago
          </Typography>
          {reply.isModerated && (
            <Chip
              label="Hidden"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        {/* Reply Content */}
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
            mb: 1,
          }}
        >
          {reply.content}
        </Typography>

        {/* Reply Attachments */}
        <ForumAttachments replyId={reply.id} />

        {/* Reply Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={handleToggleVote}>
            <ThumbUp fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            {reply.upvotes} upvotes
          </Typography>
          {canReply && (
            <>
              <Divider orientation="vertical" flexItem />
              <Button
                size="small"
                startIcon={<Reply />}
                onClick={handleReply}
                sx={{ textTransform: "none" }}
              >
                Reply
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ ml: reply.depth * 2 }}>
      {renderReplyContent()}

      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <Box>
          <Button
            size="small"
            startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
            onClick={() => setExpanded(!expanded)}
            sx={{ textTransform: "none", mb: 1 }}
          >
            {expanded ? "Hide" : "Show"} {reply.replies.length} repl
            {reply.replies.length === 1 ? "y" : "ies"}
          </Button>
          <Collapse in={expanded}>
            {reply.replies.map((nestedReply) => (
              <NestedReply
                key={nestedReply.id}
                reply={nestedReply}
                postId={postId}
                onReplyAdded={onReplyAdded}
                maxDepth={maxDepth}
              />
            ))}
          </Collapse>
        </Box>
      )}

      {/* Reply Dialog */}
      <Dialog
        open={showReplyDialog}
        onClose={() => setShowReplyDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Reply to {reply.isAnonymous ? "Anonymous" : reply.authorName}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Your Reply"
            multiline
            rows={4}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            margin="normal"
            required
          />

          {/* File Upload */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Attach Files (Optional)
            </Typography>
            <ForumFileUpload
              userId={user?.id || ""}
              onFilesUploaded={(files) => {
                setReplyAttachments((prev) => {
                  const newFiles = [...prev, ...files];
                  // Update file status for new files
                  const newStatus = { ...replyFileUploadStatus };
                  files.forEach((file) => {
                    newStatus[file.name] = "pending";
                  });
                  setReplyFileUploadStatus(newStatus);
                  return newFiles;
                });
              }}
              disabled={isSubmittingReply}
            />
          </Box>

          {/* Attached Files List */}
          {replyAttachments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Attached Files ({replyAttachments.length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                {replyAttachments.map((file, index) => (
                  <Box
                    key={`${file.name}-${index}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1,
                      mb: 1,
                      border: "1px solid",
                      borderColor: "grey.300",
                      borderRadius: 1,
                      backgroundColor: "grey.50",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({Math.round(file.size / 1024)} KB)
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {replyFileUploadStatus[file.name] === "pending" && (
                        <Chip
                          label="Ready"
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      )}
                      {replyFileUploadStatus[file.name] === "uploading" && (
                        <Chip
                          label="Uploading..."
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {replyFileUploadStatus[file.name] === "completed" && (
                        <Chip
                          label="Uploaded"
                          size="small"
                          color="success"
                          variant="filled"
                        />
                      )}
                      {replyFileUploadStatus[file.name] === "error" && (
                        <Chip
                          label="Error"
                          size="small"
                          color="error"
                          variant="filled"
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <FormControlLabel
            control={
              <Checkbox
                checked={isAnonymousReply}
                onChange={(e) => setIsAnonymousReply(e.target.checked)}
              />
            }
            label="Reply anonymously"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReplyDialog(false)}>Cancel</Button>
          <Button
            onClick={submitReply}
            variant="contained"
            disabled={isSubmittingReply || !replyContent.trim()}
          >
            Submit Reply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NestedReply;
