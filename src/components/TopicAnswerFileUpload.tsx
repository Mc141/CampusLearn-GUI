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
  topicAnswerAttachmentService,
  TopicAnswerAttachment,
  UploadProgress,
} from "../services/topicAnswerAttachmentService";

interface TopicAnswerFileUploadProps {
  answerId?: string;
  userId: string;
  disabled?: boolean;
  onFilesUploaded?: (files: File[]) => void; // Changed to File[]
}

const TopicAnswerFileUpload: React.FC<TopicAnswerFileUploadProps> = ({
  answerId,
  userId,
  disabled = false,
  onFilesUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // If we have an answerId, upload immediately
      if (answerId) {
        setUploading(true);
        setError(null);
        setUploadProgress([]);

        try {
          const attachments =
            await topicAnswerAttachmentService.uploadFilesToAnswer(
              answerId,
              acceptedFiles,
              userId,
              (progress) => {
                setUploadProgress((prev) => {
                  const existing = prev.find(
                    (p) => p.fileId === progress.fileId
                  );
                  if (existing) {
                    return prev.map((p) =>
                      p.fileId === progress.fileId ? progress : p
                    );
                  }
                  return [...prev, progress];
                });
              }
            );

          onFilesUploaded?.(acceptedFiles); // Pass original files back
          setShowUploadDialog(false);

          // Clear progress immediately after successful upload
          setUploadProgress([]);

          // Also clear it after a small delay to ensure it's gone
          setTimeout(() => {
            setUploadProgress([]);
          }, 100);
        } catch (err) {
          console.error("Error uploading files:", err);
          setError(
            err instanceof Error ? err.message : "Failed to upload files"
          );
        } finally {
          setUploading(false);
          setUploadProgress([]);
        }
      } else {
        // If no answerId, just pass files to callback (for answer creation)
        onFilesUploaded?.(acceptedFiles);
        setShowUploadDialog(false);
      }
    },
    [answerId, userId, onFilesUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || uploading,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".mov", ".avi"],
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
      <Tooltip title="Attach files (images, PDFs, videos, documents)">
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
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CloudUpload />
            Upload Files
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: "2px dashed",
              borderColor: isDragActive ? "primary.main" : "grey.300",
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              backgroundColor: isDragActive ? "primary.light" : "grey.50",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "primary.main",
                backgroundColor: "primary.light",
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload
              sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              or click to select files
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supported: PDF, Images, Videos, Audio, Documents, Presentations,
              Spreadsheets, Text files
            </Typography>
          </Box>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Uploading files...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)}>
            <Close sx={{ mr: 1 }} />
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TopicAnswerFileUpload;
