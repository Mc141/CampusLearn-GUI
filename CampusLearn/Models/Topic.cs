using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class Topic : INotifyPropertyChanged
    {
        public int TopicId { get; set; }
        
        private string _topicTitle = "";
        public string TopicTitle
        {
            get => _topicTitle;
            set
            {
                _topicTitle = value;
                OnPropertyChanged();
            }
        }

        private string _description = "";
        public string Description
        {
            get => _description;
            set
            {
                _description = value;
                OnPropertyChanged();
            }
        }

        public int CreatorUserId { get; set; }
        public string CreatorName { get; set; } = "";
        
        public int ModuleId { get; set; }
        public string ModuleCode { get; set; } = "";
        public string ModuleName { get; set; } = "";
        
        public int TutorAssignedUserId { get; set; }
        public string AssignedTutorName { get; set; } = "";
        
        public DateTime CreatedAt { get; set; }

        private int _subscriberCount;
        public int SubscriberCount
        {
            get => _subscriberCount;
            set
            {
                _subscriberCount = value;
                OnPropertyChanged();
            }
        }

        private int _postCount;
        public int PostCount
        {
            get => _postCount;
            set
            {
                _postCount = value;
                OnPropertyChanged();
            }
        }

        private int _resourceCount;
        public int ResourceCount
        {
            get => _resourceCount;
            set
            {
                _resourceCount = value;
                OnPropertyChanged();
            }
        }

        private bool _isSubscribed;
        public bool IsSubscribed
        {
            get => _isSubscribed;
            set
            {
                _isSubscribed = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(SubscribeButtonText));
            }
        }

        public string SubscribeButtonText => IsSubscribed ? "Subscribed" : "Subscribe";

        public string DifficultyLevel { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced
        public string Status { get; set; } = "Open"; // Open, In Progress, Resolved, Closed

        public string TimeAgo
        {
            get
            {
                var timeSpan = DateTime.Now - CreatedAt;
                if (timeSpan.TotalMinutes < 1) return "Just now";
                if (timeSpan.TotalMinutes < 60) return $"{(int)timeSpan.TotalMinutes} min ago";
                if (timeSpan.TotalHours < 24) return $"{(int)timeSpan.TotalHours} hr ago";
                if (timeSpan.TotalDays < 7) return $"{(int)timeSpan.TotalDays} day(s) ago";
                return CreatedAt.ToString("MMM dd, yyyy");
            }
        }

        public List<ForumPost> Posts { get; set; } = new();
        public List<LearningMaterial> Materials { get; set; } = new();

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public void NotifySubscribers() => Console.WriteLine($"Subscribers of {TopicTitle} notified.");
        public void AddQuestion(string question) => Console.WriteLine($"Question added to {TopicTitle}: {question}");
        public void AssignTutor(Tutor tutor) => Console.WriteLine($"{tutor.FirstName} assigned to {TopicTitle}");
        public void CloseTopic() => Console.WriteLine($"Topic {TopicTitle} closed.");
    }
}
