import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

emailjs.init(EMAILJS_PUBLIC_KEY);

export interface EmailNotificationData {
  to_email: string;
  to_name: string;
  notification_type: string;
  notification_title: string;
  notification_message: string;
  notification_link: string;
  platform_name: string;
}

export interface EmailPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  notification_preferences: {
    new_messages: boolean;
    tutor_escalations: boolean;
    forum_replies: boolean;
    topic_replies: boolean;
    new_topics: boolean;
    new_answers: boolean;
  };
}

class EmailService {
  async sendEmailNotification(data: EmailNotificationData): Promise<boolean> {
    try {
      console.log('Sending email notification:', {
        to: data.to_email,
        type: data.notification_type,
        title: data.notification_title
      });

      const templateParams = {
        to_email: data.to_email,
        to_name: data.to_name,
        notification_type: data.notification_type,
        notification_title: data.notification_title,
        notification_message: data.notification_message,
        notification_link: data.notification_link,
        platform_name: data.platform_name || 'CampusLearn'
      };

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('✅ Email sent successfully:', response.status);
      return true;

    } catch (error) {
      console.error('❌ Error sending email:', error);
      return false;
    }
  }

  /**
   * Send new message email notification
   * @param recipientEmail - Recipient's email address
   * @param recipientName - Recipient's name
   * @param senderName - Sender's name
   * @param conversationLink - Link to the conversation
   */
  async sendNewMessageEmail(
    recipientEmail: string,
    recipientName: string,
    senderName: string,
    conversationLink: string
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      to_email: recipientEmail,
      to_name: recipientName,
      notification_type: 'New Message',
      notification_title: `New message from ${senderName}`,
      notification_message: `You received a new message from ${senderName}. Click the link below to view and respond.`,
      notification_link: conversationLink,
      platform_name: 'CampusLearn'
    };

    return this.sendEmailNotification(emailData);
  }

  /**
   * Send tutor escalation email notification
   * @param tutorEmail - Tutor's email address
   * @param tutorName - Tutor's name
   * @param studentName - Student's name
   * @param moduleCode - Module code
   * @param escalationLink - Link to the escalation
   */
  async sendTutorEscalationEmail(
    tutorEmail: string,
    tutorName: string,
    studentName: string,
    moduleCode: string,
    escalationLink: string
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      to_email: tutorEmail,
      to_name: tutorName,
      notification_type: 'Tutor Escalation',
      notification_title: `New escalation request for ${moduleCode}`,
      notification_message: `${studentName} needs help with ${moduleCode} and has been escalated to you. Please check your messages to assist them.`,
      notification_link: escalationLink,
      platform_name: 'CampusLearn'
    };

    return this.sendEmailNotification(emailData);
  }

  /**
   * Send forum reply email notification
   * @param recipientEmail - Recipient's email address
   * @param recipientName - Recipient's name
   * @param replierName - Replier's name
   * @param postTitle - Forum post title
   * @param replyLink - Link to the reply
   */
  async sendForumReplyEmail(
    recipientEmail: string,
    recipientName: string,
    replierName: string,
    postTitle: string,
    replyLink: string
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      to_email: recipientEmail,
      to_name: recipientName,
      notification_type: 'Forum Reply',
      notification_title: `New reply to "${postTitle}"`,
      notification_message: `${replierName} replied to your forum post "${postTitle}". Click below to view the reply.`,
      notification_link: replyLink,
      platform_name: 'CampusLearn'
    };

    return this.sendEmailNotification(emailData);
  }

  /**
   * Send topic reply email notification
   * @param recipientEmail - Recipient's email address
   * @param recipientName - Recipient's name
   * @param replierName - Replier's name
   * @param topicTitle - Topic title
   * @param replyLink - Link to the reply
   */
  async sendTopicReplyEmail(
    recipientEmail: string,
    recipientName: string,
    replierName: string,
    topicTitle: string,
    replyLink: string
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      to_email: recipientEmail,
      to_name: recipientName,
      notification_type: 'Topic Reply',
      notification_title: `New reply to "${topicTitle}"`,
      notification_message: `${replierName} replied to your topic "${topicTitle}". Click below to view the reply.`,
      notification_link: replyLink,
      platform_name: 'CampusLearn'
    };

    return this.sendEmailNotification(emailData);
  }

  /**
   * Send new topic email notification
   * @param recipientEmail - Recipient's email address
   * @param recipientName - Recipient's name
   * @param topicCreator - Topic creator's name
   * @param topicTitle - Topic title
   * @param topicLink - Link to the topic
   */
  async sendNewTopicEmail(
    recipientEmail: string,
    recipientName: string,
    topicCreator: string,
    topicTitle: string,
    topicLink: string
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      to_email: recipientEmail,
      to_name: recipientName,
      notification_type: 'New Topic',
      notification_title: `New topic: "${topicTitle}"`,
      notification_message: `${topicCreator} created a new topic "${topicTitle}" that might interest you. Click below to view and participate.`,
      notification_link: topicLink,
      platform_name: 'CampusLearn'
    };

    return this.sendEmailNotification(emailData);
  }

  /**
   * Send new answer email notification
   * @param recipientEmail - Recipient's email address
   * @param recipientName - Recipient's name
   * @param answererName - Answerer's name
   * @param questionTitle - Question title
   * @param answerLink - Link to the answer
   */
  async sendNewAnswerEmail(
    recipientEmail: string,
    recipientName: string,
    answererName: string,
    questionTitle: string,
    answerLink: string
  ): Promise<boolean> {
    const emailData: EmailNotificationData = {
      to_email: recipientEmail,
      to_name: recipientName,
      notification_type: 'New Answer',
      notification_title: `New answer to "${questionTitle}"`,
      notification_message: `${answererName} answered your question "${questionTitle}". Click below to view the answer.`,
      notification_link: answerLink,
      platform_name: 'CampusLearn'
    };

    return this.sendEmailNotification(emailData);
  }

  /**
   * Check if user has email notifications enabled for a specific type
   * @param userPreferences - User's email preferences
   * @param notificationType - Type of notification
   * @returns boolean - Whether email notifications are enabled
   */
  isEmailNotificationEnabled(
    userPreferences: EmailPreferences,
    notificationType: keyof EmailPreferences['notification_preferences']
  ): boolean {
    // Check if email notifications are globally enabled
    if (!userPreferences.email_notifications) {
      return false;
    }

    // Check if specific notification type is enabled
    return userPreferences.notification_preferences[notificationType] ?? true;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;

