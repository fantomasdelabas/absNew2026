import React, { useState, useRef } from 'react';
import { Settings, Upload, Download, FileSpreadsheet, Users, AlertCircle, CheckCircle, Trash2, Mail, Edit3, Save, Eye } from 'lucide-react';
import { Student } from '../types';
import { EmailTemplate, getEmailTemplates, saveEmailTemplates } from '../utils/emailService';
import * as XLSX from 'xlsx';

interface ConfigurationProps {
  students: Student[];
  onStudentsImported: (students: Student[]) => void;
  onStudentAdded: (student: Student) => void;
  onStudentDeleted: (studentId: string) => void;
}

export const Configuration: React.FC<ConfigurationProps> = ({ students, onStudentsImported, onStudentAdded, onStudentDeleted }) => {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(getEmailTemplates());
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [singleStatus, setSingleStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [singleMessage, setSingleMessage] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const students: Student[] = [];
        let errors: string[] = [];

        jsonData.forEach((row: any, index: number) => {
          const rowNumber = index + 2;
          
          if (!row['Prénom'] || !row['Nom'] || !row['Email Parent'] || !row['Classe']) {
            errors.push(`Ligne ${rowNumber}: Champs manquants (Prénom, Nom, Email Parent, Classe requis)`);
            return;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(row['Email Parent'])) {
            errors.push(`Ligne ${rowNumber}: Email invalide (${row['Email Parent']})`);
            return;
          }

          students.push({
            id: `imported-${Date.now()}-${index}`,
            firstName: row['Prénom'].toString().trim(),
            lastName: row['Nom'].toString().trim(),
            parentEmail: row['Email Parent'].toString().trim().toLowerCase(),
            class: row['Classe'].toString().trim()
          });
        });

        if (errors.length > 0) {
          setImportStatus('error');
          setImportMessage(`Erreurs détectées:\n${errors.join('\n')}`);
        } else if (students.length === 0) {
          setImportStatus('error');
          setImportMessage('Aucun élève valide trouvé dans le fichier');
        } else {
          onStudentsImported(students);
          setImportedCount(students.length);
          setImportStatus('success');
          setImportMessage(`${students.length} élève(s) importé(s) avec succès`);
        }
      } catch (error) {
        setImportStatus('error');
        setImportMessage('Erreur lors de la lecture du fichier. Vérifiez le format Excel.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Prénom': 'Emma',
        'Nom': 'Martin',
        'Email Parent': 'parent.martin@email.com',
        'Classe': 'CP-A'
      },
      {
        'Prénom': 'Louis',
        'Nom': 'Dubois',
        'Email Parent': 'parent.dubois@email.com',
        'Classe': 'CP-A'
      },
      {
        'Prénom': 'Chloé',
        'Nom': 'Bernard',
        'Email Parent': 'parent.bernard@email.com',
        'Classe': 'CE1-B'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Élèves');
    
    const colWidths = [
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 10 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, 'modele_eleves.xlsx');
  };

  const handleAddSingleStudent = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!firstName || !lastName || !parentEmail || !studentClass) {
      setSingleStatus('error');
      setSingleMessage('Tous les champs sont obligatoires');
      return;
    }
    if (!emailRegex.test(parentEmail)) {
      setSingleStatus('error');
      setSingleMessage('Email parent invalide');
      return;
    }
    const newStudent: Student = {
      id: `manual-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      parentEmail: parentEmail.trim().toLowerCase(),
      class: studentClass.trim()
    };
    onStudentAdded(newStudent);
    setSingleStatus('success');
    setSingleMessage('Élève ajouté');
    setFirstName('');
    setLastName('');
    setParentEmail('');
    setStudentClass('');
  };

  const resetImportStatus = () => {
    setImportStatus('idle');
    setImportMessage('');
    setImportedCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTemplateUpdate = (templateId: string, field: 'subject' | 'body', value: string) => {
    setEmailTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, [field]: value }
        : template
    ));
  };

  const saveTemplate = (templateId: string) => {
    saveEmailTemplates(emailTemplates);
    setEditingTemplate(null);
    console.log('Template sauvegardé:', templateId);
  };

  const getTemplatePreview = (template: EmailTemplate) => {
    const sampleData = {
      studentName: 'Emma Martin',
      date: '15 janvier 2024',
      period: 'matin',
      absenceCount: '12'
    };

    let preview = template.body;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return preview;
  };

  const getTemplateTypeColor = (type: string) => {
    switch (type) {
      case 'absence': return 'bg-blue-100 text-blue-800';
      case 'alert': return 'bg-red-100 text-red-800';
      case 'reminder': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case 'absence': return '📅';
      case 'alert': return '⚠️';
      case 'reminder': return '🔔';
      default: return '📧';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
            <p className="text-gray-600">Gestion des élèves et paramètres de l'application</p>
          </div>
        </div>
      </div>

      {/* Email Templates Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-purple-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Modèles d'Emails
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Personnalisez les emails envoyés aux parents selon différentes situations
          </p>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Variables disponibles</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700">
              <div><code>{'{studentName}'}</code> - Nom de l'élève</div>
              <div><code>{'{date}'}</code> - Date d'absence</div>
              <div><code>{'{period}'}</code> - Période (matin/après-midi)</div>
              <div><code>{'{absenceCount}'}</code> - Nombre d'absences</div>
            </div>
          </div>

          <div className="space-y-6">
            {emailTemplates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getTemplateTypeIcon(template.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTemplateTypeColor(template.type)}`}>
                        {template.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewTemplate(previewTemplate === template.id ? null : template.id)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Aperçu"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingTemplate(editingTemplate === template.id ? null : template.id)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Preview Mode */}
                {previewTemplate === template.id && (
                  <div className="p-4 bg-yellow-50 border-b">
                    <h5 className="font-medium text-yellow-800 mb-2">Aperçu avec données d'exemple :</h5>
                    <div className="bg-white p-4 rounded border">
                      <div className="mb-2">
                        <strong>Objet :</strong> {template.subject.replace('{studentName}', 'Emma Martin')}
                      </div>
                      <div>
                        <strong>Message :</strong>
                        <pre className="whitespace-pre-wrap text-sm mt-1 text-gray-700">
                          {getTemplatePreview(template)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Mode */}
                {editingTemplate === template.id ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Objet de l'email
                      </label>
                      <input
                        type="text"
                        value={template.subject}
                        onChange={(e) => handleTemplateUpdate(template.id, 'subject', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Objet de l'email..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Corps du message
                      </label>
                      <textarea
                        value={template.body}
                        onChange={(e) => handleTemplateUpdate(template.id, 'body', e.target.value)}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Corps du message..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingTemplate(null)}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => saveTemplate(template.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700">Objet :</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                        {template.subject}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Message :</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{template.body}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
      </div>
    </div>

    {/* Single Student Section */}
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-blue-50 border-b">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gestion des Élèves
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Ajouter un élève individuellement ou supprimer un élève existant
        </p>
      </div>
      <div className="p-6 space-y-6">
        {singleStatus !== 'idle' && (
          <div className={`p-4 rounded-lg border ${
            singleStatus === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-sm ${singleStatus === 'success' ? 'text-green-700' : 'text-red-700'}`}>{singleMessage}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nom"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="Email Parent"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={studentClass}
            onChange={(e) => setStudentClass(e.target.value)}
            placeholder="Classe"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddSingleStudent}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Ajouter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Nom</th>
                <th className="px-4 py-2 text-left">Classe</th>
                <th className="px-4 py-2 text-left">Email Parent</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-4 py-2">{student.firstName} {student.lastName}</td>
                  <td className="px-4 py-2">{student.class}</td>
                  <td className="px-4 py-2">{student.parentEmail}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => onStudentDeleted(student.id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Import Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-green-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import des Élèves
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Importez une liste d'élèves depuis un fichier Excel
          </p>
        </div>

        <div className="p-6">
          {/* Status Messages */}
          {importStatus !== 'idle' && (
            <div className={`mb-6 p-4 rounded-lg border ${
              importStatus === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {importStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    importStatus === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {importStatus === 'success' ? 'Import réussi' : 'Erreur d\'import'}
                  </h4>
                  <pre className={`text-sm mt-1 whitespace-pre-wrap ${
                    importStatus === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {importMessage}
                  </pre>
                  {importStatus === 'success' && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
                      <Users className="w-4 h-4" />
                      {importedCount} élève(s) ajouté(s) à la liste
                    </div>
                  )}
                </div>
                <button
                  onClick={resetImportStatus}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Instructions d'import</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Le fichier doit être au format Excel (.xlsx ou .xls)</li>
              <li>• La première ligne doit contenir les en-têtes de colonnes</li>
              <li>• Colonnes requises : <strong>Prénom</strong>, <strong>Nom</strong>, <strong>Email Parent</strong>, <strong>Classe</strong></li>
              <li>• L'email du parent doit être valide</li>
              <li>• Tous les champs sont obligatoires</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadTemplate}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger le modèle Excel
            </button>

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer w-full"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Sélectionner un fichier Excel
              </label>
            </div>
          </div>

          {/* Format Example */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">Exemple de format attendu :</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">Prénom</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Nom</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Email Parent</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Classe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Emma</td>
                    <td className="border border-gray-300 px-3 py-2">Martin</td>
                    <td className="border border-gray-300 px-3 py-2">parent.martin@email.com</td>
                    <td className="border border-gray-300 px-3 py-2">CP-A</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">Louis</td>
                    <td className="border border-gray-300 px-3 py-2">Dubois</td>
                    <td className="border border-gray-300 px-3 py-2">parent.dubois@email.com</td>
                    <td className="border border-gray-300 px-3 py-2">CP-A</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Paramètres Avancés</h3>
          <p className="text-sm text-gray-600 mt-1">
            Configuration des alertes et notifications
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div>
                <h4 className="font-medium text-yellow-800">Seuil d'alerte</h4>
                <p className="text-sm text-yellow-700">
                  Nombre de demi-jours d'absences injustifiées avant alerte
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  defaultValue={8}
                  min={1}
                  max={20}
                  className="w-16 px-2 py-1 border border-yellow-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <span className="text-sm text-yellow-700">demi-jours</span>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
              <p><strong>Note :</strong> Les paramètres avancés seront disponibles dans une prochaine version. 
              Actuellement, le seuil d'alerte est fixé à 8 demi-jours d\'absences injustifiées.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
