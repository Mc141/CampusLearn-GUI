using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class Topic
    {
        public int TopicId { get; set; }
        public string TopicTitle { get; set; } = "";
        public int CreatorUserId { get; set; }
        public int ModuleId { get; set; }
        public int TutorAssignedUserId { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<ForumPost> Posts { get; set; } = new();
        public List<LearningMaterial> Materials { get; set; } = new();

        public void NotifySubscribers() => Console.WriteLine($"Subscribers of {TopicTitle} notified.");
        public void AddQuestion(string question) => Console.WriteLine($"Question added to {TopicTitle}: {question}");
        public void AssignTutor(Tutor tutor) => Console.WriteLine($"{tutor.FirstName} assigned to {TopicTitle}");
        public void CloseTopic() => Console.WriteLine($"Topic {TopicTitle} closed.");
    }
}
