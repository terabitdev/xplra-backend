import { ValidationConfig } from './validationConfig';

export interface Quest {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  xp: number;
  type: 'checkin' | 'dwell' | 'accrual' | 'qrCode' | 'codePhrase';
  isActive: boolean;
  visibility: {
    hideAfterOneTimeCompletion: boolean;
  };
  placeId?: string | null;
  location: string;
  geoOverride?: { lat: number; lng: number } | null;
  resolvedGeo: { lat: number; lng: number };
  validationConfigId?: string | null;
  validationConfig?: Partial<ValidationConfig> | null;
  createdAt?: string;
  updatedAt?: string;
}
