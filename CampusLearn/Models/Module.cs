using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class Module
    {
        public int ModuleId { get; set; }
        public string ModuleCode { get; set; } = "";
        public string ModuleName { get; set; } = "";
        public int Credits { get; set; }
        public int Semester { get; set; }
        public int DepartmentId { get; set; }

        public List<Topic> Topics { get; set; } = new();

        public void AddTopic(Topic topic) => Console.WriteLine($"Topic {topic.TopicTitle} added to {ModuleName}");
        public void AssignTutor(Tutor tutor) => Console.WriteLine($"Tutor {tutor.FirstName} assigned to {ModuleName}");
    }
}
