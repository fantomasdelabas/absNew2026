import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import Database from 'better-sqlite3';
const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_NAME = 'absences.db';
let db;

function getDbPath() { return join(app.getPath('userData'), DB_NAME); }
function copyDbIfNeeded() {
  const dest = getDbPath();
  if (fs.existsSync(dest)) return;
  const src = join(__dirname, DB_NAME);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  copyDbIfNeeded();
  db = new Database(getDbPath());
  console.log('DB utilisée =', getDbPath());

  db.exec(`
    CREATE TABLE IF NOT EXISTS eleves   (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT, classe TEXT);
    CREATE TABLE IF NOT EXISTS absences (id INTEGER PRIMARY KEY AUTOINCREMENT, eleve_id INTEGER, date TEXT, motif TEXT, FOREIGN KEY (eleve_id) REFERENCES eleves(id));
  `);

  if (db.prepare('SELECT COUNT(*) AS n FROM eleves').get().n === 0) {
    const stmt = db.prepare('INSERT INTO eleves (nom, classe) VALUES (?, ?)');
    stmt.run('Élève de démo 1', 'P1A');
    stmt.run('Élève de démo 2', 'P2B');
  }

  ipcMain.handle('save-eleve', (_e, d) =>
    db.prepare('INSERT INTO eleves (nom, classe) VALUES (?,?)').run(d.nom, d.classe).lastInsertRowid
  );
  ipcMain.handle('save-absence', (_e, d) =>
    db.prepare('INSERT INTO absences (eleve_id,date,motif) VALUES (?,?,?)').run(d.eleveId, d.date, d.motif)
  );

  ipcMain.handle('list-eleves', () => db.prepare('SELECT * FROM eleves').all());
  ipcMain.handle('list-absences', (_e, id) =>
    db.prepare('SELECT * FROM absences WHERE eleve_id = ?').all(id)
  );

  createWindow();
});
