/**
 * Portfolio photography, added when uploads landed. The older portfolio copy is
 * still inline English; only new strings live here.
 */
export const portfolio = {
  photo: {
    upload: 'Add photo',
    replace: 'Replace photo',
    uploading: 'Uploading…',
    remove: 'Remove photo',
    hint: 'JPEG, PNG or WebP. Resized in your browser before upload, so a phone photo does not cost a customer a download.',
    errorType: 'That file is not an image we can use.',
    errorSize: 'That photo is still too large after resizing. Try a smaller one.',
    errorStorage: 'Photo storage is not configured for this workspace.',
    errorPermission: 'Only an owner or manager can change portfolio photos.',
    errorDemo: 'Demo mode is read-only. Connect a database to upload photos.',
    errorMissing: 'That portfolio entry no longer exists.',
  },
  order: {
    up: 'Move up',
    down: 'Move down',
  },
} as const
