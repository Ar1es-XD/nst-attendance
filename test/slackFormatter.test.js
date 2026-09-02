import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSlackTeacherMessage,
  getTemperatureTone,
  getTemperatureLabel
} from '../src/utils/slackMessageFormatter.js';

test('Slack Formatter: Generates natural human DM for absent lecture', () => {
  const lecture = {
    title: 'Graph Theory and Shortest Paths',
    start_timestamp: '2026-08-31T11:00:00+05:30',
    end_timestamp: '2026-08-31T12:30:00+05:30',
    attended: false,
    course: {
      title: "Newton School of Technology'25 (SVYASA) - Analysis and Design of Algorithms",
      short_display_name: 'ADA'
    },
    instructor_user: {
      first_name: 'Ashwin',
      last_name: 'Krishnamoorthy'
    }
  };

  const studentProfile = {
    first_name: 'Chinmaya',
    last_name: 'Patil'
  };

  const msg = formatSlackTeacherMessage({
    lecture,
    studentProfile,
    honorific: 'Sir',
    isDemoMode: false
  });

  // Verify human greeting
  assert.match(msg, /^Hi Ashwin sir, hope you're doing well!/);
  // Verify no corporate jargon
  assert.doesNotMatch(msg, /discrepancy/i);
  assert.doesNotMatch(msg, /ledger/i);
  assert.doesNotMatch(msg, /Sir\/Ma'am/i);
  assert.doesNotMatch(msg, /Current Portal Status/i);

  // Verify clean course short name
  assert.match(msg, /\*ADA\*/);
  // Verify polite ask and sign-off
  assert.match(msg, /I attended the class/);
  assert.match(msg, /Chinmaya Patil$/);
});

test('Slack Formatter: Honors Ma\'am honorific for female instructors', () => {
  const lecture = {
    title: 'Operating System Processes',
    start_timestamp: '2026-08-31T14:00:00+05:30',
    attended: false,
    course: {
      short_display_name: 'OS'
    },
    instructor_user: {
      first_name: 'Pooja',
      last_name: 'Sharma'
    }
  };

  const msg = formatSlackTeacherMessage({
    lecture,
    studentProfile: { first_name: 'Rahul' },
    honorific: "Ma'am",
    isDemoMode: false
  });

  assert.match(msg, /^Hi Pooja ma'am, hope you're doing well!/);
});

test('Slack Formatter: Fallbacks gracefully when instructor has no first name', () => {
  const lecture = {
    title: 'Database Lab',
    attended: false,
    course: { short_display_name: 'DB Lab' }
  };

  const msg = formatSlackTeacherMessage({
    lecture,
    studentProfile: { first_name: 'Chinmaya' },
    honorific: 'Sir'
  });

  assert.match(msg, /^Hi sir, hope you're doing well!/);
});

test('Slack Formatter: Includes demo watermark only in demo mode', () => {
  const lecture = {
    title: 'Demo Session',
    attended: false,
    course: { short_display_name: 'Demo' }
  };

  const liveMsg = formatSlackTeacherMessage({ lecture, isDemoMode: false });
  assert.doesNotMatch(liveMsg, /Simulated demo fixture/);

  const demoMsg = formatSlackTeacherMessage({ lecture, isDemoMode: true });
  assert.match(demoMsg, /Simulated demo fixture/);
});

test('Slack Formatter: Generates crisp formal message at temperature 0.0', () => {
  const lecture = {
    title: 'Distributed Systems Architecture',
    start_timestamp: '2026-09-01T10:00:00+05:30',
    attended: false,
    course: { short_display_name: 'DistSys' },
    instructor_user: { first_name: 'Arun' }
  };

  const msg = formatSlackTeacherMessage({
    lecture,
    studentProfile: { first_name: 'Chinmaya', last_name: 'Patil' },
    honorific: 'Sir',
    temperature: 0.0
  });

  assert.match(msg, /^Dear Arun sir,/);
  assert.match(msg, /I am writing to bring to your attention that I am marked absent/);
  assert.match(msg, /Could you please review and update my attendance record at your earliest convenience\?/);
  assert.match(msg, /Thank you,\nChinmaya Patil$/);
});

test('Slack Formatter: Formal fallback without instructor first name', () => {
  const lecture = {
    title: 'Cloud Computing Lab',
    attended: false,
    course: { short_display_name: 'Cloud' }
  };

  const msg = formatSlackTeacherMessage({
    lecture,
    honorific: 'Ma\'am',
    temperature: 0.1
  });

  assert.match(msg, /^Respected ma'am,/);
  assert.match(msg, /Thank you,\nStudent$/);
});

test('Slack Formatter: Generates concise professional message at temperature 0.3', () => {
  const lecture = {
    title: 'Compiler Design',
    start_timestamp: '2026-09-01T14:00:00+05:30',
    attended: false,
    course: { short_display_name: 'CD' },
    instructor_user: { first_name: 'Rohit' }
  };

  const msg = formatSlackTeacherMessage({
    lecture,
    studentProfile: { first_name: 'Dev' },
    honorific: 'Sir',
    temperature: 0.3
  });

  assert.match(msg, /^Good day Rohit sir,/);
  assert.match(msg, /I noticed I'm marked absent on the portal/);
  assert.match(msg, /Best regards,\nDev$/);
});

test('Slack Formatter: Generates warm friendly message at temperature 0.7', () => {
  const lecture = {
    title: 'Machine Learning Foundations',
    start_timestamp: '2026-09-02T11:00:00+05:30',
    attended: false,
    course: { short_display_name: 'ML' },
    instructor_user: { first_name: 'Priya' }
  };

  const msg = formatSlackTeacherMessage({
    lecture,
    studentProfile: { first_name: 'Aditi' },
    honorific: 'Ma\'am',
    temperature: 0.7
  });

  assert.match(msg, /^Hi Priya ma'am, hope you're having a great week!/);
  assert.match(msg, /Really appreciate your time!/);
  assert.match(msg, /Thanks so much!\nAditi$/);
});

test('Slack Formatter: Generates expressive warm message at temperature 1.0', () => {
  const lecture = {
    title: 'Neural Networks Deep Dive',
    start_timestamp: '2026-09-02T15:00:00+05:30',
    attended: false,
    course: { short_display_name: 'NN' },
    instructor_user: { first_name: 'Vikram' }
  };

  const msg = formatSlackTeacherMessage({
    lecture,
    studentProfile: { first_name: 'Chinmaya' },
    honorific: 'Sir',
    temperature: 1.0
  });

  assert.match(msg, /^Hey Vikram sir! Hope you're having a wonderful week!/);
  assert.match(msg, /Sorry to trouble you!/);
  assert.match(msg, /Truly grateful for your support!/);
  assert.match(msg, /Warm regards,\nChinmaya$/);
});

test('Slack Formatter: Verification check adapts according to temperature', () => {
  const lecture = {
    title: 'Web Dev Workshop',
    attended: true,
    course: { short_display_name: 'WebDev' },
    instructor_user: { first_name: 'Sneha' }
  };

  const formalMsg = formatSlackTeacherMessage({
    lecture,
    studentProfile: { first_name: 'Sam' },
    honorific: 'Ma\'am',
    temperature: 0.0
  });
  assert.match(formalMsg, /Could you kindly verify if my attendance has been updated on the portal\?/);

  const warmMsg = formatSlackTeacherMessage({
    lecture,
    studentProfile: { first_name: 'Sam' },
    honorific: 'Ma\'am',
    temperature: 1.0
  });
  assert.match(warmMsg, /whenever you get a moment, could you please check if it's updated on the portal\?/);
});

test('Slack Formatter: Helper functions map temperature correctly', () => {
  assert.strictEqual(getTemperatureTone(0.0), 'formal');
  assert.strictEqual(getTemperatureTone(0.2), 'formal');
  assert.strictEqual(getTemperatureTone(0.3), 'concise');
  assert.strictEqual(getTemperatureTone(0.4), 'concise');
  assert.strictEqual(getTemperatureTone(0.5), 'balanced');
  assert.strictEqual(getTemperatureTone(0.6), 'balanced');
  assert.strictEqual(getTemperatureTone(0.7), 'warm');
  assert.strictEqual(getTemperatureTone(0.8), 'warm');
  assert.strictEqual(getTemperatureTone(0.9), 'expressive');
  assert.strictEqual(getTemperatureTone(1.0), 'expressive');

  assert.strictEqual(getTemperatureLabel(0.0), 'Formal');
  assert.strictEqual(getTemperatureLabel(0.3), 'Concise');
  assert.strictEqual(getTemperatureLabel(0.5), 'Balanced');
  assert.strictEqual(getTemperatureLabel(0.7), 'Warm');
  assert.strictEqual(getTemperatureLabel(1.0), 'Expressive');
});

