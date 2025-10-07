namespace CampusLearn.Presentation;

public partial class ForumViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    public ForumViewModel(INavigator navigator)
    {
        _navigator = navigator;
    }
}
