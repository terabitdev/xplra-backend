import { ValidationConfig, ValidationMode } from './validationConfig';

export interface EventGeo {
  lat: number;
  lng: number;
  geohash: string;
}

export interface Event {
  eventId: string;
  title: string;
  xp: number; // XP awarded on event check-in completion (default 0)
  placeId: string | null;
  geoOverride?: EventGeo;
  resolvedGeo?: EventGeo;
  startTime: string; // ISO string (Firebase Timestamp in Firestore)
  endTime: string; // ISO string (Firebase Timestamp in Firestore)
  eventPreGraceMin: number; // default 15
  eventPostGraceMin: number; // default 15
  windowStart?: string; // computed: startTime - eventPreGraceMin
  windowEnd?: string; // computed: endTime + eventPostGraceMin
  mode?: ValidationMode;
  validationConfigId?: string | null;
  validationConfig?: Partial<Omit<ValidationConfig, 'mode'>>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
