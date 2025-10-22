import { supabase } from '../lib/supabase';
import { tutorTopicAssignmentService } from './tutorTopicAssignmentService';

export interface TutorModuleAssignment {
  tutorId: string;
  tutorName: string;
  tutorEmail: string;
  moduleCode: string;
}

class TopicAutoAssignmentService {
  /**
   * Get all approved tutors for a specific module
   */
  async getApprovedTutorsForModule(moduleCode: string): Promise<TutorModuleAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('tutor_application_modules')
        .select(`
          application:tutor_applications!inner(
            status,
            user_id,
            users!tutor_applications_user_id_fkey(
              id,
              first_name,
              last_name,
              email
            )
          ),
          module:modules!inner(
            code
          )
        `)
        .eq('application.status', 'approved')
        .eq('module.code', moduleCode);

      if (error) {
        console.error('Error fetching approved tutors for module:', error);
        throw error;
      }

      return data.map(item => ({
        tutorId: item.application.users.id,
        tutorName: `${item.application.users.first_name} ${item.application.users.last_name}`,
        tutorEmail: item.application.users.email,
        moduleCode: item.module.code,
      }));
    } catch (error) {
      console.error('Error in getApprovedTutorsForModule:', error);
      throw error;
    }
  }

  /**
   * Auto-assign all approved tutors for a module to a new topic
   */
  async autoAssignTutorsToTopic(topicId: string, moduleCode: string): Promise<void> {
    try {
      console.log(`Auto-assigning tutors for module ${moduleCode} to topic ${topicId}`);

      // Get all approved tutors for this module
      const approvedTutors = await this.getApprovedTutorsForModule(moduleCode);

      if (approvedTutors.length === 0) {
        console.log(`No approved tutors found for module ${moduleCode}`);
        return;
      }

      console.log(`Found ${approvedTutors.length} approved tutors for module ${moduleCode}`);

      // Assign each tutor to the topic
      const assignmentPromises = approvedTutors.map(async (tutor) => {
        try {
          await tutorTopicAssignmentService.assignTutorToTopic(topicId, tutor.tutorId);
          console.log(`Successfully assigned tutor ${tutor.tutorName} to topic ${topicId}`);
        } catch (error) {
          // Log error but don't fail the entire operation
          console.error(`Failed to assign tutor ${tutor.tutorName} to topic ${topicId}:`, error);
        }
      });

      // Wait for all assignments to complete
      await Promise.allSettled(assignmentPromises);

      console.log(`Auto-assignment completed for topic ${topicId}`);
    } catch (error) {
      console.error('Error in autoAssignTutorsToTopic:', error);
      // Don't throw error - auto-assignment failure shouldn't break topic creation
    }
  }

  /**
   * Get tutors already assigned to a topic
   */
  async getAssignedTutorsForTopic(topicId: string): Promise<TutorModuleAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('topic_tutors')
        .select(`
          tutor:users!topic_tutors_tutor_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('topic_id', topicId);

      if (error) {
        console.error('Error fetching assigned tutors for topic:', error);
        throw error;
      }

      return data.map(item => ({
        tutorId: item.tutor.id,
        tutorName: `${item.tutor.first_name} ${item.tutor.last_name}`,
        tutorEmail: item.tutor.email,
        moduleCode: '', // Not needed for this use case
      }));
    } catch (error) {
      console.error('Error in getAssignedTutorsForTopic:', error);
      throw error;
    }
  }

  /**
   * Auto-assign a tutor to all existing topics for their approved modules
   * This is called when a tutor gets approved for modules
   */
  async autoAssignTutorToExistingTopics(tutorId: string): Promise<void> {
    try {
      console.log(`Auto-assigning tutor ${tutorId} to existing topics for their approved modules`);

      // Get all approved modules for this tutor
      const { data: approvedModules, error: modulesError } = await supabase
        .from('tutor_application_modules')
        .select(`
          application:tutor_applications!inner(
            status,
            user_id
          ),
          module:modules!inner(
            id,
            code
          )
        `)
        .eq('application.user_id', tutorId)
        .eq('application.status', 'approved');

      if (modulesError) {
        console.error('Error fetching approved modules for tutor:', modulesError);
        throw modulesError;
      }

      if (!approvedModules || approvedModules.length === 0) {
        console.log(`No approved modules found for tutor ${tutorId}`);
        return;
      }

      console.log(`Found ${approvedModules.length} approved modules for tutor ${tutorId}`);

      // Get all existing topics for these modules
      const moduleCodes = approvedModules.map(item => item.module.code);
      const { data: existingTopics, error: topicsError } = await supabase
        .from('topics')
        .select('id, title, module_code')
        .in('module_code', moduleCodes)
        .eq('is_active', true);

      if (topicsError) {
        console.error('Error fetching existing topics:', topicsError);
        throw topicsError;
      }

      if (!existingTopics || existingTopics.length === 0) {
        console.log(`No existing topics found for modules: ${moduleCodes.join(', ')}`);
        return;
      }

      console.log(`Found ${existingTopics.length} existing topics for modules: ${moduleCodes.join(', ')}`);

      // Assign tutor to each existing topic
      const assignmentPromises = existingTopics.map(async (topic) => {
        try {
          // Check if tutor is already assigned to this topic
          const { data: existingAssignment } = await supabase
            .from('topic_tutors')
            .select('id')
            .eq('topic_id', topic.id)
            .eq('tutor_id', tutorId)
            .maybeSingle();
          
          if (existingAssignment) {
            console.log(`Tutor ${tutorId} already assigned to topic ${topic.title}`);
            return;
          }

          await tutorTopicAssignmentService.assignTutorToTopic(topic.id, tutorId);
          console.log(`Successfully assigned tutor ${tutorId} to existing topic: ${topic.title}`);
        } catch (error) {
          console.error(`Failed to assign tutor ${tutorId} to topic ${topic.title}:`, error);
        }
      });

      // Wait for all assignments to complete
      await Promise.allSettled(assignmentPromises);

      console.log(`Auto-assignment to existing topics completed for tutor ${tutorId}`);
    } catch (error) {
      console.error('Error in autoAssignTutorToExistingTopics:', error);
      // Don't throw error - auto-assignment failure shouldn't break the approval process
    }
  }

  /**
   * Auto-assign tutors to existing topics when a module gets new approved tutors
   * This is called when admin assigns tutors to modules
   */
  async autoAssignModuleTutorsToExistingTopics(moduleCode: string): Promise<void> {
    try {
      console.log(`Auto-assigning approved tutors for module ${moduleCode} to existing topics`);

      // Get all approved tutors for this module
      const approvedTutors = await this.getApprovedTutorsForModule(moduleCode);

      if (approvedTutors.length === 0) {
        console.log(`No approved tutors found for module ${moduleCode}`);
        return;
      }

      // Get all existing topics for this module
      const { data: existingTopics, error: topicsError } = await supabase
        .from('topics')
        .select('id, title, module_code')
        .eq('module_code', moduleCode)
        .eq('is_active', true);

      if (topicsError) {
        console.error('Error fetching existing topics for module:', topicsError);
        throw topicsError;
      }

      if (!existingTopics || existingTopics.length === 0) {
        console.log(`No existing topics found for module ${moduleCode}`);
        return;
      }

      console.log(`Found ${existingTopics.length} existing topics for module ${moduleCode}`);

      // Assign each tutor to each existing topic
      const assignmentPromises = approvedTutors.flatMap(tutor => 
        existingTopics.map(async (topic) => {
          try {
            // Check if tutor is already assigned to this topic
            const { data: existingAssignment } = await supabase
              .from('topic_tutors')
              .select('id')
              .eq('topic_id', topic.id)
              .eq('tutor_id', tutor.tutorId)
              .maybeSingle();
            
            if (existingAssignment) {
              console.log(`Tutor ${tutor.tutorName} already assigned to topic ${topic.title}`);
              return;
            }

            await tutorTopicAssignmentService.assignTutorToTopic(topic.id, tutor.tutorId);
            console.log(`Successfully assigned tutor ${tutor.tutorName} to existing topic: ${topic.title}`);
          } catch (error) {
            console.error(`Failed to assign tutor ${tutor.tutorName} to topic ${topic.title}:`, error);
          }
        })
      );

      // Wait for all assignments to complete
      await Promise.allSettled(assignmentPromises);

      console.log(`Auto-assignment to existing topics completed for module ${moduleCode}`);
    } catch (error) {
      console.error('Error in autoAssignModuleTutorsToExistingTopics:', error);
      // Don't throw error - auto-assignment failure shouldn't break the assignment process
    }
  }
}

export const topicAutoAssignmentService = new TopicAutoAssignmentService();
