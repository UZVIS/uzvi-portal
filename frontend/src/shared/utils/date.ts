const HAS_TZ = /(Z|[+-]\d{2}:?\d{2})$/;

export function parseServerDate(iso: string): Date {
  return new Date(HAS_TZ.test(iso) ? iso : `${iso}Z`);
}