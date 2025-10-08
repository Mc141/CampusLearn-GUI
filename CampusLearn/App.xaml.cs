using Microsoft.Extensions.Configuration;

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
                .UseAuthentication(auth =>
                    auth.AddCustom(custom =>
                        custom.Login((sp, dispatcher, credentials, cancellationToken) =>
                        {
                            // Stub auth: pretend login always succeeds
                            var tokens = new Dictionary<string, string>
                            {
                                [TokenCacheExtensions.AccessTokenKey] = "SampleToken",
                                ["Expiry"] = DateTime.Now.AddMinutes(30).ToString("O")
                            };
                            return ValueTask.FromResult<IDictionary<string, string>?>(tokens);
                        })
                        .Refresh((sp, tokenDictionary, cancellationToken) =>
                        {
                            if (tokenDictionary != null &&
                                tokenDictionary.TryGetValue("Expiry", out var expiry) &&
                                DateTime.TryParse(expiry, out var tokenExpiry) &&
                                tokenExpiry > DateTime.Now)
                            {
                                return ValueTask.FromResult<IDictionary<string, string>?>(tokenDictionary);
                            }
                            return ValueTask.FromResult<IDictionary<string, string>?>(default);
                        }),
                        name: "StubAuth"
                    )
                )
                .ConfigureServices((context, services) =>
                {
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
                var auth = services.GetRequiredService<IAuthenticationService>();
                var authenticated = await auth.RefreshAsync();

                if (authenticated)
                {
                    await navigator.NavigateViewModelAsync<MainViewModel>(this, qualifier: Qualifiers.Nested);
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
            new ViewMap<TopicsPage, TopicsViewModel>(),
            new ViewMap<TopicsDetailPage, TopicsDetailViewModel>(),
            new ViewMap<DiscussionDetailPage, DiscussionDetailViewModel>(),
            new ViewMap<ChatPage, ChatViewModel>(),
            new ViewMap<ChatDetailPage, ChatDetailViewModel>(),
            new ViewMap<ProfilePage, ProfileViewModel>(),
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
                    new("Topics", View: views.FindByViewModel<TopicsViewModel>()),
                    new("TopicsDetail", View: views.FindByViewModel<TopicsDetailViewModel>()),
                    new("DiscussionDetail", View: views.FindByViewModel<DiscussionDetailViewModel>()),
                    new("Chat", View: views.FindByViewModel<ChatViewModel>()),
                    new("ChatDetail", View: views.FindByViewModel<ChatDetailViewModel>()),
                    new("Profile", View: views.FindByViewModel<ProfileViewModel>()),
                    new("Main", View: views.FindByViewModel<MainViewModel>(), IsDefault: true),
                    new("Second", View: views.FindByViewModel<SecondViewModel>())
                ]
            )
        );
    }
}
