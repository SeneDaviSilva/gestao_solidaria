import { createClient } from "@/utils/supabase/server";

export interface Attendance {
  id: string;
  beneficiary_id: string;
  type: string;
  description: string | null;
  date: string;
  created_at: string;
  beneficiaries?: { name: string; };
}

export async function createAttendance(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('attendances').insert([data]);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAttendances(searchQuery?: string, filterType?: string): Promise<Attendance[]> {
  const supabase = await createClient();
  let request = supabase
    .from('attendances')
    .select(`id, beneficiary_id, type, description, date, created_at, beneficiaries!inner ( name )`)
    .order('date', { ascending: false });
    
  if (searchQuery) request = request.ilike('beneficiaries.name', `%${searchQuery}%`);
  if (filterType && filterType !== 'all') request = request.eq('type', filterType);
  
  const { data, error } = await request;
  if (error) return [];
  
  // O "as any" força o TypeScript a aceitar a nossa tipagem da interface Attendance
  return (data as any) as Attendance[];
}