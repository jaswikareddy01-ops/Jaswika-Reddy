// Run with Node 22.6+ (24 LTS recommended):
// node --experimental-strip-types --test src/tests/unit.test.mjs
// These tests import the actual pure app helpers and never touch accounts or stored data.
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseCommand, matchTask } from '../lib/commands.ts'
import { normalizePhone, requiredText } from '../lib/validation.ts'
import { notificationResponse } from '../lib/notification-response.ts'
import { reminderInstant } from '../lib/reminder-time.ts'

// Explicit-zone conversion must not depend on the machine's local timezone.
test('Los Angeles reminder selections convert in the displayed zone', () => {
  assert.equal(reminderInstant('2026-10-22', '14:30', 'America/Los_Angeles'), '2026-10-22T21:30:00.000Z')
  assert.equal(reminderInstant('2026-12-22', '14:30', 'America/Los_Angeles'), '2026-12-22T22:30:00.000Z')
})
test('changing a Los Angeles selection from next week to yesterday preserves both selected dates', () => {
  assert.equal(reminderInstant('2026-10-21', '14:30', 'America/Los_Angeles'), '2026-10-21T21:30:00.000Z')
  assert.equal(reminderInstant('2026-10-14', '14:30', 'America/Los_Angeles'), '2026-10-14T21:30:00.000Z')
})
test('midnight and fractional offsets preserve the selected local day and time', () => {
  assert.equal(reminderInstant('2026-10-22', '00:00', 'America/Los_Angeles'), '2026-10-22T07:00:00.000Z')
  assert.equal(reminderInstant('2026-10-22', '00:15', 'Asia/Kolkata'), '2026-10-21T18:45:00.000Z')
})
test('spring clock gaps reject nonexistent times and repeated hours choose the first occurrence', () => {
  assert.throws(() => reminderInstant('2026-03-08', '02:30', 'America/Los_Angeles'), /does not exist/)
  assert.equal(reminderInstant('2026-11-01', '01:30', 'America/Los_Angeles'), '2026-11-01T08:30:00.000Z')
})
test('reminder conversion rejects invalid dates, times, and zones', () => {
  assert.throws(() => reminderInstant('2026-02-30', '12:00', 'UTC'))
  assert.throws(() => reminderInstant('2026-10-22', '25:00', 'UTC'))
  assert.throws(() => reminderInstant('2026-10-22', '12:00', 'Not/AZone'))
})

test('notification templates reject empty and oversized text', () => {
  assert.throws(() => notificationResponse('   '))
  assert.throws(() => notificationResponse('a'.repeat(5001)))
})
test('sensitive notifications do not suggest a reply', () => {
  assert.equal(notificationResponse('Your verification code is 123456').draft, '')
})
test('scheduling replies do not promise availability', () => {
  assert.match(notificationResponse('Meeting tomorrow?').draft, /check my schedule/)
})
test('deadline notifications use a review template', () => {
  assert.match(notificationResponse('Assignment due Friday').draft, /review the details/)
})
test('questions and general updates have neutral templates', () => {
  assert.match(notificationResponse('Any news?').draft, /check and get back/)
  assert.match(notificationResponse('Package delivered').draft, /seen your message/)
})
test('notification titles use a bounded first line', () => {
  assert.equal(notificationResponse('  Review chapter two\nMore details').title, 'Review chapter two')
  assert.equal(notificationResponse('a'.repeat(200)).title.length, 120)
})

test('assignment command extracts its task title', () => {
  assert.deepEqual(parseCommand('Add a task to finish my assignment.'), { type: 'addTask', title: 'finish my assignment' })
})
test('commands accept whitespace, case, and polite task phrasing', () => {
  assert.deepEqual(parseCommand('  Please ADD a task: Review my notes!  '), { type: 'addTask', title: 'Review my notes' })
})
test('pending tasks command', () => {
  assert.deepEqual(parseCommand('Show my pending tasks.'), { type: 'tasks' })
})
test('create note command', () => {
  assert.deepEqual(parseCommand('Create a note.'), { type: 'notes' })
})
test('reminders command', () => {
  assert.deepEqual(parseCommand('Show my reminders.'), { type: 'reminders' })
})
test('completion command extracts the matching phrase', () => {
  assert.deepEqual(parseCommand('Mark my assignment as completed.'), { type: 'completeTask', query: 'my assignment' })
})
test('unknown or incomplete commands return help, not an empty task', () => {
  for (const command of ['', 'Add a task', 'Order me lunch']) assert.deepEqual(parseCommand(command), { type: 'help' })
})
test('task matching ignores case and punctuation', () => {
  const tasks = [{ title: 'Finish my assignment!' }]
  assert.deepEqual(matchTask(tasks, 'FINISH my assignment'), tasks)
})
test('exact matches take precedence over partial matches', () => {
  const tasks = [{ title: 'Read' }, { title: 'Read chapter two' }]
  assert.deepEqual(matchTask(tasks, 'read'), [tasks[0]])
})
test('ambiguous queries return all matches for the caller to reject', () => {
  const tasks = [{ title: 'Finish my assignment' }, { title: 'Review my assignment' }]
  assert.equal(matchTask(tasks, 'my assignment').length, 2)
})
test('blank and missing queries match nothing', () => {
  assert.deepEqual(matchTask([{ title: 'Read' }], ' !!! '), [])
  assert.deepEqual(matchTask([{ title: 'Read' }], 'assignment'), [])
})
test('formatted phone numbers are normalized', () => {
  assert.equal(normalizePhone('+1 (202) 555-0148'), '+12025550148')
  assert.equal(normalizePhone('202 555 0148'), '2025550148')
})
test('invalid phone formats and lengths are rejected', () => {
  for (const phone of ['', '123', '+012345678', '+1234567890123456', 'call 2025550148', '++12025550148']) {
    assert.throws(() => normalizePhone(phone))
  }
})
test('required text is trimmed and bounded', () => {
  assert.equal(requiredText('  Assignment  ', 'Title', 10), 'Assignment')
  assert.throws(() => requiredText('  ', 'Title'))
  assert.throws(() => requiredText('Too long', 'Title', 3))
})
