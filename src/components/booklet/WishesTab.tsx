import { CalendarHeart, Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { saveInternshipWishes, type InternshipWishesInput } from '@/services/wishService';
import {
  INTERNSHIP_CODES,
  type InternshipChoice,
  type InternshipCode,
  type InternshipWishes,
  type UserProfile,
} from '@/types/models';
import { formatTimestamp } from '@/utils/dates';
import { notifyError } from '@/utils/errors';
import { isJspApprentice } from '@/utils/training';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { CheckboxField, TextAreaField, TextField } from '../ui/FormFields';

const WISHES_PER_INTERNSHIP = 3;

function buildInitialInput(wishes: InternshipWishes | null): InternshipWishesInput {
  const emptyChoice = (): InternshipChoice => ({ wishes: Array(WISHES_PER_INTERNSHIP).fill(''), exempted: false });
  const choices = Object.fromEntries(
    INTERNSHIP_CODES.map((code) => [code, wishes?.choices[code] ?? emptyChoice()]),
  ) as Record<InternshipCode, InternshipChoice>;
  return { choices, constraints: wishes?.constraints ?? '' };
}

interface WishesTabProps {
  trainee: UserProfile;
  wishes: InternshipWishes | null;
  canEdit: boolean;
}

export function WishesTab({ trainee, wishes, canEdit }: WishesTabProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(() => buildInitialInput(wishes));
  const [saving, setSaving] = useState(false);
  const isJsp = isJspApprentice(trainee.apprenticeType);

  const updateChoice = (code: InternshipCode, update: Partial<InternshipChoice>) =>
    setForm((previous) => ({
      ...previous,
      choices: { ...previous.choices, [code]: { ...previous.choices[code], ...update } },
    }));

  const updateWish = (code: InternshipCode, index: number, value: string) =>
    updateChoice(code, {
      wishes: form.choices[code].wishes.map((wish, wishIndex) => (wishIndex === index ? value : wish)),
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveInternshipWishes(trainee.id, form);
      toast.success(t('wishes.saved'));
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSave();
      }}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{canEdit ? t('wishes.hint') : t('wishes.readOnlyHint')}</p>
        {wishes && (
          <p className="text-xs text-slate-400">{t('wishes.lastUpdate', { date: formatTimestamp(wishes.updatedAt) })}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {INTERNSHIP_CODES.map((code) => {
          const choice = form.choices[code];
          return (
            <Card key={code}>
              <CardHeader
                icon={<CalendarHeart className="size-5" />}
                title={t(`internships.${code}`)}
                actions={choice.exempted && <Badge tone="success">{t('wishes.exempted')}</Badge>}
              />
              <div className="space-y-3 p-4">
                {isJsp && (
                  <CheckboxField
                    label={t('wishes.exemptedLabel')}
                    description={t('wishes.exemptedHint')}
                    checked={choice.exempted}
                    disabled={!canEdit}
                    onChange={(event) => updateChoice(code, { exempted: event.target.checked })}
                  />
                )}
                {!choice.exempted && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {choice.wishes.map((wish, index) => (
                      <TextField
                        key={index}
                        label={t('wishes.wishNumber', { number: index + 1 })}
                        placeholder={t('wishes.wishPlaceholder')}
                        value={wish}
                        disabled={!canEdit}
                        onChange={(event) => updateWish(code, index, event.target.value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4">
        <TextAreaField
          label={t('wishes.constraints')}
          rows={4}
          value={form.constraints}
          disabled={!canEdit}
          onChange={(event) => setForm((previous) => ({ ...previous, constraints: event.target.value }))}
        />
      </Card>

      {canEdit && (
        <div className="flex justify-end">
          <Button type="submit" loading={saving} icon={<Save className="size-4" />}>
            {t('wishes.save')}
          </Button>
        </div>
      )}
    </form>
  );
}
