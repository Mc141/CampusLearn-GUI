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
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  Fab,
} from "@mui/material";
import {
  Upload,
  Download,
  VideoFile,
  PictureAsPdf,
  AudioFile,
  Image,
  Link,
  Add,
  Delete,
  Edit,
  Visibility,
  CloudUpload,
  Folder,
  Search,
  FilterList,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import FileUpload from "../components/FileUpload";
import { mockModules } from "../data/mockData";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "video" | "audio" | "image" | "link";
  url: string;
  moduleId: string;
  uploadedBy: string;
  uploadedAt: Date;
  size?: number;
  downloads: number;
  tags: string[];
}

const ResourceManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Mock resources data
  const [resources] = useState<Resource[]>([
    {
      id: "1",
      title: "Introduction to Machine Learning",
      description: "Comprehensive guide to ML concepts and algorithms",
      type: "pdf",
      url: "/resources/ml-intro.pdf",
      moduleId: "1",
      uploadedBy: "Jane Smith",
      uploadedAt: new Date("2024-01-15"),
      size: 2048000,
      downloads: 45,
      tags: ["machine-learning", "algorithms", "statistics"],
    },
    {
      id: "2",
      title: "React Hooks Tutorial",
      description: "Step-by-step tutorial on React hooks",
      type: "video",
      url: "/resources/react-hooks.mp4",
      moduleId: "3",
      uploadedBy: "John Doe",
      uploadedAt: new Date("2024-01-20"),
      size: 15728640,
      downloads: 32,
      tags: ["react", "hooks", "frontend"],
    },
    {
      id: "3",
      title: "Database Design Patterns",
      description: "Audio lecture on database design principles",
      type: "audio",
      url: "/resources/db-design.mp3",
      moduleId: "4",
      uploadedBy: "Mike Johnson",
      uploadedAt: new Date("2024-01-25"),
      size: 8192000,
      downloads: 28,
      tags: ["database", "design", "patterns"],
    },
  ]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <PictureAsPdf color="error" />;
      case "video":
        return <VideoFile color="primary" />;
      case "audio":
        return <AudioFile color="secondary" />;
      case "image":
        return <Image color="success" />;
      case "link":
        return <Link color="info" />;
      default:
        return <Folder />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule =
      !selectedModule || resource.moduleId === selectedModule;
    const matchesType = !selectedType || resource.type === selectedType;
    return matchesSearch && matchesModule && matchesType;
  });

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setUploadProgress(i);
    }

    // In a real app, this would upload to backend
    console.log("Uploading files:", files);

    setIsUploading(false);
    setOpenUploadDialog(false);
    setUploadProgress(0);
  };

  const handleDownload = (resource: Resource) => {
    // In a real app, this would trigger download
    console.log("Downloading resource:", resource.title);
  };

  const renderResourceList = () => (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
          }}
          sx={{ minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Module</InputLabel>
          <Select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            label="Module"
          >
            <MenuItem value="">All Modules</MenuItem>
            {mockModules.map((module) => (
              <MenuItem key={module.id} value={module.id}>
                {module.code} - {module.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            label="Type"
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="video">Video</MenuItem>
            <MenuItem value="audio">Audio</MenuItem>
            <MenuItem value="image">Image</MenuItem>
            <MenuItem value="link">Link</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2}>
        {filteredResources.map((resource) => (
          <Grid item xs={12} sm={6} md={4} key={resource.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  {getResourceIcon(resource.type)}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      {resource.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {
                        mockModules.find((m) => m.id === resource.moduleId)
                          ?.code
                      }
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 2, minHeight: 40 }}>
                  {resource.description}
                </Typography>

                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}
                >
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Chip key={tag} label={tag} size="small" />
                  ))}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(resource.size)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {resource.downloads} downloads
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => handleDownload(resource)}
                    fullWidth
                  >
                    Download
                  </Button>
                  {(user?.role === "tutor" || user?.role === "admin") && (
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderUploadDialog = () => (
    <Dialog
      open={openUploadDialog}
      onClose={() => setOpenUploadDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Upload Learning Resources</DialogTitle>
      <DialogContent>
        <FileUpload
          onFileUpload={handleUpload}
          acceptedTypes={["pdf", "video", "audio", "image"]}
          maxFiles={5}
          maxSize={50 * 1024 * 1024} // 50MB
        />
        {isUploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Uploading... {uploadProgress}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
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
          Learning Resources 📚
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.1rem" }}
        >
          Access and share educational materials with your peers
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Browse Resources" />
            <Tab label="My Uploads" />
            <Tab label="Favorites" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {tabValue === 0 && renderResourceList()}
          {tabValue === 1 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CloudUpload
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No uploads yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start sharing resources with your peers
              </Typography>
            </Box>
          )}
          {tabValue === 2 && (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No favorites yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mark resources as favorites for easy access
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {(user?.role === "tutor" || user?.role === "admin") && (
        <Fab
          color="primary"
          sx={{ position: "fixed", bottom: 16, right: 16 }}
          onClick={() => setOpenUploadDialog(true)}
        >
          <Add />
        </Fab>
      )}

      {renderUploadDialog()}
    </Box>
  );
};

export default ResourceManagementPage;



