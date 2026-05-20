/**
 * Seed script – populates MongoDB with sample admin user,
 * notification configs, and templates so the service works out-of-the-box.
 *
 * Run:  npm run seed
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from '../src/config';
import { AdminUser } from '../src/models/AdminUser';
import { NotificationConfig } from '../src/models/NotificationConfig';
import { NotificationTemplate } from '../src/models/NotificationTemplate';
import { logger } from '../src/utils/logger';

const ADMIN = { email: 'admin@qavach.com', password: 'Admin@123', name: 'Super Admin', role: 'super_admin' as const };

// ── Templates ──────────────────────────────────────────────────────────────
const TEMPLATES = [
  // ----- EMAIL -----
  {
    templateId: 'tmpl_signup_email',
    name: 'User Signup Welcome Email',
    type: 'email',
    subject: 'Welcome to Qavach, {{name}}!',
    body: `<h1>Welcome, {{name}}!</h1>
<p>Thank you for signing up. Please <a href="{{appLink}}">add your child</a> to get started.</p>
<p>The Qavach Team</p>`,
    variables: ['name', 'appLink'],
  },
  {
    templateId: 'tmpl_add_child_reminder_email',
    name: 'Add Child Reminder Email',
    type: 'email',
    subject: 'Dont forget – Add your child on Qavach',
    body: `<h2>Hi {{name}},</h2>
<p>We noticed you haven't added your child yet. Early health screening is important!</p>
<p><a href="{{appLink}}">Add your child now →</a></p>
<p>— Qavach Health Team</p>`,
    variables: ['name', 'appLink'],
  },
  {
    templateId: 'tmpl_child_added_confirmation_email',
    name: 'Child Added Confirmation Email',
    type: 'email',
    subject: 'Booking Confirmed – {{childName}} at {{screeningVenue}}',
    body: `<h2>Booking Confirmed!</h2>
<ul>
  <li><strong>Child:</strong> {{childName}}</li>
  <li><strong>Venue:</strong> {{screeningVenue}}</li>
  <li><strong>Date:</strong> {{screeningDate}}</li>
</ul>
<p>See you soon!</p>`,
    variables: ['childName', 'screeningVenue', 'screeningDate'],
  },
  {
    templateId: 'tmpl_screening_reminder_email',
    name: 'Screening Reminder Email',
    type: 'email',
    subject: 'Upcoming Screening Reminder for {{childName}}',
    body: `<h2>Hi {{parentName}},</h2>
<p>{{reminderLabel}} – your child <strong>{{childName}}</strong> has a screening at <strong>{{center}}</strong>.</p>
<p>Date: {{date}} | Time: {{time}}</p>`,
    variables: ['parentName', 'childName', 'reminderLabel', 'center', 'date', 'time'],
  },
  {
    templateId: 'tmpl_gamification_daily_email',
    name: 'Daily Gamification Summary Email',
    type: 'email',
    subject: 'Your Health Hero Update – Day {{dayNumber}}',
    body: `<h2>Health Hero Summary</h2>
<p>Points earned today: <strong>{{pointsEarned}}</strong></p>
<p>Total points: <strong>{{totalPoints}}</strong></p>
<p>Badges: <strong>{{badges}}</strong></p>
<p>Keep going! You have until Day 14 to complete all activities.</p>`,
    variables: ['pointsEarned', 'totalPoints', 'badges', 'dayNumber'],
  },
  {
    templateId: 'tmpl_report_published_email',
    name: 'Report Published Email',
    type: 'email',
    subject: 'Your Child\'s Report is Ready',
    body: `<h2>Hi {{name}},</h2>
<p>The health screening report for <strong>{{childName}}</strong> has been published.</p>
<p><a href="{{reportLink}}">View Report →</a></p>`,
    variables: ['name', 'childName', 'reportLink'],
  },
  {
    templateId: 'tmpl_staff_slot_assigned_email',
    name: 'Staff Slot Assigned Email',
    type: 'email',
    subject: 'Slot Assigned – {{date}} at {{time}}',
    body: `<p>Your slot has been assigned:</p>
<ul>
  <li>Date: {{date}}</li>
  <li>Time: {{time}}</li>
  <li>Location: {{location}}</li>
  <li>Status: {{status}}</li>
</ul>`,
    variables: ['date', 'time', 'location', 'status'],
  },
  {
    templateId: 'tmpl_tele_doctor_queue_email',
    name: 'Tele-Doctor Queue Update Email',
    type: 'email',
    subject: 'Queue Update – {{newChildren}} new child(ren) added',
    body: `<p>Queue update for your role (<strong>{{role}}</strong>):</p>
<ul>
  <li>New children added: <strong>{{newChildren}}</strong></li>
  <li>Total in queue: <strong>{{totalInQueue}}</strong></li>
</ul>`,
    variables: ['role', 'newChildren', 'totalInQueue'],
  },
  {
    templateId: 'tmpl_appointment_cancelled_email',
    name: 'Appointment Cancelled Email',
    type: 'email',
    subject: 'Your Appointment Has Been Cancelled',
    body: `<h2>Hi {{name}},</h2>
<p>Your appointment on <strong>{{date}}</strong> has been cancelled due to unforeseen circumstances.</p>
<p>Please <a href="{{rescheduleLink}}">check available slots</a> to reschedule, or contact support for a refund.</p>`,
    variables: ['name', 'date', 'rescheduleLink'],
  },
  {
    templateId: 'tmpl_inactivity_email',
    name: 'Inactivity Reminder Email',
    type: 'email',
    subject: 'We miss you, {{name}} – Your child\'s health matters',
    body: `<h2>Hi {{name}},</h2>
<p>We noticed you haven't been active lately. Staying updated on your child's health is important.</p>
<p><a href="{{appLink}}">Return to Qavach →</a></p>`,
    variables: ['name', 'appLink'],
  },
  {
    templateId: 'tmpl_repeat_screening_email',
    name: 'Repeat Screening Reminder Email',
    type: 'email',
    subject: 'Time for Your Child\'s Repeat Screening',
    body: `<h2>Hi {{name}},</h2>
<p>It's time to book your child's repeat health screening. Slots are now open!</p>
<p><a href="{{bookingLink}}">Book Now →</a></p>`,
    variables: ['name', 'bookingLink'],
  },

  // ----- PUSH -----
  {
    templateId: 'tmpl_signup_push',
    name: 'User Signup Push',
    type: 'push',
    title: 'Welcome to Qavach! 👋',
    body: 'Hi {{name}}! Complete your profile by adding your child.',
    variables: ['name'],
  },
  {
    templateId: 'tmpl_add_child_reminder_push',
    name: 'Add Child Reminder Push',
    type: 'push',
    title: 'Complete your profile',
    body: 'Add your child to unlock all features. Tap to continue.',
    variables: [],
  },
  {
    templateId: 'tmpl_screening_reminder_push',
    name: 'Screening Reminder Push',
    type: 'push',
    title: '🏥 Screening Reminder',
    body: '{{reminderLabel}} – {{childName}}\'s screening at {{center}}',
    variables: ['reminderLabel', 'childName', 'center'],
  },
  {
    templateId: 'tmpl_gamification_push',
    name: 'Gamification Push',
    type: 'push',
    title: '⭐ Points Earned!',
    body: 'You earned {{pointsEarned}} points! Total: {{totalPoints}}',
    variables: ['pointsEarned', 'totalPoints'],
  },
  {
    templateId: 'tmpl_report_published_push',
    name: 'Report Published Push',
    type: 'push',
    title: '📄 Report Ready',
    body: '{{childName}}\'s screening report is now available. Tap to view.',
    variables: ['childName'],
  },

  // ----- SMS -----
  {
    templateId: 'tmpl_screening_reminder_sms',
    name: 'Screening Reminder SMS',
    type: 'sms',
    body: 'Hello {{parentName}}, your child {{childName}} has a screening on {{date}} at {{time}} at {{center}}. - Qavach',
    variables: ['parentName', 'childName', 'date', 'time', 'center'],
  },
  {
    templateId: 'tmpl_add_child_reminder_sms',
    name: 'Add Child Reminder SMS (Fallback)',
    type: 'sms',
    body: 'Hi {{name}}, add your child on Qavach to continue. Visit: {{appLink}} - Qavach Health',
    variables: ['name', 'appLink'],
  },
  {
    templateId: 'tmpl_appointment_cancelled_sms',
    name: 'Appointment Cancelled SMS',
    type: 'sms',
    body: 'Hi {{name}}, your Qavach appointment on {{date}} is cancelled. Reschedule: {{rescheduleLink}} or call support. - Qavach',
    variables: ['name', 'date', 'rescheduleLink'],
  },
];

// ── Notification Configs ───────────────────────────────────────────────────
const CONFIGS = [
  // 1. User Signup – Welcome (instant)
  {
    event: 'USER_SIGNED_UP',
    name: 'User Signup Welcome',
    description: 'Send welcome notification immediately on signup',
    conditions: {},
    channels: ['email', 'push'],
    templateIds: { email: 'tmpl_signup_email', push: 'tmpl_signup_push' },
    schedule: { type: 'instant' },
    priority: 'high',
    isActive: true,
  },
  // 2. Add Child Reminder – 15 days daily (starts Day+1 at 9AM)
  {
    event: 'USER_SIGNED_UP',
    name: 'Add Child Reminder (15 days)',
    description: 'Remind user to add child daily for 15 days if no child added',
    conditions: {},
    channels: ['email', 'push'],
    templateIds: { email: 'tmpl_add_child_reminder_email', push: 'tmpl_add_child_reminder_push' },
    schedule: { type: 'delayed', delay: '1d', time: '09:00' },
    repeat: { count: 15, frequency: 'daily' },
    stopConditions: { childAdded: true },
    fallback: { sms: true },
    priority: 'normal',
    isActive: true,
  },
  // 3. Child Added – Confirmation (instant)
  {
    event: 'CHILD_ADDED',
    name: 'Child Added Confirmation',
    description: 'Confirmation with child and screening details',
    conditions: {},
    channels: ['email', 'push'],
    templateIds: { email: 'tmpl_child_added_confirmation_email', push: 'tmpl_signup_push' },
    schedule: { type: 'instant' },
    priority: 'high',
    isActive: true,
  },
  // 4. Appointment Booked – Screening Reminders (T-3d, T-1d, T-3h computed by RuleEngine)
  {
    event: 'APPOINTMENT_BOOKED',
    name: 'Screening Reminders',
    description: 'Auto-computed reminders at T-3 days, T-1 day, T-3 hours',
    conditions: {},
    channels: ['email', 'push', 'sms'],
    templateIds: {
      email: 'tmpl_screening_reminder_email',
      push: 'tmpl_screening_reminder_push',
      sms: 'tmpl_screening_reminder_sms',
    },
    schedule: { type: 'delayed', delay: '0s' }, // delay computed per reminder
    priority: 'high',
    isActive: true,
  },
  // 5. Daily Gamification – Email + Push (daily cron, 14 days)
  {
    event: 'DAILY_GAMIFICATION',
    name: 'Daily Gamification Summary',
    description: 'Daily health hero points summary',
    conditions: {},
    channels: ['email', 'push'],
    templateIds: { email: 'tmpl_gamification_daily_email', push: 'tmpl_gamification_push' },
    schedule: { type: 'instant' },
    priority: 'low',
    isActive: true,
  },
  // 6. Instant Gamification – Push only
  {
    event: 'INSTANT_GAMIFICATION',
    name: 'Instant Points Notification',
    description: 'Real-time push when points are earned',
    conditions: {},
    channels: ['push'],
    templateIds: { push: 'tmpl_gamification_push' },
    schedule: { type: 'instant' },
    priority: 'normal',
    isActive: true,
  },
  // 7. Report Published
  {
    event: 'REPORT_PUBLISHED',
    name: 'Report Published Notification',
    description: 'Notify parent when screening report is published',
    conditions: {},
    channels: ['email', 'push'],
    templateIds: { email: 'tmpl_report_published_email', push: 'tmpl_report_published_push' },
    schedule: { type: 'instant' },
    priority: 'high',
    isActive: true,
  },
  // 8. Inactivity Reminder (15 days post-report)
  {
    event: 'INACTIVITY_REMINDER',
    name: 'Inactivity Reminder',
    description: 'Notify inactive users 15 days after report',
    conditions: {},
    channels: ['email', 'push'],
    templateIds: { email: 'tmpl_inactivity_email' },
    schedule: { type: 'instant' },
    priority: 'low',
    isActive: true,
  },
  // 9. Appointment Cancelled
  {
    event: 'APPOINTMENT_CANCELLED',
    name: 'Appointment Cancellation Notice',
    description: 'Notify parent when appointment is cancelled',
    conditions: {},
    channels: ['email', 'sms'],
    templateIds: { email: 'tmpl_appointment_cancelled_email', sms: 'tmpl_appointment_cancelled_sms' },
    schedule: { type: 'instant' },
    priority: 'critical',
    isActive: true,
  },
  // 10. Repeat Screening Reminder (Day 300)
  {
    event: 'REPEAT_SCREENING_REMINDER',
    name: 'Repeat Screening Reminder',
    description: 'Remind parents 6 weeks before repeat screening',
    conditions: {},
    channels: ['email', 'push'],
    templateIds: { email: 'tmpl_repeat_screening_email' },
    schedule: { type: 'delayed', delay: '1d', time: '09:00' },
    repeat: { count: 6, frequency: 'weekly' },
    priority: 'normal',
    isActive: true,
  },
  // 11. Staff Slot Assigned
  {
    event: 'STAFF_SLOT_ASSIGNED',
    name: 'Staff Slot Assigned',
    description: 'Calendar update when slot is assigned to staff',
    conditions: {},
    channels: ['email'],
    templateIds: { email: 'tmpl_staff_slot_assigned_email' },
    schedule: { type: 'instant' },
    priority: 'high',
    isActive: true,
  },
  // 12. Tele-Doctor Queue Update
  {
    event: 'TELE_DOCTOR_QUEUE_UPDATE',
    name: 'Tele-Doctor Queue Alert',
    description: 'Email all tele-doctors of a role with queue update',
    conditions: {},
    channels: ['email'],
    templateIds: { email: 'tmpl_tele_doctor_queue_email' },
    schedule: { type: 'instant' },
    priority: 'normal',
    isActive: true,
  },
];

// ── Main ───────────────────────────────────────────────────────────────────
const seed = async (): Promise<void> => {
  await mongoose.connect(config.db.uri, { dbName: config.db.name });
  logger.info('Connected to MongoDB for seeding');

  // Admin user
  const existingAdmin = await AdminUser.findOne({ email: ADMIN.email });
  if (!existingAdmin) {
    await AdminUser.create(ADMIN);
    logger.info(`Admin created: ${ADMIN.email} / ${ADMIN.password}`);
  } else {
    logger.info('Admin already exists, skipping');
  }

  // Templates
  for (const tmpl of TEMPLATES) {
    await NotificationTemplate.findOneAndUpdate(
      { templateId: tmpl.templateId },
      tmpl,
      { upsert: true, new: true }
    );
  }
  logger.info(`${TEMPLATES.length} templates seeded`);

  // Configs
  for (const cfg of CONFIGS) {
    await NotificationConfig.findOneAndUpdate(
      { event: cfg.event, name: cfg.name },
      cfg,
      { upsert: true, new: true }
    );
  }
  logger.info(`${CONFIGS.length} notification configs seeded`);

  await mongoose.disconnect();
  logger.info('Seeding complete ✓');
};

seed().catch((err) => {
  logger.error({ err }, 'Seeding failed');
  process.exit(1);
});
