export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  parentEmail: string;
  class: string;
}

export type AttendanceStatus = 'E' | 'M' | 'O' | '';

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
}

export interface EmailLog {
  id: string;
  studentId: string;
  dateSent: string;
  templateType: 'absence' | 'alert' | 'reminder';
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  'E': 'Excusé',
  'M': 'Certificat médical',
  'O': 'Non excusé',
  '': 'Motif non reçu'
};

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  'E': 'bg-blue-100 text-blue-800',
  'M': 'bg-purple-100 text-purple-800',
  'O': 'bg-red-100 text-red-800',
  '': 'bg-gray-100 text-gray-800'
};
