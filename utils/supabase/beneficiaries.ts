export interface Beneficiary {
  id: string;
  name: string;
  contact: string | null;
  category: string | null;
  created_at: string;
  created_by_name: string | null;
}