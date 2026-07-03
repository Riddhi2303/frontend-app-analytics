export const COURSE_DOT_CLASS: Record<string, string> = {
  CAD1: 'ongoing-dot--primary',
  EMC1: 'ongoing-dot--secondary',
};

export const dotClassForCourse = (code: string) => (
  COURSE_DOT_CLASS[code.toUpperCase()] ?? 'ongoing-dot--tertiary'
);

export const initialsFromName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || '?';
};
