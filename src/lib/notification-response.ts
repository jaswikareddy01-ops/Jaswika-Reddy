export function notificationResponse(input: string): { draft: string; reason: string; title: string } {
  const text = input.trim()
  if (!text) throw new Error('Paste a notification first.')
  if (text.length > 5000) throw new Error('Keep the notification under 5,000 characters.')
  const title = text.split('\n').find(line => line.trim())!.trim().slice(0, 120)
  if (/\b(otp|verification code|password|passcode|security code|bank|payment|account suspended)\b/i.test(text)) {
    return { title, draft: '', reason: 'This may be a sensitive or security-related message. No reply is suggested. Never share codes, passwords, or financial details; verify the sender independently.' }
  }
  if (/\b(meet|meeting|appointment|schedule|call)\b/i.test(text)) {
    return { title, draft: 'Thanks for the update. Let me check my schedule and get back to you.', reason: 'Scheduling keyword detected. This template does not confirm availability.' }
  }
  if (/\b(deadline|due|assignment|submit|finish|review)\b/i.test(text)) {
    return { title, draft: 'Thanks for the reminder. I’ll review the details and follow up.', reason: 'Task or deadline keyword detected. Dates are not inferred; choose a reminder time yourself.' }
  }
  if (text.includes('?')) {
    return { title, draft: 'Thanks for asking. I’ll check and get back to you.', reason: 'Question mark detected. This template does not invent an answer.' }
  }
  return { title, draft: 'Thanks for the update. I’ve seen your message.', reason: 'General acknowledgement template. Review the context before using it.' }
}
