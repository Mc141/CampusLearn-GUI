import React, { useState, useCallback, useRef } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  LinearProgress,
  Typography,
  Chip,
  Alert,
} from "@mui/material";
import {
  AttachFile,
  Close,
  Download,
  PictureAsPdf,
  VideoFile,
  AudioFile,
  Image,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import {
  fileUploadService,
  type FileUploadProgress,
  type UploadedFile,
} from "../services/fileUploadService";

interface ChatFileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export const ChatFileUpload: React.FC<ChatFileUploadProps> = ({
  onFilesUploaded,
  maxFiles = 5,
  maxSize = 50,
  disabled = false,
}) => {
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, FileUploadProgress>
  >({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;

      if (acceptedFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const oversizedFiles = acceptedFiles.filter(
        (file) => file.size > maxSize * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        setError(`Files larger than ${maxSize}MB are not allowed`);
        return;
      }

      setUploading(true);
      setError(null);

      try {
        const uploadedFiles = await fileUploadService.uploadFiles(
          acceptedFiles,
          "chat-attachments",
          (progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [progress.fileId]: progress,
            }));
          }
        );

        onFilesUploaded(uploadedFiles);

        // Clear progress after a short delay
        setTimeout(() => {
          setUploadProgress({});
          setUploading(false);
        }, 1000);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Upload failed");
        setUploading(false);
      }
    },
    [maxFiles, maxSize, onFilesUploaded, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "video/*": [".mp4", ".avi", ".mov", ".webm"],
      "audio/*": [".mp3", ".wav", ".ogg", ".m4a"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    multiple: true,
    disabled,
  });

  const handleFileSelect = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <PictureAsPdf color="error" sx={{ fontSize: 20 }} />;
      case "video":
        return <VideoFile color="primary" sx={{ fontSize: 20 }} />;
      case "audio":
        return <AudioFile color="secondary" sx={{ fontSize: 20 }} />;
      case "image":
        return <Image color="success" sx={{ fontSize: 20 }} />;
      default:
        return <AttachFile sx={{ fontSize: 20 }} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    return fileUploadService.formatFileSize(bytes);
  };

  return (
    <Box sx={{ position: "relative" }}>
      {/* File Upload Button */}
      <Tooltip title="Attach files (images, PDFs, videos, audio)">
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
      </Tooltip>

      {/* Hidden file input */}
      <input
        {...getInputProps()}
        ref={fileInputRef}
        style={{ display: "none" }}
      />

      {/* Drag and drop overlay */}
      {isDragActive && (
        <Box
          {...getRootProps()}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(25, 118, 210, 0.1)",
            border: "2px dashed",
            borderColor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "pointer",
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <AttachFile sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" color="primary.main">
              Drop files here to upload
            </Typography>
          </Box>
        </Box>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Box
          sx={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            backgroundColor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 2,
            mb: 1,
            minWidth: 300,
            zIndex: 1000,
          }}
        >
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            Uploading files...
          </Typography>
          {Object.values(uploadProgress).map((progress) => (
            <Box key={progress.fileId} sx={{ mb: 1 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                {getFileIcon(progress.fileName.split(".").pop() || "")}
                <Typography
                  variant="caption"
                  sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {progress.fileName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {progress.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress.progress}
                sx={{ height: 4, borderRadius: 2 }}
              />
              {progress.status === "error" && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {progress.error}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            mb: 1,
            minWidth: 300,
            zIndex: 1000,
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

