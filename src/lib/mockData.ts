import type { InspectionRecord, Alert, DashboardStats, Operator, AuditLog, ChartDataPoint } from '@/types';

// Defect types for tire inspection
const DEFECT_TYPES = [
  'Tread Wear',
  'Sidewall Damage',
  'Puncture',
  'Bulge',
  'Cracking',
  'Under-inflation',
  'Over-inflation',
  'Uneven Wear',
];

const LOCATIONS = [
  'Highway I-95 North - Mile 42',
  'Highway I-95 South - Mile 38',
  'Route 66 East - Checkpoint A',
  'Route 66 West - Checkpoint B',
  'Interstate 80 - Weigh Station',
  'Highway 101 - Toll Plaza',
];

const CAMERA_IDS = ['CAM-001', 'CAM-002', 'CAM-003', 'CAM-004', 'CAM-005', 'CAM-006'];

// Generate random license plate
const generatePlate = (): string => {
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const numbers = '0123456789';
  let plate = '';
  for (let i = 0; i < 3; i++) plate += letters[Math.floor(Math.random() * letters.length)];
  plate += '-';
  for (let i = 0; i < 4; i++) plate += numbers[Math.floor(Math.random() * numbers.length)];
  return plate;
};

// Generate mock inspection
export const generateInspection = (id?: string): InspectionRecord => {
  const isUnsafe = Math.random() > 0.75;
  const timestamp = new Date(Date.now() - Math.random() * 86400000);
  const locationIndex = Math.floor(Math.random() * LOCATIONS.length);
  
  return {
    inspectionId: id || `INS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: timestamp.toISOString(),
    location: LOCATIONS[locationIndex],
    cameraId: CAMERA_IDS[locationIndex],
    licensePlate: Math.random() > 0.1 ? generatePlate() : undefined,
    status: isUnsafe ? 'Unsafe' : 'Safe',
    defectTypes: isUnsafe
      ? DEFECT_TYPES.filter(() => Math.random() > 0.6).slice(0, Math.floor(Math.random() * 3) + 1)
      : undefined,
    confidence: 0.75 + Math.random() * 0.24,
    imageUrls: [
      `https://picsum.photos/seed/${Math.random()}/640/480`,
      `https://picsum.photos/seed/${Math.random()}/640/480`,
    ],
    processingDurationMs: 150 + Math.floor(Math.random() * 350),
  };
};

// Generate mock alert from inspection
export const generateAlertFromInspection = (inspection: InspectionRecord): Alert => {
  const statuses: Alert['status'][] = ['Pending', 'Acknowledged', 'Resolved'];
  const statusIndex = Math.floor(Math.random() * 3);
  const status = statuses[statusIndex];
  
  return {
    alertId: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    inspectionId: inspection.inspectionId,
    alertDate: inspection.timestamp,
    status,
    escalated: status === 'Pending' && Math.random() > 0.7,
    operatorId: status !== 'Pending' ? Math.floor(Math.random() * 5) + 1 : undefined,
    responseTimeMs: status !== 'Pending' ? Math.floor(Math.random() * 45000) + 5000 : undefined,
    summary: `Unsafe tire detected - ${inspection.defectTypes?.join(', ') || 'Unknown defect'}`,
    location: inspection.location,
    cameraId: inspection.cameraId,
    licensePlate: inspection.licensePlate,
    defectTypes: inspection.defectTypes || [],
    confidence: inspection.confidence,
    imageUrls: inspection.imageUrls,
  };
};

// Generate initial mock data
export const generateMockInspections = (count: number): InspectionRecord[] => {
  return Array.from({ length: count }, () => generateInspection());
};

export const generateMockAlerts = (inspections: InspectionRecord[]): Alert[] => {
  return inspections
    .filter((i) => i.status === 'Unsafe')
    .map(generateAlertFromInspection);
};

// Mock dashboard stats
export const getMockDashboardStats = (inspections: InspectionRecord[]): DashboardStats => {
  const today = new Date().toDateString();
  const todayInspections = inspections.filter(
    (i) => new Date(i.timestamp).toDateString() === today
  );
  
  const safeCount = todayInspections.filter((i) => i.status === 'Safe').length;
  const unsafeCount = todayInspections.filter((i) => i.status === 'Unsafe').length;
  const avgLatency =
    todayInspections.reduce((sum, i) => sum + (i.processingDurationMs || 0), 0) /
    (todayInspections.length || 1);

  return {
    totalInspections: todayInspections.length,
    safeCount,
    unsafeCount,
    avgProcessingLatency: Math.round(avgLatency),
    alertsPending: Math.floor(unsafeCount * 0.4),
  };
};

// Mock operators
export const mockOperators: Operator[] = [
  { operatorId: 1, name: 'Admin User', email: 'admin@atis.com', role: 'Admin', enabled: true, createdAt: '2024-01-01T00:00:00Z' },
  { operatorId: 2, name: 'John Operator', email: 'operator@atis.com', role: 'Operator', enabled: true, createdAt: '2024-01-15T00:00:00Z' },
  { operatorId: 3, name: 'Sarah Inspector', email: 'sarah@atis.com', role: 'Operator', enabled: true, createdAt: '2024-02-01T00:00:00Z' },
  { operatorId: 4, name: 'Mike Wilson', email: 'mike@atis.com', role: 'Operator', enabled: false, createdAt: '2024-02-10T00:00:00Z' },
  { operatorId: 5, name: 'Emily Chen', email: 'emily@atis.com', role: 'Admin', enabled: true, createdAt: '2024-03-01T00:00:00Z' },
];

// Mock audit logs
export const mockAuditLogs: AuditLog[] = [
  { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), userId: 1, userName: 'Admin User', action: 'USER_LOGIN', details: 'Logged in from 192.168.1.100' },
  { id: '2', timestamp: new Date(Date.now() - 7200000).toISOString(), userId: 2, userName: 'John Operator', action: 'ALERT_ACKNOWLEDGED', details: 'Alert ALT-001 acknowledged' },
  { id: '3', timestamp: new Date(Date.now() - 10800000).toISOString(), userId: 1, userName: 'Admin User', action: 'SETTINGS_UPDATED', details: 'Alert timeout changed to 90s' },
  { id: '4', timestamp: new Date(Date.now() - 14400000).toISOString(), userId: 3, userName: 'Sarah Inspector', action: 'ALERT_RESOLVED', details: 'Alert ALT-002 resolved' },
  { id: '5', timestamp: new Date(Date.now() - 18000000).toISOString(), userId: 1, userName: 'Admin User', action: 'USER_DISABLED', details: 'User mike@atis.com disabled' },
];

// Chart data generators
export const generateTrendData = (days: number = 7): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const safe = Math.floor(Math.random() * 800) + 200;
    const unsafe = Math.floor(Math.random() * 100) + 20;
    data.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      value: safe + unsafe,
      safe,
      unsafe,
    });
  }
  return data;
};

export const generateDefectDistribution = (): ChartDataPoint[] => {
  return DEFECT_TYPES.map((defect) => ({
    name: defect,
    value: Math.floor(Math.random() * 100) + 10,
  }));
};

export const generateLocationStats = (): ChartDataPoint[] => {
  return LOCATIONS.map((location) => ({
    name: location.split(' - ')[0],
    value: Math.floor(Math.random() * 500) + 50,
    safe: Math.floor(Math.random() * 450) + 40,
    unsafe: Math.floor(Math.random() * 50) + 10,
  }));
};
