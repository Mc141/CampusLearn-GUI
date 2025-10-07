using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class Tutor : User
    {
        public List<Module> ModulesAssigned { get; set; } = new();
        public List<Topic> TopicsManaged { get; set; } = new();

        public void CreateTopic(string title, Module module) =>
            Console.WriteLine($"{FirstName} created topic {title} in module {module.ModuleName}.");

        public void RespondQuery(string question) =>
            Console.WriteLine($"{FirstName} responded to query: {question}");

        public void UploadMaterial(LearningMaterial material) =>
            Console.WriteLine($"{FirstName} uploaded material {material.Title}");

        public void ProvideFeedback(Student student) =>
            Console.WriteLine($"{FirstName} provided feedback to {student.FirstName}");
    }
}
