export interface HealthMetrics {
  heartRate: number;
  systolicBP: number;
  diastolicBP: number;
  steps: number;
  lastUpdated: Date;
}

export interface RiskAnalysisResult {
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  score: number; // 0 to 100
  summary: string;
  recommendations: string[];
}

export interface DeviceConnectionState {
  isConnected: boolean;
  deviceName: string | null;
  batteryLevel: number | null;
  error: string | null;
}