import React, { useState, useEffect } from "react";
import {
  Box,
  Alert,
  AlertTitle,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
} from "@mui/material";
import {
  Warning,
  Schedule,
  Info,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import {
  chatExpiryService,
  ChatExpiryInfo,
} from "../services/chatExpiryService";

interface ChatExpiryWarningProps {
  conversationId: string;
  onExpiryInfoChange?: (expiryInfo: ChatExpiryInfo | null) => void;
}

const ChatExpiryWarning: React.FC<ChatExpiryWarningProps> = ({
  conversationId,
  onExpiryInfoChange,
}) => {
  const [expiryInfo, setExpiryInfo] = useState<ChatExpiryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadExpiryInfo = async () => {
      try {
        setLoading(true);
        const info = await chatExpiryService.getChatExpiryInfo(conversationId);
        setExpiryInfo(info);
        onExpiryInfoChange?.(info);
      } catch (error) {
        console.error("Error loading expiry info:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExpiryInfo();

    // Refresh every minute to keep info current
    const interval = setInterval(loadExpiryInfo, 60000);
    return () => clearInterval(interval);
  }, [conversationId, onExpiryInfoChange]);

  if (loading || !expiryInfo) {
    return null;
  }

  const getSeverity = () => {
    if (expiryInfo.isExpired) return "error";
    if (expiryInfo.daysUntilExpiry <= 1) return "warning";
    if (expiryInfo.daysUntilExpiry <= 3) return "info";
    return "success";
  };

  const getIcon = () => {
    if (expiryInfo.isExpired) return <Warning />;
    if (expiryInfo.daysUntilExpiry <= 1) return <Schedule />;
    return <Info />;
  };

  const getTitle = () => {
    if (expiryInfo.isExpired) return "Conversation Expired";
    if (expiryInfo.daysUntilExpiry === 0) return "Expires Today";
    if (expiryInfo.daysUntilExpiry === 1) return "Expires Tomorrow";
    return "Expiry Reminder";
  };

  const getColor = () => {
    if (expiryInfo.isExpired) return "error";
    if (expiryInfo.daysUntilExpiry <= 1) return "warning";
    return "default";
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity={getSeverity()}
        icon={getIcon()}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={`${expiryInfo.daysUntilExpiry} day${
                expiryInfo.daysUntilExpiry !== 1 ? "s" : ""
              } left`}
              size="small"
              color={getColor() as any}
              variant="outlined"
            />
            <Tooltip title={expanded ? "Show less" : "Show details"}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                color="inherit"
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          </Box>
        }
      >
        <AlertTitle>{getTitle()}</AlertTitle>
        <Typography variant="body2">
          {chatExpiryService.formatExpiryMessage(expiryInfo)}
        </Typography>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Last activity:</strong>{" "}
              {chatExpiryService.formatLastActivity(expiryInfo.lastActivity)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Expiry policy:</strong> One-on-one conversations are
              automatically deleted after 7 days of inactivity to keep the
              platform clean and organized.
            </Typography>
            {!expiryInfo.isExpired && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Tip:</strong> Send a message to reset the expiry timer.
              </Typography>
            )}
          </Box>
        </Collapse>
      </Alert>
    </Box>
  );
};

export default ChatExpiryWarning;
