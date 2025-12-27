// Skill Categories
export const SKILL_CATEGORIES = [
  'Technology & Programming',
  'Business & Finance',
  'Design & Creative',
  'Marketing & Sales',
  'Writing & Content',
  'Music & Audio',
  'Video & Photography',
  'Health & Fitness',
  'Cooking & Food',
  'Languages',
  'Teaching & Tutoring',
  'Crafts & DIY',
  'Sports & Recreation',
  'Personal Development',
  'Science & Research',
  'Engineering',
  'Legal & Compliance',
  'Real Estate & Property',
  'Fashion & Beauty',
  'Gaming & Esports',
  'Social Skills',
  'Other',
]

// Skill Levels
export const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
}

export const SKILL_LEVEL_LABELS = {
  [SKILL_LEVELS.BEGINNER]: 'Beginner',
  [SKILL_LEVELS.INTERMEDIATE]: 'Intermediate',
  [SKILL_LEVELS.ADVANCED]: 'Advanced',
}

// Skill Roles
export const SKILL_ROLES = {
  TEACH: 'teach',
  LEARN: 'learn',
}

// Preferred Formats
export const PREFERRED_FORMATS = {
  ONLINE: 'online',
  IN_PERSON: 'in-person',
  BOTH: 'both',
}

export const PREFERRED_FORMAT_LABELS = {
  [PREFERRED_FORMATS.ONLINE]: 'Online Only',
  [PREFERRED_FORMATS.IN_PERSON]: 'In-Person Only',
  [PREFERRED_FORMATS.BOTH]: 'Both',
}

// Swap Statuses
export const SWAP_STATUSES = {
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
}

export const SWAP_STATUS_LABELS = {
  [SWAP_STATUSES.PROPOSED]: 'Proposed',
  [SWAP_STATUSES.ACCEPTED]: 'Accepted',
  [SWAP_STATUSES.ACTIVE]: 'Active',
  [SWAP_STATUSES.COMPLETED]: 'Completed',
  [SWAP_STATUSES.CANCELLED]: 'Cancelled',
  [SWAP_STATUSES.REJECTED]: 'Rejected',
}

// Validation Rules
export const VALIDATION = {
  SKILL_NAME_MIN_LENGTH: 2,
  SKILL_NAME_MAX_LENGTH: 100,
  DIFFICULTY_MIN: 0,
  DIFFICULTY_MAX: 100,
  WEEKLY_HOURS_MIN: 0,
  WEEKLY_HOURS_MAX: 168, // 7 days * 24 hours
  BIO_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 1000,
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  PROFILE_UPDATE_ERROR: 'Failed to update profile. Please try again.',
  SKILL_ADD_ERROR: 'Failed to add skill. Please try again.',
  SKILL_DELETE_ERROR: 'Failed to delete skill. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
}

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  SKILL_ADDED: 'Skill added successfully!',
  SKILL_DELETED: 'Skill deleted successfully!',
  SWAP_CREATED: 'Swap proposal created successfully!',
}

