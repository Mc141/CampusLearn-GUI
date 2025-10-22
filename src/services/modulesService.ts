import { supabase } from '../lib/supabase';
import { Module } from '../types';

export const modulesService = {
  async getAllModules(): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('code', { ascending: true });

      if (error) {
        console.error('Error fetching modules:', error);
        throw error;
      }

      return data.map(module => ({
        id: module.id,
        name: module.name,
        code: module.code,
        description: module.description,
        level: module.level,
      }));
    } catch (error) {
      console.error('Error in getAllModules:', error);
      throw error;
    }
  },

  async getModulesByLevel(level: string): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('level', level)
        .order('code', { ascending: true });

      if (error) {
        console.error('Error fetching modules by level:', error);
        throw error;
      }

      return data.map(module => ({
        id: module.id,
        name: module.name,
        code: module.code,
        description: module.description,
        level: module.level,
      }));
    } catch (error) {
      console.error('Error in getModulesByLevel:', error);
      throw error;
    }
  },

  async getUserModules(userId: string): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('user_modules')
        .select(`
          module:modules(
            id,
            name,
            code,
            description,
            level
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user modules:', error);
        throw error;
      }

      return data.map(userModule => ({
        id: userModule.module.id,
        name: userModule.module.name,
        code: userModule.module.code,
        description: userModule.module.description,
        level: userModule.module.level,
      }));
    } catch (error) {
      console.error('Error in getUserModules:', error);
      throw error;
    }
  },
};
