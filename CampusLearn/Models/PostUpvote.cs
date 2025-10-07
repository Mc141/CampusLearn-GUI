using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class PostUpvote
    {
        public int PostId { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }

        public void UpvotePost() => Console.WriteLine($"Post {PostId} upvoted by user {UserId}");
        public void RemoveUpvote() => Console.WriteLine($"Upvote removed by user {UserId}");
    }
}
