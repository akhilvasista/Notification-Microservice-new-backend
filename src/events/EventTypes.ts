/**
 * All supported event types in the notification system.
 * Add new events here to extend the system.
 */
export enum EventType {
  // User lifecycle
  USER_SIGNED_UP = 'USER_SIGNED_UP',
  USER_ADD_CHILD_FAILED = 'USER_ADD_CHILD_FAILED',

  // Child management
  CHILD_ADDED = 'CHILD_ADDED',

  // Appointments
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',

  // Screening
  SCREENING_REMINDER = 'SCREENING_REMINDER',
  SCREENING_STATION_COMPLETE = 'SCREENING_STATION_COMPLETE',
  SCREENING_COMPLETE = 'SCREENING_COMPLETE',
  REPEAT_SCREENING_REMINDER = 'REPEAT_SCREENING_REMINDER',

  // Reports
  REPORT_PUBLISHED = 'REPORT_PUBLISHED',

  // Gamification
  DAILY_GAMIFICATION = 'DAILY_GAMIFICATION',
  INSTANT_GAMIFICATION = 'INSTANT_GAMIFICATION',
  WEEKLY_GAMIFICATION = 'WEEKLY_GAMIFICATION',

  // Inactivity
  INACTIVITY_REMINDER = 'INACTIVITY_REMINDER',

  // Social media
  SOCIAL_MEDIA_POST = 'SOCIAL_MEDIA_POST',

  // Staff
  STAFF_SLOT_ASSIGNED = 'STAFF_SLOT_ASSIGNED',
  STAFF_SLOT_CANCELLED = 'STAFF_SLOT_CANCELLED',
  STAFF_SLOT_UPDATED = 'STAFF_SLOT_UPDATED',
  STAFF_ROLE_ASSIGNED = 'STAFF_ROLE_ASSIGNED',
  STAFF_ROLE_CHANGED = 'STAFF_ROLE_CHANGED',

  // Tele-doctor
  TELE_DOCTOR_QUEUE_UPDATE = 'TELE_DOCTOR_QUEUE_UPDATE',

  // Admin / bulk
  BULK_NOTIFICATION = 'BULK_NOTIFICATION',
  ADMIN_ANNOUNCEMENT = 'ADMIN_ANNOUNCEMENT',
}

export interface BaseEventPayload {
  event: EventType;
  userId: string;
  timestamp: string;
  eventId?: string;  // For idempotency
  metadata?: Record<string, unknown>;
}

export interface UserSignedUpPayload extends BaseEventPayload {
  event: EventType.USER_SIGNED_UP;
  metadata?: { source?: string; campaign?: string };
}

export interface ChildAddedPayload extends BaseEventPayload {
  event: EventType.CHILD_ADDED;
  childId: string;
  childName: string;
  screeningVenue: string;
  screeningDate: string;
  paymentDetails?: Record<string, unknown>;
}

export interface AppointmentBookedPayload extends BaseEventPayload {
  event: EventType.APPOINTMENT_BOOKED;
  childId: string;
  appointmentDate: string;
  centerId: string;
}

export interface AppointmentCancelledPayload extends BaseEventPayload {
  event: EventType.APPOINTMENT_CANCELLED;
  childId: string;
  appointmentDate: string;
  reason?: string;
}

export interface GamificationPayload extends BaseEventPayload {
  event: EventType.DAILY_GAMIFICATION | EventType.INSTANT_GAMIFICATION | EventType.WEEKLY_GAMIFICATION;
  pointsEarned: number;
  totalPoints: number;
  badges?: number;
  activities?: Record<string, unknown>;
}

export interface ScreeningReminderPayload extends BaseEventPayload {
  event: EventType.SCREENING_REMINDER;
  childId: string;
  reminderType: 'T-3DAYS' | 'T-1DAY' | 'T-3HOURS';
  appointmentDate: string;
  centerId: string;
}

export interface StaffSlotPayload extends BaseEventPayload {
  event: EventType.STAFF_SLOT_ASSIGNED | EventType.STAFF_SLOT_CANCELLED | EventType.STAFF_SLOT_UPDATED;
  staffEmail: string;
  slotDate: string;
  slotTime: string;
  location: string;
  status: string;
}

export interface TeleDoctorPayload extends BaseEventPayload {
  event: EventType.TELE_DOCTOR_QUEUE_UPDATE;
  role: string;
  totalInQueue: number;
  newChildren: number;
}

export interface SocialMediaPayload extends BaseEventPayload {
  event: EventType.SOCIAL_MEDIA_POST;
  platform: 'instagram' | 'facebook' | 'youtube' | 'website';
  contentType: 'video' | 'blog' | 'image';
  title: string;
  url: string;
}

export interface BulkNotificationPayload extends BaseEventPayload {
  event: EventType.BULK_NOTIFICATION;
  templateId: string;
  channels: ('email' | 'push' | 'sms')[];
  filters: Record<string, unknown>;
  adminId: string;
}

export type EventPayload =
  | UserSignedUpPayload
  | ChildAddedPayload
  | AppointmentBookedPayload
  | AppointmentCancelledPayload
  | GamificationPayload
  | ScreeningReminderPayload
  | StaffSlotPayload
  | TeleDoctorPayload
  | SocialMediaPayload
  | BulkNotificationPayload
  | BaseEventPayload;
