namespace CampusLearn.Presentation;

public partial class ForumViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    public ForumViewModel(INavigator navigator)
    {
        _navigator = navigator;
    }

    [RelayCommand]
    private async Task NavigateToTopics()
    {
        await _navigator.NavigateViewModelAsync<TopicsViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    private async Task NavigateToChat()
    {
        await _navigator.NavigateViewModelAsync<ChatViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    private async Task NavigateToProfile()
    {
        await _navigator.NavigateViewModelAsync<ProfileViewModel>(this);
    }

    [RelayCommand]
    private async Task NavigateToForumDetail()
    {
        await _navigator.NavigateViewModelAsync<ForumDetailViewModel>(this);
    }
}
