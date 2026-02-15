/**
 * Web Bluetooth minimal typings (TS compile helper)
 * - Some TS setups don't include Web Bluetooth lib types by default.
 * - This keeps BUILD VERDE without changing runtime.
 */

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice: (options?: any) => Promise<BluetoothDevice>;
    };
  }

  // Minimal shapes needed by WearableService
  type BluetoothDevice = {
    id: string;
    name?: string;
    gatt?: {
      connected?: boolean;
      connect: () => Promise<BluetoothRemoteGATTServer>;
      disconnect: () => void;
    };
  };

  type BluetoothRemoteGATTServer = {
    getPrimaryService: (service: string | number) => Promise<BluetoothRemoteGATTService>;
  };

  type BluetoothRemoteGATTService = {
    getCharacteristic: (characteristic: string | number) => Promise<BluetoothRemoteGATTCharacteristic>;
  };

  type BluetoothRemoteGATTCharacteristic = EventTarget & {
    value?: DataView | null;
    startNotifications: () => Promise<void>;
    addEventListener: (
      type: "characteristicvaluechanged" | string,
      listener: (ev: Event) => any,
      options?: any
    ) => void;
  };
}

export {};
