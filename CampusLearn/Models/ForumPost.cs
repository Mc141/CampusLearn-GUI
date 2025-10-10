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
    public void Upvote() { UpvoteCount++; }
    public void Downvote() { DownvoteCount++; }
}
