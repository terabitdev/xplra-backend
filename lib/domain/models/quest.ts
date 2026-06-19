import { ValidationConfig } from './validationConfig';

export interface ContextPillSettings {
  nearbyEligible: boolean;
  todayEligible: boolean;
  todaySettings: {
    startDateTime: string;
    endDateTime: string;
    outsideWindowBehavior: 'hidePill' | 'hideQuest';
  } | null;
  limitedEligible: boolean;
  limitedSettings: {
    label: string;
    startDateTime: string;
    endDateTime: string;
    outsideWindowBehavior: 'hidePill' | 'hideQuest';
  } | null;
  eventEligible: boolean;
  eventSettings: { eventId: string } | null;
  featuredEligible: boolean;
  featuredSettings: {
    startDateTime: string;
    endDateTime: string;
  } | null;
}

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
  contextPillSettings?: ContextPillSettings | null;
  hint?: string | null;
  // Start Config (on the quest document)
  manualStartEnabled: boolean;
  autoStartEnabled: boolean;
  autoStartTriggers: AutoStartTrigger[];
  requiresExplicitStartBeforeValidation: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AutoStartTrigger =
  | 'location_enter'
  | 'dwell_time'
  | 'qr_scan'
  | 'code_input'
  | 'event_window';
