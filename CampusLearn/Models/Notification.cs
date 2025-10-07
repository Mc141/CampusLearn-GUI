using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class Notification
    {
        public int NotificationId { get; set; }
        public int UserId { get; set; }
        public int TypeId { get; set; }
        public string Content { get; set; } = "";
        public string Status { get; set; } = "";
        public DateTime Timestamp { get; set; }

        public void SendNotification() => Console.WriteLine($"Notification sent: {Content}");
        public void MarkAsRead() => Console.WriteLine($"Notification {NotificationId} marked as read.");
        public void DismissNotification() => Console.WriteLine($"Notification {NotificationId} dismissed.");
    }
}
