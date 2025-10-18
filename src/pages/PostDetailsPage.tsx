import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Avatar,
  IconButton,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from "@mui/material";
import {
  ArrowBack,
  ThumbUp,
  Comment,
  Person,
  VisibilityOff,
  Reply,
  MoreVert,
  Tag,
  Share,
  Bookmark,
  Delete,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  forumService,
  ForumPostWithAuthor,
  ForumReplyWithAuthor,
} from "../services/forumService";
import { formatDistanceToNow } from "date-fns";
import ForumAttachments from "../components/ForumAttachments";
import ForumFileUpload from "../components/ForumFileUpload";
import { forumAttachmentService } from "../services/forumAttachmentService";
import NestedReply from "../components/NestedReply";

const PostDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();

  // State management
  const [post, setPost] = useState<ForumPostWithAuthor | null>(null);
  const [hierarchicalReplies, setHierarchicalReplies] = useState<ForumReply[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isAnonymousReply, setIsAnonymousReply] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [replyFileUploadStatus, setReplyFileUploadStatus] = useState<{
    [key: string]: "pending" | "uploading" | "completed" | "error";
  }>({});

  // Load post details
  const loadPost = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      setError(null);

      const [postData, repliesData] = await Promise.all([
        forumService.getForumPost(postId),
        forumService.getForumRepliesHierarchical(postId),
      ]);

      setPost(postData);
      setHierarchicalReplies(repliesData);
    } catch (err) {
      console.error("Error loading post:", err);
      setError("Failed to load post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit reply
  const submitReply = async () => {
    if (!replyContent.trim() || !postId) return;

    try {
      setIsSubmittingReply(true);
      setError(null);

      const newReply = await forumService.createForumReply(
        {
          postId: postId,
          content: replyContent,
          isAnonymous: isAnonymousReply,
        },
        user?.id
      );

      // Update local state
      if (post) {
        const replyWithAuthor: ForumReplyWithAuthor = {
          ...newReply,
          authorName: isAnonymousReply
            ? "Anonymous"
            : user
            ? `${user.firstName} ${user.lastName}`
            : "Unknown",
        };

        setPost({
          ...post,
          replies: [...post.replies, replyWithAuthor],
          replyCount: post.replyCount + 1,
        });
      }

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
          user?.id || "",
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
      setReplyDialogOpen(false);

      // Refresh hierarchical replies
      const updatedReplies = await forumService.getForumRepliesHierarchical(
        postId
      );
      setHierarchicalReplies(updatedReplies);
    } catch (err) {
      console.error("Error submitting reply:", err);
      setError("Failed to submit reply. Please try again.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Upvote post
  const upvotePost = async () => {
    if (!post) return;

    try {
      await forumService.upvotePost(post.id);
      setPost({ ...post, upvotes: post.upvotes + 1 });
    } catch (err) {
      console.error("Error upvoting post:", err);
    }
  };

  // Upvote reply
  const upvoteReply = async (replyId: string) => {
    if (!post) return;

    try {
      await forumService.upvoteReply(replyId);
      setPost({
        ...post,
        replies: post.replies.map((reply) =>
          reply.id === replyId
            ? { ...reply, upvotes: reply.upvotes + 1 }
            : reply
        ),
      });
    } catch (err) {
      console.error("Error upvoting reply:", err);
    }
  };

  // Load post when component mounts
  useEffect(() => {
    loadPost();
  }, [postId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!post) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Post not found or you don't have permission to view it.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/forum")}
          sx={{ mt: 2 }}
        >
          Back to Forum
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Back Button */}
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate("/forum")}
        sx={{ mb: 3 }}
      >
        Back to Forum
      </Button>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Post */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Post Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600, flex: 1 }}>
              {post.title}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Upvote">
                <IconButton onClick={upvotePost}>
                  <ThumbUp />
                </IconButton>
              </Tooltip>
              <Typography variant="h6" color="primary">
                {post.upvotes}
              </Typography>
            </Box>
          </Box>

          {/* Post Meta */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar>
                <Person />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                {post.authorName}
              </Typography>
              {post.isAnonymous && (
                <Tooltip title="Anonymous post">
                  <VisibilityOff fontSize="small" color="action" />
                </Tooltip>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatDistanceToNow(post.createdAt, { addSuffix: true })}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Comment fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {post.replyCount} replies
              </Typography>
            </Box>
          </Box>

          {/* Tags */}
          {post.tags.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
              {post.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  icon={<Tag />}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )}

          {/* Post Content */}
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              mb: 3,
            }}
          >
            {post.content}
          </Typography>

          {/* Post Attachments */}
          <ForumAttachments postId={post.id} />

          {/* Post Actions */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<Reply />}
              onClick={() => setReplyDialogOpen(true)}
            >
              Reply
            </Button>
            <Button variant="outlined" startIcon={<Share />}>
              Share
            </Button>
            <Button variant="outlined" startIcon={<Bookmark />}>
              Save
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Hierarchical Replies */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Replies ({hierarchicalReplies.length})
        </Typography>

        {hierarchicalReplies.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No replies yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Be the first to reply to this post!
              </Typography>
              <Button
                variant="contained"
                startIcon={<Reply />}
                onClick={() => setReplyDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Reply
              </Button>
            </CardContent>
          </Card>
        ) : (
          hierarchicalReplies.map((reply) => (
            <NestedReply
              key={reply.id}
              reply={reply}
              postId={postId}
              onReplyAdded={loadPost}
            />
          ))
        )}
      </Box>

      {/* Reply Dialog */}
      <Dialog
        open={replyDialogOpen}
        onClose={() => setReplyDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Reply to Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={6}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            sx={{ mt: 1 }}
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
                      <IconButton
                        size="small"
                        onClick={() => {
                          setReplyAttachments((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                          const newStatus = { ...replyFileUploadStatus };
                          delete newStatus[file.name];
                          setReplyFileUploadStatus(newStatus);
                        }}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
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
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={submitReply}
            variant="contained"
            disabled={isSubmittingReply || !replyContent.trim()}
          >
            {isSubmittingReply ? "Submitting..." : "Submit Reply"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PostDetailsPage;
