import { createClient } from "@/utils/supabase/server";

export interface Beneficiary {
  id: string;
  name: string;
  contact: string | null;
  category: string | null;
  created_at: string;
}

export async function createBeneficiary(data: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('beneficiaries').insert([data]);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getBeneficiaries(searchQuery?: string): Promise<Beneficiary[]> {
  const supabase = await createClient();
  let request = supabase.from('beneficiaries').select('*').order('name', { ascending: true });
  
  if (searchQuery) request = request.ilike('name', `%${searchQuery}%`);
  
  const { data, error } = await request;
  if (error) return [];
  return data || [];
}