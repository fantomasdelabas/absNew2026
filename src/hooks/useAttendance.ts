import { useState, useEffect, useCallback } from 'react';
import { AttendanceRecord, AttendanceSummary, Student, AttendanceStatus, EmailLog } from '../types';
import { mockAttendanceRecords, mockStudents } from '../data/mockData';

export const useAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendanceRecords);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  // Debug: afficher les enregistrements dans la console
  useEffect(() => {
    console.log('Enregistrements d\'absence actuels:', attendanceRecords);
  }, [attendanceRecords]);

  // Fonction pour calculer le résumé des absences d'un élève
  const calculateAttendanceSummary = useCallback(
    (studentId: string): AttendanceSummary => {
      const studentRecords = attendanceRecords.filter(
        record => record.studentId === studentId
      );

      let totalUnjustified = 0;
      let totalExcused = 0;
      let totalMedical = 0;

      studentRecords.forEach(record => {
        // Matin
        if (record.morningStatus === 'O' || record.morningStatus === '') {
          totalUnjustified++;
        } else if (record.morningStatus === 'E') {
          totalExcused++;
        } else if (record.morningStatus === 'M') {
          totalMedical++;
        }

        // Après-midi
        if (record.afternoonStatus === 'O' || record.afternoonStatus === '') {
          totalUnjustified++;
        } else if (record.afternoonStatus === 'E') {
          totalExcused++;
        } else if (record.afternoonStatus === 'M') {
          totalMedical++;
        }
      });

      console.log(`Résumé pour élève ${studentId}:`, {
        totalUnjustified,
        totalExcused,
        totalMedical,
        records: studentRecords
      });

      return {
        studentId,
        totalUnjustified,
        totalExcused,
        totalMedical
      };
    },
    [attendanceRecords]
  );

  const updateAttendance = (
    studentId: string,
    date: string,
    period: 'morning' | 'afternoon',
    status: AttendanceStatus
  ) => {
    console.log('Mise à jour:', { studentId, date, period, status });

    setAttendanceRecords(prev => {
      const existingIndex = prev.findIndex(
        record => record.studentId === studentId && record.date === date
      );

      if (existingIndex >= 0) {
        // Modifier l'enregistrement existant
        const updated = [...prev];
        if (period === 'morning') {
          updated[existingIndex].morningStatus = status;
        } else {
          updated[existingIndex].afternoonStatus = status;
        }
        // Supprimer l'enregistrement s'il ne reste plus aucune valeur
        if (
          updated[existingIndex].morningStatus === '' &&
          updated[existingIndex].afternoonStatus === ''
        ) {
          updated.splice(existingIndex, 1);
          console.log('Enregistrement supprimé (vide)');
          return updated;
        }

        console.log('Enregistrement modifié:', updated[existingIndex]);
        return updated;
      } else {
        // Ne rien faire si le statut est vide
        if (status === '') {
          return prev;
        }

        // Créer un nouvel enregistrement
        const newRecord: AttendanceRecord = {
          id: `${Date.now()}-${Math.random()}`,
          studentId,
          date,
          morningStatus: period === 'morning' ? status : '',
          afternoonStatus: period === 'afternoon' ? status : ''
        };
        console.log('Nouvel enregistrement créé:', newRecord);
        return [...prev, newRecord];
      }
    });
  };

  const addStudents = (newStudents: Student[]) => {
    setStudents(prev => {
      // Éviter les doublons basés sur l'email du parent
      const existingEmails = new Set(prev.map(s => s.parentEmail.toLowerCase()));
      const uniqueNewStudents = newStudents.filter(
        student => !existingEmails.has(student.parentEmail.toLowerCase())
      );

      console.log(`Ajout de ${uniqueNewStudents.length} nouveaux élèves`);
      return [...prev, ...uniqueNewStudents];
    });
  };

  const addStudent = (student: Student) => {
    setStudents(prev => {
      const exists = prev.some(
        s => s.parentEmail.toLowerCase() === student.parentEmail.toLowerCase()
      );
      if (exists) {
        console.warn('Étudiant déjà existant, ajout ignoré');
        return prev;
      }
      return [...prev, student];
    });
  };

  const updateStudent = (updated: Student) => {
    setStudents(prev =>
      prev.map(s => (s.id === updated.id ? { ...s, ...updated } : s))
    );
  };

  const removeStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setAttendanceRecords(prev => prev.filter(r => r.studentId !== studentId));
  };

  const addEmailLog = (studentId: string, templateType: 'absence' | 'alert' | 'reminder') => {
    const log: EmailLog = {
      id: `${Date.now()}-${Math.random()}`,
      studentId,
      dateSent: new Date().toISOString(),
      templateType
    };
    setEmailLogs(prev => [...prev, log]);
  };

  const getAttendanceForDate = (date: string): AttendanceRecord[] => {
    return attendanceRecords.filter(record => record.date === date);
  };

  const getStudentAttendanceForDate = (studentId: string, date: string): AttendanceRecord | null => {
    return attendanceRecords.find(
      record => record.studentId === studentId && record.date === date
    ) || null;
  };

  return {
    students,
    attendanceRecords,
    emailLogs,
    updateAttendance,
    addEmailLog,
    addStudents,
    addStudent,
    updateStudent,
    removeStudent,
    getAttendanceForDate,
    getStudentAttendanceForDate,
    calculateAttendanceSummary
  };
};
