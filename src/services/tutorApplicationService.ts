import { supabase } from '../lib/supabase';
import { Module } from '../types';

export interface CreateTutorApplicationData {
  experience: string;
  qualifications: string;
  motivation: string;
  availability: string;
  moduleIds: string[];
}

export interface TutorApplicationWithDetails {
  id: string;
  userId: string;
  experience: string;
  qualifications: string;
  motivation: string;
  availability: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentNumber?: string;
  };
  modules: Module[];
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const tutorApplicationService = {
  // Create a new tutor application
  async createApplication(userId: string, applicationData: CreateTutorApplicationData): Promise<void> {
    try {
      // Start a transaction-like operation
      const { data: application, error: applicationError } = await supabase
        .from('tutor_applications')
        .insert([
          {
            user_id: userId,
            experience: applicationData.experience,
            qualifications: applicationData.qualifications,
            motivation: applicationData.motivation,
            availability: applicationData.availability,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (applicationError) {
        console.error('Error creating tutor application:', applicationError);
        throw applicationError;
      }

      // Insert module assignments
      if (applicationData.moduleIds.length > 0) {
        const moduleAssignments = applicationData.moduleIds.map(moduleId => ({
          application_id: application.id,
          module_id: moduleId,
        }));

        const { error: modulesError } = await supabase
          .from('tutor_application_modules')
          .insert(moduleAssignments);

        if (modulesError) {
          console.error('Error assigning modules to application:', modulesError);
          throw modulesError;
        }
      }
    } catch (error) {
      console.error('Error in createApplication:', error);
      throw error;
    }
  },

  // Get all tutor applications (for admin)
  async getAllApplications(): Promise<TutorApplicationWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('tutor_applications')
        .select(`
          *,
          user:users!tutor_applications_user_id_fkey(
            id,
            first_name,
            last_name,
            email,
            student_number
          ),
          modules:tutor_application_modules(
            module:modules(
              id,
              name,
              code,
              description,
              level
            )
          ),
          reviewer:users!tutor_applications_reviewed_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tutor applications:', error);
        throw error;
      }

      return data.map(application => ({
        id: application.id,
        userId: application.user_id,
        experience: application.experience,
        qualifications: application.qualifications,
        motivation: application.motivation,
        availability: application.availability,
        status: application.status,
        reviewedBy: application.reviewed_by,
        reviewedAt: application.reviewed_at ? new Date(application.reviewed_at) : undefined,
        createdAt: new Date(application.created_at),
        updatedAt: new Date(application.updated_at),
        user: {
          id: application.user.id,
          firstName: application.user.first_name,
          lastName: application.user.last_name,
          email: application.user.email,
          studentNumber: application.user.student_number,
        },
        modules: application.modules.map((assignment: any) => assignment.module),
        reviewer: application.reviewer ? {
          id: application.reviewer.id,
          firstName: application.reviewer.first_name,
          lastName: application.reviewer.last_name,
          email: application.reviewer.email,
        } : undefined,
      }));
    } catch (error) {
      console.error('Error in getAllApplications:', error);
      throw error;
    }
  },

  // Get applications by user
  async getApplicationsByUser(userId: string): Promise<TutorApplicationWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('tutor_applications')
        .select(`
          *,
          user:users!tutor_applications_user_id_fkey(
            id,
            first_name,
            last_name,
            email,
            student_number
          ),
          modules:tutor_application_modules(
            module:modules(
              id,
              name,
              code,
              description,
              level
            )
          ),
          reviewer:users!tutor_applications_reviewed_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user tutor applications:', error);
        throw error;
      }

      return data.map(application => ({
        id: application.id,
        userId: application.user_id,
        experience: application.experience,
        qualifications: application.qualifications,
        motivation: application.motivation,
        availability: application.availability,
        status: application.status,
        reviewedBy: application.reviewed_by,
        reviewedAt: application.reviewed_at ? new Date(application.reviewed_at) : undefined,
        createdAt: new Date(application.created_at),
        updatedAt: new Date(application.updated_at),
        user: {
          id: application.user.id,
          firstName: application.user.first_name,
          lastName: application.user.last_name,
          email: application.user.email,
          studentNumber: application.user.student_number,
        },
        modules: application.modules.map((assignment: any) => assignment.module),
        reviewer: application.reviewer ? {
          id: application.reviewer.id,
          firstName: application.reviewer.first_name,
          lastName: application.reviewer.last_name,
          email: application.reviewer.email,
        } : undefined,
      }));
    } catch (error) {
      console.error('Error in getApplicationsByUser:', error);
      throw error;
    }
  },

  // Review application (approve/reject)
  async reviewApplication(applicationId: string, reviewerId: string, status: 'approved' | 'rejected'): Promise<void> {
    try {
      const { error } = await supabase
        .from('tutor_applications')
        .update({
          status,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) {
        console.error('Error reviewing application:', error);
        throw error;
      }

      // If approved, update user role to tutor
      if (status === 'approved') {
        const { data: application } = await supabase
          .from('tutor_applications')
          .select('user_id')
          .eq('id', applicationId)
          .single();

        if (application) {
          const { error: roleError } = await supabase
            .from('users')
            .update({ role: 'tutor' })
            .eq('id', application.user_id);

          if (roleError) {
            console.error('Error updating user role:', roleError);
            throw roleError;
          }
        }
      }
    } catch (error) {
      console.error('Error in reviewApplication:', error);
      throw error;
    }
  },

  // Get approved tutors for a module
  async getApprovedTutorsForModule(moduleId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('tutor_application_modules')
        .select(`
          application:tutor_applications!inner(
            user_id,
            status,
            user:users!tutor_applications_user_id_fkey(
              id,
              first_name,
              last_name,
              email,
              student_number
            )
          )
        `)
        .eq('module_id', moduleId)
        .eq('application.status', 'approved');

      if (error) {
        console.error('Error fetching approved tutors for module:', error);
        throw error;
      }

      return data.map(item => ({
        id: item.application.user.id,
        firstName: item.application.user.first_name,
        lastName: item.application.user.last_name,
        email: item.application.user.email,
        studentNumber: item.application.user.student_number,
      }));
    } catch (error) {
      console.error('Error in getApprovedTutorsForModule:', error);
      throw error;
    }
  },

  // Check if user has pending application
  async hasPendingApplication(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('tutor_applications')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking pending application:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasPendingApplication:', error);
      throw error;
    }
  },
};
