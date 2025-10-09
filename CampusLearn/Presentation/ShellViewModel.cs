using CampusLearn.Services;

namespace CampusLearn.Presentation;

public class ShellViewModel
{
    private readonly CampusLearn.Services.IAuthenticationService _authentication;
    private readonly INavigator _navigator;

    public ShellViewModel(
        CampusLearn.Services.IAuthenticationService authentication,
        INavigator navigator)
    {
        _navigator = navigator;
        _authentication = authentication;
        _authentication.AuthStateChanged += OnAuthStateChanged;
    }

    private async void OnAuthStateChanged(object? sender, AuthStateChangedEventArgs e)
    {
        // If user logged out (not authenticated), navigate to login page
        if (!e.IsAuthenticated)
        {
            await _navigator.NavigateViewModelAsync<LoginViewModel>(this, qualifier: Qualifiers.ClearBackStack);
        }
    }
}
