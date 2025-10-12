import { supabase } from '../lib/supabase';

export interface TutorTopicAssignment {
  id: string;
  topicId: string;
  tutorId: string;
  assignedAt: Date;
}

export interface TutorWithDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentNumber?: string;
}

export const tutorTopicAssignmentService = {
  // Assign a tutor to a topic
  async assignTutorToTopic(topicId: string, tutorId: string): Promise<void> {
    try {
      // First check if tutor is approved for the topic's module
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('module_code')
        .eq('id', topicId)
        .single();

      if (topicError) {
        console.error('Error fetching topic:', topicError);
        throw topicError;
      }

      // Check if tutor is approved for this module
      const { data: tutorModule, error: moduleError } = await supabase
        .from('tutor_application_modules')
        .select(`
          application:tutor_applications!inner(
            status,
            user_id
          ),
          module:modules!inner(
            code
          )
        `)
        .eq('application.user_id', tutorId)
        .eq('application.status', 'approved')
        .eq('module.code', topic.module_code)
        .single();

      if (moduleError && moduleError.code !== 'PGRST116') {
        console.error('Error checking tutor module assignment:', moduleError);
        throw moduleError;
      }

      if (!tutorModule) {
        throw new Error('Tutor is not approved for this module');
      }

      // Check if tutor is already assigned to this topic
      const { data: existingAssignment, error: checkError } = await supabase
        .from('topic_tutors')
        .select('id')
        .eq('topic_id', topicId)
        .eq('tutor_id', tutorId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing assignment:', checkError);
        throw checkError;
      }

      if (existingAssignment) {
        throw new Error('Tutor is already assigned to this topic');
      }

      // Assign tutor to topic
      const { error: assignError } = await supabase
        .from('topic_tutors')
        .insert([
          {
            topic_id: topicId,
            tutor_id: tutorId,
          },
        ]);

      if (assignError) {
        console.error('Error assigning tutor to topic:', assignError);
        throw assignError;
      }
    } catch (error) {
      console.error('Error in assignTutorToTopic:', error);
      throw error;
    }
  },

  // Remove a tutor from a topic
  async removeTutorFromTopic(topicId: string, tutorId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('topic_tutors')
        .delete()
        .eq('topic_id', topicId)
        .eq('tutor_id', tutorId);

      if (error) {
        console.error('Error removing tutor from topic:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in removeTutorFromTopic:', error);
      throw error;
    }
  },

  // Get tutors assigned to a topic
  async getTutorsForTopic(topicId: string): Promise<TutorWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('topic_tutors')
        .select(`
          tutor:users!topic_tutors_tutor_id_fkey(
            id,
            first_name,
            last_name,
            email,
            student_number
          )
        `)
        .eq('topic_id', topicId);

      if (error) {
        console.error('Error fetching tutors for topic:', error);
        throw error;
      }

      return data.map(assignment => ({
        id: assignment.tutor.id,
        firstName: assignment.tutor.first_name,
        lastName: assignment.tutor.last_name,
        email: assignment.tutor.email,
        studentNumber: assignment.tutor.student_number,
      }));
    } catch (error) {
      console.error('Error in getTutorsForTopic:', error);
      throw error;
    }
  },

  // Get topics assigned to a tutor
  async getTopicsForTutor(tutorId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('topic_tutors')
        .select(`
          topic:topics!topic_tutors_topic_id_fkey(
            id,
            title,
            description,
            module_code,
            created_at,
            is_active
          )
        `)
        .eq('tutor_id', tutorId);

      if (error) {
        console.error('Error fetching topics for tutor:', error);
        throw error;
      }

      return data.map(assignment => assignment.topic);
    } catch (error) {
      console.error('Error in getTopicsForTutor:', error);
      throw error;
    }
  },

  // Get available tutors for a topic's module (approved tutors not yet assigned)
  async getAvailableTutorsForTopic(topicId: string): Promise<TutorWithDetails[]> {
    try {
      // First get the topic's module
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('module_code')
        .eq('id', topicId)
        .single();

      if (topicError) {
        console.error('Error fetching topic:', topicError);
        throw topicError;
      }

      // Get approved tutor applications for this module
      const { data: approvedApplications, error: applicationsError } = await supabase
        .from('tutor_applications')
        .select(`
          id,
          user_id,
          tutor_application_modules!inner(
            module:modules!inner(
              code
            )
          )
        `)
        .eq('status', 'approved')
        .eq('tutor_application_modules.module.code', topic.module_code);

      if (applicationsError) {
        console.error('Error fetching approved applications:', applicationsError);
        throw applicationsError;
      }

      // Get already assigned tutors for this topic
      const { data: assignedTutors, error: assignedError } = await supabase
        .from('topic_tutors')
        .select('tutor_id')
        .eq('topic_id', topicId);

      if (assignedError) {
        console.error('Error fetching assigned tutors:', assignedError);
        throw assignedError;
      }

      const assignedTutorIds = new Set(assignedTutors.map(t => t.tutor_id));

      // Filter out already assigned tutors
      const availableTutorIds = approvedApplications
        .filter(app => !assignedTutorIds.has(app.user_id))
        .map(app => app.user_id);

      if (availableTutorIds.length === 0) {
        return [];
      }

      // Get user details for available tutors
      const { data: tutors, error: tutorsDataError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, student_number')
        .in('id', availableTutorIds);

      if (tutorsDataError) {
        console.error('Error fetching tutor details:', tutorsDataError);
        throw tutorsDataError;
      }

      return tutors.map(tutor => ({
        id: tutor.id,
        firstName: tutor.first_name,
        lastName: tutor.last_name,
        email: tutor.email,
        studentNumber: tutor.student_number,
      }));
    } catch (error) {
      console.error('Error in getAvailableTutorsForTopic:', error);
      throw error;
    }
  },

  // Check if a tutor can answer questions for a topic
  async canTutorAnswerForTopic(topicId: string, tutorId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('topic_tutors')
        .select('id')
        .eq('topic_id', topicId)
        .eq('tutor_id', tutorId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking tutor assignment:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in canTutorAnswerForTopic:', error);
      throw error;
    }
  },
};
