// src/services/db.ts
// @ts-ignore – injecté par preload
const api = window.api;

export interface Eleve { id: number; nom: string; classe: string; }
export interface Absence { id: number; eleve_id: number; date: string; motif: string; }

export const fetchEleves     = (): Promise<Eleve[]>               => api.listerEleves();
export const fetchAbsences   = (id: number): Promise<Absence[]>    => api.listerAbsences(id);
export const addEleve        = (n: string, c: string): Promise<number> => api.enregistrerEleve({ nom: n, classe: c });
export const addAbsence      = (e: number, d: string, m: string)       => api.enregistrerAbsence({ eleveId: e, date: d, motif: m });
