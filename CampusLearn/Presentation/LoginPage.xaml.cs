namespace CampusLearn.Presentation;

public sealed partial class LoginPage : Page
{
    public LoginViewModel? ViewModel => DataContext as LoginViewModel;

    public LoginPage()
    {
        this.InitializeComponent();
        this.Loaded += LoginPage_Loaded;
        this.DataContextChanged += LoginPage_DataContextChanged;
    }

    private void LoginPage_DataContextChanged(FrameworkElement sender, DataContextChangedEventArgs args)
    {
        if (ViewModel != null)
        {
            ViewModel.PropertyChanged -= ViewModel_PropertyChanged; // Remove old handler
            ViewModel.PropertyChanged += ViewModel_PropertyChanged;
            UpdateVisualState();
        }
    }

    private void LoginPage_Loaded(object sender, RoutedEventArgs e)
    {
        UpdateVisualState();
    }

    private void ViewModel_PropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(LoginViewModel.IsLoginMode))
        {
            UpdateVisualState();
        }
    }

    private void UpdateVisualState()
    {
        if (ViewModel == null) return;

        var stateName = ViewModel.IsLoginMode ? "LoginMode" : "RegisterMode";
        System.Diagnostics.Debug.WriteLine($"🔄 Switching to visual state: {stateName}");
        var result = VisualStateManager.GoToState(this, stateName, useTransitions: true);
        System.Diagnostics.Debug.WriteLine($"✅ Visual state changed: {result}");
    }

    private async void OnRegisterButtonClick(object sender, RoutedEventArgs e)
    {
        System.Diagnostics.Debug.WriteLine("🔘 Register button CLICKED via Click event!");

        if (ViewModel == null)
        {
            System.Diagnostics.Debug.WriteLine("❌ ViewModel is null");
            return;
        }

        System.Diagnostics.Debug.WriteLine($"📧 Email: {ViewModel.Email}");
        System.Diagnostics.Debug.WriteLine($"👤 Full Name: {ViewModel.FullName}");
        System.Diagnostics.Debug.WriteLine($"🔒 Password: {(string.IsNullOrEmpty(ViewModel.Password) ? "Empty" : "Has value")}");
        System.Diagnostics.Debug.WriteLine($"⏳ IsLoading: {ViewModel.IsLoading}");

        if (ViewModel.RegisterCommand?.CanExecute(null) == true)
        {
            System.Diagnostics.Debug.WriteLine("✅ Executing RegisterCommand...");
            await ViewModel.RegisterCommand.ExecuteAsync(null);
        }
        else
        {
            System.Diagnostics.Debug.WriteLine("❌ RegisterCommand cannot execute or is null");
        }
    }

    private void OnPasswordChanged(object sender, RoutedEventArgs e)
    {
        if (ViewModel != null && sender is PasswordBox passwordBox)
        {
            ViewModel.Password = passwordBox.Password;
            System.Diagnostics.Debug.WriteLine($"🔒 Password updated: {(string.IsNullOrEmpty(passwordBox.Password) ? "Empty" : $"{passwordBox.Password.Length} chars")}");
        }
    }

    private async void OnLoginButtonClick(object sender, RoutedEventArgs e)
    {
        System.Diagnostics.Debug.WriteLine("🔘 Login button CLICKED via Click event!");
        
        if (ViewModel == null)
        {
            System.Diagnostics.Debug.WriteLine("❌ ViewModel is null");
            return;
        }

        System.Diagnostics.Debug.WriteLine($"📧 Email: {ViewModel.Email}");
        System.Diagnostics.Debug.WriteLine($"🔒 Password: {(string.IsNullOrEmpty(ViewModel.Password) ? "Empty" : "Has value")}");
        System.Diagnostics.Debug.WriteLine($"⏳ IsLoading: {ViewModel.IsLoading}");
        
        if (ViewModel.LoginCommand?.CanExecute(null) == true)
        {
            System.Diagnostics.Debug.WriteLine("✅ Executing LoginCommand...");
            await ViewModel.LoginCommand.ExecuteAsync(null);
        }
        else
        {
            System.Diagnostics.Debug.WriteLine("❌ LoginCommand cannot execute or is null");
        }
    }
}
