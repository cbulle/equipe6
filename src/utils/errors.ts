import { toast } from 'sonner';
import i18n from '@/i18n';

const KNOWN_ERROR_CODES = [
  'permission-denied',
  'unavailable',
  'functions/permission-denied',
  'functions/unauthenticated',
  'functions/internal',
  'functions/invalid-argument',
  'functions/unavailable',
  'auth/email-already-in-use',
  'auth/invalid-email',
  'auth/weak-password',
  'auth/invalid-credential',
  'auth/missing-email',
  'auth/user-disabled',
  'auth/too-many-requests',
  'auth/network-request-failed',
  'auth/requires-recent-login',
  'auth/wrong-password',
  'registration/sdis-email-not-allowed',
] as const;

type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

export function getErrorMessage(error: unknown): string {
  const rawCode = (error as { code?: string } | null)?.code ?? '';
  const code = rawCode as KnownErrorCode;
  if (KNOWN_ERROR_CODES.includes(code)) {
    return i18n.t(`errors.${code}`);
  }
  return i18n.t('errors.generic');
}

export function notifyError(error: unknown): void {
  console.error(error);
  toast.error(getErrorMessage(error));
}
