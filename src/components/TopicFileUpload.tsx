import React, { useCallback, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  LinearProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { AttachFile, CloudUpload, Close } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import {
  topicResourcesService,
  TopicResource,
  UploadProgress,
} from "../services/topicResourcesService";

interface TopicFileUploadProps {
  topicId: string;
  userId: string;
  onFilesUploaded?: (resources: TopicResource[]) => void;
  disabled?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string[];
}

const TopicFileUpload: React.FC<TopicFileUploadProps> = ({
  topicId,
  userId,
  onFilesUploaded,
  disabled = false,
  maxFiles = 10,
  acceptedFileTypes = [
    "image/*",
    "application/pdf",
    "video/*",
    "audio/*",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setUploading(true);
      setError(null);
      setUploadProgress([]);

      try {
        const resources = await topicResourcesService.uploadFilesToTopic(
          topicId,
          acceptedFiles,
          userId,
          (progress) => {
            setUploadProgress((prev) => {
              const existing = prev.find((p) => p.fileId === progress.fileId);
              if (existing) {
                return prev.map((p) =>
                  p.fileId === progress.fileId ? progress : p
                );
              }
              return [...prev, progress];
            });
          }
        );

        onFilesUploaded?.(resources);
        setShowUploadDialog(false);

        // Clear progress immediately after successful upload
        setUploadProgress([]);

        // Also clear it after a small delay to ensure it's gone
        setTimeout(() => {
          setUploadProgress([]);
        }, 100);
      } catch (err) {
        console.error("Error uploading files:", err);
        setError(err instanceof Error ? err.message : "Failed to upload files");
      } finally {
        setUploading(false);
        setUploadProgress([]);
      }
    },
    [topicId, userId, onFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || uploading,
    maxFiles,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "video/*": [".mp4", ".avi", ".mov", ".wmv"],
      "audio/*": [".mp3", ".wav", ".ogg", ".m4a"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/plain": [".txt"],
    },
  });

  const handleFileSelect = () => {
    setShowUploadDialog(true);
  };

  return (
    <Box>
      {/* Upload Button */}
      <Tooltip title="Upload learning resources (PDFs, images, videos, documents)">
        <span>
          <IconButton
            onClick={handleFileSelect}
            disabled={disabled || uploading}
            color="primary"
            size="small"
            sx={{
              opacity: disabled ? 0.5 : 1,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "primary.light",
                transform: "scale(1.05)",
              },
            }}
          >
            <AttachFile />
          </IconButton>
        </span>
      </Tooltip>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {uploadProgress.map((progress) => (
            <Box key={progress.fileId} sx={{ mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {progress.fileName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {progress.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.progress}
                color={progress.status === "error" ? "error" : "primary"}
              />
              {progress.status === "error" && (
                <Typography variant="caption" color="error">
                  {progress.error}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Learning Resources</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed",
              borderColor: isDragActive ? "primary.main" : "grey.300",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: disabled || uploading ? "not-allowed" : "pointer",
              backgroundColor: isDragActive ? "primary.light" : "transparent",
              opacity: disabled || uploading ? 0.5 : 1,
              transition: "all 0.2s ease",
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              or click to select files
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported formats: Images, PDFs, Videos, Audio, Documents
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Maximum {maxFiles} files
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TopicFileUpload;
