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
}
