import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Chip,
  CircularProgress,
} from "@mui/material";
import { PlayArrow, Link, YouTube, VideoLibrary } from "@mui/icons-material";
import { topicResourcesService } from "../services/topicResourcesService";

interface VideoLinkDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  topicId: string;
  userId: string;
}

const VideoLinkDialog: React.FC<VideoLinkDialogProps> = ({
  open,
  onClose,
  onSuccess,
  topicId,
  userId,
}) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<{
    platform: "youtube" | "vimeo" | "other";
    thumbnail?: string;
    title?: string;
  } | null>(null);

  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    setError(null);

    if (url.trim()) {
      // Extract video info for preview
      const info = topicResourcesService.extractVideoInfo(url);
      setVideoInfo(info);

      // Auto-fill title if empty
      if (!title && info.title) {
        setTitle(info.title);
      }
    } else {
      setVideoInfo(null);
    }
  };

  const handleSubmit = async () => {
    if (!videoUrl.trim()) {
      setError("Please enter a video URL");
      return;
    }

    if (!topicResourcesService.isValidVideoUrl(videoUrl)) {
      setError(
        "Please enter a valid video URL (YouTube, Vimeo, or direct video file)"
      );
      return;
    }

    if (!title.trim()) {
      setError("Please enter a title for the video");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await topicResourcesService.createVideoLinkResource(
        topicId,
        videoUrl,
        title,
        description,
        userId
      );

      // Reset form
      setVideoUrl("");
      setTitle("");
      setDescription("");
      setVideoInfo(null);

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error creating video link:", err);
      setError("Failed to add video link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setVideoUrl("");
      setTitle("");
      setDescription("");
      setVideoInfo(null);
      setError(null);
      onClose();
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "youtube":
        return <YouTube color="error" />;
      case "vimeo":
        return <VideoLibrary color="primary" />;
      default:
        return <Link color="action" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "youtube":
        return "error";
      case "vimeo":
        return "primary";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PlayArrow color="primary" />
          <Typography variant="h6">Add Video Link</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Video URL"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            fullWidth
            disabled={loading}
            helperText="Supported: YouTube, Vimeo, and direct video file links"
            InputProps={{
              startAdornment: <Link sx={{ mr: 1, color: "text.secondary" }} />,
            }}
          />

          {videoInfo && (
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.paper",
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {getPlatformIcon(videoInfo.platform)}
                <Chip
                  label={videoInfo.platform.toUpperCase()}
                  size="small"
                  color={getPlatformColor(videoInfo.platform) as any}
                />
              </Box>

              {videoInfo.thumbnail && (
                <Box mb={1}>
                  <img
                    src={videoInfo.thumbnail}
                    alt="Video thumbnail"
                    style={{
                      width: "100%",
                      maxWidth: "200px",
                      height: "auto",
                      borderRadius: "4px",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            disabled={loading}
            required
            helperText="Give your video resource a descriptive title"
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={loading}
            placeholder="Optional description of what this video covers..."
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !videoUrl.trim() || !title.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
        >
          {loading ? "Adding..." : "Add Video"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VideoLinkDialog;
