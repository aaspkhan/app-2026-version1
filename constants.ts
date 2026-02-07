// Standard Bluetooth Low Energy UUIDs
export const BLE_SERVICES = {
  HEART_RATE: 0x180D,
  BATTERY: 0x180F,
  BLOOD_PRESSURE: 0x1810, // Note: Not all watches expose this via standard BLE
};

export const BLE_CHARACTERISTICS = {
  HEART_RATE_MEASUREMENT: 0x2A37,
  BODY_SENSOR_LOCATION: 0x2A38,
  BATTERY_LEVEL: 0x2A19,
  BLOOD_PRESSURE_MEASUREMENT: 0x2A35,
};

export const MOCK_DATA_INTERVAL = 2000; // ms

export const DEFAULT_METRICS = {
  heartRate: 72,
  systolicBP: 120,
  diastolicBP: 80,
  steps: 5432,
  lastUpdated: new Date(),
};