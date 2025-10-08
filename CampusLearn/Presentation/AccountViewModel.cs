namespace CampusLearn.Presentation;

public partial class AccountViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    public AccountViewModel(INavigator navigator)
    {
        _navigator = navigator;
    }

    [RelayCommand]
    private async Task NavigateBack()
    {
        await _navigator.NavigateBackAsync(this);
    }

    [RelayCommand]
    private async Task NavigateToProfile()
    {
        await _navigator.NavigateViewModelAsync<ProfileViewModel>(this);
    }
}
