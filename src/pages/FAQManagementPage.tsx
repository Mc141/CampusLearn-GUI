import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
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
  Divider,
} from "@mui/material";
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
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  helpful: number;
  notHelpful: number;
}

const FAQManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | false>(false);

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: "1",
      question: "How do I register as a peer tutor?",
      answer:
        "To register as a peer tutor, go to the Tutor Registration page and fill out the application form. You'll need to provide your academic background, teaching experience, and motivation statement. Applications are reviewed within 2-3 business days.",
      category: "Tutoring",
      tags: ["registration", "tutor", "application"],
      isPublished: true,
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-15"),
      views: 156,
      helpful: 23,
      notHelpful: 2,
    },
    {
      id: "2",
      question: "What file types can I upload as learning resources?",
      answer:
        "You can upload PDFs, videos (MP4, AVI), audio files (MP3, WAV), images (JPG, PNG), and links to external resources. Maximum file size is 50MB per file.",
      category: "Resources",
      tags: ["upload", "files", "resources"],
      isPublished: true,
      createdAt: new Date("2024-01-12"),
      updatedAt: new Date("2024-01-12"),
      views: 89,
      helpful: 15,
      notHelpful: 1,
    },
    {
      id: "3",
      question: "How do I subscribe to topics?",
      answer:
        "Navigate to the Topics page, browse available topics, and click the 'Subscribe' button on topics you're interested in. You'll receive notifications when new questions are posted in your subscribed topics.",
      category: "Topics",
      tags: ["subscription", "topics", "notifications"],
      isPublished: true,
      createdAt: new Date("2024-01-14"),
      updatedAt: new Date("2024-01-14"),
      views: 134,
      helpful: 19,
      notHelpful: 3,
    },
    {
      id: "4",
      question: "Can I post anonymously in the forum?",
      answer:
        "Yes, you can choose to post anonymously in the public forum. This allows you to ask questions without revealing your identity. However, remember to be respectful and follow community guidelines.",
      category: "Forum",
      tags: ["anonymous", "forum", "privacy"],
      isPublished: true,
      createdAt: new Date("2024-01-16"),
      updatedAt: new Date("2024-01-16"),
      views: 67,
      helpful: 12,
      notHelpful: 0,
    },
  ]);

  const [newFAQ, setNewFAQ] = useState({
    question: "",
    answer: "",
    category: "",
    tags: [] as string[],
  });

  const categories = [
    "General",
    "Tutoring",
    "Resources",
    "Topics",
    "Forum",
    "Technical",
    "Account",
  ];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddFAQ = () => {
    const faq: FAQ = {
      id: Date.now().toString(),
      ...newFAQ,
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
      helpful: 0,
      notHelpful: 0,
    };
    setFaqs([...faqs, faq]);
    setNewFAQ({ question: "", answer: "", category: "", tags: [] });
    setOpenDialog(false);
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

  const handleUpdateFAQ = () => {
    if (editingFAQ) {
      setFaqs(
        faqs.map((faq) =>
          faq.id === editingFAQ.id
            ? { ...faq, ...newFAQ, updatedAt: new Date() }
            : faq
        )
      );
      setEditingFAQ(null);
      setNewFAQ({ question: "", answer: "", category: "", tags: [] });
      setOpenDialog(false);
    }
  };

  const handleDeleteFAQ = (id: string) => {
    setFaqs(faqs.filter((faq) => faq.id !== id));
  };

  const handleTogglePublish = (id: string) => {
    setFaqs(
      faqs.map((faq) =>
        faq.id === id ? { ...faq, isPublished: !faq.isPublished } : faq
      )
    );
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

      {filteredFAQs.map((faq) => (
        <Accordion
          key={faq.id}
          expanded={expandedFAQ === faq.id}
          onChange={(_, isExpanded) =>
            setExpandedFAQ(isExpanded ? faq.id : false)
          }
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
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
      ))}
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
                {faqs.length}
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
                {faqs.filter((faq) => faq.isPublished).length}
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
                {faqs.reduce((sum, faq) => sum + faq.views, 0)}
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
                {categories.length}
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
    </Box>
  );
};

export default FAQManagementPage;
