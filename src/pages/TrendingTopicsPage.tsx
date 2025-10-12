import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import {
  TrendingUp,
  School,
  People,
  ThumbUp,
  Comment,
  Schedule,
  Visibility,
  Star,
  StarBorder,
  FilterList,
  Search,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { mockTopics, mockQuestions, mockForumPosts } from "../data/mockData";

interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  module: string;
  type: "topic" | "question" | "forum";
  engagement: number;
  growth: number;
  participants: number;
  lastActivity: Date;
  tags: string[];
}

const TrendingTopicsPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState("week");

  // Generate trending topics from mock data
  const trendingTopics: TrendingTopic[] = [
    {
      id: "1",
      title: "Machine Learning Algorithms",
      description:
        "Understanding supervised and unsupervised learning algorithms",
      module: "BCS101",
      type: "topic",
      engagement: 85,
      growth: 23,
      participants: 45,
      lastActivity: new Date("2024-01-20"),
      tags: ["machine-learning", "algorithms", "statistics"],
    },
    {
      id: "2",
      title: "React Hooks vs Class Components",
      description:
        "What are the advantages of using React hooks over class components?",
      module: "BIT101",
      type: "question",
      engagement: 78,
      growth: 18,
      participants: 32,
      lastActivity: new Date("2024-01-19"),
      tags: ["react", "hooks", "components"],
    },
    {
      id: "3",
      title: "Database Design Patterns",
      description:
        "Discussion on normalization, indexing strategies, and performance optimization",
      module: "BIT102",
      type: "forum",
      engagement: 72,
      growth: 15,
      participants: 28,
      lastActivity: new Date("2024-01-18"),
      tags: ["database", "design", "patterns"],
    },
    {
      id: "4",
      title: "Cybersecurity Best Practices",
      description: "Information security, ethical hacking, and risk management",
      module: "BCS201",
      type: "topic",
      engagement: 68,
      growth: 12,
      participants: 35,
      lastActivity: new Date("2024-01-17"),
      tags: ["cybersecurity", "security", "ethics"],
    },
    {
      id: "5",
      title: "Cloud Computing Architecture",
      description: "How to design scalable cloud applications?",
      module: "DIP101",
      type: "question",
      engagement: 65,
      growth: 20,
      participants: 22,
      lastActivity: new Date("2024-01-16"),
      tags: ["cloud", "architecture", "scalability"],
    },
  ];

  const getEngagementColor = (engagement: number) => {
    if (engagement >= 80) return "success";
    if (engagement >= 60) return "warning";
    return "error";
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 15) return <TrendingUp color="success" />;
    if (growth > 5) return <TrendingUp color="warning" />;
    return <TrendingUp color="error" />;
  };

  const renderTrendingList = () => (
    <Box>
      <Grid container spacing={2}>
        {trendingTopics.map((topic, index) => (
          <Grid item xs={12} md={6} key={topic.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      #{index + 1} {topic.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {topic.description}
                    </Typography>
                  </Box>
                  <Chip
                    label={topic.type.toUpperCase()}
                    size="small"
                    color={
                      topic.type === "topic"
                        ? "primary"
                        : topic.type === "question"
                        ? "secondary"
                        : "success"
                    }
                  />
                </Box>

                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}
                >
                  {topic.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Engagement Score
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {topic.engagement}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={topic.engagement}
                    color={getEngagementColor(topic.engagement)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h6" color="primary">
                        {topic.participants}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Participants
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: "center" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 0.5,
                        }}
                      >
                        {getGrowthIcon(topic.growth)}
                        <Typography variant="h6" sx={{ ml: 0.5 }}>
                          {topic.growth}%
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Growth
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="h6" color="secondary">
                        {topic.module}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Module
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Last activity: {topic.lastActivity.toLocaleDateString()}
                  </Typography>
                  <Button size="small" variant="outlined">
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderAnalytics = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUp
                  color="primary"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                Top Performing Modules
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <School color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="BCS101 - Data Science Fundamentals"
                    secondary="85% engagement, 45 participants"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <School color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="BIT101 - Web Development"
                    secondary="78% engagement, 32 participants"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <School color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="BIT102 - Database Systems"
                    secondary="72% engagement, 28 participants"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <People
                  color="primary"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                Most Active Users
              </Typography>
              <List>
                <ListItem>
                  <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>JD</Avatar>
                  <ListItemText
                    primary="John Doe"
                    secondary="24 questions, 18 answers"
                  />
                </ListItem>
                <ListItem>
                  <Avatar sx={{ mr: 2, bgcolor: "secondary.main" }}>JS</Avatar>
                  <ListItemText
                    primary="Jane Smith"
                    secondary="19 questions, 22 answers"
                  />
                </ListItem>
                <ListItem>
                  <Avatar sx={{ mr: 2, bgcolor: "success.main" }}>MJ</Avatar>
                  <ListItemText
                    primary="Mike Johnson"
                    secondary="16 questions, 15 answers"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderTimeframeSelector = () => (
    <Box sx={{ mb: 3 }}>
      <Tabs
        value={timeframe}
        onChange={(e, newValue) => setTimeframe(newValue)}
      >
        <Tab label="Today" value="today" />
        <Tab label="This Week" value="week" />
        <Tab label="This Month" value="month" />
        <Tab label="All Time" value="all" />
      </Tabs>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Trending Topics 🔥
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontSize: "1.1rem" }}
        >
          Discover what's popular and engaging in the CampusLearn community
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Trending topics are calculated based on engagement, participation, and
        recent activity. Updated every hour to reflect current community
        interests.
      </Alert>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
          >
            <Tab label="Trending Topics" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Box>
              {renderTimeframeSelector()}
              {renderTrendingList()}
            </Box>
          )}
          {tabValue === 1 && renderAnalytics()}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TrendingTopicsPage;


