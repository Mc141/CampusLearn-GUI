using Supabase.Gotrue;
using Supabase.Gotrue.Interfaces;

namespace CampusLearn.Services;

/// <summary>
/// Supabase Authentication Service using the official Supabase .NET library
/// Provides authentication functionality for the CampusLearn app
/// </summary>
public class SupabaseAuthService : IAuthenticationService
{
    private readonly SupabaseService _supabaseService;
    private UserProfile? _currentUser;

    public bool IsAuthenticated => _currentUser != null && !string.IsNullOrEmpty(_currentUser.Id);
    public string? CurrentUserId => _currentUser?.Id;

    public event EventHandler<AuthStateChangedEventArgs>? AuthStateChanged;

    public SupabaseAuthService(SupabaseService supabaseService)
    {
        _supabaseService = supabaseService;
    }

    public async Task<AuthResult> SignUpAsync(string email, string password, string fullName)
    {
        try
        {
            System.Diagnostics.Debug.WriteLine($"🔐 SignUpAsync called with email: {email}");

            // Validate Belgium Campus email (support both formats)
            bool isValidEmail = email.EndsWith("@belgiumcampus.ac.za", StringComparison.OrdinalIgnoreCase) ||
                                email.EndsWith("@student.belgiumcampus.ac.za", StringComparison.OrdinalIgnoreCase);

            if (!isValidEmail)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Email validation failed: {email}");
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Only Belgium Campus emails (@belgiumcampus.ac.za or @student.belgiumcampus.ac.za) are allowed"
                };
            }

            System.Diagnostics.Debug.WriteLine($"✅ Email validation passed");

            // Create signup options with full name
            var signUpOptions = new SignUpOptions
            {
                Data = new Dictionary<string, object>
                {
                    { "full_name", fullName }
                }
            };

            System.Diagnostics.Debug.WriteLine($"📡 Sending signup request to Supabase");

            var response = await _supabaseService.Auth.SignUp(email, password, signUpOptions);

            System.Diagnostics.Debug.WriteLine($"📥 Supabase response - Has User: {response.User != null}");

            if (response.User != null)
            {
                System.Diagnostics.Debug.WriteLine($"✅ User created successfully: {response.User.Email}");

                _currentUser = new UserProfile
                {
                    Id = response.User.Id,
                    Email = response.User.Email ?? email,
                    FullName = fullName,
                    EmailConfirmed = response.User.EmailConfirmedAt != null,
                    CreatedAt = response.User.CreatedAt ?? DateTime.UtcNow
                };

                // Check if user is immediately authenticated (has session)
                var currentSession = _supabaseService.Auth.CurrentSession;
                bool isAuthenticated = currentSession != null;

                if (isAuthenticated)
                {
                    System.Diagnostics.Debug.WriteLine($"✅ User authenticated immediately");

                    AuthStateChanged?.Invoke(this, new AuthStateChangedEventArgs
                    {
                        IsAuthenticated = true,
                        User = _currentUser
                    });

                    return new AuthResult
                    {
                        Success = true,
                        User = _currentUser,
                        AccessToken = currentSession?.AccessToken,
                        RefreshToken = currentSession?.RefreshToken
                    };
                }
                else
                {
                    System.Diagnostics.Debug.WriteLine($"⚠️ User needs email confirmation");

                    // User registered but needs email confirmation
                    return new AuthResult
                    {
                        Success = true,
                        User = _currentUser,
                        ErrorMessage = "Registration successful! Please check your email and click the confirmation link to activate your account. You will be redirected to the login page.",
                        RequiresEmailConfirmation = true
                    };
                }
            }

            System.Diagnostics.Debug.WriteLine($"❌ Signup failed - no user data in response");
            return new AuthResult { Success = false, ErrorMessage = "Registration failed" };
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Exception in SignUpAsync: {ex}");
            return new AuthResult { Success = false, ErrorMessage = ex.Message };
        }
    }

    public async Task<AuthResult> SignInAsync(string email, string password)
    {
        try
        {
            // Validate Belgium Campus email (support both formats)
            bool isValidEmail = email.EndsWith("@belgiumcampus.ac.za", StringComparison.OrdinalIgnoreCase) ||
                                email.EndsWith("@student.belgiumcampus.ac.za", StringComparison.OrdinalIgnoreCase);

            if (!isValidEmail)
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Only Belgium Campus emails (@belgiumcampus.ac.za or @student.belgiumcampus.ac.za) are allowed"
                };
            }

            System.Diagnostics.Debug.WriteLine($"🔐 SignInAsync called with email: {email}");

            var response = await _supabaseService.Auth.SignIn(email, password);

            System.Diagnostics.Debug.WriteLine($"📥 Login response - Has User: {response.User != null}");

            if (response.User != null)
            {
                // Check if email is confirmed
                if (response.User.EmailConfirmedAt == null)
                {
                    System.Diagnostics.Debug.WriteLine($"❌ Email not confirmed for: {email}");
                    return new AuthResult
                    {
                        Success = false,
                        ErrorMessage = "Please verify your email before logging in. Check your inbox for the verification link."
                    };
                }

                System.Diagnostics.Debug.WriteLine($"✅ User logged in successfully: {response.User.Email}");

                _currentUser = new UserProfile
                {
                    Id = response.User.Id,
                    Email = response.User.Email ?? email,
                    FullName = (response.User.UserMetadata != null && response.User.UserMetadata.ContainsKey("full_name"))
                        ? response.User.UserMetadata["full_name"]?.ToString() ?? email
                        : email,
                    EmailConfirmed = response.User.EmailConfirmedAt != null,
                    CreatedAt = response.User.CreatedAt ?? DateTime.UtcNow
                };

                AuthStateChanged?.Invoke(this, new AuthStateChangedEventArgs
                {
                    IsAuthenticated = true,
                    User = _currentUser
                });

                // Get current session for tokens
                var currentSession = _supabaseService.Auth.CurrentSession;

                return new AuthResult
                {
                    Success = true,
                    User = _currentUser,
                    AccessToken = currentSession?.AccessToken,
                    RefreshToken = currentSession?.RefreshToken
                };
            }

            System.Diagnostics.Debug.WriteLine($"❌ Login failed - no user or session data");
            return new AuthResult { Success = false, ErrorMessage = "Login failed. Check your credentials." };
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Exception in SignInAsync: {ex}");

            // Check if the error is about email not confirmed
            if (ex.Message.Contains("email_not_confirmed") || ex.Message.Contains("Email not confirmed"))
            {
                return new AuthResult
                {
                    Success = false,
                    ErrorMessage = "Please verify your email before logging in. Check your inbox for the verification link and click it to activate your account."
                };
            }

            return new AuthResult { Success = false, ErrorMessage = ex.Message };
        }
    }

    public async Task<bool> SignOutAsync()
    {
        try
        {
            await _supabaseService.Auth.SignOut();

            _currentUser = null;

            AuthStateChanged?.Invoke(this, new AuthStateChangedEventArgs
            {
                IsAuthenticated = false,
                User = null
            });

            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Exception in SignOutAsync: {ex}");
            return false;
        }
    }

    public async Task<bool> SendPasswordResetEmailAsync(string email)
    {
        try
        {
            await _supabaseService.Auth.ResetPasswordForEmail(email);
            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Exception in SendPasswordResetEmailAsync: {ex}");
            return false;
        }
    }

    public async Task<bool> ConfirmEmailAsync(string token)
    {
        try
        {
            // For now, just return true - email confirmation is handled by Supabase
            return true;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Exception in ConfirmEmailAsync: {ex}");
            return false;
        }
    }

    public async Task<UserProfile?> GetCurrentUserAsync()
    {
        try
        {
            if (_currentUser != null)
                return _currentUser;

            var user = _supabaseService.Auth.CurrentUser;
            if (user != null)
            {
                _currentUser = new UserProfile
                {
                    Id = user.Id,
                    Email = user.Email ?? "",
                    FullName = (user.UserMetadata != null && user.UserMetadata.ContainsKey("full_name"))
                        ? user.UserMetadata["full_name"]?.ToString() ?? user.Email ?? ""
                        : user.Email ?? "",
                    EmailConfirmed = user.EmailConfirmedAt != null,
                    CreatedAt = user.CreatedAt ?? DateTime.UtcNow
                };

                return _currentUser;
            }

            return null;
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Exception in GetCurrentUserAsync: {ex}");
            return null;
        }
    }
}