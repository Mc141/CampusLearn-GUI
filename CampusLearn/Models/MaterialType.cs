using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class MaterialType
    {
        public int TypeId { get; set; }
        public string TypeName { get; set; } = "";
        public string MimeType { get; set; } = "";
        public int MaxSizeKb { get; set; }
        public string Description { get; set; } = "";

        public void ValidateUpload() => Console.WriteLine($"Validating file of type {TypeName}");
        public string GetMimeType() => MimeType;
    }
}
