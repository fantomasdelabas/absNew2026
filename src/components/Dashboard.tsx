import React, { useState, useMemo } from 'react';
import { BarChart3, Users, AlertTriangle, Mail, ChevronUp, ChevronDown, Minus, Search, Filter } from 'lucide-react';
import { Student, AttendanceSummary } from '../types';
import { sendAlertEmail } from '../utils/emailService';

interface DashboardProps {
  students: Student[];
  getAttendanceSummary: (studentId: string) => AttendanceSummary;
  addEmailLog: (studentId: string, templateType: 'absence' | 'alert' | 'reminder') => void;
}

type SortField = 'name' | 'class' | 'excused' | 'medical' | 'unjustified';
type SortDirection = 'asc' | 'desc';

interface ColumnFilter {
  field: SortField;
  minValue?: number;
  maxValue?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ students, getAttendanceSummary, addEmailLog }) => {
  const [sortField, setSortField] = useState<SortField>('unjustified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const availableClasses = useMemo(() => {
    const classes = [...new Set(students.map(s => s.class))];
    return classes.sort();
  }, [students]);

  const summaries = students.map(student => ({
    student,
    summary: getAttendanceSummary(student.id)
  }));

  const totalStudents = students.length;
  const studentsWithAlerts = summaries.filter(s => s.summary.totalUnjustified > 8).length;
  const totalUnjustified = summaries.reduce((acc, s) => acc + s.summary.totalUnjustified, 0);

  // Fonction pour gérer le tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Fonction pour ajouter un filtre
  const addColumnFilter = (field: SortField, type: 'min' | 'max') => {
    const values = summaries.map(s => {
      switch (field) {
        case 'excused': return s.summary.totalExcused;
        case 'medical': return s.summary.totalMedical;
        case 'unjustified': return s.summary.totalUnjustified;
        default: return 0;
      }
    });

    const value = type === 'min' ? Math.min(...values) : Math.max(...values);
    
    setColumnFilters(prev => {
      const existing = prev.find(f => f.field === field);
      if (existing) {
        return prev.map(f => f.field === field 
          ? { ...f, [type === 'min' ? 'minValue' : 'maxValue']: value }
          : f
        );
      } else {
        return [...prev, { 
          field, 
          [type === 'min' ? 'minValue' : 'maxValue']: value 
        }];
      }
    });
  };

  // Fonction pour supprimer un filtre
  const removeColumnFilter = (field: SortField) => {
    setColumnFilters(prev => prev.filter(f => f.field !== field));
  };

  // Données filtrées et triées
  const filteredAndSortedSummaries = useMemo(() => {
    let filtered = [...summaries];

    if (nameFilter.trim() !== '') {
      const term = nameFilter.toLowerCase();
      filtered = filtered.filter(item =>
        `${item.student.firstName} ${item.student.lastName}`.toLowerCase().includes(term)
      );
    }

    if (classFilter !== '') {
      filtered = filtered.filter(item => item.student.class === classFilter);
    }

    // Appliquer les filtres
    columnFilters.forEach(filter => {
      filtered = filtered.filter(item => {
        let value = 0;
        switch (filter.field) {
          case 'excused': value = item.summary.totalExcused; break;
          case 'medical': value = item.summary.totalMedical; break;
          case 'unjustified': value = item.summary.totalUnjustified; break;
        }
        
        if (filter.minValue !== undefined && value < filter.minValue) return false;
        if (filter.maxValue !== undefined && value > filter.maxValue) return false;
        return true;
      });
    });

    // Appliquer le tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = `${a.student.firstName} ${a.student.lastName}`;
          bValue = `${b.student.firstName} ${b.student.lastName}`;
          break;
        case 'class':
          aValue = a.student.class;
          bValue = b.student.class;
          break;
        case 'excused':
          aValue = a.summary.totalExcused;
          bValue = b.summary.totalExcused;
          break;
        case 'medical':
          aValue = a.summary.totalMedical;
          bValue = b.summary.totalMedical;
          break;
        case 'unjustified':
          aValue = a.summary.totalUnjustified;
          bValue = b.summary.totalUnjustified;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [summaries, columnFilters, sortField, sortDirection, nameFilter, classFilter]);

  const handleSendAlertEmail = (student: Student, absenceCount: number) => {
    sendAlertEmail(student, absenceCount);
    addEmailLog(student.id, 'alert');
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const getColumnFilter = (field: SortField) => {
    return columnFilters.find(f => f.field === field);
  };

  const clearFilters = () => {
    setNameFilter('');
    setClassFilter('');
  };

  const stats = [
    {
      title: 'Total Élèves',
      value: totalStudents,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Élèves en Alerte',
      value: studentsWithAlerts,
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    {
      title: 'Absences Injustifiées',
      value: totalUnjustified,
      icon: BarChart3,
      color: 'bg-orange-500'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {studentsWithAlerts > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Attention: {studentsWithAlerts} élève(s) en situation d'alerte
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Les élèves suivants ont plus de 8 demi-jours d'absences injustifiées:</p>
                <ul className="list-disc list-inside mt-1">
                  {summaries
                    .filter(s => s.summary.totalUnjustified > 8)
                    .map(({ student, summary }) => (
                      <li key={student.id} className="flex items-center justify-between py-1">
                        <span>
                          {student.firstName} {student.lastName} - {summary.totalUnjustified} demi-jours
                        </span>
                        <button
                          onClick={() => handleSendAlertEmail(student, summary.totalUnjustified)}
                          className="ml-4 inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                          title="Envoyer email d'alerte"
                        >
                          <Mail className="w-3 h-3 mr-1" />
                          Alerte
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres actifs */}
      {columnFilters.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-blue-800">Filtres actifs:</span>
            {columnFilters.map((filter, index) => (
              <div key={index} className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded text-sm text-blue-800">
                <span>
                  {filter.field === 'excused' && 'Excusées'}
                  {filter.field === 'medical' && 'Médicales'}
                  {filter.field === 'unjustified' && 'Injustifiées'}
                  {filter.minValue !== undefined && ` ≥ ${filter.minValue}`}
                  {filter.maxValue !== undefined && ` ≤ ${filter.maxValue}`}
                </span>
                <button
                  onClick={() => removeColumnFilter(filter.field)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => setColumnFilters([])}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Effacer tous les filtres
            </button>
          </div>
        </div>
      )}

      {/* Filtres par nom et classe */}
      <div className="bg-gray-50 border rounded-lg p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtres :</span>
        </div>
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
        <div className="flex items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les classes</option>
            {availableClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </div>
        {(nameFilter || classFilter) && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Effacer les filtres
          </button>
        )}
        <div className="ml-auto text-sm text-gray-600">
          {filteredAndSortedSummaries.length} élève{filteredAndSortedSummaries.length > 1 ? 's' : ''} affiché{filteredAndSortedSummaries.length > 1 ? 's' : ''}
          {filteredAndSortedSummaries.length !== summaries.length && (
            <span className="text-gray-500"> sur {summaries.length}</span>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Résumé par Élève ({filteredAndSortedSummaries.length} élève{filteredAndSortedSummaries.length > 1 ? 's' : ''})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-gray-700 transition-colors"
                  >
                    Élève
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleSort('excused')}
                      className="flex items-center hover:text-gray-700 transition-colors"
                    >
                      Excusées
                      {getSortIcon('excused')}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => addColumnFilter('excused', 'min')}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Filtrer valeur minimum"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => addColumnFilter('excused', 'max')}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Filtrer valeur maximum"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {getColumnFilter('excused') && (
                        <button
                          onClick={() => removeColumnFilter('excused')}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Supprimer filtre"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleSort('medical')}
                      className="flex items-center hover:text-gray-700 transition-colors"
                    >
                      Médicales
                      {getSortIcon('medical')}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => addColumnFilter('medical', 'min')}
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                        title="Filtrer valeur minimum"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => addColumnFilter('medical', 'max')}
                        className="p-1 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                        title="Filtrer valeur maximum"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {getColumnFilter('medical') && (
                        <button
                          onClick={() => removeColumnFilter('medical')}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Supprimer filtre"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleSort('unjustified')}
                      className="flex items-center hover:text-gray-700 transition-colors"
                    >
                      Injustifiées
                      {getSortIcon('unjustified')}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => addColumnFilter('unjustified', 'min')}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Filtrer valeur minimum"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => addColumnFilter('unjustified', 'max')}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Filtrer valeur maximum"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {getColumnFilter('unjustified') && (
                        <button
                          onClick={() => removeColumnFilter('unjustified')}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Supprimer filtre"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedSummaries.map(({ student, summary }) => (
                <tr key={student.id} className={summary.totalUnjustified > 8 ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {summary.totalUnjustified > 8 && (
                        <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.class}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {summary.totalExcused}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {summary.totalMedical}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      summary.totalUnjustified > 8
                        ? 'bg-red-100 text-red-800'
                        : summary.totalUnjustified > 0
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {summary.totalUnjustified}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {summary.totalUnjustified > 8 && (
                      <button
                        onClick={() => handleSendAlertEmail(student, summary.totalUnjustified)}
                        className="inline-flex items-center px-2 py-1 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        title="Envoyer email d'alerte"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Alerte
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
