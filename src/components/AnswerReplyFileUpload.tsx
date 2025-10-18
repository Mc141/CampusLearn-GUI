import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  Alert,
} from "@mui/material";
import { AttachFile, Delete } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { answerReplyAttachmentService } from "../services/answerReplyAttachmentService";

interface AnswerReplyFileUploadProps {
  replyId?: string;
  onFilesUploaded?: (files: File[]) => void;
  onUploadProgress?: (progress: {
    fileName: string;
    progress: number;
    status: "uploading" | "completed" | "error";
  }) => void;
  userId?: string;
}

const AnswerReplyFileUpload: React.FC<AnswerReplyFileUploadProps> = ({
  replyId,
  onFilesUploaded,
  onUploadProgress,
  userId,
}) => {
  const [uploadProgress, setUploadProgress] = useState<{
    [fileName: string]: number;
  }>({});
  const [uploadStatus, setUploadStatus] = useState<{
    [fileName: string]: "uploading" | "completed" | "error";
  }>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!userId) {
        console.error("No user ID provided for file upload");
        return;
      }

      // If we have a replyId, upload immediately
      if (replyId) {
        try {
          await answerReplyAttachmentService.uploadFilesToReply(
            replyId,
            acceptedFiles,
            userId,
            (progress) => {
              setUploadProgress((prev) => ({
                ...prev,
                [progress.fileName]: progress.progress,
              }));
              setUploadStatus((prev) => ({
                ...prev,
                [progress.fileName]: progress.status,
              }));
              onUploadProgress?.(progress);
            }
          );

          // Clear progress after successful upload
          setUploadProgress({});
          setTimeout(() => setUploadProgress({}), 100);
        } catch (error) {
          console.error("Error uploading files:", error);
          acceptedFiles.forEach((file) => {
            setUploadStatus((prev) => ({
              ...prev,
              [file.name]: "error",
            }));
          });
        }
      } else {
        // If no replyId, just pass files to parent component
        setSelectedFiles(acceptedFiles);
        onFilesUploaded?.(acceptedFiles);
      }
    },
    [replyId, userId, onFilesUploaded, onUploadProgress]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif"],
      "video/*": [".mp4", ".webm", ".mov"],
      "audio/*": [".mp3", ".wav", ".ogg"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (fileName: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== fileName));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    setUploadStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
  };

  const getStatusColor = (status: "uploading" | "completed" | "error") => {
    switch (status) {
      case "uploading":
        return "primary";
      case "completed":
        return "success";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* File Upload Area */}
      <Box
        {...getRootProps()}
        sx={{
          border: "2px dashed",
          borderColor: isDragActive ? "primary.main" : "grey.300",
          borderRadius: 2,
          p: 2,
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: isDragActive ? "action.hover" : "background.paper",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: "action.hover",
          },
        }}
      >
        <input {...getInputProps()} />
        <AttachFile sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {isDragActive
            ? "Drop files here..."
            : "Drag & drop files here, or click to select"}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: "block" }}
        >
          PDF, Images, Videos, Audio, Documents (max 50MB each)
        </Typography>
      </Box>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <Box sx={{ mt: 2 }}>
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <Box key={fileName} sx={{ mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Typography variant="caption" sx={{ flexGrow: 1 }}>
                  {fileName}
                </Typography>
                <Chip
                  label={uploadStatus[fileName] || "uploading"}
                  size="small"
                  color={getStatusColor(uploadStatus[fileName] || "uploading")}
                  sx={{ ml: 1 }}
                />
                <IconButton
                  size="small"
                  onClick={() => removeFile(fileName)}
                  sx={{ ml: 1 }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={uploadStatus[fileName] === "error" ? "error" : "primary"}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Selected Files (for new replies) */}
      {selectedFiles.length > 0 && !replyId && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Selected Files:
          </Typography>
          {selectedFiles.map((file) => (
            <Box
              key={file.name}
              sx={{ display: "flex", alignItems: "center", mb: 1 }}
            >
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
              <IconButton size="small" onClick={() => removeFile(file.name)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AnswerReplyFileUpload;
