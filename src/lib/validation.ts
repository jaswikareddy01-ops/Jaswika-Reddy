export function requiredText(value: string, label: string, max = 200): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`)
  if (value.trim().length > max) throw new Error(`${label} must be ${max} characters or fewer.`)
  return value.trim()
}
export function normalizePhone(value: string): string {
  if (typeof value !== 'string' || !/^\+?[\d\s().-]+$/.test(value.trim())) throw new Error('Enter a valid phone number, including country code, such as +1 202 555 0148.')
  const phone = value.replace(/[\s().-]/g, '')
  if (!/^\+?[1-9]\d{7,14}$/.test(phone)) throw new Error('Phone numbers need 8–15 digits and may start with +.')
  return phone
}
