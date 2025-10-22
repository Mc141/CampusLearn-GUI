import { supabase } from '../lib/supabase';
import { Module } from '../types';

export interface TutorModuleInfo {
  appliedModules: Module[];
  assignedModules: Module[];
  applicationStatus: 'pending' | 'approved' | 'rejected' | null;
  applicationId?: string;
}

export const tutorModuleService = {
  // Get tutor's application and assignment modules
  async getTutorModuleInfo(userId: string): Promise<TutorModuleInfo> {
    try {
      // Get tutor application with modules
      const { data: application, error: appError } = await supabase
        .from('tutor_applications')
        .select(`
          id,
          status,
          modules:tutor_application_modules(
            module:modules(
              id,
              name,
              code,
              description,
              level,
              programme_title,
              year_group,
              academic_year,
              nqf_level,
              credits,
              pdf_url,
              pdf_local_path
            )
          )
        `)
        .eq('user_id', userId)
        .single();

      if (appError && appError.code !== 'PGRST116') {
        console.error('Error fetching tutor application:', appError);
        throw appError;
      }

      // If no application exists, return empty data
      if (!application) {
        return {
          appliedModules: [],
          assignedModules: [],
          applicationStatus: null,
        };
      }

      // Extract applied modules from application
      const appliedModules = application.modules?.map((m: any) => m.module) || [];

      // If application is approved, assigned modules are the same as applied modules
      // If application is pending or rejected, no assigned modules
      const assignedModules = application.status === 'approved' ? appliedModules : [];

      return {
        appliedModules,
        assignedModules,
        applicationStatus: application.status,
        applicationId: application.id,
      };
    } catch (error) {
      console.error('Error in getTutorModuleInfo:', error);
      throw error;
    }
  },

  // Get all modules that a tutor can apply for (not already applied)
  async getAvailableModulesForApplication(userId: string): Promise<Module[]> {
    try {
      // Get all modules
      const { data: allModules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .order('code');

      if (modulesError) {
        console.error('Error fetching all modules:', modulesError);
        throw modulesError;
      }

      // Get tutor's current application modules
      const { data: application, error: appError } = await supabase
        .from('tutor_applications')
        .select(`
          modules:tutor_application_modules(
            module_id
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (appError && appError.code !== 'PGRST116') {
        console.error('Error fetching current application:', appError);
        throw appError;
      }

      // If no pending application, return all modules
      if (!application) {
        return allModules || [];
      }

      // Filter out modules that are already in the application
      const appliedModuleIds = application.modules?.map((m: any) => m.module_id) || [];
      const availableModules = allModules?.filter(module => !appliedModuleIds.includes(module.id)) || [];

      return availableModules;
    } catch (error) {
      console.error('Error in getAvailableModulesForApplication:', error);
      throw error;
    }
  },

  // Get tutor's application status and details
  async getTutorApplicationStatus(userId: string): Promise<{
    status: 'pending' | 'approved' | 'rejected' | null;
    applicationId?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    createdAt?: Date;
  }> {
    try {
      const { data: application, error } = await supabase
        .from('tutor_applications')
        .select(`
          id,
          status,
          reviewed_by,
          reviewed_at,
          created_at,
          reviewer:users!tutor_applications_reviewed_by_fkey(
            first_name,
            last_name
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching application status:', error);
        throw error;
      }

      if (!application) {
        return { status: null };
      }

      return {
        status: application.status,
        applicationId: application.id,
        reviewedBy: application.reviewer ? `${application.reviewer.first_name} ${application.reviewer.last_name}` : undefined,
        reviewedAt: application.reviewed_at,
        createdAt: application.created_at,
      };
    } catch (error) {
      console.error('Error in getTutorApplicationStatus:', error);
      throw error;
    }
  },
};
