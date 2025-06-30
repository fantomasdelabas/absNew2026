import React, { useMemo } from 'react';
import { User, Mail, AlertTriangle } from 'lucide-react';
import { Student, AttendanceSummary } from '../types';

interface StudentListProps {
  students: Student[];
  getAttendanceSummary: (studentId: string) => AttendanceSummary;
  onStudentSelect?: (student: Student) => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  getAttendanceSummary,
  onStudentSelect
}) => {
  // Trier les élèves par nombre d'absences injustifiées (décroissant)
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const summaryA = getAttendanceSummary(a.id);
      const summaryB = getAttendanceSummary(b.id);
      
      // Tri par absences injustifiées (décroissant), puis par nom (croissant)
      if (summaryB.totalUnjustified !== summaryA.totalUnjustified) {
        return summaryB.totalUnjustified - summaryA.totalUnjustified;
      }
      
      // Si même nombre d'absences, trier par nom
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return nameA.localeCompare(nameB);
    });
  }, [students, getAttendanceSummary]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-blue-50 border-b">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5" />
          Liste des Élèves
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Triés par nombre d'absences injustifiées (plus élevé en premier)
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rang
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Élève
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Classe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Parent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Absences Injustifiées
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStudents.map((student, index) => {
              const summary = getAttendanceSummary(student.id);
              const hasAlert = summary.totalUnjustified > 8;
              const rank = index + 1;
              
              return (
                <tr
                  key={student.id}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                    hasAlert ? 'bg-red-50' : ''
                  }`}
                  onClick={() => onStudentSelect?.(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {rank <= 3 && summary.totalUnjustified > 0 && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-2 ${
                          rank === 1 ? 'bg-red-500' : 
                          rank === 2 ? 'bg-orange-500' : 
                          'bg-yellow-500'
                        }`}>
                          {rank}
                        </div>
                      )}
                      {(rank > 3 || summary.totalUnjustified === 0) && (
                        <span className="text-sm text-gray-500 w-6 text-center mr-2">
                          {rank}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {hasAlert && (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">ID: {student.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {student.class}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{student.parentEmail}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        hasAlert 
                          ? 'bg-red-100 text-red-800' 
                          : summary.totalUnjustified > 0 
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {summary.totalUnjustified} demi-jours
                      </span>
                      {summary.totalUnjustified > 0 && (
                        <div className="text-xs text-gray-500">
                          ({summary.totalPresent}P, {summary.totalExcused}E, {summary.totalMedical}M)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {hasAlert ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ⚠️ Alerte
                      </span>
                    ) : summary.totalUnjustified > 4 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ⚡ Attention
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Normal
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Légende */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>Légende:</span>
            <div className="flex items-center gap-1">
              <span className="text-xs">P = Présent</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">E = Excusé</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">M = Médical</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-xs">Top 1</span>
            <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            <span className="text-xs">Top 2</span>
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-xs">Top 3</span>
          </div>
        </div>
      </div>
    </div>
  );
};