import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Box, Typography, Paper } from "@mui/material";

interface MarkdownRendererProps {
  content: string;
  isUserMessage?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isUserMessage = false,
}) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : "";

          if (!inline && language) {
            return (
              <Box sx={{ my: 2 }}>
                <SyntaxHighlighter
                  style={tomorrow}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </Box>
            );
          }

          // Inline code
          return (
            <Box
              component="code"
              sx={{
                backgroundColor: "grey.200",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "0.875rem",
                fontFamily: "monospace",
                color: "text.primary",
              }}
              {...props}
            >
              {children}
            </Box>
          );
        },

        // Headings
        h1: ({ children }) => (
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 2,
              mt: 3,
              color: isUserMessage ? "primary.contrastText" : "text.primary",
            }}
          >
            {children}
          </Typography>
        ),
        h2: ({ children }) => (
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              mt: 2.5,
              color: isUserMessage ? "primary.contrastText" : "text.primary",
            }}
          >
            {children}
          </Typography>
        ),
        h3: ({ children }) => (
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              mt: 2,
              color: isUserMessage ? "primary.contrastText" : "text.primary",
            }}
          >
            {children}
          </Typography>
        ),
        h4: ({ children }) => (
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mb: 1,
              mt: 1.5,
              color: isUserMessage ? "primary.contrastText" : "text.primary",
            }}
          >
            {children}
          </Typography>
        ),

        // Paragraphs
        p: ({ children }) => (
          <Typography
            variant="body1"
            sx={{
              mb: 1.5,
              lineHeight: 1.6,
              color: isUserMessage ? "primary.contrastText" : "text.primary",
            }}
          >
            {children}
          </Typography>
        ),

        // Lists
        ul: ({ children }) => (
          <Box component="ul" sx={{ pl: 2, mb: 1.5 }}>
            {children}
          </Box>
        ),
        ol: ({ children }) => (
          <Box component="ol" sx={{ pl: 2, mb: 1.5 }}>
            {children}
          </Box>
        ),
        li: ({ children }) => (
          <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
            {children}
          </Typography>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <Paper
            sx={{
              borderLeft: "4px solid",
              borderColor: "primary.main",
              pl: 2,
              py: 1,
              mb: 2,
              bgcolor: "grey.50",
              fontStyle: "italic",
            }}
          >
            {children}
          </Paper>
        ),

        // Tables
        table: ({ children }) => (
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              mb: 2,
              "& th, & td": {
                border: "1px solid",
                borderColor: "grey.300",
                padding: "8px 12px",
                textAlign: "left",
              },
              "& th": {
                backgroundColor: "grey.100",
                fontWeight: 600,
              },
            }}
          >
            {children}
          </Box>
        ),

        // Links
        a: ({ children, href }) => (
          <Typography
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "primary.main",
              textDecoration: "underline",
              "&:hover": {
                color: "primary.dark",
              },
            }}
          >
            {children}
          </Typography>
        ),

        // Strong/Bold
        strong: ({ children }) => (
          <Typography component="strong" sx={{ fontWeight: 600 }}>
            {children}
          </Typography>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
          <Typography component="em" sx={{ fontStyle: "italic" }}>
            {children}
          </Typography>
        ),

        // Horizontal rule
        hr: () => (
          <Box
            sx={{
              border: "none",
              borderTop: "1px solid",
              borderColor: "grey.300",
              my: 2,
            }}
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
