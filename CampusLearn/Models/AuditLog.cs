using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class AuditLog
    {
        public int LogId { get; set; }
        public int UserId { get; set; }
        public string ActionType { get; set; } = "";
        public string EntityType { get; set; } = "";
        public int EntityId { get; set; }
        public string Details { get; set; } = "";
        public DateTime Timestamp { get; set; }

        public void LogAction() => Console.WriteLine($"Log {LogId}: {ActionType} on {EntityType} {EntityId}");
        public void ViewLogs() => Console.WriteLine($"Viewing logs for user {UserId}");
    }
}
