using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class Student : User
    {
        public List<TopicSubscription> SubscribedTopics { get; set; } = new();
        public List<PrivateMessage> Messages { get; set; } = new();

        public void SubscribeTopic(Topic topic) =>
            Console.WriteLine($"{FirstName} subscribed to topic {topic.TopicTitle}.");

        public void AskQuestion(Topic topic, string text) =>
            Console.WriteLine($"{FirstName} asked: {text} in {topic.TopicTitle}.");

        public void SendMessage(Tutor tutor, string text) =>
            Console.WriteLine($"{FirstName} sent message to {tutor.FirstName}: {text}");

        public void RateTopic(Topic topic, int rating) =>
            Console.WriteLine($"{FirstName} rated {topic.TopicTitle} with {rating} stars.");
    }
}
