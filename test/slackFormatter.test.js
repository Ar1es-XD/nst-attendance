import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSlackTeacherMessage } from '../src/utils/slackMessageFormatter.js';

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
