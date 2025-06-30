import { Student, AttendanceRecord } from '../types';

export const mockStudents: Student[] = [
  {
    id: '1',
    firstName: 'Emma',
    lastName: 'Martin',
    parentEmail: 'parent.martin@email.com',
    class: 'CP-A'
  },
  {
    id: '2',
    firstName: 'Louis',
    lastName: 'Dubois',
    parentEmail: 'parent.dubois@email.com',
    class: 'CP-A'
  },
  {
    id: '3',
    firstName: 'Chloé',
    lastName: 'Bernard',
    parentEmail: 'parent.bernard@email.com',
    class: 'CE1-B'
  },
  {
    id: '4',
    firstName: 'Nathan',
    lastName: 'Petit',
    parentEmail: 'parent.petit@email.com',
    class: 'CE1-B'
  },
  {
    id: '5',
    firstName: 'Léa',
    lastName: 'Robert',
    parentEmail: 'parent.robert@email.com',
    class: 'CE2-A'
  },
  {
    id: '6',
    firstName: 'Hugo',
    lastName: 'Richard',
    parentEmail: 'parent.richard@email.com',
    class: 'CE2-A'
  },
  {
    id: '7',
    firstName: 'Manon',
    lastName: 'Durand',
    parentEmail: 'parent.durand@email.com',
    class: 'CM1-A'
  },
  {
    id: '8',
    firstName: 'Gabriel',
    lastName: 'Moreau',
    parentEmail: 'parent.moreau@email.com',
    class: 'CM1-A'
  }
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  // Données pour simuler des absences sur plusieurs jours
  {
    id: '1',
    studentId: '1',
    date: '2024-01-15',
    morningStatus: 'I',
    afternoonStatus: 'I'
  },
  {
    id: '2',
    studentId: '2',
    date: '2024-01-15',
    morningStatus: 'O',
    afternoonStatus: 'O'
  },
  {
    id: '3',
    studentId: '3',
    date: '2024-01-15',
    morningStatus: 'E',
    afternoonStatus: 'I'
  },
  {
    id: '4',
    studentId: '2',
    date: '2024-01-16',
    morningStatus: 'O',
    afternoonStatus: 'O'
  },
  {
    id: '5',
    studentId: '2',
    date: '2024-01-17',
    morningStatus: 'O',
    afternoonStatus: 'O'
  },
  {
    id: '6',
    studentId: '2',
    date: '2024-01-18',
    morningStatus: 'O',
    afternoonStatus: 'O'
  },
  {
    id: '7',
    studentId: '2',
    date: '2024-01-19',
    morningStatus: '',
    afternoonStatus: ''
  }
];