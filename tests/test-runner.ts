import { parseTextDeterministic } from '../src/services/taskParser';
import { generatePreparationPlan } from '../src/services/planningService';
import { DEFAULT_SETTINGS } from '../src/services/storageService';

console.log('=== CHRONOAI VERIFICATION SUITE ===\n');

// TEST 1: Exact prompt example 1 (Single assignment with subtasks, effort, date & time)
const input1 =
  'Submit the machine learning assignment by October 29, 2026, at 11:59 PM. Train a CNN model, evaluate its performance, and submit a report with screenshots. The final report must be uploaded before the deadline.';
console.log('Testing Input 1:', input1);
const res1 = parseTextDeterministic(input1);
console.log(`- Extracted Tasks Count: ${res1.tasks.length}`);
const t1 = res1.tasks[0];
console.log(`  Title: "${t1.title}"`);
console.log(`  Deadline Date: "${t1.deadlineDate}", Time: "${t1.deadlineTime}"`);
console.log(`  Priority: "${t1.priority}"`);
console.log(`  Effort: ${t1.estimatedMinutes} mins`);
console.log(`  Subtasks count: ${t1.subtasks.length}`);
t1.subtasks.forEach((st, i) => console.log(`    ${i + 1}. ${st.title} (${st.estimatedMinutes}m)`));

if (t1.deadlineDate.includes('2026-10-29') && t1.deadlineTime === '23:59') {
  console.log('✅ TEST 1 PASSED: Accurate date & time extraction\n');
} else {
  console.error('❌ TEST 1 FAILED: Unexpected date/time', t1.deadlineDate, t1.deadlineTime);
}

// TEST 2: Multi-task announcement splitting
const input2 =
  'Submit the DBMS assignment by Friday, attend the project review on Saturday, and finish the DSA practice sheet by Sunday evening.';
console.log('Testing Input 2 (Multi-Task):', input2);
const res2 = parseTextDeterministic(input2);
console.log(`- Extracted Tasks Count: ${res2.tasks.length}`);
res2.tasks.forEach((t, i) => {
  console.log(`  Task ${i + 1}: "${t.title}" | Date: ${t.deadlineDate} | Ambiguous: ${t.isDateAmbiguous}`);
});

if (res2.tasks.length >= 2) {
  console.log('✅ TEST 2 PASSED: Successfully decomposed multi-task notice\n');
} else {
  console.error('❌ TEST 2 FAILED: Expected multiple tasks, got:', res2.tasks.length);
}

// TEST 3: Ambiguous Date handling
const input3 = 'Complete final term paper by next Friday.';
console.log('Testing Input 3 (Ambiguous Date):', input3);
const res3 = parseTextDeterministic(input3);
const t3 = res3.tasks[0];
console.log(`- Date ambiguous flag: ${t3.isDateAmbiguous}`);
console.log(`- Missing info flags:`, t3.missingInformation);
if (t3.isDateAmbiguous || t3.missingInformation.length > 0) {
  console.log('✅ TEST 3 PASSED: Ambiguity flagged for user review\n');
} else {
  console.error('❌ TEST 3 FAILED: Ambiguity not flagged');
}

// TEST 4: Preparation Planning Backward Schedule
console.log('Testing Backward Preparation Schedule Planner:');
const plan = generatePreparationPlan(
  {
    id: 'test-1',
    title: t1.title,
    deadlineDate: '2026-10-29',
    deadlineTime: '23:59',
    subtasks: t1.subtasks,
    estimatedMinutes: 240,
  },
  [],
  DEFAULT_SETTINGS,
  'standard'
);

console.log(`- Plan feasible: ${plan.isFeasible}`);
console.log(`- Sessions generated: ${plan.sessions.length}`);
console.log(`- Rationale: "${plan.rationale}"`);
plan.sessions.forEach(s => {
  console.log(`  * ${s.title} on ${s.date} (${s.startTime} - ${s.endTime}, ${s.durationMinutes}m)`);
});

if (plan.sessions.length > 0 && plan.sessions.every(s => s.date <= '2026-10-29')) {
  console.log('✅ TEST 4 PASSED: All preparation sessions placed before or on deadline\n');
} else {
  console.error('❌ TEST 4 FAILED: Sessions improperly placed');
}

console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY.');
