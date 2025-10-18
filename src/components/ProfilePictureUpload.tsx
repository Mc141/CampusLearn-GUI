import React, { useState, useCallback } from "react";
import {
  Box,
  Avatar,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { PhotoCamera, Delete } from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { fileUploadService } from "../services/fileUploadService";

interface ProfilePictureUploadProps {
  currentPicture?: string;
  onPictureChange: (url: string | null) => void;
  userId: string;
  isEditing?: boolean;
  userInitials?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPicture,
  onPictureChange,
  userId,
  isEditing = false,
  userInitials = "??",
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError("File size must be less than 5MB");
        return;
      }

      setError(null);
      setUploading(true);

      try {
        // Upload to profile-pictures bucket
        const uploadResult = await fileUploadService.uploadFile(
          file,
          `profile-pictures/${userId}`,
          (progress) => {
            // Handle upload progress if needed
            console.log("Upload progress:", progress);
          }
        );

        if (uploadResult.url) {
          onPictureChange(uploadResult.url);
          console.log(
            "Profile picture uploaded successfully:",
            uploadResult.url
          );
        } else {
          throw new Error("No URL returned from upload");
        }
      } catch (err) {
        console.error("Error uploading profile picture:", err);
        setError("Failed to upload profile picture. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [userId, onPictureChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
    disabled: uploading || !isEditing,
  });

  const handleRemovePicture = () => {
    onPictureChange(null);
    setError(null);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      {/* Current Profile Picture */}
      <Box sx={{ position: "relative" }}>
        <Avatar
          src={currentPicture}
          sx={{
            width: 120,
            height: 120,
            fontSize: "2.5rem",
            border: "3px solid",
            borderColor: "primary.main",
          }}
        >
          {!currentPicture && userInitials}
        </Avatar>

        {/* Remove button */}
        {currentPicture && isEditing && (
          <IconButton
            onClick={handleRemovePicture}
            sx={{
              position: "absolute",
              top: -8,
              right: -8,
              backgroundColor: "error.main",
              color: "white",
              "&:hover": {
                backgroundColor: "error.dark",
              },
              width: 32,
              height: 32,
            }}
            size="small"
          >
            <Delete fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Upload Area - Only show when editing */}
      {isEditing && (
        <Box
          {...getRootProps()}
          sx={{
            border: "2px dashed",
            borderColor: isDragActive ? "primary.main" : "grey.300",
            borderRadius: 2,
            p: 2,
            textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            backgroundColor: isDragActive ? "action.hover" : "transparent",
            transition: "all 0.2s ease-in-out",
            minWidth: 150,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <input {...getInputProps()} />

          {uploading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={20} />
              <Typography variant="caption" color="text.secondary">
                Uploading...
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <PhotoCamera sx={{ fontSize: 24, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {isDragActive ? "Drop image here" : "Click to upload"}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ width: "100%", maxWidth: 200 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ProfilePictureUpload;
