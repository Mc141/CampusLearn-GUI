using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class TopicSubscription
    {
        public int UserId { get; set; }
        public int TopicId { get; set; }

        public void SubscribeTopic() => Console.WriteLine($"User {UserId} subscribed to topic {TopicId}");
        public void UnsubscribeTopic() => Console.WriteLine($"User {UserId} unsubscribed from topic {TopicId}");
    }
}
