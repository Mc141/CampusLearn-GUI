using Microsoft.Extensions.Configuration;
using CampusLearn.Services;

namespace CampusLearn;

public partial class App : Application
{
    public App()
    {
        this.InitializeComponent();
    }

    protected Window? MainWindow { get; private set; }
    protected IHost? Host { get; private set; }

    protected async override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var builder = this.CreateBuilder(args)
            .UseToolkitNavigation()
            .Configure(host => host
#if DEBUG
                .UseEnvironment(Environments.Development)
#endif
                .UseLogging((context, logBuilder) =>
                {
                    logBuilder
                        .SetMinimumLevel(
                            context.HostingEnvironment.IsDevelopment()
                                ? LogLevel.Information
                                : LogLevel.Warning)
                        .CoreLogLevel(LogLevel.Warning);
                }, enableUnoLogging: true)
                .UseConfiguration(configBuilder =>
                {
                    // Standard .NET way to load config
                    configBuilder.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
                    configBuilder.AddEnvironmentVariables();
                })
                .UseLocalization()
                .ConfigureServices((context, services) =>
                {
                    // Register our Supabase Authentication Service
                    services.AddHttpClient<CampusLearn.Services.IAuthenticationService, SupabaseAuthService>();
                    
                    // Example: bind AppConfig section if it exists
                    services.Configure<AppConfig>(context.Configuration.GetSection("AppConfig"));
                })
                .UseNavigation(RegisterRoutes)
            );

        MainWindow = builder.Window;

#if DEBUG
        MainWindow.UseStudio();
#endif
        // Commented out unless you have Uno.Resizetizer installed:
        // MainWindow.SetWindowIcon();

        Host = await builder.NavigateAsync<Shell>(
            initialNavigate: async (services, navigator) =>
            {
                var auth = services.GetRequiredService<CampusLearn.Services.IAuthenticationService>();
                var user = await auth.GetCurrentUserAsync();

                if (user != null && auth.IsAuthenticated)
                {
                    await navigator.NavigateViewModelAsync<ForumViewModel>(this, qualifier: Qualifiers.Nested);
                }
                else
                {
                    await navigator.NavigateViewModelAsync<LoginViewModel>(this, qualifier: Qualifiers.Nested);
                }
            });
    }

    private static void RegisterRoutes(IViewRegistry views, IRouteRegistry routes)
    {
        views.Register(
            new ViewMap(ViewModel: typeof(ShellViewModel)),
            new ViewMap<LoginPage, LoginViewModel>(),
            new ViewMap<ForumPage, ForumViewModel>(),
            new ViewMap<ForumDetailPage, ForumDetailViewModel>(),
            new ViewMap<CreatePostPage, CreatePostViewModel>(),
            new ViewMap<TopicsPage, TopicsViewModel>(),
            new ViewMap<TopicsDetailPage, TopicsDetailViewModel>(),
            new ViewMap<CreateTopicPage, CreateTopicViewModel>(),
            new ViewMap<ResourcesLibraryPage, ResourcesLibraryViewModel>(),
            new ViewMap<UploadResourcePage, UploadResourceViewModel>(),
            new ViewMap<DiscussionDetailPage, DiscussionDetailViewModel>(),
            new ViewMap<ChatPage, ChatViewModel>(),
            new ViewMap<ChatDetailPage, ChatDetailViewModel>(),
            new ViewMap<ProfilePage, ProfileViewModel>(),
            new ViewMap<AccountPage, AccountViewModel>(),
            new ViewMap<SettingsPage, SettingsViewModel>(),
            new ViewMap<HelpPage, HelpViewModel>(),
            new ViewMap<MainPage, MainViewModel>(),
            new DataViewMap<SecondPage, SecondViewModel, Entity>()
        );

        routes.Register(
            new RouteMap("",
                View: views.FindByViewModel<ShellViewModel>(),
                Nested:
                [
                    new("Login", View: views.FindByViewModel<LoginViewModel>()),
                    new("Forum", View: views.FindByViewModel<ForumViewModel>()),
                    new("ForumDetail", View: views.FindByViewModel<ForumDetailViewModel>()),
                    new("CreatePost", View: views.FindByViewModel<CreatePostViewModel>()),
                    new("Topics", View: views.FindByViewModel<TopicsViewModel>()),
                    new("TopicsDetail", View: views.FindByViewModel<TopicsDetailViewModel>()),
                    new("CreateTopic", View: views.FindByViewModel<CreateTopicViewModel>()),
                    new("ResourcesLibrary", View: views.FindByViewModel<ResourcesLibraryViewModel>()),
                    new("UploadResource", View: views.FindByViewModel<UploadResourceViewModel>()),
                    new("DiscussionDetail", View: views.FindByViewModel<DiscussionDetailViewModel>()),
                    new("Chat", View: views.FindByViewModel<ChatViewModel>()),
                    new("ChatDetail", View: views.FindByViewModel<ChatDetailViewModel>()),
                    new("Profile", View: views.FindByViewModel<ProfileViewModel>()),
                    new("Account", View: views.FindByViewModel<AccountViewModel>()),
                    new("Settings", View: views.FindByViewModel<SettingsViewModel>()),
                    new("Help", View: views.FindByViewModel<HelpViewModel>()),
                    new("Main", View: views.FindByViewModel<MainViewModel>(), IsDefault: true),
                    new("Second", View: views.FindByViewModel<SecondViewModel>())
                ]
            )
        );
    }
}
