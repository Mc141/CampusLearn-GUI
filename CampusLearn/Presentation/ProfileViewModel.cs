namespace CampusLearn.Presentation;

public partial class ProfileViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    public ProfileViewModel(INavigator navigator)
    {
        _navigator = navigator;
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
}
