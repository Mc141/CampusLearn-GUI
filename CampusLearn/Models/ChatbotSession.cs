using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class ChatbotSession
    {
        public int SessionId { get; set; }
        public int UserId { get; set; }
        public string Question { get; set; } = "";
        public string Response { get; set; } = "";
        public string Status { get; set; } = "";
        public int? TutorId { get; set; }
        public DateTime CreatedAt { get; set; }

        public void StartSession() => Console.WriteLine("Chatbot session started.");
        public void AnswerQuestion(string answer) => Console.WriteLine($"Chatbot answered: {answer}");
        public void EscalateToTutor() => Console.WriteLine("Escalated to tutor.");
        public void CloseSession() => Console.WriteLine("Session closed.");
    }
}
