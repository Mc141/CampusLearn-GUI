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
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  forumService,
  ForumPostWithAuthor,
  ForumReplyWithAuthor,
} from "../services/forumService";
import { formatDistanceToNow } from "date-fns";

const PostDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();

  // State management
  const [post, setPost] = useState<ForumPostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isAnonymousReply, setIsAnonymousReply] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);

  // Load post details
  const loadPost = async () => {
    if (!postId) return;

    try {
      setLoading(true);
      setError(null);

      const postData = await forumService.getForumPost(postId);
      setPost(postData);
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

      // Reset form
      setReplyContent("");
      setIsAnonymousReply(false);
      setReplyDialogOpen(false);
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

      {/* Replies Section */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        Replies ({post.replies.length})
      </Typography>

      {post.replies.length === 0 ? (
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
        <List>
          {post.replies.map((reply, index) => (
            <React.Fragment key={reply.id}>
              <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {reply.authorName}
                        {reply.isAnonymous && (
                          <Tooltip title="Anonymous reply">
                            <VisibilityOff
                              fontSize="small"
                              color="action"
                              sx={{ ml: 1 }}
                            />
                          </Tooltip>
                        )}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Tooltip title="Upvote">
                          <IconButton
                            size="small"
                            onClick={() => upvoteReply(reply.id)}
                          >
                            <ThumbUp fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {reply.upvotes}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box>
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
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(reply.createdAt, {
                          addSuffix: true,
                        })}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < post.replies.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      )}

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
