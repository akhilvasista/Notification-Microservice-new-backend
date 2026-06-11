import { EVENTS } from '../../../constants/events';

export const parentConfigs = [
  //USER_SIGNED_UP 1
  {
    event: EVENTS.USER_SIGNED_UP,

    name: 'Parent Welcome Notification',

    type: ['email','inapp'],

    templateIds: {
      email: 'welcome_email',
        inapp: 'welcome_email'

    },

    schedule: {
      type: 'instant',
    },

    priority: 'normal',

    isActive: true,
  },


//CHILD_ADDED_SUCCESS 2
  {
    event: EVENTS.CHILD_ADDED_SUCCESS,

    name: 'Child Added Notification',

    type: ['email','inapp'],

    templateIds: {
      email: 'child_added_email',
      inapp: 'child_added_email'
    },

    schedule: {
      type: 'instant',
    },

    priority: 'high',

    isActive: true,
  },



//CHILD_ADD_FAILED 3


{
  event: EVENTS.CHILD_ADD_FAILED,

  name: 'Child Add Failed Notification',

  type: ['email','inapp'],

  templateIds: {
    email: 'child_add_failed_email',
    inapp: 'child_add_failed_email'
  },

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},




//SOCIAL_MEDIA_POSTED 4

{
  event: EVENTS.SOCIAL_MEDIA_POSTED,

  name: 'Social Media Broadcast Notification',

  type: ['inapp'],

  templateIds: {
    email: 'social_media_post_email',
  },

  schedule: {
    type: 'instant',
  },

  priority: 'normal',

  isActive: true,
},



//EVENTS.CHILD_ADDED_SUCCESS 5 


{
  event: EVENTS.CHILD_ADDED_SUCCESS,

  name: 'Child Added Success Notification',

  type: ['email','inapp'],

  templateIds: {
    email: 'child_added_success_email',
    inapp: 'child_added_success_email'
  },

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},



//CHILD_ADDED_SUCCESS 6
{
  event: EVENTS.CHILD_ADDED_SUCCESS,

  name: 'Child Added Welcome Notification',

  type: ['email','inapp'],

  templateIds: {
    email: 'child_added_welcome_email',
    inapp: 'child_added_welcome_email'
  },

  schedule: {
    type: 'instant',
  },

  priority: 'normal',

  isActive: true,
},





//EVENTS.GAMIFICATION_DAILY 7
{
  event: EVENTS.GAMIFICATION_DAILY,

  name: 'Daily Gamification Notification',

  type: ['email','inapp'],

  templateIds: {
    email: 'gamification_daily_email',
    inapp: 'gamification_daily_email'
  },

  schedule: {
    type: 'scheduled',

    timezone: 'Asia/Kolkata',

    occurrence: {
      frequency: 'daily',

      interval: 1,

      times: ['18:30'],
    },
  },

  priority: 'normal',

  isActive: true,
},

  

//GAMIFICATION_POINTS_EARNED  8
{
  event: EVENTS.GAMIFICATION_POINTS_EARNED,

  name: 'Instant Gamification Notification',

  type: ['inapp'],

  templateIds: {
    push: 'gamification_points_earned',
  },

  schedule: {
    type: 'instant',
  },

  priority: 'normal',

  isActive: true,
},



//SCREENING_REMINDER_3_DAYS

{
  event: EVENTS.SCREENING_REMINDER_3_DAYS,

  name: 'Screening Reminder - 3 Days',

  type: ['email','inapp','sms'],

  templateIds: {
    email: 'screening_reminder_3_days',
    inapp: 'screening_reminder_3_days',
    sms: 'screening_reminder_3_days'
  },

  schedule: {
    type: 'scheduled',
  },

  priority: 'high',

  isActive: true,
},




//EVENTS.SCREENING_REMINDER_1_DAY

{
  event: EVENTS.SCREENING_REMINDER_1_DAY,

  name: 'Screening Reminder - 1 Day',

  type: ['email','inapp','sms'],

  templateIds: {
    email: 'screening_reminder_1_day_email',
      inapp: 'screening_reminder_1_day_email',
      sms: 'screening_reminder_1_day_email'
  },

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},




{
  event: EVENTS.SCREENING_REMINDER_3_HOURS,

  name: 'Screening Reminder - 3 Hours',

  type: ['email','inapp','sms'],

  templateIds: {
    email: 'screening_reminder_3_hours_email',
    inapp: 'screening_reminder_3_hours_email',
    sms: 'screening_reminder_3_hours_email'
  },

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},


//SCREENING_STATION_COMPLETED

{
  event: EVENTS.SCREENING_STATION_COMPLETED,

  name: 'Screening Progress Updates',

  type: ['inapp'],

  templateIds: {
    inapp: 'screening_progress_update_email',
  },

  schedule: {
    type: 'instant',
  },

  priority: 'normal',

  isActive: true,
},




//SCREENING_COMPLETED

{
  event: EVENTS.SCREENING_COMPLETED,

  name: 'Screening Complete Update',

  type: ['email','inapp'],

  templateIds: {
    email: 'screening_completed_email',
    inapp:'screening_completed_email'
  },

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},


//REPORT_PUBLISHED
// {
//   event: EVENTS.REPORT_PUBLISHED,

//   name: 'Report Update',

//   type: ['email','inapp'],

//   templateIds: {
//     email: 'report_published_email',
//     inapp: 'report_published_email'
//   },

//   schedule: {
//     type: 'instant',
//   },

//   priority: 'high',

//   isActive: true,
// },



{
  event: EVENTS.REPORT_PUBLISHED,

  name: 'Report Update',

  channels: ['email', 'inapp'],

  templateIds: {
    email: 'report_published_email',
    inapp: 'report_published_email'
  },

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},





//GAMIFICATION_WEEKLY_SUMMARY

{
  event: EVENTS.GAMIFICATION_WEEKLY_SUMMARY,

  name: 'Weekly Gamification Notification',

  type: ['email','inapp'],

  templateIds: {
    email: 'gamification_weekly_summary_email',
    inapp: 'gamification_weekly_summary_email'
  },

  schedule: {
    type: 'scheduled',

    timezone: 'Asia/Kolkata',

    occurrence: {
      frequency: 'weekly',

      interval: 1,

      count: 50,

      times: ['12:47'],
    },
  },

  priority: 'normal',

  isActive: true,
},


//USER_INACTIVE_15_DAYS
{
  event: EVENTS.USER_INACTIVE_15_DAYS,

  name: 'Inactivity for 15 Days',

  type: ['email', 'inapp'],

  templateIds: {
    email: 'inactivity_15_days_email',
    inapp: 'inactivity_15_days_inapp',
  },

  schedule: {
    type: 'scheduled',

    timezone: 'Asia/Kolkata',

    occurrence: {
      frequency: 'daily',
      interval: 1,
      count: 1,
      times: ['15:44'],
    },
  },

  priority: 'normal',

  isActive: true,
},


//UPCOMING_REPEAT_SCREENING_2_MONTHS
{
  event: EVENTS.UPCOMING_REPEAT_SCREENING_2_MONTHS,

  name: 'Upcoming Repeat Screening Reminder 1',

  type: ['email', 'inapp'],

  templateIds: 'upcoming_repeat_screening_2_months',

  schedule: {
    type: 'scheduled',

    timezone: 'Asia/Kolkata',

    occurrence: {
      frequency: 'daily',
      interval: 1,
      count: 1,
      times: ['18:00'],
    },
  },

  priority: 'normal',

  isActive: true,
},

//REPEAT_SCREENING_SLOTS_OPEN
{
  event: EVENTS.REPEAT_SCREENING_SLOTS_OPEN,

  name: 'Slots Open for Repeat Screening',

  type: ['email', 'inapp'],

  templateIds: 'repeat_screening_slots_open',

  schedule: {
    type: 'scheduled',

    timezone: 'Asia/Kolkata',

    occurrence: {
      frequency: 'weekly',

      interval: 1,

      count: 6,

      times: ['18:00'],
    },
  },

  priority: 'normal',

  isActive: true,
},



// /APPOINTMENT_CANCELLED_BY_ADMIN
{
  event: EVENTS.APPOINTMENT_CANCELLED_BY_ADMIN,

  name: 'Appointment Cancelled By Admin',

  type: ['email', 'inapp'],

  templateIds: 'appointment_cancelled_by_admin',

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},




//CHILD_ADDED_TO_QUEUE Tele_docter
{
  event: EVENTS.CHILD_ADDED_TO_QUEUE,

  name: 'Child Added To Queue',

  type: ['email'],

  templateIds: 'child_added_to_queue',

  schedule: {
    type: 'instant',
  },

  priority: 'normal',

  isActive: true,
},




//STAFF_SLOT_ASSIGNED
{
  event: EVENTS.STAFF_SLOT_ASSIGNED,

  name: 'Staff Slot Assigned',

  type: ['email'],

  templateIds: 'staff_slot_assigned',

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},


//STAFF_SLOT_CANCELLED

{
  event: EVENTS.STAFF_SLOT_CANCELLED,

  name: 'Staff Slot Cancelled',

  type: ['email'],

  templateIds: 'staff_slot_cancelled',

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},



//STAFF_SLOT_UPDATED
{
  event: EVENTS.STAFF_SLOT_UPDATED,

  name: 'Staff Slot Updated',

  type: ['email'],

  templateIds: 'staff_slot_updated',

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
},

//STAFF_ROLE_ASSIGNED
{
  event: EVENTS.STAFF_ROLE_ASSIGNED,

  name: 'Staff Role Assigned',

  type: ['email'],

  templateIds: 'staff_role_assigned',

  schedule: {
    type: 'instant',
  },

  priority: 'normal',

  isActive: true,
},


//STAFF_ROLE_CHANGED
{
  event: EVENTS.STAFF_ROLE_CHANGED,

  name: 'Staff Role Changed',

  type: ['email'],

  templateIds: 'staff_role_changed',

  schedule: {
    type: 'instant',
  },

  priority: 'normal',

  isActive: true,
},


//PARENT_EMAIL_REPLY_RECEIVED
{
  event: EVENTS.PARENT_EMAIL_REPLY_RECEIVED,

  name: 'Parent Email Reply Received',

  type: ['email'],

  templateIds: 'parent_email_reply_received',

  schedule: {
    type: 'instant',
  },

  priority: 'high',

  isActive: true,
}




];