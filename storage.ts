
import { SampleJob, Staff } from './types';

const JOBS_KEY = 'lab_master_jobs_v1';
const STAFF_KEY = 'lab_master_staff_v1';

// Event emitter to simulate real-time updates
export const storageEvent = new EventTarget();

const notifyChange = () => {
  storageEvent.dispatchEvent(new Event('data-change'));
};

// --- JOBS ---

export const getJobs = (): SampleJob[] => {
  try {
    const data = localStorage.getItem(JOBS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error loading jobs", e);
    return [];
  }
};

export const addJob = (job: Omit<SampleJob, 'id'>) => {
  const jobs = getJobs();
  const newJob: SampleJob = {
    ...job,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2)
  };
  jobs.unshift(newJob); // Add to top
  localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
  notifyChange();
  return newJob;
};

export const updateJob = (id: string, updates: Partial<SampleJob>) => {
  const jobs = getJobs();
  const index = jobs.findIndex(j => j.id === id);
  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates };
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));
    notifyChange();
  }
};

export const clearAllJobs = () => {
  localStorage.removeItem(JOBS_KEY);
  notifyChange();
};

// --- STAFF ---

export const getStaff = (): Staff[] => {
  try {
    const data = localStorage.getItem(STAFF_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const addStaff = (name: string) => {
  const staff = getStaff();
  const newStaff: Staff = {
    id: Date.now().toString(),
    name
  };
  staff.push(newStaff);
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
  notifyChange();
  return newStaff;
};

export const updateStaff = (id: string, name: string) => {
  const staff = getStaff();
  const index = staff.findIndex(s => s.id === id);
  if (index !== -1) {
    staff[index].name = name;
    localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
    notifyChange();
  }
};

export const deleteStaff = (id: string) => {
  const staff = getStaff();
  const newStaff = staff.filter(s => s.id !== id);
  localStorage.setItem(STAFF_KEY, JSON.stringify(newStaff));
  notifyChange();
};
