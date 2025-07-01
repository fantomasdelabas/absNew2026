import React, { useState, useMemo } from 'react';
import { Calendar, Save, Mail, Check, Search, Filter, AlertCircle } from 'lucide-react';
import { Student, AttendanceStatus, STATUS_LABELS, STATUS_COLORS } from '../types';
import { AttendanceRecord } from '../types';
import { sendEmailToParent, formatDate, getTodayString } from '../utils/emailService';

interface AttendanceEncoderProps {
  students: Student[];
  getStudentAttendanceForDate: (
    studentId: string,
    date: string
  ) => AttendanceRecord | null;
  updateAttendance: (
    studentId: string,
    date: string,
    period: 'morning' | 'afternoon',
    status: AttendanceStatus
  ) => void;
  addEmailLog: (studentId: string, templateType: 'absence' | 'alert' | 'reminder') => void;
}

interface PendingAttendance {
  studentId: string;
  morningStatus: AttendanceStatus;
  afternoonStatus: AttendanceStatus;
}

export const AttendanceEncoder: React.FC<AttendanceEncoderProps> = ({
  students,
  getStudentAttendanceForDate,
  updateAttendance,
  addEmailLog
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [pendingChanges, setPendingChanges] = useState<Record<string, PendingAttendance>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Obtenir la liste unique des classes
  const availableClasses = useMemo(() => {
    const classes = [...new Set(students.map(student => student.class))];
    return classes.sort();
  }, [students]);

  // Filtrer les élèves selon les critères
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesName = nameFilter === '' || 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(nameFilter.toLowerCase());
      
      const matchesClass = classFilter === '' || student.class === classFilter;
      
      return matchesName && matchesClass;
    });
  }, [students, nameFilter, classFilter]);

  // Initialiser les présences par défaut pour la date sélectionnée
  const initializeDefaultAttendance = () => {
    const newPendingChanges: Record<string, PendingAttendance> = {};
    
    students.forEach(student => {
      const existingAttendance = getStudentAttendanceForDate(student.id, selectedDate);
      
      newPendingChanges[student.id] = {
        studentId: student.id,
        morningStatus: existingAttendance?.morningStatus || '',
        afternoonStatus: existingAttendance?.afternoonStatus || ''
      };
    });
    
    setPendingChanges(newPendingChanges);
    setHasUnsavedChanges(false);
  };

  // Initialiser quand la date change
  React.useEffect(() => {
    initializeDefaultAttendance();
  }, [selectedDate, students]);

  const handleStatusChange = (
    studentId: string,
    period: 'morning' | 'afternoon',
    status: AttendanceStatus
  ) => {
    setPendingChanges(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        studentId,
        [period === 'morning' ? 'morningStatus' : 'afternoonStatus']: status
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    // Sauvegarder tous les changements en attente
    Object.values(pendingChanges).forEach(attendance => {
      updateAttendance(attendance.studentId, selectedDate, 'morning', attendance.morningStatus);
      updateAttendance(attendance.studentId, selectedDate, 'afternoon', attendance.afternoonStatus);
    });

    setHasUnsavedChanges(false);
    setShowSaveConfirmation(true);
    setTimeout(() => {
      setShowSaveConfirmation(false);
    }, 3000);
  };

  const handleSendEmail = (student: Student, period: 'matin' | 'après-midi') => {
    sendEmailToParent(student, selectedDate, period);
    addEmailLog(student.id, 'absence');
  };

  const getStatusBadge = (status: AttendanceStatus) => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );

  const clearFilters = () => {
    setNameFilter('');
    setClassFilter('');
  };

  const getCurrentAttendance = (studentId: string) => {
    return pendingChanges[studentId] || {
      studentId,
      morningStatus: '',
      afternoonStatus: ''
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-blue-50 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Encodage des Absences
          </h2>
          <div className="flex items-center gap-4">
            {showSaveConfirmation && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1 animate-fade-in">
                <Check className="w-4 h-4" />
                Absences enregistrées avec succès !
              </span>
            )}
            <label className="text-sm font-medium text-gray-700">
              Date:
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="ml-2 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {formatDate(selectedDate)}
        </p>
      </div>

      {/* Alerte pour les modifications non sauvegardées */}
      {hasUnsavedChanges && (
        <div className="px-6 py-3 bg-orange-50 border-b border-orange-200">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Vous avez des modifications non sauvegardées. N'oubliez pas d'enregistrer !
            </span>
          </div>
        </div>
      )}

      {/* Section des filtres */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtres :</span>
          </div>
          
          {/* Filtre par nom */}
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>

          {/* Filtre par classe */}
          <div className="flex items-center gap-2">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Toutes les classes</option>
              {availableClasses.map(className => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton pour effacer les filtres */}
          {(nameFilter || classFilter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Effacer les filtres
            </button>
          )}

          {/* Compteur d'élèves */}
          <div className="ml-auto text-sm text-gray-600">
            {filteredStudents.length} élève{filteredStudents.length > 1 ? 's' : ''} affiché{filteredStudents.length > 1 ? 's' : ''}
            {filteredStudents.length !== students.length && (
              <span className="text-gray-500"> sur {students.length}</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Bouton d'enregistrement principal */}
        <div className="mb-6 flex items-center justify-between">
          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500">
            <div>Légende:</div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              E = Excusé
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              M = Certificat
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              O = Non excusé
            </div>
          </div>
          
          <button
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              hasUnsavedChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Enregistrer les Absences
          </button>
        </div>

        {/* Message si aucun élève ne correspond aux filtres */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun élève trouvé</h3>
            <p className="text-gray-500">
              Aucun élève ne correspond aux critères de recherche.
            </p>
            <button
              onClick={clearFilters}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Effacer les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Élève
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matin
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Après-midi
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const currentAttendance = getCurrentAttendance(student.id);
                  const morningStatus = currentAttendance.morningStatus;
                  const afternoonStatus = currentAttendance.afternoonStatus;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.class}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <select
                          value={morningStatus}
                          onChange={(e) => handleStatusChange(
                            student.id,
                            'morning',
                            e.target.value as AttendanceStatus
                          )}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="E">E - Excusé</option>
                          <option value="M">M - Certificat</option>
                          <option value="O">O - Non excusé</option>
                        </select>
                        {morningStatus && (
                          <div className="mt-1">
                            {getStatusBadge(morningStatus)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <select
                          value={afternoonStatus}
                          onChange={(e) => handleStatusChange(
                            student.id,
                            'afternoon',
                            e.target.value as AttendanceStatus
                          )}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="E">E - Excusé</option>
                          <option value="M">M - Certificat</option>
                          <option value="O">O - Non excusé</option>
                        </select>
                        {afternoonStatus && (
                          <div className="mt-1">
                            {getStatusBadge(afternoonStatus)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center gap-2">
                          {morningStatus === 'O' && (
                            <button
                              onClick={() => handleSendEmail(student, 'matin')}
                              className="inline-flex items-center px-2 py-1 border border-orange-300 rounded-md text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                              title="Envoyer email pour le matin"
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              AM
                            </button>
                          )}
                          {afternoonStatus === 'O' && (
                            <button
                              onClick={() => handleSendEmail(student, 'après-midi')}
                              className="inline-flex items-center px-2 py-1 border border-orange-300 rounded-md text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                              title="Envoyer email pour l'après-midi"
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              PM
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-end">
            {hasUnsavedChanges && (
              <div className="text-sm text-orange-600 bg-orange-50 px-4 py-2 rounded-lg border border-orange-200">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Modifications en attente - Cliquez sur "Enregistrer"
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};