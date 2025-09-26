namespace CampusLearn.Presentation;

public partial class LoginViewModel : ObservableObject
{
    [ObservableProperty]
    private string statusMessage = string.Empty;

    public ICommand MicrosoftLoginCommand { get; }

    public LoginViewModel()
    {
        MicrosoftLoginCommand = new RelayCommand(OnMicrosoftLogin);
    }

    private void OnMicrosoftLogin()
    {
        // Placeholder – will call MSAL later
        StatusMessage = "Pretend Microsoft login successful.";
        // TODO: Plug in MSAL authentication here
        // TODO: Navigate to StudentDashboardPage
    }
}
