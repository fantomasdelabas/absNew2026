import React from 'react';
import { Student, AttendanceRecord, STATUS_LABELS, EmailLog } from '../types';
import { formatDate } from '../utils/emailService';

interface StudentDetailsProps {
  student: Student;
  attendanceRecords: AttendanceRecord[];
  emailLogs: EmailLog[];
  onBack: () => void;
}

export const StudentDetails: React.FC<StudentDetailsProps> = ({ student, attendanceRecords, emailLogs, onBack }) => {
  const records = attendanceRecords
    .filter(r => r.studentId === student.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const emails = emailLogs
    .filter(e => e.studentId === student.id)
    .sort((a, b) => a.dateSent.localeCompare(b.dateSent));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <button onClick={onBack} className="text-blue-600 mb-4">&larr; Retour</button>
      <h2 className="text-2xl font-bold mb-4">{student.firstName} {student.lastName}</h2>
      <p className="text-sm text-gray-600 mb-1">Classe: {student.class}</p>
      <p className="text-sm text-gray-600 mb-4">Email parent: {student.parentEmail}</p>

      <h3 className="text-lg font-medium mt-4 mb-2">Absences</h3>
      <table className="w-full mb-4">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matin</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Après-midi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {records.map(record => (
            <tr key={record.id}>
              <td className="px-4 py-2 whitespace-nowrap">{formatDate(record.date)}</td>
              <td className="px-4 py-2 whitespace-nowrap">{STATUS_LABELS[record.morningStatus]}</td>
              <td className="px-4 py-2 whitespace-nowrap">{STATUS_LABELS[record.afternoonStatus]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="text-lg font-medium mt-4 mb-2">Emails envoyés</h3>
      <ul className="list-disc list-inside">
        {emails.length === 0 && <li>Aucun email envoyé</li>}
        {emails.map(email => (
          <li key={email.id}>{new Date(email.dateSent).toLocaleDateString('fr-FR')} - {email.templateType}</li>
        ))}
      </ul>
    </div>
  );
};
