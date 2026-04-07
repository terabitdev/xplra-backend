import { ValidationConfig } from './validationConfig';

export interface EventGeo {
  lat: number;
  lng: number;
  geohash: string;
}

export interface Event {
  eventId: string;
  title: string;
  placeId: string | null;
  geoOverride?: EventGeo;
  resolvedGeo?: EventGeo;
  startTime: string; // ISO string (Firebase Timestamp in Firestore)
  endTime: string; // ISO string (Firebase Timestamp in Firestore)
  eventPreGraceMin: number; // default 15
  eventPostGraceMin: number; // default 15
  windowStart?: string; // computed: startTime - eventPreGraceMin
  windowEnd?: string; // computed: endTime + eventPostGraceMin
  validationConfigId?: string | null;
  validationConfig?: Partial<ValidationConfig>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
