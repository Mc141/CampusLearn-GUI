namespace CampusLearn.Services;

public interface IAuthenticationService
{
    Task<AuthResult> SignUpAsync(string email, string password, string fullName);
    Task<AuthResult> SignInAsync(string email, string password);
    Task<bool> SignOutAsync();
    Task<bool> SendPasswordResetEmailAsync(string email);
    Task<bool> ConfirmEmailAsync(string token);
    Task<UserProfile?> GetCurrentUserAsync();
    bool IsAuthenticated { get; }
    string? CurrentUserId { get; }
    event EventHandler<AuthStateChangedEventArgs>? AuthStateChanged;
}

public class AuthResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public UserProfile? User { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
}

public class UserProfile
{
    public string Id { get; set; } = "";
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";
    public bool EmailConfirmed { get; set; }
    public string Role { get; set; } = "Student"; // Student, Tutor, Admin
    public DateTime CreatedAt { get; set; }
}

public class AuthStateChangedEventArgs : EventArgs
{
    public bool IsAuthenticated { get; set; }
    public UserProfile? User { get; set; }
}
