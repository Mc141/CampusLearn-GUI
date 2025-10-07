using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class ForumPost
    {
        public int PostId { get; set; }
        public int TopicId { get; set; }
        public int AuthorUserId { get; set; }
        public int? ParentPostId { get; set; }
        public string Text { get; set; } = "";
        public bool AnonymousFlag { get; set; }
        public string Status { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public int UpvoteCount { get; set; }

        public void PostQuestion(string question) => Console.WriteLine($"Question posted: {question}");
        public void AnswerQuestion(string answer) => Console.WriteLine($"Answer posted: {answer}");
        public void Upvote() => Console.WriteLine("Post upvoted");
        public void EditPost(string newText) => Console.WriteLine($"Post edited: {newText}");
        public void DeletePost() => Console.WriteLine("Post deleted");
    }
}
