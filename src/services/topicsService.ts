import { supabase } from '../lib/supabase';
import { Topic } from '../types';

export interface CreateTopicData {
  title: string;
  description: string;
  moduleCode: string;
}

export interface TopicWithDetails extends Omit<Topic, 'module'> {
  createdByUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  moduleCode: string;
  moduleDetails: {
    id: string;
    name: string;
    code: string;
    level: string;
  };
  subscriberCount: number;
  tutorCount: number;
  isModerated?: boolean;
}

export const topicsService = {
  // Get all topics with details
  async getAllTopics(): Promise<TopicWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          created_by_user:users!topics_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          subscriptions:topic_subscriptions(count),
          tutors:topic_tutors(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching topics:', error);
        throw error;
      }

      // Get modules separately to match with module_code
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*');

      const modulesMap = new Map(modulesData?.map(m => [m.code, m]) || []);

      return data.map(topic => {
        const module = modulesMap.get(topic.module_code);
        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          moduleCode: topic.module_code,
          createdBy: topic.created_by,
          createdAt: new Date(topic.created_at),
          subscribers: [], // Will be populated separately if needed
          tutors: [], // Will be populated separately if needed
          isActive: topic.is_active,
          createdByUser: {
            id: topic.created_by_user.id,
            firstName: topic.created_by_user.first_name,
            lastName: topic.created_by_user.last_name,
            email: topic.created_by_user.email,
          },
          moduleDetails: module ? {
            id: module.id,
            name: module.name,
            code: module.code,
            level: module.level,
          } : {
            id: '',
            name: topic.module_code,
            code: topic.module_code,
            level: 'Unknown',
          },
          subscriberCount: topic.subscriptions?.[0]?.count || 0,
          tutorCount: topic.tutors?.[0]?.count || 0,
        };
      });
    } catch (error) {
      console.error('Error in getAllTopics:', error);
      throw error;
    }
  },

  // Get topics by module
  async getTopicsByModule(moduleCode: string): Promise<TopicWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          created_by_user:users!topics_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          subscriptions:topic_subscriptions(count),
          tutors:topic_tutors(count)
        `)
        .eq('module_code', moduleCode)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching topics by module:', error);
        throw error;
      }

      // Get modules separately to match with module_code
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*');

      const modulesMap = new Map(modulesData?.map(m => [m.code, m]) || []);

      return data.map(topic => {
        const module = modulesMap.get(topic.module_code);
        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          moduleCode: topic.module_code,
          createdBy: topic.created_by,
          createdAt: new Date(topic.created_at),
          subscribers: [],
          tutors: [],
          isActive: topic.is_active,
          createdByUser: {
            id: topic.created_by_user.id,
            firstName: topic.created_by_user.first_name,
            lastName: topic.created_by_user.last_name,
            email: topic.created_by_user.email,
          },
          moduleDetails: module ? {
            id: module.id,
            name: module.name,
            code: module.code,
            level: module.level,
          } : {
            id: '',
            name: topic.module_code,
            code: topic.module_code,
            level: 'Unknown',
          },
          subscriberCount: topic.subscriptions?.[0]?.count || 0,
          tutorCount: topic.tutors?.[0]?.count || 0,
        };
      });
    } catch (error) {
      console.error('Error in getTopicsByModule:', error);
      throw error;
    }
  },

  // Create a new topic
  async createTopic(topicData: CreateTopicData, userId: string): Promise<Topic> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert([
          {
            title: topicData.title,
            description: topicData.description,
            module_code: topicData.moduleCode,
            created_by: userId,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating topic:', error);
        throw error;
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        module: data.module_code,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        subscribers: [],
        tutors: [],
        isActive: data.is_active,
      };
    } catch (error) {
      console.error('Error in createTopic:', error);
      throw error;
    }
  },

  // Subscribe to a topic
  async subscribeToTopic(topicId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('topic_subscriptions')
        .insert([
          {
            topic_id: topicId,
            user_id: userId,
          },
        ]);

      if (error) {
        console.error('Error subscribing to topic:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in subscribeToTopic:', error);
      throw error;
    }
  },

  // Unsubscribe from a topic
  async unsubscribeFromTopic(topicId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('topic_subscriptions')
        .delete()
        .eq('topic_id', topicId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error unsubscribing from topic:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in unsubscribeFromTopic:', error);
      throw error;
    }
  },

  // Check if user is subscribed to a topic
  async isSubscribedToTopic(topicId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('topic_subscriptions')
        .select('id')
        .eq('topic_id', topicId)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking subscription:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isSubscribedToTopic:', error);
      throw error;
    }
  },

  // Get user's subscribed topics
  async getUserSubscribedTopics(userId: string): Promise<TopicWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('topic_subscriptions')
        .select(`
          topic:topics(
            *,
            created_by_user:users!topics_created_by_fkey(
              id,
              first_name,
              last_name,
              email
            ),
            subscriptions:topic_subscriptions(count),
            tutors:topic_tutors(count)
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user subscribed topics:', error);
        throw error;
      }

      // Get modules separately to match with module_code
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*');

      const modulesMap = new Map(modulesData?.map(m => [m.code, m]) || []);

      return data.map(subscription => {
        const module = modulesMap.get(subscription.topic.module_code);
        return {
          id: subscription.topic.id,
          title: subscription.topic.title,
          description: subscription.topic.description,
          moduleCode: subscription.topic.module_code,
          createdBy: subscription.topic.created_by,
          createdAt: new Date(subscription.topic.created_at),
          subscribers: [],
          tutors: [],
          isActive: subscription.topic.is_active,
          createdByUser: {
            id: subscription.topic.created_by_user.id,
            firstName: subscription.topic.created_by_user.first_name,
            lastName: subscription.topic.created_by_user.last_name,
            email: subscription.topic.created_by_user.email,
          },
          moduleDetails: module ? {
            id: module.id,
            name: module.name,
            code: module.code,
            level: module.level,
          } : {
            id: '',
            name: subscription.topic.module_code,
            code: subscription.topic.module_code,
            level: 'Unknown',
          },
          subscriberCount: subscription.topic.subscriptions?.[0]?.count || 0,
          tutorCount: subscription.topic.tutors?.[0]?.count || 0,
        };
      });
    } catch (error) {
      console.error('Error in getUserSubscribedTopics:', error);
      throw error;
    }
  },

  // Update a topic
  async updateTopic(topicId: string, userId: string, updateData: Partial<CreateTopicData>): Promise<Topic> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .update({
          title: updateData.title,
          description: updateData.description,
          module_code: updateData.moduleCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', topicId)
        .eq('created_by', userId) // Only allow creator to update
        .select()
        .single();

      if (error) {
        console.error('Error updating topic:', error);
        throw error;
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        module: data.module_code,
        createdBy: data.created_by,
        createdAt: new Date(data.created_at),
        subscribers: [],
        tutors: [],
        isActive: data.is_active,
      };
    } catch (error) {
      console.error('Error in updateTopic:', error);
      throw error;
    }
  },

  // Delete a topic (soft delete)
  async deleteTopic(topicId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ is_active: false })
        .eq('id', topicId)
        .eq('created_by', userId); // Only allow creator to delete

      if (error) {
        console.error('Error deleting topic:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteTopic:', error);
      throw error;
    }
  },

  // Moderate a topic (hide/show)
  async moderateTopic(topicId: string, isModerated: boolean = true): Promise<void> {
    try {
      const { error } = await supabase
        .from('topics')
        .update({ is_moderated: isModerated })
        .eq('id', topicId);

      if (error) {
        console.error('Error moderating topic:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in moderateTopic:', error);
      throw error;
    }
  },

  // Get all topics for moderation (including moderated ones)
  async getAllTopicsForModeration(): Promise<TopicWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          created_by_user:users!topics_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          subscriptions:topic_subscriptions(count),
          tutors:topic_tutors(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching topics for moderation:', error);
        throw error;
      }

      // Get modules separately to match with module_code
      const { data: modulesData } = await supabase
        .from('modules')
        .select('*');

      const modulesMap = new Map(modulesData?.map(m => [m.code, m]) || []);

      return data.map(topic => {
        const module = modulesMap.get(topic.module_code);
        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          moduleCode: topic.module_code,
          createdBy: topic.created_by,
          createdAt: new Date(topic.created_at),
          subscribers: [],
          tutors: [],
          isActive: topic.is_active,
          isModerated: topic.is_moderated || false,
          createdByUser: {
            id: topic.created_by_user.id,
            firstName: topic.created_by_user.first_name,
            lastName: topic.created_by_user.last_name,
            email: topic.created_by_user.email,
          },
          moduleDetails: module ? {
            id: module.id,
            name: module.name,
            code: module.code,
            level: module.level,
          } : {
            id: '',
            name: topic.module_code,
            code: topic.module_code,
            level: 'Unknown',
          },
          subscriberCount: topic.subscriptions?.[0]?.count || 0,
          tutorCount: topic.tutors?.[0]?.count || 0,
        };
      });
    } catch (error) {
      console.error('Error in getAllTopicsForModeration:', error);
      throw error;
    }
  },
};
