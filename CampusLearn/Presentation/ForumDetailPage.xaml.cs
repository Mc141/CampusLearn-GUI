using Uml_Implementation.Entities;

namespace CampusLearn.Presentation;

public sealed partial class ForumDetailPage : Page
{
    public ForumDetailPage()
    {
        this.InitializeComponent();
        this.Loaded += OnPageLoaded;
    }

    private void OnPageLoaded(object sender, RoutedEventArgs e)
    {
        // Get the ViewModel and check if there's navigation data
        if (this.DataContext is ForumDetailViewModel viewModel)
        {
            // The post will be passed via the ViewModel's navigation
        }
    }

    private void OnDiscussionsTabClick(object sender, RoutedEventArgs e)
    {
        // Show Discussions view
        DiscussionsView.Visibility = Visibility.Visible;
        ResourcesView.Visibility = Visibility.Collapsed;

        // Update tab styling
        DiscussionsText.FontWeight = Microsoft.UI.Text.FontWeights.SemiBold;
        DiscussionsText.Foreground = new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 103, 80, 164)); // #6750A4
        DiscussionsUnderline.Fill = new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 103, 80, 164)); // #6750A4

        ResourcesText.FontWeight = Microsoft.UI.Text.FontWeights.Normal;
        ResourcesText.Foreground = new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 73, 69, 79)); // #49454F
        DiscussionsUnderline.Fill = new SolidColorBrush(Microsoft.UI.Colors.Transparent);
    }

    private void OnResourcesTabClick(object sender, RoutedEventArgs e)
    {
        // Show Resources view
        DiscussionsView.Visibility = Visibility.Collapsed;
        ResourcesView.Visibility = Visibility.Visible;

        // Update tab styling
        ResourcesText.FontWeight = Microsoft.UI.Text.FontWeights.SemiBold;
        ResourcesText.Foreground = new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 103, 80, 164)); // #6750A4
        ResourcesUnderline.Fill = new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 103, 80, 164)); // #6750A4

        DiscussionsText.FontWeight = Microsoft.UI.Text.FontWeights.Normal;
        DiscussionsText.Foreground = new SolidColorBrush(Microsoft.UI.ColorHelper.FromArgb(255, 73, 69, 79)); // #49454F
        DiscussionsUnderline.Fill = new SolidColorBrush(Microsoft.UI.Colors.Transparent);
    }
}
