// Core data models for ATIS

export interface Operator {
  operatorId: number;
  name: string;
  email: string;
  role: "Operator" | "Admin";
  enabled: boolean;
  createdAt: string;
}

export interface InspectionRecord {
  inspectionId: string;
  timestamp: string;
  location: string;
  cameraId: string;
  licensePlate?: string;
  status: "Safe" | "Unsafe";
  defectTypes?: string[];
  confidence: number;
  imageUrls: string[];
  processingDurationMs?: number;
}

export interface Alert {
  alertId: string;
  inspectionId: string;
  alertDate: string;
  status: "Pending" | "Acknowledged" | "Resolved";
  escalated?: boolean;
  operatorId?: number;
  responseTimeMs?: number;
  summary: string;
  location: string;
  cameraId: string;
  licensePlate?: string;
  defectTypes: string[];
  confidence: number;
  imageUrls: string[];
}

export interface DashboardStats {
  totalInspections: number;
  safeCount: number;
  unsafeCount: number;
  avgProcessingLatency: number;
  alertsPending: number;
}

export interface AuthState {
  user: Operator | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface ReportConfig {
  type: "trend" | "defects" | "locations" | "daily";
  dateFrom: string;
  dateTo: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  safe?: number;
  unsafe?: number;
}

export interface SystemSettings {
  alertAcknowledgmentTimeout: number;
  audioAlarmEnabled: boolean;
  apiBaseUrl: string;
  wsUrl: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: number;
  userName: string;
  action: string;
  details: string;
}

// WebSocket event types
export type WSEventType = "inspection.created" | "alert.created" | "alert.updated";

export interface WSEvent<T = unknown> {
  type: WSEventType;
  payload: T;
}
