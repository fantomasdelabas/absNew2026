const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  enregistrerEleve:   (d)   => ipcRenderer.invoke('save-eleve',   d),
  enregistrerAbsence: (d)   => ipcRenderer.invoke('save-absence', d),
  listerEleves:       ()    => ipcRenderer.invoke('list-eleves'),
  listerAbsences:     (id)  => ipcRenderer.invoke('list-absences', id)
});
