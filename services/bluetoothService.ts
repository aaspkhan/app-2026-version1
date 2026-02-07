import { BLE_SERVICES, BLE_CHARACTERISTICS } from '../constants';

// --- Web Bluetooth Type Definitions ---
// Required because standard TypeScript lib.dom.d.ts excludes Web Bluetooth API types.

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;

interface BluetoothRequestDeviceFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
  manufacturerData?: { companyIdentifier: number; dataPrefix?: BufferSource; mask?: BufferSource }[];
  serviceData?: { service: BluetoothServiceUUID; dataPrefix?: BufferSource; mask?: BufferSource }[];
}

interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[];
  optionalServices?: BluetoothServiceUUID[];
  acceptAllDevices?: boolean;
}

interface BluetoothRemoteGATTDescriptor {
  characteristic: BluetoothRemoteGATTCharacteristic;
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
}

interface BluetoothCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  getDescriptor(descriptor: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTDescriptor>;
  getDescriptors(descriptor?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTDescriptor[]>;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface BluetoothRemoteGATTService extends EventTarget {
  device: BluetoothDevice;
  uuid: string;
  isPrimary: boolean;
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
  getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  watchAdvertisements(): Promise<void>;
  unwatchAdvertisements(): void;
  readonly watchingAdvertisements: boolean;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, callback: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

interface Bluetooth extends EventTarget {
  getAvailability(): Promise<boolean>;
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
}

declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
}
// --- End of Web Bluetooth Type Definitions ---

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  
  // Callbacks
  private onHeartRateChange: ((hr: number) => void) | null = null;
  private onDisconnect: (() => void) | null = null;

  constructor(
    onHeartRateChange: (hr: number) => void,
    onDisconnect: () => void
  ) {
    this.onHeartRateChange = onHeartRateChange;
    this.onDisconnect = onDisconnect;
  }

  public async connect(): Promise<string> {
    try {
      if (!navigator.bluetooth) {
        throw new Error("Web Bluetooth is not supported in this browser.");
      }

      console.log('Requesting Bluetooth Device...');
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICES.HEART_RATE] }],
        optionalServices: [BLE_SERVICES.BATTERY, BLE_SERVICES.BLOOD_PRESSURE]
      });

      if (!this.device) throw new Error("No device selected.");

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnection.bind(this));

      console.log('Connecting to GATT Server...');
      this.server = await this.device.gatt?.connect() || null;

      if (!this.server) throw new Error("Could not connect to GATT Server.");

      await this.startHeartRateNotifications(this.server);
      // Try to get other services if available, but don't fail if they aren't
      
      return this.device.name || "Unknown Device";
    } catch (error) {
      console.error('Connection failed', error);
      throw error;
    }
  }

  public disconnect() {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
  }

  private handleDisconnection() {
    console.log('Device disconnected');
    if (this.onDisconnect) this.onDisconnect();
  }

  private async startHeartRateNotifications(server: BluetoothRemoteGATTServer) {
    try {
      const service = await server.getPrimaryService(BLE_SERVICES.HEART_RATE);
      const characteristic = await service.getCharacteristic(BLE_CHARACTERISTICS.HEART_RATE_MEASUREMENT);
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', this.handleHeartRateValueChanged.bind(this));
      console.log('Heart Rate notifications started');
    } catch (error) {
      console.warn('Heart Rate service not available or failed to start', error);
    }
  }

  private handleHeartRateValueChanged(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    // Parsing the Heart Rate Measurement Value (See Bluetooth Spec)
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    let heartRate: number;
    if (rate16Bits) {
      heartRate = value.getUint16(1, true); // Little Endian
    } else {
      heartRate = value.getUint8(1);
    }

    if (this.onHeartRateChange) {
      this.onHeartRateChange(heartRate);
    }
  }
}