using CampusLearn.Services;

namespace CampusLearn.Presentation;

public partial class LoginViewModel : ObservableObject
{
    private readonly INavigator _navigator;
    private readonly CampusLearn.Services.IAuthenticationService _authService;

    [ObservableProperty]
    private string email = string.Empty;

    [ObservableProperty]
    private string password = string.Empty;

    [ObservableProperty]
    private string fullName = string.Empty;

    [ObservableProperty]
    private string statusMessage = string.Empty;

    [ObservableProperty]
    private bool isLoading = false;

    [ObservableProperty]
    private bool isLoginMode = true; // Toggle between Login and Register

    public LoginViewModel(INavigator navigator, CampusLearn.Services.IAuthenticationService authService)
    {
        _navigator = navigator;
        _authService = authService;
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password))
        {
            StatusMessage = "Please enter email and password";
            return;
        }

        IsLoading = true;
        StatusMessage = "Signing in...";

        try
        {
            var result = await _authService.SignInAsync(Email.Trim(), Password);

            if (result.Success)
            {
                StatusMessage = "Login successful!";

                // Navigate to Forum
                await Task.Delay(500); // Brief delay to show success message
                await _navigator.NavigateViewModelAsync<ForumViewModel>(this, qualifier: Qualifiers.ClearBackStack);
            }
            else
            {
                StatusMessage = result.ErrorMessage ?? "Login failed";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Error: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task RegisterAsync()
    {
        try
        {
            // Validation
            if (string.IsNullOrWhiteSpace(Email) || string.IsNullOrWhiteSpace(Password) || string.IsNullOrWhiteSpace(FullName))
            {
                StatusMessage = "Please fill in all fields";
                return;
            }

            if (Password.Length < 6)
            {
                StatusMessage = "Password must be at least 6 characters";
                return;
            }

            IsLoading = true;
            StatusMessage = "Creating account...";

            System.Diagnostics.Debug.WriteLine($"📝 Starting registration for: {Email}");

            var result = await _authService.SignUpAsync(Email.Trim(), Password, FullName.Trim());

            System.Diagnostics.Debug.WriteLine($"✅ Registration result - Success: {result.Success}, Error: {result.ErrorMessage}");

            if (result.Success)
            {
                if (result.RequiresEmailConfirmation)
                {
                    StatusMessage = result.ErrorMessage ?? "Registration successful! Please check your email to verify your account.";

                    System.Diagnostics.Debug.WriteLine($"✉️ Registration successful! Check email for verification.");

                    // Clear form
                    Email = string.Empty;
                    Password = string.Empty;
                    FullName = string.Empty;

                    // Switch to login mode after delay
                    await Task.Delay(3000);
                    IsLoginMode = true;
                    StatusMessage = "Please check your email and click the confirmation link, then return here to login.";
                }
                else
                {
                    StatusMessage = "Registration successful! You can now login.";

                    // Clear form
                    Email = string.Empty;
                    Password = string.Empty;
                    FullName = string.Empty;

                    // Switch to login mode after delay
                    await Task.Delay(2000);
                    IsLoginMode = true;
                    StatusMessage = "You can now login";
                }
            }
            else
            {
                StatusMessage = result.ErrorMessage ?? "Registration failed";
                System.Diagnostics.Debug.WriteLine($"❌ Registration failed: {result.ErrorMessage}");
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Error: {ex.Message}";
            System.Diagnostics.Debug.WriteLine($"💥 Exception during registration: {ex}");
        }
        finally
        {
            IsLoading = false;
            System.Diagnostics.Debug.WriteLine($"🏁 Registration process completed. IsLoading: {IsLoading}");
        }
    }

    [RelayCommand]
    private void ToggleMode()
    {
        IsLoginMode = !IsLoginMode;
        StatusMessage = string.Empty;
        Password = string.Empty;

        // Explicitly notify that IsLoginMode changed (should be automatic with ObservableProperty, but just in case)
        OnPropertyChanged(nameof(IsLoginMode));
    }

    [RelayCommand]
    private async Task ForgotPasswordAsync()
    {
        if (string.IsNullOrWhiteSpace(Email))
        {
            StatusMessage = "Please enter your email address";
            return;
        }

        IsLoading = true;
        StatusMessage = "Sending password reset email...";

        try
        {
            var success = await _authService.SendPasswordResetEmailAsync(Email.Trim());

            if (success)
            {
                StatusMessage = "Password reset email sent! Check your inbox.";
            }
            else
            {
                StatusMessage = "Failed to send reset email. Please try again.";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Error: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }
}
