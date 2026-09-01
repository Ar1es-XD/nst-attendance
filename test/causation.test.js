import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubjectMetrics,
  verifyActionCausation
} from '../src/utils/causationEngine.js';

test('Fixture 1: Zero-lecture boundary condition (T_i = 0)', () => {
  const metrics = calculateSubjectMetrics(0, 0, 75);
  assert.strictEqual(metrics.total, 0);
  assert.strictEqual(metrics.attended, 0);
  assert.strictEqual(metrics.percent, 100.0);
  assert.strictEqual(metrics.bunkable, 0);
  assert.strictEqual(metrics.required, 0);
  assert.strictEqual(metrics.isSkippable, false);
  assert.strictEqual(metrics.hasZeroLectures, true);
});

test('Fixture 2: Clamping B_i against actual remaining scheduled lectures', () => {
  // Subject with 10/10 (100%), target 80%
  // Raw bunkable: floor((10 - 0.8 * 10) / 0.8) = floor(2 / 0.8) = 2
  // Case A: Remaining lectures is 1 -> B_i clamped to 1
  const metricsClamped = calculateSubjectMetrics(10, 10, 80, 1);
  assert.strictEqual(metricsClamped.rawBunkable, 2);
  assert.strictEqual(metricsClamped.bunkable, 1);
  assert.strictEqual(metricsClamped.isSkippable, true);

  // Case B: Remaining lectures is 0 -> B_i clamped to 0, cannot skip anymore
  const metricsZeroRemaining = calculateSubjectMetrics(10, 10, 80, 0);
  assert.strictEqual(metricsZeroRemaining.rawBunkable, 2);
  assert.strictEqual(metricsZeroRemaining.bunkable, 0);
  assert.strictEqual(metricsZeroRemaining.isSkippable, false);

  // Case C: Remaining lectures is 5 (plenty) -> B_i remains 2
  const metricsPlenty = calculateSubjectMetrics(10, 10, 80, 5);
  assert.strictEqual(metricsPlenty.bunkable, 2);
  assert.strictEqual(metricsPlenty.isSkippable, true);
});

test('Fixture 3: Conflict Detection — Aggregate is safe, but individual subject is restricted', () => {
  // Subject A (ADA): 5/5 (100%), Target 80% -> Skipping 1 leaves 5/6 = 83.3% (SAFE)
  // Subject B (Calculus): 5/6 (83.3%), Target 80% -> Skipping 1 leaves 5/7 = 71.4% (RESTRICTED)
  const subjects = [
    { hash: 'sub-ada', shortName: 'ADA', attended: 5, total: 5 },
    { hash: 'sub-calc', shortName: 'Calculus', attended: 5, total: 6 }
  ];

  const report = verifyActionCausation({
    subjects,
    targetThreshold: 80
  });

  // Aggregate: 10/11 = 90.9% >= 80%
  assert.strictEqual(report.aggregate.percent.toFixed(1), '90.9');
  assert.strictEqual(report.causationType, 'conditional_safe');

  // Verify Safe subjects
  assert.strictEqual(report.safeSubjects.length, 1);
  assert.strictEqual(report.safeSubjects[0].hash, 'sub-ada');
  assert.strictEqual(report.safeSubjects[0].bunkable, 1);

  // Verify Restricted subjects
  assert.strictEqual(report.restrictedSubjects.length, 1);
  assert.strictEqual(report.restrictedSubjects[0].hash, 'sub-calc');
  assert.strictEqual(report.restrictedSubjects[0].projectedPercentIfSkipped.toFixed(1), '71.4');
  assert.strictEqual(report.restrictedSubjects[0].projectedDrop.toFixed(1), '11.9');
});

test('Fixture 4: Conflict Warning — Aggregate has buffer, but ZERO individual subjects can skip', () => {
  // 4 subjects each with 4/5 (80.0%), Target 80%
  // Aggregate: 16/20 = 80.0%
  const subjects = [
    { hash: 's1', shortName: 'S1', attended: 4, total: 5 },
    { hash: 's2', shortName: 'S2', attended: 4, total: 5 },
    { hash: 's3', shortName: 'S3', attended: 4, total: 5 },
    { hash: 's4', shortName: 'S4', attended: 4, total: 5 }
  ];

  const report = verifyActionCausation({
    subjects,
    targetThreshold: 80
  });

  assert.strictEqual(report.aggregate.percent, 80.0);
  assert.strictEqual(report.safeSubjects.length, 0);
  assert.strictEqual(report.restrictedSubjects.length, 4);
  assert.strictEqual(report.causationType, 'aggregate_only_warning');
});

test('Fixture 5: Deficit Driver Identification and Recovery Count', () => {
  // Target: 75%
  // Subject 1: 10/10 (100%)
  // Subject 2: 2/8 (25%) -> Deficit! Required = ceil((0.75 * 8 - 2) / 0.25) = ceil(4 / 0.25) = 16
  const subjects = [
    { hash: 's1', shortName: 'S1', attended: 10, total: 10 },
    { hash: 's2', shortName: 'S2', attended: 2, total: 8 }
  ];

  const report = verifyActionCausation({
    subjects,
    targetThreshold: 75
  });

  // Aggregate: 12/18 = 66.7% < 75%
  assert.strictEqual(report.causationType, 'deficit');
  assert.strictEqual(report.deficitDrivers.length, 1);
  assert.strictEqual(report.deficitDrivers[0].hash, 's2');
  assert.strictEqual(report.deficitDrivers[0].required, 16);
});

test('Fixture 6: Next Upcoming Lecture Advisory', () => {
  const subjects = [
    { hash: 'sub-safe', shortName: 'SafeCourse', attended: 10, total: 10 },
    { hash: 'sub-risky', shortName: 'RiskyCourse', attended: 5, total: 6 }
  ];

  // Upcoming lecture 1 belongs to RiskyCourse
  const reportRisky = verifyActionCausation({
    subjects,
    targetThreshold: 80,
    upcomingLectures: [
      {
        title: 'Calculus Session 7',
        course: { hash: 'sub-risky', short_display_name: 'RiskyCourse' },
        start_timestamp: '2026-09-02T10:00:00+05:30'
      }
    ]
  });

  assert.ok(reportRisky.nextLectureAdvisory);
  assert.strictEqual(reportRisky.nextLectureAdvisory.isSafeToSkip, false);
  assert.match(reportRisky.nextLectureAdvisory.message, /DO NOT SKIP/);

  // Upcoming lecture 2 belongs to SafeCourse
  const reportSafe = verifyActionCausation({
    subjects,
    targetThreshold: 80,
    upcomingLectures: [
      {
        title: 'SafeCourse Lab',
        course: { hash: 'sub-safe', short_display_name: 'SafeCourse' },
        start_timestamp: '2026-09-02T11:30:00+05:30'
      }
    ]
  });

  assert.ok(reportSafe.nextLectureAdvisory);
  assert.strictEqual(reportSafe.nextLectureAdvisory.isSafeToSkip, true);
  assert.match(reportSafe.nextLectureAdvisory.message, /safely be skipped/);
});
