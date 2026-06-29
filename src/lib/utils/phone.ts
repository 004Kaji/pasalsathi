// Nepali phone number utilities

/** Normalises any Nepali phone input to E.164 (+977XXXXXXXXXX) */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('977')) return `+${digits}`
  if (digits.startsWith('0'))  return `+977${digits.slice(1)}`
  return `+977${digits}`
}

/** Returns true if the raw input is a valid Nepali mobile number */
export function isValidNepaliPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '')
  return (
    /^(97[4-9]\d{7}|98[0-9]\d{7}|96[0-9]\d{7})$/.test(digits) ||
    /^977(97[4-9]\d{7}|98[0-9]\d{7}|96[0-9]\d{7})$/.test(digits)
  )
}
