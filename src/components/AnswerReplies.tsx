import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Divider,
  Collapse,
} from "@mui/material";
import {
  ThumbUp,
  Reply,
  Person,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { AnswerReply } from "../types";
import { answerReplyService } from "../services/answerReplyService";
import { formatDistanceToNow } from "date-fns";
import AnswerReplyAttachments from "./AnswerReplyAttachments";

interface AnswerRepliesProps {
  answerId: string;
  replies: AnswerReply[];
  onRepliesUpdated: () => void;
  onOpenReplyDialog: (answerId: string) => void;
}

const AnswerReplies: React.FC<AnswerRepliesProps> = ({
  answerId,
  replies,
  onRepliesUpdated,
  onOpenReplyDialog,
}) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const handleToggleVote = async (replyId: string) => {
    if (!user?.id) return;

    try {
      const result = await answerReplyService.toggleReplyVote(replyId, user.id);
      onRepliesUpdated(); // Refresh to show updated upvotes
    } catch (error) {
      console.error("Error toggling reply vote:", error);
    }
  };

  const handleReply = () => {
    console.log("Reply button clicked, opening dialog");
    onOpenReplyDialog(answerId);
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  if (replies.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Reply />}
          onClick={handleReply}
          size="small"
          sx={{ textTransform: "none" }}
        >
          Reply to this answer
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Collapsible Header */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Button
          onClick={toggleExpanded}
          startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          sx={{
            textTransform: "none",
            p: 0,
            minWidth: "auto",
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
        >
          {expanded ? "Hide" : "Show"} {replies.length} repl
          {replies.length === 1 ? "y" : "ies"}
        </Button>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Button
          variant="outlined"
          startIcon={<Reply />}
          onClick={handleReply}
          size="small"
          sx={{ textTransform: "none" }}
        >
          Reply to this answer
        </Button>
      </Box>

      {/* Collapsible Replies List */}
      <Collapse in={expanded}>
        <Box sx={{ mb: 2 }}>
          {replies.map((reply, index) => (
            <Card key={reply.id} variant="outlined" sx={{ mb: 1 }}>
              <CardContent sx={{ p: 2 }}>
                {/* Reply Header */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                    {reply.isAnonymous ? (
                      <Person fontSize="small" />
                    ) : (
                      <Typography variant="caption">
                        {reply.authorName?.charAt(0) || "?"}
                      </Typography>
                    )}
                  </Avatar>
                  <Box
                    component="span"
                    sx={{ fontSize: "0.875rem", fontWeight: 600 }}
                  >
                    {reply.isAnonymous
                      ? "Anonymous"
                      : reply.authorName || "Unknown"}
                  </Box>
                  <Box
                    component="span"
                    sx={{ fontSize: "0.75rem", color: "text.secondary", ml: 1 }}
                  >
                    {formatDistanceToNow(reply.createdAt)} ago
                  </Box>
                  {reply.isModerated && (
                    <Box
                      component="span"
                      sx={{ fontSize: "0.75rem", color: "warning.main", ml: 1 }}
                    >
                      (Hidden)
                    </Box>
                  )}
                </Box>

                {/* Reply Content */}
                <Box
                  sx={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                    mb: 1,
                    fontSize: "0.875rem",
                  }}
                >
                  {reply.content}
                </Box>

                {/* Attachments */}
                <AnswerReplyAttachments replyId={reply.id} canDelete={false} />

                {/* Reply Actions */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleToggleVote(reply.id)}
                  >
                    <ThumbUp fontSize="small" />
                  </IconButton>
                  <Box
                    component="span"
                    sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                  >
                    {reply.upvotes} upvotes
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Button
                    size="small"
                    startIcon={<Reply />}
                    onClick={handleReply}
                    sx={{ textTransform: "none" }}
                  >
                    Reply
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default AnswerReplies;
