using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class LearningMaterial
    {
        public int MaterialId { get; set; }
        public string Title { get; set; } = "";
        public int TypeId { get; set; }
        public int SizeKb { get; set; }
        public string Url { get; set; } = "";
        public DateTime UploadedAt { get; set; }
        public int UploaderId { get; set; }
        public int TopicId { get; set; }

        public void Upload() => Console.WriteLine($"{Title} uploaded.");
        public void Download() => Console.WriteLine($"{Title} downloaded.");
        public void View() => Console.WriteLine($"{Title} viewed.");
    }
}
