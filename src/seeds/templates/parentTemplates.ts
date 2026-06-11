import { EVENTS } from "../../constants/events";

export const parentTemplates = [
  {
    templateId: 'welcome_email',

    name: 'Welcome Email',

    type: 'notification',

    subject: 'Welcome to Qavach',

    body: `
      Hi {{parentName}},

      Welcome to Qavach.

      Start your preventive healthcare journey today.

      Regards,
      Qavach Team
    `,

    variables: [
      'parentName'
    ],
  },





//child_added_email
  {
    templateId: 'child_added_email',

    name: 'Child Added Success',

    type: 'email',

    subject: 'Child Added Successfully',

    body: `
      Hi {{parentName}},

      Child {{childName}} added successfully.

      Screening Venue:
      {{screeningVenue}}

      Screening Date:
      {{screeningDate}}

      Regards,
      Qavach Team
    `,

    variables: [
      'parentName',
      'childName',
      'screeningVenue',
      'screeningDate'
    ],
  },





//child_not_added_reminder_email
{
  templateId: 'child_not_added_reminder_email',

  name: 'Child Not Added Reminder',

  type: 'email',

  subject: 'Complete Your Child Profile',

  body: `
    Hi {{parentName}},

    Your preventive healthcare journey is almost ready.

    Please add your child profile to continue accessing screenings,
    reports, and personalized healthcare recommendations.

    Click here:
    {{appLink}}

    Regards,
    Qavach Team
  `,

  variables: [
    'parentName',
    'appLink'
  ],
},











//CHILD_NOT_ADDED_REMINDER

{
  event: EVENTS.CHILD_NOT_ADDED_REMINDER,

  name: 'Child Not Added Daily Reminder',

  channels: ['email'],

  templateIds: {
    email: 'child_not_added_reminder_email',
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

  stopConditions: {
    childAdded: true,
  },

  priority: 'normal',

  isActive: true,
},






//child_add_failed_email

{
  templateId: 'child_add_failed_email',

  name: 'Child Add Failed',

  type: 'email',

  subject: 'Need Help Completing Child Setup?',

  body: `
    Hi {{parentName}},

    We noticed that your child profile setup could not be completed.

    Possible reasons:
    - Payment failure
    - Coupon validation issue
    - Venue code issue
    - Session interruption

    Please try again or contact support.

    Support Email:
    {{supportEmail}}

    Regards,
    Qavach Team
  `,

  variables: [
    'parentName',
    'supportEmail'
  ],
},



//social_media_post_email


{
  templateId: 'social_media_post_email',

  name: 'Social Media Post Notification',

  type: 'email',

  subject: 'New Health Content Available',

  body: `
    Hi {{parentName}},

    New health content has been published.

    {{contentTitle}}

    Platform:
    {{platform}}

    Watch now:
    {{contentLink}}

    Regards,
    Qavach Team
  `,

  variables: [
    'parentName',
    'contentTitle',
    'platform',
    'contentLink'
  ],
},






//child_added_success_email

{
  templateId: 'child_added_success_email',

  name: 'Child Added Successfully',

  type: 'email',

  subject: 'Child Added Successfully',

  body: `
    Hi {{parentName}},

    Your child profile has been successfully added.

    Child Name:
    {{childName}}

    Screening Venue:
    {{screeningVenue}}

    Screening Date:
    {{screeningDate}}

    Payment Amount:
    ₹{{paymentAmount}}

    Transaction ID:
    {{transactionId}}

    Thank you for choosing Qavach.

    Regards,
    Qavach Team
  `,

  variables: [
    'parentName',
    'childName',
    'screeningVenue',
    'screeningDate',
    'paymentAmount',
    'transactionId'
  ],
},


//child_added_welcome_email


{
  templateId: 'child_added_welcome_email',

  name: 'Child Added Welcome',

  type: 'email',

  subject: 'Welcome to Your Screening Journey',

  body: `
Hi {{parentName}},

Congratulations on completing your child's profile.

Before screening, please review:

• Pre-Screening Activities
• Health Heroes Program

These activities help maximize your child's screening experience.

Regards,
Qavach Team
`,

  variables: [
    'parentName'
  ]
},




//gamification_daily_email

{
  templateId: 'gamification_daily_email',

  name: 'Daily Gamification Summary',

  type: 'email',

  subject: 'Your Health Hero Progress',

  body: `
Hi {{parentName}},

Health Hero Summary

Points Earned:
{{pointsEarned}}

Badges Won:
{{badgesWon}}

Progress:
{{progressPercentage}}%

Days Remaining:
{{daysRemaining}}

Keep progressing to unlock more rewards.

Regards,
Qavach Team
`,

  variables: [
    'parentName',
    'pointsEarned',
    'badgesWon',
    'progressPercentage',
    'daysRemaining'
  ],
},





//gamification_points_earned
{
  templateId: 'gamification_points_earned',

  name: 'Points Earned Notification',

  type: 'inapp',

  subject: 'Points Earned',

  body: `
Congratulations {{parentName}}!

You earned {{pointsEarned}} points.

Total Points:
{{totalPoints}}

Keep going and unlock more badges.
`,

  variables: [
    'parentName',
    'pointsEarned',
    'totalPoints'
  ],
},


//screening_reminder_3_days
{
  templateId: 'screening_reminder_3_days',

  name: 'Screening Reminder 3 Days',

  type: 'email',

  subject: 'Your Screening Is In 3 Days',

  body: `
Hi {{parentName}},

This is a reminder that your child's screening is scheduled in 3 days.

Child Name:
{{childName}}

Venue:
{{screeningVenue}}

Date:
{{screeningDate}}

Please ensure all pre-screening activities are completed.

Regards,
Qavach Team
`,

  variables: [
    'parentName',
    'childName',
    'screeningVenue',
    'screeningDate'
  ],
},




//screening_reminder_1_day_email
{
  templateId: 'screening_reminder_1_day_email',

  name: 'Screening Reminder 1 Day Email',

  type : 'email',

  subject: 'Screening Reminder - Tomorrow',

  body: `
Hi {{parentName}},

This is a reminder that {{childName}}'s screening is scheduled for tomorrow.

Venue: {{screeningVenue}}
Date: {{screeningDate}}

Regards,
Qavach Team
  `,

  isActive: true,
},

//screening_reminder_3_hours_email

{
  templateId: 'screening_reminder_3_hours_email',

  name: 'Screening Reminder - 3 Hours',

  channel: 'email',

  subject: 'Screening Reminder - Today',

  body: `
Hi {{parentName}},

This is a reminder that {{childName}}'s screening is scheduled in 3 hours.

Venue: {{screeningVenue}}

Date: {{screeningDate}}

Time: {{screeningTime}}

Please arrive on time.

Regards,
Qavach Team
  `,

  isActive: true,
},


//screening_progress_update_email

{
  templateId: 'screening_progress_update_email',

  name: 'Screening Progress Update',

  channel: 'email',

  subject: 'Screening Progress Update',

  body: `
Hi {{parentName}},

{{stationName}} has been completed successfully.

Next Station:
{{nextStation}}

Please proceed to the next station.

Regards,
Qavach Team
  `,

  isActive: true,
},


//screening_completed_email

{
  templateId: 'screening_completed_email',

  name: 'Screening Complete Update',

  channel: 'email',

  subject: 'Screening Completed',

  body: `
Hi {{parentName}},

{{childName}}'s screening has been completed successfully.

The report is currently being prepared and will be shared shortly.

Regards,
Qavach Team
  `,

  isActive: true,
},



//report_published_email

{
  templateId: 'report_published_email',

  name: 'Report Published Notification',

  channel: 'email',

  subject: 'Screening Report Published',

  body: `
Hi {{parentName}},

{{childName}}'s screening report has been published successfully.

You can now view/download the report.

{{reportUrl}}

Regards,
Qavach Team
  `,

  isActive: true,
},


//gamification_weekly_summary_email

{
  templateId: 'gamification_weekly_summary_email',

  name: 'Weekly Gamification Notification',

  channel: 'email',

  subject: 'Your Weekly Health Hero Summary',

  body: `
Hi {{parentName}},

Weekly Progress Summary

New Points Earned: {{newPoints}}

Total Points: {{totalPoints}}

Activities Completed: {{activities}}

Videos Watched: {{videosWatched}}

Blogs Read: {{blogsRead}}

Keep progressing and earning rewards.

Regards,
Qavach Team
  `,

  isActive: true,
},


//inactivity_15_days_email

{
  templateId: 'inactivity_15_days_email',

  name: 'Inactivity for 15 Days',

  channel: 'email',

  subject: 'We Miss You at Qavach',

  body: `
Hi {{parentName}},

We noticed that you have been inactive for the past 15 days.

Regularly monitoring your child's health can help you stay informed about their well-being and developmental progress.

We encourage you to log in and continue your health journey with Qavach.

Regards,
Qavach Team
  `,

  isActive: true,
},


//upcoming_repeat_screening_2_months
{
  templateId: 'upcoming_repeat_screening_2_months',

  name: 'Upcoming Repeat Screening Reminder 1',

  subject: 'Upcoming Screening Reminder',

  body: `
Hi {{parentName}},

Your child's next screening is coming up in two months.

We recommend planning ahead and scheduling the screening at your convenience.

Regards,
Qavach Team
  `,

  isActive: true,
},



//repeat_screening_slots_open
{
  templateId: 'repeat_screening_slots_open',

  name: 'Slots Open for Repeat Screening',

  subject: 'Repeat Screening Slots Available',

  body: `
Hi {{parentName}},

Slots are now open for your child's repeat screening.

We recommend booking an appointment at your earliest convenience to secure your preferred slot.

Regards,
Qavach Team
  `,

  isActive: true,
},


//appointment_cancelled_by_admin

{
  templateId: 'appointment_cancelled_by_admin',

  name: 'Appointment Cancelled By Admin',

  subject: 'Appointment Cancelled - Action Required',

  body: `
Hi {{parentName}},

Your appointment scheduled on {{appointmentDate}} has been cancelled due to unforeseen circumstances.

You may reschedule your appointment using the link below:

{{rescheduleLink}}

If you do not wish to reschedule, please contact support to initiate a refund.

Regards,
Qavach Team
  `,

  isActive: true,
},


//child_added_to_queue tele-docter 

{
  templateId: 'child_added_to_queue',

  name: 'Child Added To Queue',

  subject: 'New Child Added to Queue',

  body: `
Hi Doctor,

A new child has been added to the {{queueName}} queue.

New Children Added: {{newChildren}}

Total Children in Queue: {{totalChildren}}

Please review the queue for assignment.

Regards,
Qavach Team
  `,

  isActive: true,
},



//staff_slot_assigned
{
  templateId: 'staff_slot_assigned',

  name: 'Staff Slot Assigned',

  subject: 'New Appointment Assigned',

  body: `
Hi {{staffName}},

A new appointment has been assigned to you.

Date: {{appointmentDate}}
Time: {{appointmentTime}}
Location: {{location}}

Status: Assigned

Please review your calendar for complete details.

Regards,
Qavach Team
  `,

  isActive: true,
},


//staff_slot_cancelled


{
  templateId: 'staff_slot_cancelled',

  name: 'Staff Slot Cancelled',

  subject: 'Appointment Cancelled',

  body: `
Hi {{staffName}},

The following appointment has been cancelled.

Date: {{appointmentDate}}
Time: {{appointmentTime}}
Location: {{location}}

Status: Cancelled

Please check your calendar for updated availability.

Regards,
Qavach Team
  `,

  isActive: true,
},



//staff_slot_updated
{
  templateId: 'staff_slot_updated',

  name: 'Staff Slot Updated',

  subject: 'Appointment Schedule Updated',

  body: `
Hi {{staffName}},

Your assigned appointment has been updated.

Date: {{appointmentDate}}
Time: {{appointmentTime}}
Location: {{location}}

Status: Updated

Please review the updated appointment details in your calendar.

Regards,
Qavach Team
  `,

  isActive: true,
},


//staff_role_assigned
{
  templateId: 'staff_role_assigned',

  name: 'Staff Role Assigned',

  subject: 'Welcome to Qavach',

  body: `
Hi {{staffName}},

Welcome to Qavach.

Your account has been successfully created and assigned the role of:

Role: {{roleName}}

You can now access the platform using your assigned credentials.

We look forward to working with you.

Regards,
Qavach Team
  `,

  isActive: true,
},


//staff_role_changed

{
  templateId: 'staff_role_changed',

  name: 'Staff Role Changed',

  subject: 'Role Updated Successfully',

  body: `
Hi {{staffName}},

Your role in Qavach has been updated.

Previous Role: {{oldRole}}

New Role: {{newRole}}

Your permissions and responsibilities may have changed based on the new role assignment.

If you have any questions, please contact the administrator.

Regards,
Qavach Team
  `,

  isActive: true,
},

//parent_email_reply_received

{
  templateId: 'parent_email_reply_received',

  name: 'Parent Email Reply Received',

  subject: 'Parent Replied to Email',

  body: `
Hi Admin,

A parent has replied to a previously sent email.

Parent Name: {{parentName}}

Parent Email: {{parentEmail}}

Reply Message:

{{replyMessage}}

Please review and respond if required.

Regards,
Qavach Notification System
  `,

  isActive: true,
}



];









