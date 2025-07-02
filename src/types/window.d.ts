import type { Eleve, Absence } from '@/services/db';
interface ApiBridge {
  listerEleves(): Promise<Eleve[]>;
  listerAbsences(id: number): Promise<Absence[]>;
  enregistrerEleve(data: { nom: string; classe: string }): Promise<number>;
  enregistrerAbsence(data: { eleveId: number; date: string; motif: string }): Promise<void>;
}
declare global { interface Window { api: ApiBridge; } }
export {};
