import { useState, useEffect } from 'react';
import { fetchEleves, addEleve, Eleve } from '@/services/db';

export const useEleves = () => {
  const [eleves, setEleves] = useState<Eleve[]>([]);

  useEffect(() => {
    fetchEleves().then(setEleves);
  }, []);

  const createEleve = async (nom: string, classe: string) => {
    const id = await addEleve(nom, classe);
    setEleves(prev => [...prev, { id, nom, classe }]);
  };

  return { eleves, createEleve, setEleves };
};
