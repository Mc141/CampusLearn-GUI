import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import {
  VisibilityOff,
  Visibility,
  Delete,
  Edit,
  Person,
  Comment,
  ThumbUp,
  Flag,
  AdminPanelSettings,
  Refresh,
  Search,
  ArrowBack,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  forumService,
  ForumPostWithAuthor,
  ForumReplyWithAuthor,
} from "../services/forumService";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "../lib/supabase";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`moderation-tabpanel-${index}`}
      aria-labelledby={`moderation-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ForumModerationPage: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState<ForumPostWithAuthor[]>([]);
  const [moderatedPosts, setModeratedPosts] = useState<ForumPostWithAuthor[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Post details view state
  const [selectedPost, setSelectedPost] = useState<ForumPostWithAuthor | null>(
    null
  );
  const [postReplies, setPostReplies] = useState<ForumReplyWithAuthor[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Moderation dialog state
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    ForumPostWithAuthor | ForumReplyWithAuthor | null
  >(null);
  const [moderationReason, setModerationReason] = useState("");
  const [isModerating, setIsModerating] = useState(false);

  // Load all posts (including moderated ones)
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all posts (including moderated ones)
      const { data: allPosts, error: postsError } = await supabase
        .from("forum_posts")
        .select(
          `
          *,
          author:users(first_name, last_name),
          replies:forum_replies(count)
        `
        )
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      const postsData = allPosts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        authorId: post.author_id,
        isAnonymous: post.is_anonymous,
        createdAt: new Date(post.created_at),
        upvotes: post.upvotes || 0,
        tags: post.tags || [],
        isModerated: post.is_moderated,
        authorName: post.is_anonymous
          ? "Anonymous"
          : post.author
          ? `${post.author.first_name} ${post.author.last_name}`
          : "Unknown",
        replyCount: post.replies?.[0]?.count || 0,
        replies: [],
      }));

      // Separate moderated and non-moderated posts
      const activePosts = postsData.filter((post) => !post.isModerated);
      const moderatedPostsData = postsData.filter((post) => post.isModerated);

      setPosts(activePosts);
      setModeratedPosts(moderatedPostsData);
    } catch (err) {
      console.error("Error loading posts for moderation:", err);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Moderate a post (hide/show)
  const moderatePost = async (
    postId: string,
    isModerated: boolean,
    reason?: string
  ) => {
    try {
      setIsModerating(true);
      setError(null);

      await forumService.moderatePost(postId, isModerated);

      // Update local state
      if (isModerated) {
        // Move from active to moderated
        const postToModerate = posts.find((p) => p.id === postId);
        if (postToModerate) {
          setPosts((prev) => prev.filter((p) => p.id !== postId));
          setModeratedPosts((prev) => [
            ...prev,
            { ...postToModerate, isModerated: true },
          ]);
        }
      } else {
        // Move from moderated to active
        const postToRestore = moderatedPosts.find((p) => p.id === postId);
        if (postToRestore) {
          setModeratedPosts((prev) => prev.filter((p) => p.id !== postId));
          setPosts((prev) => [
            ...prev,
            { ...postToRestore, isModerated: false },
          ]);
        }
      }

      setModerationDialogOpen(false);
      setSelectedItem(null);
      setModerationReason("");
    } catch (err) {
      console.error("Error moderating post:", err);
      setError("Failed to moderate post. Please try again.");
    } finally {
      setIsModerating(false);
    }
  };

  // Moderate a reply (hide/show)
  const moderateReply = async (
    replyId: string,
    isModerated: boolean,
    reason?: string
  ) => {
    try {
      setIsModerating(true);
      setError(null);

      await forumService.moderateReply(replyId, isModerated);

      // Update local state for replies
      setPostReplies((prevReplies) =>
        prevReplies.map((reply) =>
          reply.id === replyId ? { ...reply, isModerated: isModerated } : reply
        )
      );

      setModerationDialogOpen(false);
      setSelectedItem(null);
      setModerationReason("");
    } catch (err) {
      console.error("Error moderating reply:", err);
      setError("Failed to moderate reply. Please try again.");
    } finally {
      setIsModerating(false);
    }
  };

  // Open moderation dialog
  const openModerationDialog = (
    item: ForumPostWithAuthor | ForumReplyWithAuthor,
    action: "hide" | "show"
  ) => {
    console.log(
      "Opening moderation dialog for:",
      item.title || "Reply",
      "Action:",
      action
    );
    console.log("Setting moderationDialogOpen to true");
    setSelectedItem(item);
    setModerationDialogOpen(true);
    setModerationReason("");
  };

  // Handle moderation action
  const handleModerationAction = () => {
    if (!selectedItem) {
      console.log("No selected item for moderation");
      return;
    }

    console.log(
      "Handling moderation action for:",
      selectedItem.title || "Reply"
    );
    const isModerated = selectedItem.isModerated;
    const action = isModerated ? false : true; // Toggle moderation state

    if ("postId" in selectedItem) {
      // It's a reply
      console.log("Moderating reply:", selectedItem.id, "Action:", action);
      moderateReply(selectedItem.id, action, moderationReason);
    } else {
      // It's a post
      console.log("Moderating post:", selectedItem.id, "Action:", action);
      moderatePost(selectedItem.id, action, moderationReason);
    }
  };

  // Load replies for a specific post
  const loadPostReplies = async (postId: string) => {
    try {
      setLoadingReplies(true);
      setError(null);

      console.log("Loading replies for post:", postId);

      const { data: replies, error: repliesError } = await supabase
        .from("forum_replies")
        .select(
          `
          *,
          author:users(first_name, last_name)
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (repliesError) throw repliesError;

      console.log("Replies loaded:", replies);

      const repliesData = replies.map((reply) => ({
        id: reply.id,
        postId: reply.post_id,
        content: reply.content,
        authorId: reply.author_id,
        isAnonymous: reply.is_anonymous,
        createdAt: new Date(reply.created_at),
        upvotes: reply.upvotes || 0,
        isModerated: reply.is_moderated,
        authorName: reply.is_anonymous
          ? "Anonymous"
          : reply.author
          ? `${reply.author.first_name} ${reply.author.last_name}`
          : "Unknown",
      }));

      console.log("Processed replies:", repliesData);
      setPostReplies(repliesData);
    } catch (err) {
      console.error("Error loading post replies:", err);
      setError("Failed to load replies. Please try again.");
    } finally {
      setLoadingReplies(false);
    }
  };

  // Handle post selection to view replies
  const handlePostClick = async (post: ForumPostWithAuthor) => {
    console.log("Post clicked:", post.title);
    setSelectedPost(post);
    await loadPostReplies(post.id);
  };

  // Go back to posts list
  const handleBackToList = () => {
    setSelectedPost(null);
    setPostReplies([]);
  };

  // Load posts when component mounts
  useEffect(() => {
    loadPosts();
  }, []);

  // Filter posts based on search
  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModeratedPosts = moderatedPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If a post is selected, show post details with replies
  if (selectedPost) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Header with Back Button */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handleBackToList}
            >
              Back to Posts
            </Button>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AdminPanelSettings color="primary" />
              Post Moderation
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => loadPostReplies(selectedPost.id)}
            disabled={loadingReplies}
          >
            Refresh Replies
          </Button>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Post Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, flex: 1 }}>
                {selectedPost.title}
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {selectedPost.isModerated && (
                  <Chip label="MODERATED" color="error" size="small" />
                )}
                <Tooltip
                  title={
                    selectedPost.isModerated ? "Restore Post" : "Hide Post"
                  }
                >
                  <IconButton
                    color={selectedPost.isModerated ? "success" : "error"}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log(
                        "Post moderation button clicked:",
                        selectedPost.id
                      );
                      openModerationDialog(
                        selectedPost,
                        selectedPost.isModerated ? "show" : "hide"
                      );
                    }}
                  >
                    {selectedPost.isModerated ? (
                      <Visibility />
                    ) : (
                      <VisibilityOff />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar>
                  <Person />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {selectedPost.authorName}
                </Typography>
                {selectedPost.isAnonymous && (
                  <Tooltip title="Anonymous post">
                    <VisibilityOff fontSize="small" color="action" />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formatDistanceToNow(selectedPost.createdAt, {
                  addSuffix: true,
                })}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <ThumbUp fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {selectedPost.upvotes}
                </Typography>
              </Box>
            </Box>

            {selectedPost.tags.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
                {selectedPost.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            )}

            <Typography
              variant="body1"
              sx={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                mb: 3,
              }}
            >
              {selectedPost.content}
            </Typography>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Replies ({postReplies.length})
        </Typography>

        {loadingReplies ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : postReplies.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No replies yet
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <List>
            {postReplies.map((reply, index) => (
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
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
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
                          {reply.isModerated && (
                            <Chip
                              label="MODERATED"
                              color="error"
                              size="small"
                            />
                          )}
                          <Tooltip
                            title={
                              reply.isModerated ? "Restore Reply" : "Hide Reply"
                            }
                          >
                            <IconButton
                              size="small"
                              color={reply.isModerated ? "success" : "error"}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(
                                  "Reply moderation button clicked:",
                                  reply.id
                                );
                                openModerationDialog(
                                  reply,
                                  reply.isModerated ? "show" : "hide"
                                );
                              }}
                            >
                              {reply.isModerated ? (
                                <Visibility />
                              ) : (
                                <VisibilityOff />
                              )}
                            </IconButton>
                          </Tooltip>
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
                            opacity: reply.isModerated ? 0.6 : 1,
                          }}
                        >
                          {reply.content}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(reply.createdAt, {
                              addSuffix: true,
                            })}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <ThumbUp fontSize="small" color="action" />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {reply.upvotes}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < postReplies.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Moderation Dialog - Always rendered */}
        <Dialog
          open={moderationDialogOpen}
          onClose={() => setModerationDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {selectedItem?.isModerated ? "Restore Post" : "Moderate Post"}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {selectedItem?.isModerated
                ? "Are you sure you want to restore this post? It will become visible to all users again."
                : "Are you sure you want to hide this post? It will no longer be visible to regular users."}
            </Typography>

            {selectedItem && (
              <Box sx={{ mb: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {"postId" in selectedItem ? "Reply" : "Post"}:{" "}
                  {selectedItem.title || "Reply"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {selectedItem.content.substring(0, 100)}...
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for moderation (optional)"
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              placeholder="Explain why this content is being moderated..."
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModerationDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleModerationAction}
              variant="contained"
              color={selectedItem?.isModerated ? "success" : "error"}
              disabled={isModerating}
            >
              {isModerating
                ? "Processing..."
                : selectedItem?.isModerated
                ? "Restore"
                : "Hide Post"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // Default view: Posts list
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AdminPanelSettings color="primary" />
          Forum Moderation
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadPosts}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search posts by title, content, or author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
        />
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab
            label={
              <Badge badgeContent={filteredPosts.length} color="primary">
                Active Posts
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={filteredModeratedPosts.length} color="error">
                Moderated Posts
              </Badge>
            }
          />
        </Tabs>
      </Box>

      {/* Active Posts Tab */}
      <TabPanel value={activeTab} index={0}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No active posts found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "All posts are currently moderated"}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredPosts.map((post) => (
              <Grid item xs={12} key={post.id}>
                <Card
                  sx={{ cursor: "pointer" }}
                  onClick={() => handlePostClick(post)}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, flex: 1 }}
                      >
                        {post.title}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Hide Post">
                          <IconButton
                            color="error"
                            onClick={() => openModerationDialog(post, "hide")}
                          >
                            <VisibilityOff />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.content}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <Person fontSize="small" />
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
                          {formatDistanceToNow(post.createdAt, {
                            addSuffix: true,
                          })}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <ThumbUp fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {post.upvotes}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Comment fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {post.replyCount}
                          </Typography>
                        </Box>
                        {post.tags.length > 0 && (
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {post.tags.slice(0, 2).map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Moderated Posts Tab */}
      <TabPanel value={activeTab} index={1}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredModeratedPosts.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No moderated posts found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "No posts have been moderated yet"}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredModeratedPosts.map((post) => (
              <Grid item xs={12} key={post.id}>
                <Card
                  sx={{
                    opacity: 0.7,
                    border: "2px solid",
                    borderColor: "error.main",
                    cursor: "pointer",
                  }}
                  onClick={() => handlePostClick(post)}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, flex: 1 }}
                      >
                        {post.title}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip label="MODERATED" color="error" size="small" />
                        <Tooltip title="Restore Post">
                          <IconButton
                            color="success"
                            onClick={() => openModerationDialog(post, "show")}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.content}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <Person fontSize="small" />
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
                          {formatDistanceToNow(post.createdAt, {
                            addSuffix: true,
                          })}
                        </Typography>
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <ThumbUp fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {post.upvotes}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Comment fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {post.replyCount}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>

      {/* Moderation Dialog - Always rendered */}
      <Dialog
        open={moderationDialogOpen}
        onClose={() => setModerationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedItem?.isModerated ? "Restore Post" : "Moderate Post"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {selectedItem?.isModerated
              ? "Are you sure you want to restore this post? It will become visible to all users again."
              : "Are you sure you want to hide this post? It will no longer be visible to regular users."}
          </Typography>

          {selectedItem && (
            <Box sx={{ mb: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {"postId" in selectedItem ? "Reply" : "Post"}:{" "}
                {selectedItem.title || "Reply"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {selectedItem.content.substring(0, 100)}...
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for moderation (optional)"
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            placeholder="Explain why this content is being moderated..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModerationDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleModerationAction}
            variant="contained"
            color={selectedItem?.isModerated ? "success" : "error"}
            disabled={isModerating}
          >
            {isModerating
              ? "Processing..."
              : selectedItem?.isModerated
              ? "Restore"
              : "Hide Post"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForumModerationPage;
