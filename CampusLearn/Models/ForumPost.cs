using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class ForumPost : INotifyPropertyChanged
    {
        public int PostId { get; set; }
        public int TopicId { get; set; }
        public int AuthorUserId { get; set; }
        public string AuthorName { get; set; } = "";
        public int? ParentPostId { get; set; }
        
        private string _text = "";
        public string Text
        {
            get => _text;
            set
            {
                _text = value;
                OnPropertyChanged();
            }
        }
        
        public string Title { get; set; } = "";
        
        private bool _anonymousFlag;
        public bool AnonymousFlag
        {
            get => _anonymousFlag;
            set
            {
                _anonymousFlag = value;
                OnPropertyChanged();
                OnPropertyChanged(nameof(DisplayName));
            }
        }
        
        public string DisplayName => AnonymousFlag ? "Anonymous" : AuthorName;
        
        public string Status { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        
        private int _upvoteCount;
        public int UpvoteCount
        {
            get => _upvoteCount;
            set
            {
                _upvoteCount = value;
                OnPropertyChanged();
            }
        }
        
        private int _downvoteCount;
        public int DownvoteCount
        {
            get => _downvoteCount;
            set
            {
                _downvoteCount = value;
                OnPropertyChanged();
            }
        }
        
        private int _replyCount;
        public int ReplyCount
        {
            get => _replyCount;
            set
            {
                _replyCount = value;
                OnPropertyChanged();
            }
        }
        
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

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public void PostQuestion(string question) => Console.WriteLine($"Question posted: {question}");
        public void AnswerQuestion(string answer) => Console.WriteLine($"Answer posted: {answer}");
        public void Upvote()
        {
            UpvoteCount++;
            Console.WriteLine("Post upvoted");
        }
        public void Downvote()
        {
            DownvoteCount++;
            Console.WriteLine("Post downvoted");
        }
        public void EditPost(string newText) => Console.WriteLine($"Post edited: {newText}");
        public void DeletePost() => Console.WriteLine("Post deleted");
    }
}
