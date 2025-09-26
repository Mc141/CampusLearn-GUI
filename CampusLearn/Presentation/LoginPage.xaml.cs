namespace CampusLearn.Presentation;

public sealed partial class LoginPage : Page
{
    public LoginPage()
    {
        this.InitializeComponent();
        DataContext = new LoginViewModel();
    }
}
