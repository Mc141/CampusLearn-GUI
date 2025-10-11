using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace CampusLearn.Models;

[Table("forum_posts")]
public class DbForumPost : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("user_name")]
    public string UserName { get; set; } = string.Empty;

    [Column("is_anonymous")]
    public bool IsAnonymous { get; set; }

    [Column("likes_count")]
    public int LikesCount { get; set; }

    [Column("dislikes_count")]
    public int DislikesCount { get; set; }

    [Column("comments_count")]
    public int CommentsCount { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
