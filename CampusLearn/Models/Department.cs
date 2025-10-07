using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class Department
    {
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = "";
        public string DepartmentHead { get; set; } = "";

        public void AssignUser(User user) =>
            Console.WriteLine($"{user.FirstName} assigned to {DepartmentName}");

        public void ManageModules() =>
            Console.WriteLine($"{DepartmentName} managing modules...");
    }
}
