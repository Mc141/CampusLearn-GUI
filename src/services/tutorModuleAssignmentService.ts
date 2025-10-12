import { supabase } from '../lib/supabase';

export interface TutorModuleAssignment {
  id: string;
  tutorId: string;
  moduleId: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface TutorWithModuleDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentNumber?: string;
  approvedModules: {
    id: string;
    name: string;
    code: string;
    level: string;
  }[];
}

export const tutorModuleAssignmentService = {
  // Assign a tutor to a module
  async assignTutorToModule(tutorId: string, moduleId: string, assignedBy: string): Promise<void> {
    try {
      // Check if tutor has an approved application
      const { data: application, error: appError } = await supabase
        .from('tutor_applications')
        .select('id, status')
        .eq('user_id', tutorId)
        .eq('status', 'approved')
        .single();

      if (appError) {
        if (appError.code === 'PGRST116') {
          throw new Error('Tutor does not have an approved application');
        }
        console.error('Error checking tutor application:', appError);
        throw appError;
      }

      // Check if tutor is already assigned to this module
      const { data: existingAssignment, error: checkError } = await supabase
        .from('tutor_application_modules')
        .select('id')
        .eq('application_id', application.id)
        .eq('module_id', moduleId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing assignment:', checkError);
        throw checkError;
      }

      if (existingAssignment) {
        throw new Error('Tutor is already assigned to this module');
      }

      // Assign tutor to module
      const { error: assignError } = await supabase
        .from('tutor_application_modules')
        .insert([
          {
            application_id: application.id,
            module_id: moduleId,
          },
        ]);

      if (assignError) {
        console.error('Error assigning tutor to module:', assignError);
        throw assignError;
      }
    } catch (error) {
      console.error('Error in assignTutorToModule:', error);
      throw error;
    }
  },

  // Remove a tutor from a module
  async removeTutorFromModule(tutorId: string, moduleId: string): Promise<void> {
    try {
      // Get the tutor's application
      const { data: application, error: appError } = await supabase
        .from('tutor_applications')
        .select('id')
        .eq('user_id', tutorId)
        .eq('status', 'approved')
        .single();

      if (appError) {
        console.error('Error fetching tutor application:', appError);
        throw appError;
      }

      // Remove the assignment
      const { error } = await supabase
        .from('tutor_application_modules')
        .delete()
        .eq('application_id', application.id)
        .eq('module_id', moduleId);

      if (error) {
        console.error('Error removing tutor from module:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in removeTutorFromModule:', error);
      throw error;
    }
  },

  // Get all approved tutors with their module assignments
  async getAllApprovedTutors(): Promise<TutorWithModuleDetails[]> {
    try {
      const { data, error } = await supabase
        .from('tutor_applications')
        .select(`
          user_id,
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
              level
            )
          )
        `)
        .eq('status', 'approved');

      if (error) {
        console.error('Error fetching approved tutors:', error);
        throw error;
      }

      return data.map(app => ({
        id: app.user.id,
        firstName: app.user.first_name,
        lastName: app.user.last_name,
        email: app.user.email,
        studentNumber: app.user.student_number,
        approvedModules: app.modules.map((m: any) => ({
          id: m.module.id,
          name: m.module.name,
          code: m.module.code,
          level: m.module.level,
        })),
      }));
    } catch (error) {
      console.error('Error in getAllApprovedTutors:', error);
      throw error;
    }
  },

  // Get modules not yet assigned to a tutor
  async getAvailableModulesForTutor(tutorId: string): Promise<any[]> {
    try {
      // Get tutor's application
      const { data: application, error: appError } = await supabase
        .from('tutor_applications')
        .select('id')
        .eq('user_id', tutorId)
        .eq('status', 'approved')
        .single();

      if (appError) {
        console.error('Error fetching tutor application:', appError);
        throw appError;
      }

      // Get assigned modules
      const { data: assignedModules, error: assignedError } = await supabase
        .from('tutor_application_modules')
        .select('module_id')
        .eq('application_id', application.id);

      if (assignedError) {
        console.error('Error fetching assigned modules:', assignedError);
        throw assignedError;
      }

      const assignedModuleIds = assignedModules.map(m => m.module_id);

      // Get all modules
      const { data: allModules, error: modulesError } = await supabase
        .from('modules')
        .select('id, name, code, level');

      if (modulesError) {
        console.error('Error fetching all modules:', modulesError);
        throw modulesError;
      }

      // Filter out already assigned modules
      return allModules.filter(module => !assignedModuleIds.includes(module.id));
    } catch (error) {
      console.error('Error in getAvailableModulesForTutor:', error);
      throw error;
    }
  },

  // Get all modules
  async getAllModules(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, code, level');

      if (error) {
        console.error('Error fetching modules:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getAllModules:', error);
      throw error;
    }
  },
};
