using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class TutorSubscription
    {
        public int SubscriberId { get; set; }
        public int TutorId { get; set; }

        public void SubscribeTutor() => Console.WriteLine($"User {SubscriberId} subscribed to tutor {TutorId}");
        public void UnsubscribeTutor() => Console.WriteLine($"User {SubscriberId} unsubscribed from tutor {TutorId}");
    }
}
