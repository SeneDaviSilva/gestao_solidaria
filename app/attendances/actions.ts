"use server";

import {
  createAttendance as createAttendanceRecord,
} from "@/services/attendances";
import type { Attendance } from "@/utils/supabase/attendances";

type AttendanceInput = Pick<
  Attendance,
  "beneficiary_id" | "type" | "description"
>;

export async function createAttendance(data: AttendanceInput) {
  return createAttendanceRecord(data);
}
