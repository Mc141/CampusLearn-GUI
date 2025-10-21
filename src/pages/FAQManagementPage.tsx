import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Fab,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import Collapse from "@mui/material/Collapse";
import {
  Help,
  Add,
  Edit,
  Delete,
  ExpandMore,
  Search,
  Category,
  TrendingUp,
  Visibility,
  VisibilityOff,
  ThumbUp,
  ThumbDown,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import {
  faqService,
  FAQ,
  CreateFAQData,
  UpdateFAQData,
  FAQStats,
} from "../services/faqService";

const FAQManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | false>(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [userFeedbackMap, setUserFeedbackMap] = useState<
    Record<string, "helpful" | "not_helpful" | null>
  >({});
  const [categories, setCategories] = useState<string[]>([]);
  const [stats, setStats] = useState<FAQStats>({
    totalFAQs: 0,
    publishedFAQs: 0,
    totalViews: 0,
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [newFAQ, setNewFAQ] = useState({
    question: "",
    answer: "",
    category: "",
    tags: [] as string[],
  });

  // Load FAQs and categories on component mount
  useEffect(() => {
    loadFAQs();
    loadCategories();
    loadStats();
  }, []);

  // Load FAQs when search or category filter changes
  useEffect(() => {
    loadFAQs();
  }, [searchTerm, selectedCategory]);

  const loadFAQs = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) setLoading(true);
      setError(null);

      const faqsData = await faqService.getFAQs({
        publishedOnly: false, // Show all FAQs for management
        category: selectedCategory || undefined,
        searchTerm: searchTerm || undefined,
      });

      setFaqs(faqsData);
      if (user) {
        const feedback = await faqService.getUserFeedbackForFaqs(
          faqsData.map((f) => f.id),
          user.id
        );
        setUserFeedbackMap(feedback);
      } else {
        setUserFeedbackMap({});
      }
    } catch (err) {
      console.error("Error loading FAQs:", err);
      setError("Failed to load FAQs. Please try again.");
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await faqService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await faqService.getFAQStats();
      setStats(statsData);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  const filteredFAQs = faqs; // No need for client-side filtering since we're doing it server-side

  const handleAddFAQ = async () => {
    try {
      const faqData: CreateFAQData = {
        question: newFAQ.question,
        answer: newFAQ.answer,
        category: newFAQ.category,
        tags: newFAQ.tags,
      isPublished: true,
    };

      await faqService.createFAQ(faqData);
      setSuccessMessage("FAQ created successfully!");
    setNewFAQ({ question: "", answer: "", category: "", tags: [] });
    setOpenDialog(false);
      loadFAQs(); // Reload FAQs
      loadStats(); // Reload stats
    } catch (err) {
      console.error("Error creating FAQ:", err);
      setError("Failed to create FAQ. Please try again.");
    }
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq);
    setNewFAQ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      tags: faq.tags,
    });
    setOpenDialog(true);
  };

  const handleUpdateFAQ = async () => {
    if (!editingFAQ) return;

    try {
      const updateData: UpdateFAQData = {
        question: newFAQ.question,
        answer: newFAQ.answer,
        category: newFAQ.category,
        tags: newFAQ.tags,
      };

      await faqService.updateFAQ(editingFAQ.id, updateData);
      setSuccessMessage("FAQ updated successfully!");
      setEditingFAQ(null);
      setNewFAQ({ question: "", answer: "", category: "", tags: [] });
      setOpenDialog(false);
      loadFAQs(); // Reload FAQs
      loadStats(); // Reload stats
    } catch (err) {
      console.error("Error updating FAQ:", err);
      setError("Failed to update FAQ. Please try again.");
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      await faqService.deleteFAQ(id);
      setSuccessMessage("FAQ deleted successfully!");
      loadFAQs(); // Reload FAQs
      loadStats(); // Reload stats
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      setError("Failed to delete FAQ. Please try again.");
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await faqService.togglePublishStatus(id);
      setSuccessMessage("FAQ publish status updated!");
      loadFAQs(); // Reload FAQs
      loadStats(); // Reload stats
    } catch (err) {
      console.error("Error toggling publish status:", err);
      setError("Failed to update publish status. Please try again.");
    }
  };

  const handleIncrementViews = async (id: string) => {
    try {
      // Debug: expanding FAQ (management)
      // eslint-disable-next-line no-console
      console.log("🔎 [Mgmt] Expanding FAQ (view increment attempt):", {
        faqId: id,
      });
      await faqService.incrementViews(id);
      // Optimistically bump local views
      setFaqs((prev) =>
        prev.map((f) => (f.id === id ? { ...f, views: (f.views || 0) + 1 } : f))
      );
    } catch (err) {
      console.error("Error incrementing views:", err);
    }
  };

  const handleIncrementHelpful = async (id: string) => {
    try {
      if (!user) return;
      // Debug: helpful click (management)
      // eslint-disable-next-line no-console
      console.log("👍 [Mgmt] Helpful click:", { faqId: id, userId: user.id });
      const prevSelection = userFeedbackMap[id] ?? null;
      setUserFeedbackMap((prev) => ({
        ...prev,
        [id]: prevSelection === "helpful" ? null : "helpful",
      }));
      setFaqs((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          let helpful = f.helpful || 0;
          let notHelpful = f.notHelpful || 0;
          if (prevSelection === "helpful") {
            helpful = Math.max(0, helpful - 1);
          } else if (prevSelection === "not_helpful") {
            helpful += 1;
            notHelpful = Math.max(0, notHelpful - 1);
          } else {
            helpful += 1;
          }
          return { ...f, helpful, notHelpful };
        })
      );
      const result = await faqService.submitFeedback(id, user.id, true);
      setSuccessMessage("Thank you for your feedback!");
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, helpful: result.helpful, notHelpful: result.notHelpful }
            : f
        )
      );
      setUserFeedbackMap((prev) => ({ ...prev, [id]: result.userFeedback }));
    } catch (err) {
      console.error("Error incrementing helpful:", err);
      setError("Failed to record feedback. Please try again.");
    }
  };

  const handleIncrementNotHelpful = async (id: string) => {
    try {
      if (!user) return;
      // Debug: not helpful click (management)
      // eslint-disable-next-line no-console
      console.log("👎 [Mgmt] Not Helpful click:", {
        faqId: id,
        userId: user.id,
      });
      const prevSelection = userFeedbackMap[id] ?? null;
      setUserFeedbackMap((prev) => ({
        ...prev,
        [id]: prevSelection === "not_helpful" ? null : "not_helpful",
      }));
      setFaqs((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          let helpful = f.helpful || 0;
          let notHelpful = f.notHelpful || 0;
          if (prevSelection === "not_helpful") {
            notHelpful = Math.max(0, notHelpful - 1);
          } else if (prevSelection === "helpful") {
            notHelpful += 1;
            helpful = Math.max(0, helpful - 1);
          } else {
            notHelpful += 1;
          }
          return { ...f, helpful, notHelpful };
        })
      );
      const result = await faqService.submitFeedback(id, user.id, false);
      setSuccessMessage("Thank you for your feedback!");
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, helpful: result.helpful, notHelpful: result.notHelpful }
            : f
        )
      );
      setUserFeedbackMap((prev) => ({ ...prev, [id]: result.userFeedback }));
    } catch (err) {
      console.error("Error incrementing not helpful:", err);
      setError("Failed to record feedback. Please try again.");
    }
  };

  const renderFAQList = () => (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
          sx={{ minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : filteredFAQs.length === 0 ? (
        <Box textAlign="center" p={4}>
          <Typography variant="h6" color="text.secondary">
            No FAQs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || selectedCategory
              ? "Try adjusting your search criteria"
              : "No FAQs have been created yet"}
          </Typography>
        </Box>
      ) : (
        filteredFAQs.map((faq) => (
        <Accordion
          key={faq.id}
          expanded={expandedFAQ === faq.id}
            onChange={(_, isExpanded) => {
              setExpandedFAQ(isExpanded ? faq.id : false);
              if (isExpanded) {
                handleIncrementViews(faq.id); // Track views when FAQ is opened
              }
            }}
            TransitionComponent={Collapse}
            TransitionProps={{
              timeout: 300,
              easing: {
                enter: "cubic-bezier(0.4, 0, 0.2, 1)",
                exit: "cubic-bezier(0.4, 0, 0.2, 1)",
              },
            }}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
              <Box
                sx={{ display: "flex", alignItems: "center", width: "100%" }}
              >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {faq.question}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Chip label={faq.category} size="small" color="primary" />
                  <Chip
                    label={faq.isPublished ? "Published" : "Draft"}
                    size="small"
                    color={faq.isPublished ? "success" : "default"}
                  />
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 1, mr: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {faq.views} views
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {faq.helpful} helpful
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {faq.answer}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
              {faq.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>

              {/* Feedback buttons for all users */}
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Button
                  size="small"
                  startIcon={<ThumbUp />}
                  onClick={() => handleIncrementHelpful(faq.id)}
                  color="success"
                  variant={
                    userFeedbackMap[faq.id] === "helpful"
                      ? "contained"
                      : "outlined"
                  }
                >
                  Helpful ({faq.helpful})
                </Button>
                <Button
                  size="small"
                  startIcon={<ThumbDown />}
                  onClick={() => handleIncrementNotHelpful(faq.id)}
                  color="error"
                  variant={
                    userFeedbackMap[faq.id] === "not_helpful"
                      ? "contained"
                      : "outlined"
                  }
                >
                  Not Helpful ({faq.notHelpful})
                </Button>
              </Box>

              {/* Management buttons for admins and tutors */}
            {(user?.role === "admin" || user?.role === "tutor") && (
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => handleEditFAQ(faq)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  startIcon={
                    faq.isPublished ? <VisibilityOff /> : <Visibility />
                  }
                  onClick={() => handleTogglePublish(faq.id)}
                >
                  {faq.isPublished ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleDeleteFAQ(faq.id)}
                >
                  Delete
                </Button>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
        ))
      )}
    </Box>
  );

  const renderDialog = () => (
    <Dialog
      open={openDialog}
      onClose={() => setOpenDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>{editingFAQ ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Question"
          value={newFAQ.question}
          onChange={(e) =>
            setNewFAQ((prev) => ({ ...prev, question: e.target.value }))
          }
          sx={{ mb: 2 }}
          multiline
          rows={2}
        />
        <TextField
          fullWidth
          label="Answer"
          value={newFAQ.answer}
          onChange={(e) =>
            setNewFAQ((prev) => ({ ...prev, answer: e.target.value }))
          }
          sx={{ mb: 2 }}
          multiline
          rows={4}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={newFAQ.category}
            onChange={(e) =>
              setNewFAQ((prev) => ({ ...prev, category: e.target.value }))
            }
            label="Category"
          >
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Tags (comma-separated)"
          value={newFAQ.tags.join(", ")}
          onChange={(e) =>
            setNewFAQ((prev) => ({
              ...prev,
              tags: e.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag),
            }))
          }
          placeholder="e.g., registration, tutor, application"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
        <Button
          onClick={editingFAQ ? handleUpdateFAQ : handleAddFAQ}
          variant="contained"
        >
          {editingFAQ ? "Update" : "Add"} FAQ
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
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
          FAQ Management ❓
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.1rem" }}
        >
          Manage frequently asked questions and help content
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Help color="primary" sx={{ mr: 1, verticalAlign: "middle" }} />
                Total FAQs
              </Typography>
              <Typography variant="h4" color="primary">
                {stats.totalFAQs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Visibility
                  color="success"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                Published
              </Typography>
              <Typography variant="h4" color="success">
                {stats.publishedFAQs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUp
                  color="secondary"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                Total Views
              </Typography>
              <Typography variant="h4" color="secondary">
                {stats.totalViews}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Category
                  color="info"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                Categories
              </Typography>
              <Typography variant="h4" color="info">
                {stats.categories.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent sx={{ p: 3 }}>{renderFAQList()}</CardContent>
      </Card>

      {(user?.role === "admin" || user?.role === "tutor") && (
        <Fab
          color="primary"
          sx={{ position: "fixed", bottom: 16, right: 16 }}
          onClick={() => {
            setEditingFAQ(null);
            setNewFAQ({ question: "", answer: "", category: "", tags: [] });
            setOpenDialog(true);
          }}
        >
          <Add />
        </Fab>
      )}

      {renderDialog()}

      {/* Success message snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
};

export default FAQManagementPage;
