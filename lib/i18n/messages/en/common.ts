/**
 * Shared UI words: the ones that appear on almost every screen.
 *
 * Owned by nobody in particular, changed by everybody — keep additions here to
 * genuinely cross-cutting words (save, cancel, search). A page-specific string
 * belongs in that page's module, or two agents will fight over this file.
 */
export const common = {
  save: 'Save changes',
  saving: 'Saving…',
  cancel: 'Cancel',
  search: 'Search',
  back: 'Back',
  loading: 'Loading…',
  required: 'Required',
  optional: 'Optional',
  tryAgain: 'Try again',
  saved: 'Saved.',
  confirm: 'Confirm',
  somethingWentWrong: 'Something went wrong. Please try again.',
} as const
