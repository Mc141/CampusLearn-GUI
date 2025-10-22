import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  InsertDriveFile,
  Image,
  VideoFile,
  AudioFile,
  Description,
  Download,
  Delete,
  Edit,
  CloudUpload,
  Visibility,
  PlayArrow,
  YouTube,
  VideoLibrary,
  Link,
} from "@mui/icons-material";
import {
  topicResourcesService,
  TopicResource,
} from "../services/topicResourcesService";
import { useAuth } from "../context/AuthContext";
import TopicFileUpload from "./TopicFileUpload";
import VideoLinkDialog from "./VideoLinkDialog";

interface TopicResourcesProps {
  topicId: string;
  canUpload?: boolean;
}

const TopicResources: React.FC<TopicResourcesProps> = ({
  topicId,
  canUpload = true,
}) => {
  const { user } = useAuth();
  const [resources, setResources] = useState<TopicResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] =
    useState<TopicResource | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [videoLinkDialogOpen, setVideoLinkDialogOpen] = useState(false);

  // Load resources for the topic
  const loadResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const topicResources = await topicResourcesService.getResourcesForTopic(
        topicId
      );
      setResources(topicResources);
    } catch (err) {
      console.error("Error loading topic resources:", err);
      setError("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [topicId]);

  const handleFilesUploaded = (newResources: TopicResource[]) => {
    setResources((prev) => [...newResources, ...prev]);
  };

  const handleVideoLinkAdded = () => {
    loadResources(); // Reload resources to include the new video link
  };

  const handleDownload = async (resource: TopicResource) => {
    try {
      await topicResourcesService.incrementDownloadCount(resource.id);
      window.open(resource.url, "_blank");
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file");
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await topicResourcesService.deleteResource(resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
    } catch (err) {
      console.error("Error deleting resource:", err);
      setError("Failed to delete resource");
    }
  };

  const handlePreviewResource = (resource: TopicResource) => {
    setSelectedResource(resource);
    setPreviewDialogOpen(true);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image color="primary" />;
      case "video":
        return <VideoFile color="secondary" />;
      case "video_link":
        return <PlayArrow color="secondary" />;
      case "audio":
        return <AudioFile color="success" />;
      case "pdf":
        return <Description color="error" />;
      default:
        return <InsertDriveFile color="action" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (date: Date) => {
    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      return "Unknown date";
    }
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const canDeleteResource = (resource: TopicResource) => {
    return (
      user &&
      (user.role === "admin" ||
        user.id === resource.uploaded_by ||
        user.id === resource.uploaded_by_user?.id)
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">
          Learning Resources ({resources.length})
        </Typography>
        {canUpload && user && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={() => setVideoLinkDialogOpen(true)}
              size="small"
            >
              Add Video Link
            </Button>
            <TopicFileUpload
              topicId={topicId}
              userId={user.id}
              onFilesUploaded={handleFilesUploaded}
            />
          </Box>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <CloudUpload
              sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No resources uploaded yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload learning materials to help students with this topic
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <List>
              {resources.map((resource, index) => (
                <React.Fragment key={resource.id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>{getFileIcon(resource.type)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            {resource.title}
                          </Typography>
                          <Chip
                            label={resource.type.toUpperCase()}
                            size="small"
                            variant="outlined"
                            color={
                              resource.type === "video_link"
                                ? "secondary"
                                : "primary"
                            }
                            icon={
                              resource.type === "video_link" ? (
                                <PlayArrow />
                              ) : undefined
                            }
                          />
                          {resource.video_metadata?.platform && (
                            <Chip
                              label={resource.video_metadata.platform.toUpperCase()}
                              size="small"
                              variant="filled"
                              color={
                                resource.video_metadata.platform === "youtube"
                                  ? "error"
                                  : "primary"
                              }
                              icon={
                                resource.video_metadata.platform ===
                                "youtube" ? (
                                  <YouTube />
                                ) : (
                                  <VideoLibrary />
                                )
                              }
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {resource.description}
                          </Typography>
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
                              {formatFileSize(resource.size)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {resource.downloads} downloads
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Uploaded {formatDate(resource.created_at)}
                            </Typography>
                            {resource.uploaded_by_user && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                by {resource.uploaded_by_user.first_name}{" "}
                                {resource.uploaded_by_user.last_name}
                              </Typography>
                            )}
                          </Box>
                          {resource.tags.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              {resource.tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Preview">
                          <IconButton
                            size="small"
                            onClick={() => handlePreviewResource(resource)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={() => handleDownload(resource)}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                        {canDeleteResource(resource) && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteResource(resource.id)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < resources.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Resource Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedResource?.title}</DialogTitle>
        <DialogContent>
          {selectedResource && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedResource.description}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Type: {selectedResource.type.toUpperCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Size: {formatFileSize(selectedResource.size)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Downloads: {selectedResource.downloads}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Uploaded: {formatDate(selectedResource.created_at)}
                </Typography>
              </Box>
              {selectedResource.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Tags:
                  </Typography>
                  {selectedResource.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              )}
              {/* Preview content based on file type */}
              {selectedResource.type === "image" && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <img
                    src={selectedResource.url}
                    alt={selectedResource.title}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "400px",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              )}
              {selectedResource.type === "pdf" && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <iframe
                    src={selectedResource.url}
                    width="100%"
                    height="400px"
                    style={{ border: "none" }}
                    title={selectedResource.title}
                  />
                </Box>
              )}
              {selectedResource.type === "video_link" && (
                <Box sx={{ mt: 2 }}>
                  {selectedResource.video_metadata?.platform === "youtube" && (
                    <Box sx={{ textAlign: "center" }}>
                      <iframe
                        src={selectedResource.url.replace("watch?v=", "embed/")}
                        width="100%"
                        height="400px"
                        style={{ border: "none", borderRadius: "8px" }}
                        title={selectedResource.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                  )}
                  {selectedResource.video_metadata?.platform === "vimeo" && (
                    <Box sx={{ textAlign: "center" }}>
                      <iframe
                        src={selectedResource.url.replace(
                          "vimeo.com/",
                          "player.vimeo.com/video/"
                        )}
                        width="100%"
                        height="400px"
                        style={{ border: "none", borderRadius: "8px" }}
                        title={selectedResource.title}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                      />
                    </Box>
                  )}
                  {selectedResource.video_metadata?.platform === "other" && (
                    <Box sx={{ textAlign: "center", mt: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() =>
                          window.open(selectedResource.url, "_blank")
                        }
                        size="large"
                      >
                        Watch Video
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          {selectedResource && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => handleDownload(selectedResource)}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Video Link Dialog */}
      <VideoLinkDialog
        open={videoLinkDialogOpen}
        onClose={() => setVideoLinkDialogOpen(false)}
        onSuccess={handleVideoLinkAdded}
        topicId={topicId}
        userId={user?.id || ""}
      />
    </Box>
  );
};

export default TopicResources;
