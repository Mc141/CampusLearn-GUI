using CampusLearn.Services;

namespace CampusLearn.Presentation;

public partial class ProfileViewModel : ObservableObject
{
    private readonly INavigator _navigator;
    private readonly CampusLearn.Services.IAuthenticationService _authService;

    [ObservableProperty]
    private string userName = "Loading...";

    [ObservableProperty]
    private string userEmail = "";

    [ObservableProperty]
    private string userRole = "Student";

    public ProfileViewModel(INavigator navigator, CampusLearn.Services.IAuthenticationService authService)
    {
        _navigator = navigator;
        _authService = authService;

        // Load user info
        LoadUserInfo();
    }

    private async void LoadUserInfo()
    {
        var user = await _authService.GetCurrentUserAsync();
        if (user != null)
        {
            UserName = $"{user.FullName} ({user.Role})";
            UserEmail = user.Email;
            UserRole = user.Role;
        }
    }

    [RelayCommand]
    private async Task NavigateBack()
    {
        await _navigator.NavigateBackAsync(this);
    }

    [RelayCommand]
    private async Task NavigateToAccount()
    {
        await _navigator.NavigateViewModelAsync<AccountViewModel>(this);
    }

    [RelayCommand]
    private async Task NavigateToSettings()
    {
        await _navigator.NavigateViewModelAsync<SettingsViewModel>(this);
    }

    [RelayCommand]
    private async Task NavigateToHelp()
    {
        await _navigator.NavigateViewModelAsync<HelpViewModel>(this);
    }

    [RelayCommand]
    private async Task NavigateToResources()
    {
        await _navigator.NavigateViewModelAsync<ResourcesLibraryViewModel>(this);
    }

    [RelayCommand]
    private async Task SignOut()
    {
        // Sign out from Supabase
        var success = await _authService.SignOutAsync();

        if (success)
        {
            // Navigate to login page (ShellViewModel will handle this via AuthStateChanged event)
            await _navigator.NavigateViewModelAsync<LoginViewModel>(this, qualifier: Qualifiers.ClearBackStack);
        }
    }
}
