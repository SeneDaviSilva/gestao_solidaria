export interface Attendance {
  id: string;
  beneficiary_id: string;
  type: string;
  description: string | null;
  date: string;
  created_at: string;
  created_by_name: string | null;
  beneficiaries?: { name: string; };
}