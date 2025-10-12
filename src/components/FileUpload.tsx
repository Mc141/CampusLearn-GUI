import React, { useState, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
  Chip,
  Alert,
} from "@mui/material";
import {
  CloudUpload,
  AttachFile,
  Delete,
  Download,
  PictureAsPdf,
  VideoFile,
  AudioFile,
  Image,
  Link,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  existingFiles?: Array<{
    id: string;
    name: string;
    type: "pdf" | "video" | "audio" | "image" | "link";
    url: string;
    size?: number;
    uploadedAt: Date;
  }>;
  onFileDelete?: (fileId: string) => void;
  onFileDownload?: (fileId: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ["image/*", "application/pdf", "video/*", "audio/*"],
  existingFiles = [],
  onFileDelete,
  onFileDownload,
}) => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const oversizedFiles = acceptedFiles.filter(
        (file) => file.size > maxSize * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        alert(`Files larger than ${maxSize}MB are not allowed`);
        return;
      }

      setUploading(true);

      // Simulate upload progress
      acceptedFiles.forEach((file, index) => {
        const fileId = `${Date.now()}-${index}`;
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[fileId] || 0;
            if (current >= 100) {
              clearInterval(interval);
              return prev;
            }
            return { ...prev, [fileId]: current + 10 };
          });
        }, 200);

        // Complete upload after 2 seconds
        setTimeout(() => {
          clearInterval(interval);
          setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));
          setUploading(false);
          onFileUpload([file]);
        }, 2000);
      });
    },
    [maxFiles, maxSize, onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    multiple: true,
  });

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <PictureAsPdf color="error" />;
    if (type.includes("video")) return <VideoFile color="primary" />;
    if (type.includes("audio")) return <AudioFile color="secondary" />;
    if (type.includes("image")) return <Image color="success" />;
    return <AttachFile />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileType = (
    fileName: string
  ): "pdf" | "video" | "audio" | "image" | "link" => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(extension || "")) return "pdf";
    if (["mp4", "avi", "mov", "wmv"].includes(extension || "")) return "video";
    if (["mp3", "wav", "ogg"].includes(extension || "")) return "audio";
    if (["jpg", "jpeg", "png", "gif", "bmp"].includes(extension || ""))
      return "image";
    return "link";
  };

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: "center",
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "grey.300",
          bgcolor: isDragActive ? "action.hover" : "background.paper",
          cursor: "pointer",
          mb: 3,
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? "Drop files here" : "Drag & drop files here"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          Max {maxFiles} files, {maxSize}MB each
        </Typography>
      </Paper>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Box sx={{ mb: 3 }}>
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <Box key={fileId} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Uploading... {progress}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          ))}
        </Box>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Attached Files
          </Typography>
          <List>
            {existingFiles.map((file) => (
              <ListItem
                key={file.id}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>{getFileIcon(file.name)}</ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {file.size ? formatFileSize(file.size) : "Unknown size"}{" "}
                        •{file.uploadedAt.toLocaleDateString()}
                      </Typography>
                      <Chip
                        label={file.type.toUpperCase()}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  }
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  {onFileDownload && (
                    <IconButton
                      size="small"
                      onClick={() => onFileDownload(file.id)}
                    >
                      <Download />
                    </IconButton>
                  )}
                  {onFileDelete && (
                    <IconButton
                      size="small"
                      onClick={() => onFileDelete(file.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Supported Formats */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Supported formats:</strong> Images (JPG, PNG, GIF), PDFs,
          Videos (MP4, AVI), Audio (MP3, WAV)
        </Typography>
      </Alert>
    </Box>
  );
};

export default FileUpload;
