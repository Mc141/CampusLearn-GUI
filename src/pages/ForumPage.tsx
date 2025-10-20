import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Search,
  Add,
  Sort,
  TrendingUp,
  ThumbUp,
  Comment,
  Person,
  VisibilityOff,
  MoreVert,
  FilterList,
  Tag,
  Delete,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { forumService, ForumPostWithAuthor } from "../services/forumService";
import { formatDistanceToNow } from "date-fns";
import ForumFileUpload from "../components/ForumFileUpload";
import {
  ForumAttachment,
  forumAttachmentService,
} from "../services/forumAttachmentService";

const ForumPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [posts, setPosts] = useState<ForumPostWithAuthor[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<ForumPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "most_voted" | "trending"
  >("newest");

  // UI state
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [postAttachments, setPostAttachments] = useState<File[]>([]);
  const [fileUploadStatus, setFileUploadStatus] = useState<{
    [key: string]: "pending" | "uploading" | "completed" | "error";
  }>({});

  // Load forum posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const [postsData, trendingData] = await Promise.all([
        forumService.getForumPosts(currentPage, 20, sortBy),
        forumService.getTrendingPosts(5),
      ]);

      setPosts(postsData);
      setTrendingPosts(trendingData);
    } catch (err) {
      console.error("Error loading forum posts:", err);
      setError("Failed to load forum posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Search posts
  const searchPosts = async () => {
    if (!searchQuery.trim()) {
      loadPosts();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const searchResults = await forumService.searchForumPosts(
        searchQuery,
        currentPage,
        20
      );
      setPosts(searchResults);
    } catch (err) {
      console.error("Error searching posts:", err);
      setError("Failed to search posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Create new post
  const createPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setError("Please fill in both title and content.");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const tags = newPostTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const newPost = await forumService.createForumPost(
        {
          title: newPostTitle,
          content: newPostContent,
          isAnonymous: isAnonymous,
          tags: tags,
        },
        user?.id
      );

      // Handle attachments if any were uploaded
      if (postAttachments.length > 0 && newPost.id) {
        // Update file status to uploading
        const newStatus = { ...fileUploadStatus };
        postAttachments.forEach((file) => {
          newStatus[file.name] = "uploading";
        });
        setFileUploadStatus(newStatus);

        // Upload files to the created post
        await forumAttachmentService.uploadFilesToPost(
          newPost.id,
          postAttachments,
          user?.id || "",
          (progress) => {
            console.log(
              `Upload progress for ${progress.fileName}: ${progress.progress}%`
            );
            // Update status based on progress
            if (progress.status === "completed") {
              setFileUploadStatus((prev) => ({
                ...prev,
                [progress.fileName]: "completed",
              }));
            } else if (progress.status === "error") {
              setFileUploadStatus((prev) => ({
                ...prev,
                [progress.fileName]: "error",
              }));
            }
          }
        );
      }

      // Reset form
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostTags("");
      setIsAnonymous(false);
      setPostAttachments([]);
      setFileUploadStatus({});
      setCreatePostDialogOpen(false);

      // Reload posts
      await loadPosts();
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle vote for post
  const togglePostVote = async (postId: string) => {
    if (!user?.id) return;

    try {
      const result = await forumService.togglePostVote(postId, user.id);
      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, upvotes: result.voteCount } : post
        )
      );
    } catch (err) {
      console.error("Error toggling post vote:", err);
    }
  };

  // Handle sort change
  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(1);
    setSortMenuAnchor(null);
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    searchPosts();
  };

  // Load posts when component mounts or dependencies change
  useEffect(() => {
    loadPosts();
  }, [currentPage, sortBy]);

  // Handle enter key in search
  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const sortOptions = [
    { value: "newest", label: "Newest First", icon: <Sort /> },
    { value: "oldest", label: "Oldest First", icon: <Sort /> },
    { value: "most_voted", label: "Most Upvoted", icon: <ThumbUp /> },
    { value: "trending", label: "Trending", icon: <TrendingUp /> },
  ];

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
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Public Forum
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreatePostDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          New Post
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Search and Sort Bar */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                fullWidth
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleSearch}
                sx={{ minWidth: 100 }}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<Sort />}
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                sx={{ minWidth: 120 }}
              >
                {sortOptions.find((opt) => opt.value === sortBy)?.label}
              </Button>
            </Box>
          </Paper>

          {/* Sort Menu */}
          <Menu
            anchorEl={sortMenuAnchor}
            open={Boolean(sortMenuAnchor)}
            onClose={() => setSortMenuAnchor(null)}
          >
            {sortOptions.map((option) => (
              <MenuItem
                key={option.value}
                onClick={() => handleSortChange(option.value as typeof sortBy)}
                selected={sortBy === option.value}
              >
                <ListItemIcon>{option.icon}</ListItemIcon>
                <ListItemText>{option.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>

          {/* Posts List */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No posts found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Be the first to start a discussion!"}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card
                key={post.id}
                sx={{ mb: 2, cursor: "pointer" }}
                onClick={() => navigate(`/forum/post/${post.id}`)}
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
                    <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                      {post.title}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Tooltip title="Like">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePostVote(post.id);
                          }}
                        >
                          <ThumbUp fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="body2" color="text.secondary">
                        {post.upvotes}
                      </Typography>
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
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
                              icon={<Tag />}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ))}
                          {post.tags.length > 2 && (
                            <Chip
                              label={`+${post.tags.length - 2}`}
                              size="small"
                              variant="outlined"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Trending Posts */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <TrendingUp color="primary" />
                Trending Posts
              </Typography>
              {trendingPosts.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No trending posts yet
                </Typography>
              ) : (
                trendingPosts.map((post, index) => (
                  <Box
                    key={post.id}
                    sx={{
                      py: 1,
                      cursor: "pointer",
                      "&:hover": { backgroundColor: "action.hover" },
                      borderRadius: 1,
                      px: 1,
                      mb: 1,
                    }}
                    onClick={() => navigate(`/forum/post/${post.id}`)}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, mb: 0.5 }}
                    >
                      {post.title}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {post.authorName}
                      </Typography>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <ThumbUp fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {post.upvotes}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>

          {/* Forum Guidelines */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Forum Guidelines
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Be respectful and constructive
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Use descriptive titles
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • Add relevant tags
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                • You can post anonymously
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Help others when you can
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Post Dialog */}
      <Dialog
        open={createPostDialogOpen}
        onClose={() => setCreatePostDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Post Title"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            placeholder="What's your question or topic?"
          />

          <TextField
            fullWidth
            label="Content"
            multiline
            rows={6}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Describe your question or share your thoughts..."
          />

          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={newPostTags}
            onChange={(e) => setNewPostTags(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="e.g., programming, math, assignment"
            helperText="Add relevant tags to help others find your post"
          />

          {/* File Upload */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Attach Files (Optional)
            </Typography>
            <ForumFileUpload
              userId={user?.id || ""}
              onFilesUploaded={(files) => {
                setPostAttachments((prev) => {
                  const newFiles = [...prev, ...files];
                  // Update file status for new files
                  const newStatus = { ...fileUploadStatus };
                  files.forEach((file) => {
                    newStatus[file.name] = "pending";
                  });
                  setFileUploadStatus(newStatus);
                  return newFiles;
                });
              }}
              disabled={isCreating}
            />
          </Box>

          {/* Attached Files List */}
          {postAttachments.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Attached Files ({postAttachments.length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                {postAttachments.map((file, index) => (
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
                      {fileUploadStatus[file.name] === "pending" && (
                        <Chip
                          label="Ready"
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      )}
                      {fileUploadStatus[file.name] === "uploading" && (
                        <Chip
                          label="Uploading..."
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {fileUploadStatus[file.name] === "completed" && (
                        <Chip
                          label="Uploaded"
                          size="small"
                          color="success"
                          variant="filled"
                        />
                      )}
                      {fileUploadStatus[file.name] === "error" && (
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
                          setPostAttachments((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                          const newStatus = { ...fileUploadStatus };
                          delete newStatus[file.name];
                          setFileUploadStatus(newStatus);
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
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            }
            label="Post anonymously"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePostDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={createPost}
            variant="contained"
            disabled={
              isCreating || !newPostTitle.trim() || !newPostContent.trim()
            }
          >
            {isCreating ? "Creating..." : "Create Post"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForumPage;
