"use server";

import {
  createAttendance as createAttendanceRecord,
  type Attendance,
} from "@/utils/supabase/attendances";

type AttendanceInput = Pick<
  Attendance,
  "beneficiary_id" | "type" | "description"
>;

export async function createAttendance(data: AttendanceInput) {
  return createAttendanceRecord(data);
}
