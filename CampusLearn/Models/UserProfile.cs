using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace CampusLearn.Models;

[Table("profiles")]
public class UserProfile : BaseModel
{
    [PrimaryKey("id", false)]
    public Guid Id { get; set; }

    [Column("full_name")]
    public string FullName { get; set; } = string.Empty;

    [Column("student_number")]
    public string? StudentNumber { get; set; }

    [Column("role")]
    public string Role { get; set; } = "Student";

    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [Column("bio")]
    public string? Bio { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
