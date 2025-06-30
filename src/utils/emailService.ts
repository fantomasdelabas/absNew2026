import { Student } from '../types';

// Interface pour les modèles d'emails
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'absence' | 'alert' | 'reminder';
}

// Modèles par défaut (peuvent être récupérés depuis localStorage ou une base de données)
export const getEmailTemplates = (): EmailTemplate[] => {
  const saved = localStorage.getItem('emailTemplates');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Erreur lors du chargement des modèles d\'emails:', e);
    }
  }

  // Modèles par défaut
  return [
    {
      id: 'absence',
      name: 'Absence du jour',
      type: 'absence',
      subject: 'Absence non justifiée - {studentName}',
      body: `Bonjour,

Nous vous informons que votre enfant {studentName} était absent(e) le {date} {period}.

Nous vous remercions de bien vouloir justifier cette absence dans les plus brefs délais.

Cordialement,
L'équipe pédagogique`
    },
    {
      id: 'alert',
      name: 'Alerte seuil dépassé',
      type: 'alert',
      subject: 'ALERTE - Absences répétées de {studentName}',
      body: `Bonjour,

Nous attirons votre attention sur le fait que votre enfant {studentName} a accumulé {absenceCount} demi-jours d'absences injustifiées.

Ce nombre dépasse le seuil d'alerte fixé par l'établissement. Nous vous demandons de prendre contact avec nous rapidement pour régulariser cette situation.

Une rencontre pourrait être nécessaire pour discuter de l'assiduité de votre enfant.

Cordialement,
La direction`
    },
    {
      id: 'reminder',
      name: 'Rappel justification',
      type: 'reminder',
      subject: 'Rappel - Justification d\'absence requise pour {studentName}',
      body: `Bonjour,

Nous vous rappelons qu'une justification est encore attendue pour l'absence de votre enfant {studentName} du {date}.

Merci de nous faire parvenir le justificatif dans les meilleurs délais (certificat médical, mot d'excuse, etc.).

Cordialement,
Le secrétariat`
    }
  ];
};

// Fonction pour remplacer les variables dans le template
const replaceVariables = (text: string, variables: Record<string, string>): string => {
  let result = text;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return result;
};

// Fonction principale pour envoyer un email avec un template spécifique
export const sendEmailWithTemplate = (
  student: Student, 
  templateType: 'absence' | 'alert' | 'reminder',
  variables: Record<string, string> = {}
) => {
  const templates = getEmailTemplates();
  const template = templates.find(t => t.type === templateType);
  
  if (!template) {
    console.error(`Template de type "${templateType}" non trouvé`);
    return;
  }

  // Variables par défaut
  const defaultVariables = {
    studentName: `${student.firstName} ${student.lastName}`,
    date: variables.date || new Date().toLocaleDateString('fr-FR'),
    period: variables.period || '',
    absenceCount: variables.absenceCount || '0'
  };

  // Fusionner avec les variables personnalisées
  const allVariables = { ...defaultVariables, ...variables };

  // Remplacer les variables dans le sujet et le corps
  const subject = replaceVariables(template.subject, allVariables);
  const body = replaceVariables(template.body, allVariables);

  // Créer le lien mailto
  const mailtoLink = `mailto:${student.parentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Ouvrir le client email
  window.open(mailtoLink, '_blank');
};

// Fonction de compatibilité avec l'ancienne version
export const sendEmailToParent = (student: Student, date: string, period: 'matin' | 'après-midi') => {
  sendEmailWithTemplate(student, 'absence', {
    date: new Date(date).toLocaleDateString('fr-FR'),
    period: period
  });
};

// Fonction pour envoyer une alerte
export const sendAlertEmail = (student: Student, absenceCount: number) => {
  sendEmailWithTemplate(student, 'alert', {
    absenceCount: absenceCount.toString()
  });
};

// Fonction pour envoyer un rappel
export const sendReminderEmail = (student: Student, date: string) => {
  sendEmailWithTemplate(student, 'reminder', {
    date: new Date(date).toLocaleDateString('fr-FR')
  });
};

// Fonctions utilitaires
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Fonction pour sauvegarder les templates
export const saveEmailTemplates = (templates: EmailTemplate[]) => {
  try {
    localStorage.setItem('emailTemplates', JSON.stringify(templates));
    return true;
  } catch (e) {
    console.error('Erreur lors de la sauvegarde des modèles d\'emails:', e);
    return false;
  }
};

// Fonction pour récupérer un template spécifique
export const getEmailTemplate = (type: 'absence' | 'alert' | 'reminder'): EmailTemplate | null => {
  const templates = getEmailTemplates();
  return templates.find(t => t.type === type) || null;
};