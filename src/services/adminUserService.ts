import { supabase } from '../lib/supabase';

export type PlatformRole = 'student' | 'tutor';

export interface AdminUserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: PlatformRole;
  is_active: boolean;
  created_at: string;
  last_login?: string | null;
  student_number?: string | null;
}

export const adminUserService = {
  async listUsers(search?: string): Promise<AdminUserRow[]> {
    let query = supabase
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, created_at, last_login, student_number')
      .neq('role', 'admin') // Exclude admin users
      .order('created_at', { ascending: false });
    if (search && search.trim()) {
      query = query.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updateRole(userId: string, role: PlatformRole): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId);
    if (error) throw error;
  },

  async setActive(userId: string, isActive: boolean, adminId?: string, reason?: string): Promise<void> {
    // Prefer RPC if available (adds audit metadata); fallback to direct update
    const rpc = await supabase.rpc('set_user_ban_state', {
      p_user_id: userId,
      p_is_active: isActive,
      p_banned_by: adminId ?? null,
      p_reason: reason ?? null,
    });
    if (rpc.error && rpc.error.code === '42883') {
      // function not found → fallback to simple update
      const { error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId);
      if (error) throw error;
    } else if (rpc.error) {
      throw rpc.error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
  },
};


