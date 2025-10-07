using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class NotificationType
    {
        public int TypeId { get; set; }
        public string TypeName { get; set; } = "";
        public string Description { get; set; } = "";
        public int PriorityLevel { get; set; }

        public void TriggerNotification() => Console.WriteLine($"Notification type {TypeName} triggered.");
        public void UpdateType() => Console.WriteLine($"Notification type {TypeName} updated.");
    }
}
