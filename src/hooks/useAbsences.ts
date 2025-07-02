import { useState, useEffect } from 'react';
import { fetchAbsences, addAbsence, Absence } from '@/services/db';

export const useAbsences = (eleveId: number) => {
  const [absences, setAbsences] = useState<Absence[]>([]);

  useEffect(() => {
    fetchAbsences(eleveId).then(setAbsences);
  }, [eleveId]);

  const createAbsence = async (date: string, motif: string) => {
    await addAbsence(eleveId, date, motif);
    setAbsences(await fetchAbsences(eleveId));
  };

  return { absences, createAbsence, setAbsences };
};
