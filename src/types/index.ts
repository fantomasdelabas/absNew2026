export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  parentEmail: string;
  class: string;
}

export type AttendanceStatus = 'I' | 'E' | 'M' | 'O' | '';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  morningStatus: AttendanceStatus;
  afternoonStatus: AttendanceStatus;
  notes?: string;
}

export interface AttendanceSummary {
  studentId: string;
  totalUnjustified: number;
  totalExcused: number;
  totalMedical: number;
  totalPresent: number;
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  'I': 'Présent',
  'E': 'Excusé',
  'M': 'Certificat médical',
  'O': 'Non excusé',
  '': 'Motif non reçu'
};

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  'I': 'bg-green-100 text-green-800',
  'E': 'bg-blue-100 text-blue-800',
  'M': 'bg-purple-100 text-purple-800',
  'O': 'bg-red-100 text-red-800',
  '': 'bg-gray-100 text-gray-800'
};