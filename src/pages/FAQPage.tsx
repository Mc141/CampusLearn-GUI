import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Chip,
  InputAdornment,
} from "@mui/material";
import Collapse from "@mui/material/Collapse";
import {
  ExpandMore,
  Search,
  ThumbUp,
  ThumbDown,
  Help,
} from "@mui/icons-material";
import { faqService, FAQ } from "../services/faqService";
import { useAuth } from "../context/AuthContext";

const FAQPage: React.FC = () => {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [userFeedbackMap, setUserFeedbackMap] = useState<
    Record<string, "helpful" | "not_helpful" | null>
  >({});
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | false>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load FAQs and categories on component mount
  useEffect(() => {
    loadFAQs();
    loadCategories();
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
        publishedOnly: true, // Only show published FAQs for public view
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

  const handleIncrementViews = async (id: string) => {
    // Debug: expanding FAQ
    // eslint-disable-next-line no-console
    console.log("🔎 Expanding FAQ (view increment attempt):", { faqId: id });
    // Optimistically bump local views immediately
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, views: (f.views || 0) + 1 } : f))
    );
    // Fire-and-forget RPC so transition is not blocked
    faqService
      .incrementViews(id)
      .catch((err) => console.error("Error incrementing views:", err));
  };

  const handleIncrementHelpful = async (id: string) => {
    if (!user) return;
    // Debug: helpful click
    // eslint-disable-next-line no-console
    console.log("👍 Helpful click:", { faqId: id, userId: user.id });
    const prevSelection = userFeedbackMap[id] ?? null;
    // Optimistic selection
    setUserFeedbackMap((prev) => ({
      ...prev,
      [id]: prevSelection === "helpful" ? null : "helpful",
    }));
    // Optimistic counts
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
    try {
      const result = await faqService.submitFeedback(id, user.id, true);
      // Reconcile with server
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
      // Revert optimistic change on error
      setUserFeedbackMap((prev) => ({ ...prev, [id]: prevSelection }));
      setFaqs((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          let helpful = f.helpful || 0;
          let notHelpful = f.notHelpful || 0;
          // Reverse the optimistic branch above
          if (prevSelection === "helpful") {
            helpful += 1;
          } else if (prevSelection === "not_helpful") {
            helpful = Math.max(0, helpful - 1);
            notHelpful += 1;
          } else {
            helpful = Math.max(0, helpful - 1);
          }
          return { ...f, helpful, notHelpful };
        })
      );
    }
  };

  const handleIncrementNotHelpful = async (id: string) => {
    if (!user) return;
    // Debug: not helpful click
    // eslint-disable-next-line no-console
    console.log("👎 Not Helpful click:", { faqId: id, userId: user.id });
    const prevSelection = userFeedbackMap[id] ?? null;
    // Optimistic selection
    setUserFeedbackMap((prev) => ({
      ...prev,
      [id]: prevSelection === "not_helpful" ? null : "not_helpful",
    }));
    // Optimistic counts
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
    try {
      const result = await faqService.submitFeedback(id, user.id, false);
      // Reconcile with server
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
      // Revert optimistic change on error
      setUserFeedbackMap((prev) => ({ ...prev, [id]: prevSelection }));
      setFaqs((prev) =>
        prev.map((f) => {
          if (f.id !== id) return f;
          let helpful = f.helpful || 0;
          let notHelpful = f.notHelpful || 0;
          if (prevSelection === "not_helpful") {
            notHelpful += 1;
          } else if (prevSelection === "helpful") {
            notHelpful = Math.max(0, notHelpful - 1);
            helpful += 1;
          } else {
            notHelpful = Math.max(0, notHelpful - 1);
          }
          return { ...f, helpful, notHelpful };
        })
      );
    }
  };

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
          Frequently Asked Questions ❓
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.1rem" }}
        >
          Find answers to common questions about CampusLearn
        </Typography>
      </Box>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300, flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 200 }}>
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
        </CardContent>
      </Card>

      {/* FAQ List */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : faqs.length === 0 ? (
            <Box textAlign="center" p={4}>
              <Help sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No FAQs found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm || selectedCategory
                  ? "Try adjusting your search criteria"
                  : "No FAQs are available at the moment"}
              </Typography>
            </Box>
          ) : (
            faqs.map((faq) => (
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
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {faq.question}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Chip
                          label={faq.category}
                          size="small"
                          color="primary"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {faq.views} views
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {faq.answer}
                  </Typography>

                  {faq.tags.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mb: 2,
                      }}
                    >
                      {faq.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}

                  {/* Feedback buttons */}
                  <Box sx={{ display: "flex", gap: 1 }}>
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
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default FAQPage;
