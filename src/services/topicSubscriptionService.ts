import { supabase } from '../lib/supabase';
import { emailService } from './emailService';

export interface TopicSubscriber {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface TopicActivityNotification {
  topicId: string;
  topicTitle: string;
  moduleCode: string;
  activityType: 'new_question' | 'new_answer' | 'new_resource';
  activityTitle: string;
  activityDescription: string;
  activityAuthor: string;
  activityLink: string;
}

class TopicSubscriptionService {
  /**
   * Get all subscribers for a specific topic
   */
  async getTopicSubscribers(topicId: string): Promise<TopicSubscriber[]> {
    try {
      const { data, error } = await supabase
        .from('topic_subscriptions')
        .select(`
          user_id,
          users!topic_subscriptions_user_id_fkey(
            id,
            email,
            first_name,
            last_name,
            email_notifications
          )
        `)
        .eq('topic_id', topicId);

      if (error) {
        console.error('Error fetching topic subscribers:', error);
        throw error;
      }

      // Filter out users who have disabled email notifications
      return data
        .filter(subscription => subscription.users?.email_notifications !== false)
        .map(subscription => ({
          id: subscription.users.id,
          email: subscription.users.email,
          firstName: subscription.users.first_name,
          lastName: subscription.users.last_name,
        }));
    } catch (error) {
      console.error('Error in getTopicSubscribers:', error);
      throw error;
    }
  }

  /**
   * Send email notifications to all topic subscribers
   */
  async notifyTopicSubscribers(notification: TopicActivityNotification): Promise<void> {
    try {
      const subscribers = await this.getTopicSubscribers(notification.topicId);
      
      if (subscribers.length === 0) {
        console.log(`No subscribers found for topic ${notification.topicId}`);
        return;
      }

      console.log(`Sending notifications to ${subscribers.length} subscribers for topic activity`);

      // Send email to each subscriber
      const emailPromises = subscribers.map(subscriber => {
        const recipientName = `${subscriber.firstName} ${subscriber.lastName}`.trim();
        
        return emailService.sendTopicActivityEmail(
          subscriber.email,
          recipientName,
          notification.topicTitle,
          notification.moduleCode,
          notification.activityType,
          notification.activityTitle,
          notification.activityDescription,
          notification.activityAuthor,
          notification.activityLink
        );
      });

      // Wait for all emails to be sent
      const results = await Promise.allSettled(emailPromises);
      
      // Log results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to send email to ${subscribers[index].email}:`, result.reason);
        } else {
          console.log(`Email sent successfully to ${subscribers[index].email}`);
        }
      });

    } catch (error) {
      console.error('Error in notifyTopicSubscribers:', error);
      // Don't throw error - notification failure shouldn't break the main functionality
    }
  }

  /**
   * Notify subscribers about new questions
   */
  async notifyNewQuestion(
    topicId: string,
    questionTitle: string,
    questionAuthor: string,
    questionId: string
  ): Promise<void> {
    try {
      // Get topic details
      const { data: topic, error } = await supabase
        .from('topics')
        .select('title, module_code')
        .eq('id', topicId)
        .single();

      if (error || !topic) {
        console.error('Error fetching topic details:', error);
        return;
      }

      const notification: TopicActivityNotification = {
        topicId,
        topicTitle: topic.title,
        moduleCode: topic.module_code,
        activityType: 'new_question',
        activityTitle: questionTitle,
        activityDescription: `A new question has been posted in the topic "${topic.title}"`,
        activityAuthor: questionAuthor,
        activityLink: `/topics/${topicId}/questions/${questionId}`
      };

      await this.notifyTopicSubscribers(notification);
    } catch (error) {
      console.error('Error in notifyNewQuestion:', error);
    }
  }

  /**
   * Notify subscribers about new answers
   */
  async notifyNewAnswer(
    topicId: string,
    questionTitle: string,
    answerAuthor: string,
    questionId: string
  ): Promise<void> {
    try {
      // Get topic details
      const { data: topic, error } = await supabase
        .from('topics')
        .select('title, module_code')
        .eq('id', topicId)
        .single();

      if (error || !topic) {
        console.error('Error fetching topic details:', error);
        return;
      }

      const notification: TopicActivityNotification = {
        topicId,
        topicTitle: topic.title,
        moduleCode: topic.module_code,
        activityType: 'new_answer',
        activityTitle: questionTitle,
        activityDescription: `A new answer has been posted for the question "${questionTitle}" in topic "${topic.title}"`,
        activityAuthor: answerAuthor,
        activityLink: `/topics/${topicId}/questions/${questionId}`
      };

      await this.notifyTopicSubscribers(notification);
    } catch (error) {
      console.error('Error in notifyNewAnswer:', error);
    }
  }

  /**
   * Notify subscribers about new resources
   */
  async notifyNewResource(
    topicId: string,
    resourceTitle: string,
    resourceType: string,
    resourceAuthor: string,
    resourceId: string
  ): Promise<void> {
    try {
      // Get topic details
      const { data: topic, error } = await supabase
        .from('topics')
        .select('title, module_code')
        .eq('id', topicId)
        .single();

      if (error || !topic) {
        console.error('Error fetching topic details:', error);
        return;
      }

      const notification: TopicActivityNotification = {
        topicId,
        topicTitle: topic.title,
        moduleCode: topic.module_code,
        activityType: 'new_resource',
        activityTitle: resourceTitle,
        activityDescription: `A new ${resourceType} resource "${resourceTitle}" has been uploaded to topic "${topic.title}"`,
        activityAuthor: resourceAuthor,
        activityLink: `/topics/${topicId}/resources/${resourceId}`
      };

      await this.notifyTopicSubscribers(notification);
    } catch (error) {
      console.error('Error in notifyNewResource:', error);
    }
  }
}

export const topicSubscriptionService = new TopicSubscriptionService();
