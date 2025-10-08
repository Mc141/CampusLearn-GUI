using Uml_Implementation.Entities;

namespace CampusLearn.Presentation;

public partial class TopicsDetailViewModel : ObservableObject
{
    private readonly INavigator _navigator;
    
    // Static property to receive the selected topic
    public static Topic? SelectedTopic { get; set; }

    public TopicsDetailViewModel(INavigator navigator)
    {
        _navigator = navigator;
        
        // Load the topic from the static property
        if (SelectedTopic != null)
        {
            CurrentTopic = SelectedTopic;
        }
    }

    [ObservableProperty]
    private Topic? currentTopic;

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

    [RelayCommand]
    private async Task NavigateToDiscussionDetail()
    {
        await _navigator.NavigateViewModelAsync<DiscussionDetailViewModel>(this);
    }
}
