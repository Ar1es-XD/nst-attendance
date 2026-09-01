/**
 * Causation Verification Engine for Newton School LMS Attendance
 * 
 * Computes exact per-subject metrics, clamped skippable buffers,
 * deficit causation drivers, and next-lecture advisories.
 */

/**
 * Calculates attendance metrics for a single subject.
 * 
 * @param {number} attended - Classes attended so far
 * @param {number} total - Total classes held so far
 * @param {number} targetThreshold - Target percentage (e.g. 75 or 80)
 * @param {number|null} remainingLectures - Number of upcoming scheduled lectures remaining (optional)
 * @returns {object} Calculated metrics including clamped buffer and post-absence projection
 */
export function calculateSubjectMetrics(attended, total, targetThreshold = 75, remainingLectures = null) {
  const target = targetThreshold / 100.0;

  // Boundary condition: No lectures conducted yet
  if (total <= 0) {
    return {
      attended: 0,
      total: 0,
      percent: 100.0,
      status: 'neutral',
      rawBunkable: 0,
      bunkable: 0,
      required: 0,
      projectedPercentIfSkipped: 100.0,
      projectedDrop: 0.0,
      isSkippable: false,
      hasZeroLectures: true,
      remainingLectures: remainingLectures ?? null
    };
  }

  const percent = (attended / total) * 100;
  
  // Post-absence projection if 1 lecture is skipped (attended remains same, total increases by 1)
  const projectedPercentIfSkipped = (attended / (total + 1)) * 100;
  const projectedDrop = percent - projectedPercentIfSkipped;

  if (percent >= targetThreshold) {
    // Subject is currently compliant
    const rawBunkable = Math.floor((attended - target * total) / target);
    const validRawBunkable = Math.max(0, rawBunkable);
    
    // Clamp bunkable against actual remaining lectures if known
    let clampedBunkable = validRawBunkable;
    if (typeof remainingLectures === 'number' && remainingLectures >= 0) {
      clampedBunkable = Math.min(validRawBunkable, remainingLectures);
    }

    // A subject is strictly skippable if missing 1 class leaves it >= targetThreshold
    const isSkippable = clampedBunkable >= 1 && projectedPercentIfSkipped >= targetThreshold;

    return {
      attended,
      total,
      percent,
      status: percent >= targetThreshold + 5 ? 'safe' : 'warning',
      rawBunkable: validRawBunkable,
      bunkable: clampedBunkable,
      required: 0,
      projectedPercentIfSkipped,
      projectedDrop,
      isSkippable,
      hasZeroLectures: false,
      remainingLectures: remainingLectures ?? null
    };
  } else {
    // Subject is currently below mandated threshold
    let required = 0;
    if (target >= 1.0) {
      required = 999;
    } else {
      required = Math.ceil((target * total - attended) / (1.0 - target));
    }

    return {
      attended,
      total,
      percent,
      status: 'danger',
      rawBunkable: 0,
      bunkable: 0,
      required: Math.max(0, required),
      projectedPercentIfSkipped,
      projectedDrop,
      isSkippable: false,
      hasZeroLectures: false,
      remainingLectures: remainingLectures ?? null
    };
  }
}

/**
 * Calculates aggregate statistics across an array of processed subjects.
 * 
 * @param {Array<object>} subjects - Array of subject objects with attended and total
 * @param {number} targetThreshold - Target percentage
 * @returns {object} Aggregate metrics
 */
export function calculateAggregateMetrics(subjects, targetThreshold = 75) {
  let sumAttended = 0;
  let sumTotal = 0;

  for (const s of subjects) {
    sumAttended += (s.attended || 0);
    sumTotal += (s.total || 0);
  }

  const metrics = calculateSubjectMetrics(sumAttended, sumTotal, targetThreshold);
  return {
    attended: sumAttended,
    total: sumTotal,
    ...metrics
  };
}

/**
 * Performs full Causation Verification by comparing aggregate verdict with individual subject constraints,
 * identifying which subjects can actually be skipped safely, identifying deficit drivers, and providing
 * upcoming lecture advisories.
 * 
 * @param {object} params
 * @param {Array<object>} params.subjects - List of subjects with raw or adjusted attendance
 * @param {number} params.targetThreshold - Minimum mandated percentage (e.g. 75 or 80)
 * @param {Array<object>} [params.upcomingLectures] - Optional list of upcoming scheduled lectures
 * @returns {object} Comprehensive causation verification report
 */
export function verifyActionCausation({ subjects = [], targetThreshold = 75, upcomingLectures = [] }) {
  if (!subjects || subjects.length === 0) {
    return {
      aggregate: calculateSubjectMetrics(0, 0, targetThreshold),
      safeSubjects: [],
      restrictedSubjects: [],
      deficitDrivers: [],
      nextLectureAdvisory: null,
      causationType: 'empty',
      causationSummary: 'No enrolled course data available to verify causation.'
    };
  }

  // Count remaining scheduled lectures per subject if upcomingLectures is provided
  const remainingCountsByHash = {};
  if (Array.isArray(upcomingLectures)) {
    for (const lec of upcomingLectures) {
      const courseHash = lec.course?.hash || lec.courseHash;
      if (courseHash) {
        remainingCountsByHash[courseHash] = (remainingCountsByHash[courseHash] || 0) + 1;
      }
    }
  }

  // Process all subjects with individual metrics & remaining-lecture clamping
  const analyzedSubjects = subjects.map(sub => {
    const remaining = remainingCountsByHash[sub.hash];
    const metrics = calculateSubjectMetrics(sub.attended, sub.total, targetThreshold, remaining);
    return {
      ...sub,
      metrics
    };
  });

  const aggregate = calculateAggregateMetrics(
    analyzedSubjects.map(s => ({ attended: s.metrics.attended, total: s.metrics.total })),
    targetThreshold
  );

  const safeSubjects = [];
  const restrictedSubjects = [];
  const deficitDrivers = [];

  for (const s of analyzedSubjects) {
    const m = s.metrics;
    if (m.isSkippable) {
      safeSubjects.push({
        hash: s.hash,
        name: s.name || s.title || s.shortName,
        shortName: s.shortName || s.code || s.name,
        currentPercent: m.percent,
        bunkable: m.bunkable,
        rawBunkable: m.rawBunkable,
        remainingLectures: m.remainingLectures,
        projectedPercentIfSkipped: m.projectedPercentIfSkipped,
        projectedDrop: m.projectedDrop
      });
    } else {
      restrictedSubjects.push({
        hash: s.hash,
        name: s.name || s.title || s.shortName,
        shortName: s.shortName || s.code || s.name,
        currentPercent: m.percent,
        projectedPercentIfSkipped: m.projectedPercentIfSkipped,
        projectedDrop: m.projectedDrop,
        hasZeroLectures: m.hasZeroLectures,
        required: m.required,
        isDeficit: m.percent < targetThreshold
      });

      if (m.percent < targetThreshold) {
        deficitDrivers.push({
          hash: s.hash,
          name: s.name || s.title || s.shortName,
          shortName: s.shortName || s.code || s.name,
          currentPercent: m.percent,
          required: m.required
        });
      }
    }
  }

  // Next Lecture Advisory: Determine next upcoming lecture
  let nextLectureAdvisory = null;
  if (Array.isArray(upcomingLectures) && upcomingLectures.length > 0) {
    const nextLec = upcomingLectures[0];
    const nextHash = nextLec.course?.hash || nextLec.courseHash;
    const isSafe = safeSubjects.some(s => s.hash === nextHash);
    const restrictedMatch = restrictedSubjects.find(s => s.hash === nextHash);

    nextLectureAdvisory = {
      lectureTitle: nextLec.title || 'Upcoming Class',
      courseName: nextLec.course?.title || nextLec.course?.short_display_name || 'Scheduled Subject',
      courseShortName: nextLec.course?.short_display_name || nextLec.course?.title,
      startTimestamp: nextLec.start_timestamp,
      isSafeToSkip: isSafe,
      projectedDrop: restrictedMatch ? restrictedMatch.projectedDrop : 0,
      projectedPercentIfSkipped: restrictedMatch ? restrictedMatch.projectedPercentIfSkipped : 0,
      message: isSafe
        ? `Upcoming class can safely be skipped without breaching its ${targetThreshold}% floor.`
        : `DO NOT SKIP upcoming class — skipping will drop this course to ${restrictedMatch ? restrictedMatch.projectedPercentIfSkipped.toFixed(1) : 'N/A'}% (< ${targetThreshold}%).`
    };
  }

  // Build causation explanation
  let causationType = 'compliant';
  let causationSummary = '';

  if (aggregate.percent >= targetThreshold) {
    if (safeSubjects.length > 0) {
      causationType = 'conditional_safe';
      const safeNames = safeSubjects.map(s => `${s.shortName} (+${s.bunkable})`).join(', ');
      causationSummary = `Aggregate allows bunking, but skipping is strictly valid ONLY in ${safeSubjects.length} safe course(s): ${safeNames}. Skipping in other courses will breach individual subject compliance.`;
    } else {
      causationType = 'aggregate_only_warning';
      causationSummary = `Aggregate rate is ${aggregate.percent.toFixed(1)}% (≥ ${targetThreshold}%), but ZERO individual courses have buffer. Skipping any course will trigger an immediate course-level compliance violation.`;
    }
  } else {
    causationType = 'deficit';
    const driverNames = deficitDrivers.map(d => `${d.shortName} (${d.currentPercent.toFixed(1)}%, needs +${d.required})`).join(', ');
    causationSummary = `Deficit of ${(targetThreshold - aggregate.percent).toFixed(1)}% is driven by: ${driverNames || 'low overall attendance'}. Attending consecutive classes in these courses will restore compliance.`;
  }

  return {
    aggregate,
    safeSubjects,
    restrictedSubjects,
    deficitDrivers,
    nextLectureAdvisory,
    causationType,
    causationSummary
  };
}
