import React, { useState } from 'react';
import { GraduationCap, Home, Users, Calendar, BarChart3, Settings } from 'lucide-react';
import { useAttendance } from './hooks/useAttendance';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { StudentDetails } from './components/StudentDetails';
import { Student } from './types';
import { AttendanceEncoder } from './components/AttendanceEncoder';
import { Configuration } from './components/Configuration';

type View = 'dashboard' | 'students' | 'studentDetail' | 'attendance' | 'configuration';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const {
    students,
    calculateAttendanceSummary,
    addStudents,
    addStudent,
    removeStudent,
    updateStudent,
    updateAttendance,
    getStudentAttendanceForDate,
    attendanceRecords,
    emailLogs,
    addEmailLog
  } = useAttendance();

  const navigationItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: Home },
    { id: 'students', label: 'Élèves', icon: Users },
    { id: 'attendance', label: 'Absences', icon: Calendar },
    { id: 'configuration', label: 'Configuration', icon: Settings }
  ];

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            students={students}
            getAttendanceSummary={calculateAttendanceSummary}
            addEmailLog={addEmailLog}
          />
        );
      case 'students':
        return (
          <StudentList
            students={students}
            getAttendanceSummary={calculateAttendanceSummary}
            onStudentSelect={(s) => {
              setSelectedStudent(s);
              setCurrentView('studentDetail');
            }}
          />
        );
      case 'studentDetail':
        if (!selectedStudent) return null;
        return (
          <StudentDetails
            student={selectedStudent}
            attendanceRecords={attendanceRecords}
            emailLogs={emailLogs}
            onBack={() => setCurrentView('students')}
          />
        );
      case 'attendance':
        return (
          <AttendanceEncoder
            students={students}
            updateAttendance={updateAttendance}
            getStudentAttendanceForDate={getStudentAttendanceForDate}
            addEmailLog={addEmailLog}
          />
        );
      case 'configuration':
        return (
          <Configuration
            students={students}
            onStudentsImported={addStudents}
            onStudentAdded={addStudent}
            onStudentDeleted={removeStudent}
            onStudentUpdated={updateStudent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">École Primaire</h1>
                <p className="text-sm text-gray-600">Gestion des Absences</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {students.length} élèves
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-white rounded-lg shadow-md p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView(item.id as View)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      currentView === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Main Content */}
          <main className="flex-1">
            {renderCurrentView()}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
