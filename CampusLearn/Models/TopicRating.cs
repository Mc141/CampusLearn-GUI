using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class TopicRating
    {
        public int TopicId { get; set; }
        public int UserId { get; set; }
        public int Rating { get; set; }

        public void RateTopic() => Console.WriteLine($"User {UserId} rated topic {TopicId} with {Rating} stars");
        public void UpdateRating(int newRating) => Console.WriteLine($"Rating updated to {newRating}");
    }
}
