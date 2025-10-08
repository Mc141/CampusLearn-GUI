namespace CampusLearn.Presentation;

public partial class DiscussionDetailViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    public DiscussionDetailViewModel(INavigator navigator)
    {
        _navigator = navigator;
    }

    [RelayCommand]
    private async Task NavigateBack()
    {
        await _navigator.NavigateBackAsync(this);
    }

    [RelayCommand]
    private async Task NavigateToProfile()
    {
        await _navigator.NavigateViewModelAsync<ProfileViewModel>(this);
    }

    [RelayCommand]
    private async Task NavigateToForum()
    {
        await _navigator.NavigateViewModelAsync<ForumViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    private async Task NavigateToChat()
    {
        await _navigator.NavigateViewModelAsync<ChatViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }
}
