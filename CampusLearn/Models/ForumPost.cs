namespace Uml_Implementation.Entities;

public class ForumPost
{
    public int PostId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public int AuthorUserId { get; set; }
    public bool AnonymousFlag { get; set; }
    public DateTime CreatedAt { get; set; }
    public int UpvoteCount { get; set; }
    public int DownvoteCount { get; set; }
    public int ReplyCount { get; set; }
    public int TopicId { get; set; }
    public int ParentPostId { get; set; }

    // New properties for database integration
    public Guid DbId { get; set; } // Maps to database UUID
    public bool IsLiked { get; set; } // Current user's like status
    public bool IsDisliked { get; set; } // Current user's dislike status

    public void Upvote() { UpvoteCount++; }
    public void Downvote() { DownvoteCount++; }

    // Helper method to get time since post
    public string GetTimeSincePost()
    {
        var timeSpan = DateTime.Now - CreatedAt;

        if (timeSpan.TotalMinutes < 1)
            return "Just now";
        else if (timeSpan.TotalMinutes < 60)
            return $"{(int)timeSpan.TotalMinutes}m ago";
        else if (timeSpan.TotalHours < 24)
            return $"{(int)timeSpan.TotalHours}h ago";
        else if (timeSpan.TotalDays < 7)
            return $"{(int)timeSpan.TotalDays}d ago";
        else
            return CreatedAt.ToString("MMM dd, yyyy");
    }

    // Properties for UI binding
    public string DisplayName => AuthorName;
    public string TimeAgo => GetTimeSincePost();
}
