import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Delete,
  Refresh,
  Warning,
  Schedule,
  Info,
  Cleanup,
} from "@mui/icons-material";
import {
  chatExpiryService,
  ChatExpiryInfo,
} from "../services/chatExpiryService";

const ChatExpiryManagement: React.FC = () => {
  const [expiryInfo, setExpiryInfo] = useState<ChatExpiryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const loadExpiryInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await chatExpiryService.getAllChatExpiryInfo();
      setExpiryInfo(info);
    } catch (err) {
      console.error("Error loading expiry info:", err);
      setError("Failed to load chat expiry information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpiryInfo();
  }, []);

  const handleCleanup = async () => {
    try {
      setCleanupLoading(true);
      const result = await chatExpiryService.triggerCleanup();
      console.log("Cleanup result:", result);

      // Reload data after cleanup
      await loadExpiryInfo();
      setCleanupDialogOpen(false);
    } catch (err) {
      console.error("Error during cleanup:", err);
      setError("Failed to clean up expired chats");
    } finally {
      setCleanupLoading(false);
    }
  };

  const getSeverity = (info: ChatExpiryInfo) => {
    if (info.isExpired) return "error";
    if (info.daysUntilExpiry <= 1) return "warning";
    if (info.daysUntilExpiry <= 3) return "info";
    return "success";
  };

  const getStatusChip = (info: ChatExpiryInfo) => {
    if (info.isExpired) {
      return <Chip label="Expired" color="error" size="small" />;
    }
    if (info.daysUntilExpiry <= 1) {
      return <Chip label="Expires Soon" color="warning" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  const expiredCount = expiryInfo.filter((info) => info.isExpired).length;
  const expiringSoonCount = expiryInfo.filter(
    (info) => !info.isExpired && info.daysUntilExpiry <= 1
  ).length;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5">Chat Expiry Management</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadExpiryInfo}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Cleanup />}
            onClick={() => setCleanupDialogOpen(true)}
            disabled={expiredCount === 0}
          >
            Clean Up Expired ({expiredCount})
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box display="flex" gap={2} mb={3}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Warning color="error" />
              <Typography variant="h6">{expiredCount}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Expired Conversations
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Schedule color="warning" />
              <Typography variant="h6">{expiringSoonCount}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Expiring Soon (≤1 day)
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1}>
              <Info color="primary" />
              <Typography variant="h6">{expiryInfo.length}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Total Conversations
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Conversations Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Conversation ID</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>Days Until Expiry</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expiryInfo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        No conversations found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  expiryInfo.map((info) => (
                    <TableRow key={info.conversationId}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {info.conversationId.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {chatExpiryService.formatLastActivity(
                          info.lastActivity
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${info.daysUntilExpiry} day${
                            info.daysUntilExpiry !== 1 ? "s" : ""
                          }`}
                          size="small"
                          color={getSeverity(info) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{getStatusChip(info)}</TableCell>
                      <TableCell>
                        <Tooltip title="View conversation details">
                          <IconButton size="small">
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Cleanup Confirmation Dialog */}
      <Dialog
        open={cleanupDialogOpen}
        onClose={() => setCleanupDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Cleanup</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete all expired conversations? This
            action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete {expiredCount} expired conversations
            and all their messages.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCleanup}
            variant="contained"
            color="error"
            disabled={cleanupLoading}
            startIcon={
              cleanupLoading ? <CircularProgress size={20} /> : <Delete />
            }
          >
            {cleanupLoading ? "Cleaning..." : "Delete Expired Chats"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatExpiryManagement;
