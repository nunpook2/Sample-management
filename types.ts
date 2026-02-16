
export type ActionType = 'DISPOSE' | 'RETURN';

export interface SampleJob {
  id: string;
  jobNo: string;
  customerName: string;
  action: ActionType;
  returnAddress?: string;
  slotId: string; // e.g., "D1", "R1"
  entryDate: number; // timestamp
  deadlineDate: number; // timestamp (entryDate + 12 days)
  staffName: string;
  status: 'PENDING' | 'COMPLETED';
  exitDate?: number;
  exitStaff?: string;
  recipient?: string; // Who received the sample
  notes?: string; // Reason for removal or extra details
}

export interface Slot {
  id: string;
  type: ActionType;
  index: number; // 1-10
  currentCount: number;
}

export interface Staff {
  id: string;
  name: string;
}

export interface AppSettings {
  staffList: Staff[];
}
