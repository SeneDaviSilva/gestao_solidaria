import { createClient } from "@/utils/supabase/server";

export interface Beneficiary {
  id: string;
  name: string;
  contact: string | null;
  category: string | null;
  created_at: string;
  created_by_name: string | null;
}

export async function getBeneficiaries(searchQuery?: string): Promise<Beneficiary[]> {
  const supabase = await createClient();
  let request = supabase
    .from('beneficiaries')
    .select('id, name, contact, category, created_at, created_by_name')
    .order('name', { ascending: true });
  
  if (searchQuery) request = request.ilike('name', `%${searchQuery}%`);
  
  const { data, error } = await request;
  if (error) return [];
  return data || [];
}