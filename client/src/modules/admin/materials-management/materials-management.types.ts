export type MaterialControlMode = 'INDIVIDUAL' | 'QUANTITY';

export type MaterialStatus = 'ACTIVE' | 'INACTIVE';

export interface Material {
  id: string;
  name: string;
  category: string;
  controlMode: MaterialControlMode;
  patrimony?: string;
  quantity: number;
  availableQuantity: number;
  location: string;
  status: MaterialStatus;
  description: string;
}

export interface MaterialFormData {
  name: string;
  category: string;
  controlMode: MaterialControlMode;
  patrimony: string;
  quantity: number;
  location: string;
  description: string;
}
