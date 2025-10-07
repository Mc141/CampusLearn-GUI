using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class UserRole
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; } = "";
        public string RoleDescription { get; set; } = "";
        public int PermissionsLevel { get; set; }

        public void AssignRole(User user) =>
            Console.WriteLine($"{user.FirstName} assigned role {RoleName}");

        public void CheckPermissions(string action) =>
            Console.WriteLine($"Checking if {RoleName} can perform {action}");
    }
}
