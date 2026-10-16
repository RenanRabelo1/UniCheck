export type KeyStatus = 'AVAILABLE' | 'LOANED' | 'MAINTENANCE';

export interface Room {
  id: string;
  code: string;
  name: string;
  floor: string;
  description: string;
}

export interface PhysicalKey {
  id: string;
  code: string;
  roomId: string;
  kind: 'PRIMARY' | 'SECONDARY';
  status: KeyStatus;
  holder?: string;
  hasHistory: boolean;
}

export interface RoomDraft {
  code: string;
  name: string;
  floor: string;
}

export interface KeyDraft {
  code: string;
  roomId: string;
  kind: PhysicalKey['kind'];
}

export interface RoomsKeysManagementProps {
  onDemoWithdrawal?: (key: PhysicalKey) => void;
  onDemonstrationChange?: (message: string) => void;
}
