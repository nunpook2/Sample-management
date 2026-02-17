
import { SampleJob, Staff } from './types';

// Configuration
// Changed to HTTPS protocol for direct fetch
const TURSO_URL = 'https://sample-management-chaiyapat.aws-ap-south-1.turso.io'; 
const TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzEzMDM0MjEsImlkIjoiN2YxMGVjNjctNjdlZi00M2IwLTliNDYtNTJlZWRmNjU1YzRmIiwicmlkIjoiNWM2ZWI2YjQtYmI0Ny00M2NhLWJkMzctMzZlMmJhMTQxODJhIn0.lY6T-GNRRMXStfjd8fvBZvK3gYJGGyBXJAFaduxXdUkCZ4SlT2B1gDNTja8SIrpYXfsVsltj9xuZ8T4V8aVFCw';

// --- TURSO HTTP CLIENT IMPLEMENTATION ---

// Helper to format arguments for Turso HTTP API (LibSQL Protocol)
const mapArg = (arg: any) => {
  if (arg === null || arg === undefined) return { type: "null" };
  if (typeof arg === 'number') {
    // Distinguish between float and integer roughly
    if (Number.isInteger(arg)) return { type: "integer", value: arg.toString() };
    return { type: "float", value: arg };
  }
  return { type: "text", value: arg.toString() };
};

// Helper to parse values back from Turso
const parseValue = (cell: any) => {
  if (!cell) return null;
  if (cell.type === "text") return cell.value;
  if (cell.type === "integer") return parseInt(cell.value);
  if (cell.type === "float") return parseFloat(cell.value);
  if (cell.type === "null") return null;
  return cell.value; // Fallback
};

// Core execute function using fetch
const executeQuery = async (sql: string, args: any[] = []) => {
  try {
    const url = `${TURSO_URL}/v2/pipeline`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: sql, args: args.map(mapArg) } },
          { type: "close" }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    
    // Check for errors in the batch
    if (json.results && json.results[0] && json.results[0].type === "error") {
      throw new Error(json.results[0].error.message);
    }

    const resultStep = json.results.find((r: any) => r.type === "ok" && r.response && r.response.result);
    
    if (resultStep) {
      const { cols, rows } = resultStep.response.result;
      const colNames = cols.map((c: any) => c.name);
      
      return rows.map((row: any[]) => {
        const obj: any = {};
        row.forEach((val, index) => {
          obj[colNames[index]] = parseValue(val);
        });
        return obj;
      });
    }

    return [];
  } catch (err) {
    console.error("DB Execute Error:", err);
    throw err;
  }
};

// Event emitter for real-time updates
export const storageEvent = new EventTarget();
const notifyChange = () => {
  storageEvent.dispatchEvent(new Event('data-change'));
};

// --- INITIALIZATION ---

export const initDB = async () => {
  try {
    // Create jobs table
    await executeQuery(`
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
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT
      )
    `);
    
    console.log("Database initialized successfully (via Fetch)");
  } catch (e) {
    console.error("Failed to initialize database:", e);
  }
};

// --- JOBS ---

export const getJobs = async (): Promise<SampleJob[]> => {
  try {
    const rows = await executeQuery("SELECT * FROM jobs ORDER BY entryDate DESC");
    return rows.map(row => ({
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
    await executeQuery(
      `INSERT INTO jobs (
        id, jobNo, customerName, action, returnAddress, slotId, 
        entryDate, deadlineDate, staffName, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, job.jobNo, job.customerName || '', job.action, job.returnAddress || '', job.slotId,
        job.entryDate, job.deadlineDate, job.staffName, job.status, job.notes || ''
      ]
    );
    notifyChange();
    return { ...job, id };
  } catch (e) {
    console.error("Error adding job", e);
    throw e;
  }
};

export const updateJob = async (id: string, updates: Partial<SampleJob>) => {
  try {
    const keys = Object.keys(updates);
    if (keys.length === 0) return;

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const args = [...Object.values(updates), id];

    await executeQuery(
      `UPDATE jobs SET ${setClause} WHERE id = ?`,
      args
    );
    notifyChange();
  } catch (e) {
    console.error("Error updating job", e);
    throw e;
  }
};

export const clearAllJobs = async () => {
  try {
    await executeQuery("DELETE FROM jobs");
    notifyChange();
  } catch (e) {
    console.error("Error clearing jobs", e);
    throw e;
  }
};

// --- STAFF ---

export const getStaff = async (): Promise<Staff[]> => {
  try {
    const rows = await executeQuery("SELECT * FROM staff ORDER BY name ASC");
    return rows.map(row => ({
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
    await executeQuery(
      "INSERT INTO staff (id, name) VALUES (?, ?)",
      [id, name]
    );
    notifyChange();
    return { id, name };
  } catch (e) {
    console.error("Error adding staff", e);
    throw e;
  }
};

export const updateStaff = async (id: string, name: string) => {
  try {
    await executeQuery(
      "UPDATE staff SET name = ? WHERE id = ?",
      [name, id]
    );
    notifyChange();
  } catch (e) {
    console.error("Error updating staff", e);
    throw e;
  }
};

export const deleteStaff = async (id: string) => {
  try {
    await executeQuery(
      "DELETE FROM staff WHERE id = ?",
      [id]
    );
    notifyChange();
  } catch (e) {
    console.error("Error deleting staff", e);
    throw e;
  }
};
