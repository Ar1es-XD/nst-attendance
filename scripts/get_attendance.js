#!/usr/bin/env node

/**
 * Newton School LMS Attendance Extractor CLI
 * Usage: node get_attendance.js <YOUR_BEARER_TOKEN> [COURSE_HASH]
 */

const BASE_URL = "https://my.newtonschool.co";

async function main() {
  const tokenInput = process.argv[2] || process.env.NEWTON_TOKEN;
  const targetCourseHash = process.argv[3] || "u4fvf1rm9v2e";

  if (!tokenInput) {
    console.error(`
\x1b[31m[!] Missing Bearer Token.\x1b[0m

Usage:
  node get_attendance.js <YOUR_BEARER_TOKEN> [COURSE_HASH]

Example:
  node get_attendance.js "eyJhbGciOi..." u4fvf1rm9v2e

How to get your token:
  1. Go to https://my.newtonschool.co/course/u4fvf1rm9v2e/details?tab=my-timeline
  2. Open DevTools (F12) -> Network tab
  3. Look for any request to '/api/' and copy the Authorization header value (without 'Bearer ')
`);
    process.exit(1);
  }

  const token = tokenInput.replace(/^Bearer\s+/i, '').trim();

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  };

  console.log('\n\x1b[36m[*] Connecting to Newton School LMS API...\x1b[0m');

  try {
    // 1. Fetch User Info
    const userRes = await fetch(`${BASE_URL}/api/v1/user/me/`, { headers });
    if (!userRes.ok) {
      throw new Error(`User auth failed with HTTP ${userRes.status}: ${userRes.statusText}. Token might be expired.`);
    }
    const userData = await userRes.json();
    console.log(`\x1b[32m[✓] Authenticated as:\x1b[0m ${userData.first_name || ''} ${userData.last_name || ''} (${userData.email || userData.username})`);

    // 2. Fetch Courses
    const coursesRes = await fetch(`${BASE_URL}/api/v2/course/all/applied/?pagination=false&completed=false`, { headers });
    let courses = [];
    if (coursesRes.ok) {
      courses = await coursesRes.json();
      console.log(`\x1b[32m[✓] Found ${courses.length} active course(s).\x1b[0m`);
    }

    // 3. Fetch Target Course Performance
    console.log(`\x1b[36m[*] Fetching attendance for course: ${targetCourseHash}...\x1b[0m\n`);
    const perfRes = await fetch(`${BASE_URL}/api/v2/course/h/${targetCourseHash}/self_performance/`, { headers });
    if (!perfRes.ok) {
      throw new Error(`Failed to fetch performance for ${targetCourseHash}: HTTP ${perfRes.status}`);
    }
    const perf = await perfRes.json();

    console.log('='.repeat(70));
    console.log(`\x1b[1mATTENDANCE REPORT FOR COURSE: ${targetCourseHash}\x1b[0m`);
    console.log('='.repeat(70));

    const overallAtt = perf.total_lectures_attended ?? 0;
    const overallTot = perf.total_lectures ?? 0;
    const overallPct = overallTot > 0 ? ((overallAtt / overallTot) * 100).toFixed(1) : 0;
    
    console.log(`Overall: ${overallAtt}/${overallTot} classes (${overallPct}%)`);
    console.log('-'.repeat(70));

    const subjects = perf.children_courses && perf.children_courses.length > 0 
      ? perf.children_courses 
      : [{ course: { name: 'Main Course', hash: targetCourseHash }, total_lectures: overallTot, total_lectures_attended: overallAtt }];

    subjects.forEach((sub, idx) => {
      const name = sub.course?.name || `Subject ${idx + 1}`;
      const att = sub.total_lectures_attended ?? 0;
      const tot = sub.total_lectures ?? 0;
      const pct = tot > 0 ? (att / tot) * 100 : 0;
      const threshold = 0.75;

      let statusMsg = '';
      if (pct >= 75) {
        const bunkable = Math.floor((att - threshold * tot) / threshold);
        statusMsg = `\x1b[32m[SAFE] Can bunk ${bunkable} more classes\x1b[0m`;
      } else {
        const required = Math.ceil((threshold * tot - att) / (1 - threshold));
        statusMsg = `\x1b[31m[LOW] Must attend ${required} consecutive classes\x1b[0m`;
      }

      console.log(`${idx + 1}. \x1b[1m${name}\x1b[0m`);
      console.log(`   Attendance: ${att}/${tot} (${pct.toFixed(1)}%) -> ${statusMsg}`);
    });

    console.log('='.repeat(70) + '\n');

  } catch (err) {
    console.error(`\x1b[31m[ERROR] ${err.message}\x1b[0m`);
    process.exit(1);
  }
}

main();
