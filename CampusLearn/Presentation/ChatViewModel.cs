namespace CampusLearn.Presentation;

public partial class ChatViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    public ChatViewModel(INavigator navigator)
    {
        _navigator = navigator;
    }

    [RelayCommand]
    private async Task NavigateToForum()
    {
        await _navigator.NavigateViewModelAsync<ForumViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    private async Task NavigateToTopics()
    {
        await _navigator.NavigateViewModelAsync<TopicsViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    private async Task NavigateToProfile()
    {
        await _navigator.NavigateViewModelAsync<ProfileViewModel>(this);
    }

    [RelayCommand]
    private async Task NavigateToChatDetail()
    {
        await _navigator.NavigateViewModelAsync<ChatDetailViewModel>(this);
    }
}
