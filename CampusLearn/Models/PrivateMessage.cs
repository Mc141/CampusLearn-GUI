using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class PrivateMessage
    {
        public int MessageId { get; set; }
        public int SenderId { get; set; }
        public int ReceiverId { get; set; }
        public string Text { get; set; } = "";
        public DateTime Timestamp { get; set; }

        public void SendMessage() => Console.WriteLine($"Message sent to {ReceiverId}: {Text}");
        public void ReceiveMessage() => Console.WriteLine($"Message received from {SenderId}");
    }
}
