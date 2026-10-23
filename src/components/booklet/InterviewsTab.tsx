import { MessagesSquare, PenLine, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import {
  createInterview,
  deleteInterview,
  signInterview,
  updateInterviewContent,
  type InterviewContentInput,
} from '@/services/interviewService';
import type { Interview, UserProfile, Visa } from '@/types/models';
import { formatDate, formatTimestamp, todayIsoDate, toSchoolYear } from '@/utils/dates';
import { notifyError } from '@/utils/errors';
import { fullName } from '@/utils/names';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/Feedback';
import { TextAreaField, TextField } from '../ui/FormFields';
import { IconButton } from '../ui/IconButton';
import { Modal } from '../ui/Modal';

const MAX_INTERVIEWS_PER_YEAR = 3;

interface InterviewFormModalProps {
  interview: Interview | null;
  onSubmit: (input: InterviewContentInput) => Promise<void>;
  onClose: () => void;
}

function InterviewFormModal({ interview, onSubmit, onClose }: InterviewFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<InterviewContentInput>({
    date: interview?.date ?? todayIsoDate(),
    strengths: interview?.strengths ?? '',
    improvements: interview?.improvements ?? '',
    objectives: interview?.objectives ?? '',
  });
  const [saving, setSaving] = useState(false);

  const updateField = (key: keyof InterviewContentInput, value: string) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      size="lg"
      title={t(interview ? 'interviews.editTitle' : 'interviews.createTitle')}
      description={interview ? t('interviews.editWarning') : undefined}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label={t('interviews.fields.date')}
          type="date"
          required
          value={form.date}
          onChange={(event) => updateField('date', event.target.value)}
          className="sm:w-56"
        />
        <TextAreaField
          label={t('interviews.fields.strengths')}
          required
          value={form.strengths}
          onChange={(event) => updateField('strengths', event.target.value)}
        />
        <TextAreaField
          label={t('interviews.fields.improvements')}
          required
          value={form.improvements}
          onChange={(event) => updateField('improvements', event.target.value)}
        />
        <TextAreaField
          label={t('interviews.fields.objectives')}
          required
          value={form.objectives}
          onChange={(event) => updateField('objectives', event.target.value)}
        />
      </div>
    </Modal>
  );
}

interface VisaBoxProps {
  label: string;
  visa: Visa | null;
  canSign: boolean;
  onSign: () => void;
}

function VisaBox({ label, visa, canSign, onSign }: VisaBoxProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 items-center justify-between gap-3 rounded-lg bg-brand-50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
        {visa ? (
          <p className="text-sm text-emerald-700">
            {t('interviews.signedBy', { name: visa.name, date: formatTimestamp(visa.signedAt) })}
          </p>
        ) : (
          <p className="text-sm text-slate-400">{t('interviews.notSigned')}</p>
        )}
      </div>
      {!visa && canSign && (
        <Button size="sm" icon={<PenLine className="size-4" />} onClick={onSign}>
          {t('interviews.sign')}
        </Button>
      )}
    </div>
  );
}

interface InterviewsTabProps {
  trainee: UserProfile;
  interviews: Interview[];
}

export function InterviewsTab({ trainee, interviews }: InterviewsTabProps) {
  const { t } = useTranslation();
  const { isStaff } = useAuth();
  const { uid, profile } = useCurrentUser();
  const [editedInterview, setEditedInterview] = useState<Interview | null | undefined>(undefined);
  const [interviewToDelete, setInterviewToDelete] = useState<Interview | null>(null);

  const currentSchoolYear = toSchoolYear(todayIsoDate());
  const currentYearCount = interviews.filter((interview) => interview.schoolYear === currentSchoolYear).length;
  const canCreate = isStaff && currentYearCount < MAX_INTERVIEWS_PER_YEAR;
  const isSelf = uid === trainee.id;

  const handleSubmit = async (input: InterviewContentInput) => {
    if (editedInterview) {
      await updateInterviewContent(editedInterview.id, input);
      return;
    }
    const schoolYear = toSchoolYear(input.date);
    await createInterview({
      ...input,
      userId: trainee.id,
      schoolYear,
      occurrence: interviews.filter((interview) => interview.schoolYear === schoolYear).length + 1,
      trainerVisa: null,
      traineeVisa: null,
      createdBy: uid,
    });
    toast.success(t('interviews.created'));
  };

  const handleSign = (interview: Interview, side: 'trainerVisa' | 'traineeVisa') => {
    signInterview(interview.id, side, { userId: uid, name: fullName(profile), signedAt: Date.now() }).catch(notifyError);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {t('interviews.counter', { count: currentYearCount, max: MAX_INTERVIEWS_PER_YEAR, year: currentSchoolYear })}
        </p>
        {isStaff && (
          <Button icon={<Plus className="size-4" />} disabled={!canCreate} onClick={() => setEditedInterview(null)}>
            {t('interviews.create')}
          </Button>
        )}
      </div>

      {interviews.length === 0 ? (
        <EmptyState icon={<MessagesSquare className="size-6" />} title={t('interviews.empty')} />
      ) : (
        interviews.map((interview) => (
          <Card key={interview.id}>
            <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-brand-900">
                  {t('interviews.title', { occurrence: interview.occurrence })}
                </h3>
                <Badge tone="neutral">{formatDate(interview.date)}</Badge>
                <Badge tone="brand">{interview.schoolYear}</Badge>
              </div>
              {isStaff && (
                <div className="flex gap-1">
                  <IconButton
                    label={t('common.edit')}
                    icon={<Pencil className="size-4" />}
                    onClick={() => setEditedInterview(interview)}
                  />
                  <IconButton
                    label={t('common.delete')}
                    tone="danger"
                    icon={<Trash2 className="size-4" />}
                    onClick={() => setInterviewToDelete(interview)}
                  />
                </div>
              )}
            </div>
            <div className="grid gap-4 px-5 py-4 md:grid-cols-3">
              {(['strengths', 'improvements', 'objectives'] as const).map((field) => (
                <div key={field}>
                  <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase">
                    {t(`interviews.fields.${field}`)}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-line text-slate-700">{interview[field]}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-brand-100 px-5 py-3 sm:flex-row">
              <VisaBox
                label={t('interviews.trainerVisa')}
                visa={interview.trainerVisa}
                canSign={isStaff}
                onSign={() => handleSign(interview, 'trainerVisa')}
              />
              <VisaBox
                label={t('interviews.traineeVisa')}
                visa={interview.traineeVisa}
                canSign={isSelf}
                onSign={() => handleSign(interview, 'traineeVisa')}
              />
            </div>
          </Card>
        ))
      )}

      {editedInterview !== undefined && (
        <InterviewFormModal
          key={editedInterview?.id ?? 'new'}
          interview={editedInterview}
          onSubmit={handleSubmit}
          onClose={() => setEditedInterview(undefined)}
        />
      )}

      <ConfirmDialog
        open={interviewToDelete !== null}
        title={t('interviews.deleteTitle')}
        message={t('interviews.deleteMessage')}
        onConfirm={() => (interviewToDelete ? deleteInterview(interviewToDelete.id) : Promise.resolve())}
        onClose={() => setInterviewToDelete(null)}
      />
    </div>
  );
}
