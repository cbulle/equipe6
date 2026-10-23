import { Link2, Paperclip, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCurrentUser } from '@/hooks/useAuth';
import { addResource, deleteResource } from '@/services/resourceService';
import { createSession, updateSession, type SessionInput } from '@/services/sessionService';
import { SESSION_TYPES, type Resource, type TrainingModule, type TrainingSession } from '@/types/models';
import { todayIsoDate } from '@/utils/dates';
import { notifyError } from '@/utils/errors';
import { isHttpUrl } from '@/utils/links';
import { fullName } from '@/utils/names';
import { Button } from '../ui/Button';
import { SelectField, TextField } from '../ui/FormFields';
import { IconButton } from '../ui/IconButton';
import { Modal } from '../ui/Modal';

interface SessionFormModalProps {
  session: TrainingSession | null;
  modules: TrainingModule[];
  linkedResources: Resource[];
  onClose: () => void;
}

interface PendingLink {
  title: string;
  url: string;
}

function toSessionInput({ id: _id, ...input }: TrainingSession): SessionInput {
  return input;
}

export function SessionFormModal({ session, modules, linkedResources, onClose }: SessionFormModalProps) {
  const { t } = useTranslation();
  const { uid, profile } = useCurrentUser();
  const [form, setForm] = useState<SessionInput>(() =>
    session ? toSessionInput(session) : {
      date: todayIsoDate(),
      startTime: '18:30',
      endTime: '20:30',
      title: '',
      theme: '',
      moduleId: null,
      type: 'course',
      createdBy: uid,
    },
  );
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([]);
  const [draftLink, setDraftLink] = useState<PendingLink>({ title: '', url: '' });
  const [saving, setSaving] = useState(false);

  const updateField = <K extends keyof SessionInput>(key: K, value: SessionInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const sessionId = session ? session.id : await createSession(form);
      if (session) {
        await updateSession(session.id, form);
      }
      await Promise.all(
        pendingLinks.map((link) =>
          addResource({
            ...link,
            sessionId,
            moduleId: form.moduleId,
            uploadedBy: uid,
            uploadedByName: fullName(profile),
          }),
        ),
      );
      toast.success(t(session ? 'sessions.updated' : 'sessions.created'));
      onClose();
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLink = () => {
    if (!isHttpUrl(draftLink.url)) {
      toast.error(t('resources.invalidUrl'));
      return;
    }
    setPendingLinks((previous) => [...previous, { title: draftLink.title.trim() || draftLink.url.trim(), url: draftLink.url.trim() }]);
    setDraftLink({ title: '', url: '' });
  };

  const handleRemoveResource = async (resource: Resource) => {
    try {
      await deleteResource(resource);
    } catch (error) {
      notifyError(error);
    }
  };

  return (
    <Modal
      open
      size="lg"
      title={t(session ? 'sessions.editTitle' : 'sessions.createTitle')}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={t('sessions.fields.title')}
          required
          placeholder={t('sessions.fields.titlePlaceholder')}
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
          className="sm:col-span-2"
        />
        <SelectField
          label={t('sessions.fields.type')}
          value={form.type}
          onChange={(event) => updateField('type', event.target.value as SessionInput['type'])}
        >
          {SESSION_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`sessionTypes.${type}`)}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t('sessions.fields.date')}
          type="date"
          required
          value={form.date}
          onChange={(event) => updateField('date', event.target.value)}
        />
        <TextField
          label={t('sessions.fields.startTime')}
          type="time"
          required
          value={form.startTime}
          onChange={(event) => updateField('startTime', event.target.value)}
        />
        <TextField
          label={t('sessions.fields.endTime')}
          type="time"
          required
          value={form.endTime}
          onChange={(event) => updateField('endTime', event.target.value)}
        />
        <TextField
          label={t('sessions.fields.theme')}
          placeholder={t('sessions.fields.themePlaceholder')}
          value={form.theme}
          onChange={(event) => updateField('theme', event.target.value)}
        />
        <SelectField
          label={t('sessions.fields.module')}
          value={form.moduleId ?? ''}
          onChange={(event) => updateField('moduleId', event.target.value || null)}
        >
          <option value="">{t('common.none')}</option>
          {modules.map((trainingModule) => (
            <option key={trainingModule.id} value={trainingModule.id}>
              {trainingModule.code} — {trainingModule.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="mt-6">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900">
          <Paperclip className="size-4" />
          {t('sessions.documents')}
        </h3>
        <p className="text-xs text-slate-500">{t('sessions.documentsHint')}</p>
        <ul className="mt-3 space-y-2">
          {linkedResources.map((resource) => (
            <li key={resource.id} className="flex items-center gap-3 rounded-lg bg-brand-50 px-3 py-2 text-sm">
              <Link2 className="size-4 shrink-0 text-brand-500" />
              <a href={resource.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:underline">
                {resource.title}
              </a>
              <IconButton
                label={t('common.delete')}
                tone="danger"
                icon={<Trash2 className="size-4" />}
                onClick={() => void handleRemoveResource(resource)}
              />
            </li>
          ))}
          {pendingLinks.map((link, index) => (
            <li key={`${link.url}-${index}`} className="flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2 text-sm">
              <Link2 className="size-4 shrink-0 text-amber-600" />
              <span className="min-w-0 flex-1 truncate">{link.title}</span>
              <IconButton
                label={t('common.remove')}
                tone="danger"
                icon={<Trash2 className="size-4" />}
                onClick={() => setPendingLinks((previous) => previous.filter((_, linkIndex) => linkIndex !== index))}
              />
            </li>
          ))}
        </ul>
        <div className="mt-3 grid gap-2 rounded-lg border-2 border-dashed border-brand-200 p-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
          <TextField
            label={t('resources.fields.title')}
            value={draftLink.title}
            onChange={(event) => setDraftLink((previous) => ({ ...previous, title: event.target.value }))}
          />
          <TextField
            label={t('resources.fields.url')}
            type="url"
            placeholder="https://"
            value={draftLink.url}
            onChange={(event) => setDraftLink((previous) => ({ ...previous, url: event.target.value }))}
          />
          <Button variant="secondary" icon={<Plus className="size-4" />} onClick={handleAddLink} disabled={!draftLink.url}>
            {t('sessions.addDocument')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
