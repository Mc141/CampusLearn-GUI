import { supabase } from '../lib/supabase';

export interface UserActivity {
  id: string;
  type: 'question_answered' | 'question_posted' | 'topic_subscribed' | 'answer_posted' | 'reply_posted';
  title: string;
  description: string;
  createdAt: Date;
  metadata?: {
    questionId?: string;
    answerId?: string;
    topicId?: string;
    replyId?: string;
  };
}

export const userActivityService = {
  // Get recent activity for a user
  async getUserRecentActivity(userId: string, limit: number = 10): Promise<UserActivity[]> {
    try {
      const activities: UserActivity[] = [];

      // Get recent questions posted by user
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select(`
          id,
          title,
          created_at,
          topic:topics(
            title,
            module_code
          )
        `)
        .eq('student_id', userId)
        .eq('is_moderated', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!questionsError && questions) {
        questions.forEach(question => {
          activities.push({
            id: `question-${question.id}`,
            type: 'question_posted',
            title: 'New question posted',
            description: `${question.title} - ${question.topic?.module_code || 'Unknown Module'}`,
            createdAt: new Date(question.created_at),
            metadata: { questionId: question.id }
          });
        });
      }

      // Get recent answers posted by user (if they're a tutor)
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select(`
          id,
          created_at,
          question:questions(
            id,
            title,
            topic:topics(
              title,
              module_code
            )
          )
        `)
        .eq('tutor_id', userId)
        .eq('is_moderated', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!answersError && answers) {
        answers.forEach(answer => {
          activities.push({
            id: `answer-${answer.id}`,
            type: 'answer_posted',
            title: 'Question answered',
            description: `${answer.question?.title || 'Unknown Question'} - ${answer.question?.topic?.module_code || 'Unknown Module'}`,
            createdAt: new Date(answer.created_at),
            metadata: { answerId: answer.id, questionId: answer.question?.id }
          });
        });
      }

      // Get recent topic subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('topic_subscriptions')
        .select(`
          subscribed_at,
          topic:topics(
            id,
            title,
            module_code
          )
        `)
        .eq('user_id', userId)
        .order('subscribed_at', { ascending: false })
        .limit(limit);

      if (!subscriptionsError && subscriptions) {
        subscriptions.forEach(subscription => {
          activities.push({
            id: `subscription-${subscription.topic?.id}`,
            type: 'topic_subscribed',
            title: 'Subscribed to topic',
            description: `${subscription.topic?.title || 'Unknown Topic'} - ${subscription.topic?.module_code || 'Unknown Module'}`,
            createdAt: new Date(subscription.subscribed_at),
            metadata: { topicId: subscription.topic?.id }
          });
        });
      }

      // Get recent replies posted by user
      const { data: replies, error: repliesError } = await supabase
        .from('answer_replies')
        .select(`
          id,
          created_at,
          answer:answers(
            id,
            question:questions(
              id,
              title,
              topic:topics(
                title,
                module_code
              )
            )
          )
        `)
        .eq('author_id', userId)
        .eq('is_moderated', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!repliesError && replies) {
        replies.forEach(reply => {
          activities.push({
            id: `reply-${reply.id}`,
            type: 'reply_posted',
            title: 'Reply posted',
            description: `Reply to: ${reply.answer?.question?.title || 'Unknown Question'} - ${reply.answer?.question?.topic?.module_code || 'Unknown Module'}`,
            createdAt: new Date(reply.created_at),
            metadata: { replyId: reply.id, answerId: reply.answer?.id, questionId: reply.answer?.question?.id }
          });
        });
      }

      // Sort all activities by date and limit
      return activities
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    questionsAsked: number;
    topicsSubscribed: number;
    messagesSent: number;
    answersPosted: number;
    repliesPosted: number;
  }> {
    try {
      console.log('📊 Fetching user stats for user:', userId);
      
      const [
        { count: questionsCount, error: questionsError },
        { count: subscriptionsCount, error: subscriptionsError },
        { count: messagesCount, error: messagesError },
        { count: answersCount, error: answersError },
        { count: repliesCount, error: repliesError }
      ] = await Promise.all([
        supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('is_moderated', false),
        
        supabase
          .from('topic_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', userId),
        
        supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('tutor_id', userId)
          .eq('is_moderated', false),
        
        supabase
          .from('answer_replies')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', userId)
          .eq('is_moderated', false)
      ]);

      // Log any errors
      if (questionsError) console.error('Questions count error:', questionsError);
      if (subscriptionsError) console.error('Subscriptions count error:', subscriptionsError);
      if (messagesError) console.error('Messages count error:', messagesError);
      if (answersError) console.error('Answers count error:', answersError);
      if (repliesError) console.error('Replies count error:', repliesError);

      const stats = {
        questionsAsked: questionsCount || 0,
        topicsSubscribed: subscriptionsCount || 0,
        messagesSent: messagesCount || 0,
        answersPosted: answersCount || 0,
        repliesPosted: repliesCount || 0,
      };

      console.log('📊 User stats result:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }
};
