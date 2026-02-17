
import { createClient } from "@libsql/client";
import { SampleJob, Staff } from './types';

// Configuration
const TURSO_URL = 'libsql://sample-management-chaiyapat.aws-ap-south-1.turso.io';
const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEzMDM0MjEsImlkIjoiN2YxMGVjNjctNjdlZi00M2IwLTliNDYtNTJlZWRmNjU1YzRmIiwicmlkIjoiNWM2ZWI2YjQtYmI0Ny00M2NhLWJkMzctMzZlMmJhMTQxODJhIn0.lY6T-GNRRMXStfjd8fvBZvK3gYJGGyBXJAFaduxXdUkCZ4SlT2B1gDNTja8SIrpYXfsVsltj9xuZ8T4V8aVFCw';

// Lazy Initialization Variable
let clientInstance: any = null;

// Helper to get client safely
// This ensures we don't crash the app at the top-level import phase
const getClient = () => {
  if (!clientInstance) {
    // Force HTTPS for web environment compatibility
    // Browser cannot handle raw libsql:// directly without websockets/http proxy logic often handled better by https:// endpoint in this SDK
    const httpUrl = TURSO_URL.replace('libsql://', 'https://');
    
    console.log("Initializing Database Connection to:", httpUrl);
    
    clientInstance = createClient({
      url: httpUrl,
      authToken: TURSO_AUTH_TOKEN,
    });
  }
  return clientInstance;
};

// Event emitter for real-time updates
export const storageEvent = new EventTarget();
const notifyChange = () => {
  storageEvent.dispatchEvent(new Event('data-change'));
};

// --- INITIALIZATION ---

export const initDB = async () => {
  try {
    const db = getClient();
    // Create jobs table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        jobNo TEXT,
        customerName TEXT,
        action TEXT,
        returnAddress TEXT,
        slotId TEXT,
        entryDate INTEGER,
        deadlineDate INTEGER,
        staffName TEXT,
        status TEXT,
        exitDate INTEGER,
        exitStaff TEXT,
        recipient TEXT,
        notes TEXT
      )
    `);

    // Create staff table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT
      )
    `);
    
    console.log("Database initialized successfully");
  } catch (e) {
    console.error("Failed to initialize database:", e);
  }
};

// --- JOBS ---

export const getJobs = async (): Promise<SampleJob[]> => {
  try {
    const db = getClient();
    const result = await db.execute("SELECT * FROM jobs ORDER BY entryDate DESC");
    return result.rows.map(row => ({
      id: row.id as string,
      jobNo: row.jobNo as string,
      customerName: row.customerName as string || '',
      action: row.action as any,
      returnAddress: row.returnAddress as string || '',
      slotId: row.slotId as string,
      entryDate: Number(row.entryDate),
      deadlineDate: Number(row.deadlineDate),
      staffName: row.staffName as string,
      status: row.status as any,
      exitDate: row.exitDate ? Number(row.exitDate) : undefined,
      exitStaff: row.exitStaff as string || undefined,
      recipient: row.recipient as string || undefined,
      notes: row.notes as string || undefined
    }));
  } catch (e) {
    console.error("Error loading jobs", e);
    return [];
  }
};

export const addJob = async (job: Omit<SampleJob, 'id'>) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
  try {
    const db = getClient();
    await db.execute({
      sql: `INSERT INTO jobs (
        id, jobNo, customerName, action, returnAddress, slotId, 
        entryDate, deadlineDate, staffName, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, job.jobNo, job.customerName || '', job.action, job.returnAddress || '', job.slotId,
        job.entryDate, job.deadlineDate, job.staffName, job.status, job.notes || ''
      ]
    });
    notifyChange();
    return { ...job, id };
  } catch (e) {
    console.error("Error adding job", e);
    throw e;
  }
};

export const updateJob = async (id: string, updates: Partial<SampleJob>) => {
  try {
    const db = getClient();
    // Construct dynamic update query
    const keys = Object.keys(updates);
    if (keys.length === 0) return;

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const args = [...Object.values(updates), id];

    await db.execute({
      sql: `UPDATE jobs SET ${setClause} WHERE id = ?`,
      args: args as any[]
    });
    notifyChange();
  } catch (e) {
    console.error("Error updating job", e);
    throw e;
  }
};

export const clearAllJobs = async () => {
  try {
    const db = getClient();
    await db.execute("DELETE FROM jobs");
    notifyChange();
  } catch (e) {
    console.error("Error clearing jobs", e);
    throw e;
  }
};

// --- STAFF ---

export const getStaff = async (): Promise<Staff[]> => {
  try {
    const db = getClient();
    const result = await db.execute("SELECT * FROM staff ORDER BY name ASC");
    return result.rows.map(row => ({
      id: row.id as string,
      name: row.name as string
    }));
  } catch (e) {
    console.error("Error loading staff", e);
    return [];
  }
};

export const addStaff = async (name: string) => {
  const id = Date.now().toString();
  try {
    const db = getClient();
    await db.execute({
      sql: "INSERT INTO staff (id, name) VALUES (?, ?)",
      args: [id, name]
    });
    notifyChange();
    return { id, name };
  } catch (e) {
    console.error("Error adding staff", e);
    throw e;
  }
};

export const updateStaff = async (id: string, name: string) => {
  try {
    const db = getClient();
    await db.execute({
      sql: "UPDATE staff SET name = ? WHERE id = ?",
      args: [name, id]
    });
    notifyChange();
  } catch (e) {
    console.error("Error updating staff", e);
    throw e;
  }
};

export const deleteStaff = async (id: string) => {
  try {
    const db = getClient();
    await db.execute({
      sql: "DELETE FROM staff WHERE id = ?",
      args: [id]
    });
    notifyChange();
  } catch (e) {
    console.error("Error deleting staff", e);
    throw e;
  }
};
