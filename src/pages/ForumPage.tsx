import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Paper,
  Divider,
  Grid,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
  Badge,
} from "@mui/material";
import {
  Add,
  ThumbUp,
  Reply,
  Person,
  Visibility,
  TrendingUp,
  FilterList,
  Search,
  PersonOff,
  School,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockForumPosts } from "../data/mockData";

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const ForumPage: React.FC = () => {
  const { user } = useAuth();
  const [posts] = useState(mockForumPosts);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    isAnonymous: true,
    tags: [] as string[],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = Array.from(new Set(posts.flatMap((post) => post.tags)));

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => post.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const trendingPosts = [...posts]
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 5);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreatePost = () => {
    // In a real app, this would save to backend
    console.log("Creating post:", newPost);
    setOpenDialog(false);
    setNewPost({ title: "", content: "", isAnonymous: true, tags: [] });
  };

  const handleUpvote = (postId: string) => {
    // In a real app, this would update the backend
    console.log("Upvoting post:", postId);
  };

  const handleReply = (postId: string) => {
    // In a real app, this would open a reply dialog
    console.log("Replying to post:", postId);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Public Forum 💬
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: "1.1rem" }}
            >
              Join the conversation and share your thoughts
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            New Post
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "text.secondary" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {allTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Main Forum Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="All Posts" />
                  <Tab label="Trending" />
                  <Tab label="Recent" />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
                <List>
                  {filteredPosts.map((post, index) => (
                    <React.Fragment key={post.id}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <ListItemIcon>
                          {post.isAnonymous ? (
                            <PersonOff color="action" />
                          ) : (
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {post.authorId ? "U" : "A"}
                            </Avatar>
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <span
                                style={{ fontWeight: 500, fontSize: "1.25rem" }}
                              >
                                {post.title}
                              </span>
                              {post.isModerated && (
                                <Chip
                                  label="Moderated"
                                  size="small"
                                  color="warning"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <div
                                style={{
                                  fontSize: "0.875rem",
                                  color: "inherit",
                                  opacity: 0.7,
                                  marginBottom: "8px",
                                }}
                              >
                                {post.content}
                              </div>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                  mb: 1,
                                }}
                              >
                                {post.tags.map((tag) => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {post.createdAt.toLocaleDateString()}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => handleUpvote(post.id)}
                                  >
                                    <ThumbUp fontSize="small" />
                                  </IconButton>
                                  <Typography variant="caption">
                                    {post.upvotes}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => handleReply(post.id)}
                                  >
                                    <Reply fontSize="small" />
                                  </IconButton>
                                  <Typography variant="caption">
                                    {post.replies.length}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < filteredPosts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <List>
                  {trendingPosts.map((post, index) => (
                    <React.Fragment key={post.id}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <ListItemIcon>
                          <TrendingUp color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <span
                                style={{ fontWeight: 500, fontSize: "1.25rem" }}
                              >
                                {post.title}
                              </span>
                              <Chip
                                label={`${post.upvotes} upvotes`}
                                size="small"
                                color="warning"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <div
                                style={{
                                  fontSize: "0.875rem",
                                  color: "inherit",
                                  opacity: 0.7,
                                  marginBottom: "8px",
                                }}
                              >
                                {post.content}
                              </div>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                {post.tags.map((tag) => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < trendingPosts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <List>
                  {[...filteredPosts]
                    .sort(
                      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                    )
                    .map((post, index) => (
                      <React.Fragment key={post.id}>
                        <ListItem sx={{ px: 0, py: 2 }}>
                          <ListItemIcon>
                            <Visibility color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {post.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {post.createdAt.toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <div
                                  style={{
                                    fontSize: "0.875rem",
                                    color: "rgba(0, 0, 0, 0.6)",
                                    marginBottom: "8px",
                                  }}
                                >
                                  {post.content}
                                </div>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {post.tags.map((tag) => (
                                    <Chip
                                      key={tag}
                                      label={tag}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < filteredPosts.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                </List>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Forum Stats
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Total Posts</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {posts.length}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Active Users</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    156
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">Today's Posts</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    12
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Popular Tags
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {allTags.slice(0, 10).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* New Post Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={newPost.title}
            onChange={(e) =>
              setNewPost((prev) => ({ ...prev, title: e.target.value }))
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Content"
            multiline
            rows={4}
            value={newPost.content}
            onChange={(e) =>
              setNewPost((prev) => ({ ...prev, content: e.target.value }))
            }
            margin="normal"
            required
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newPost.isAnonymous}
                onChange={(e) =>
                  setNewPost((prev) => ({
                    ...prev,
                    isAnonymous: e.target.checked,
                  }))
                }
              />
            }
            label="Post anonymously"
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tags (click to add/remove)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant={newPost.tags.includes(tag) ? "filled" : "outlined"}
                  onClick={() => {
                    setNewPost((prev) => ({
                      ...prev,
                      tags: prev.tags.includes(tag)
                        ? prev.tags.filter((t) => t !== tag)
                        : [...prev.tags, tag],
                    }));
                  }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreatePost} variant="contained">
            Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForumPage;
