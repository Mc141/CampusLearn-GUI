using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class User
    {
        public int UserId { get; set; }
        public string Email { get; set; } = "";
        public string PasswordHash { get; set; } = "";
        public string FirstName { get; set; } = "";
        public string LastName { get; set; } = "";
        public int RoleId { get; set; }
        public int DepartmentId { get; set; }
        public bool ProfileCompleted { get; set; }
        public bool IsApproved { get; set; }

        public virtual void Login() => Console.WriteLine($"{Email} logged in.");
        public virtual void Logout() => Console.WriteLine($"{Email} logged out.");
        public void UpdateProfile() => Console.WriteLine($"{Email}'s profile updated.");
        public void ViewNotifications() => Console.WriteLine($"{Email} is viewing notifications.");
    }
}
