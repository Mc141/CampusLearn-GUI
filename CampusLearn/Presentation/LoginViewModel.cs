namespace CampusLearn.Presentation;

public partial class LoginViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    [ObservableProperty]
    private string statusMessage = string.Empty;

    public ICommand MicrosoftLoginCommand { get; }

    public LoginViewModel(INavigator navigator)
    {
        _navigator = navigator;
        MicrosoftLoginCommand = new RelayCommand(OnMicrosoftLogin);
    }

    private async void OnMicrosoftLogin()
    {
        // Placeholder – will call MSAL later
        StatusMessage = "Pretend Microsoft login successful.";
        // TODO: Plug in MSAL authentication here

        // Navigate to Forum
        await _navigator.NavigateViewModelAsync<ForumViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }
}
