using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace CampusLearn.Models;

[Table("post_likes")]
public class PostLike : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("post_id")]
    public Guid PostId { get; set; }

    [Column("user_id")]
    public Guid UserId { get; set; }

    [Column("like_type")]
    public string LikeType { get; set; } = "like"; // "like" or "dislike"

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}
