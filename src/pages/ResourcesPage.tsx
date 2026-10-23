import { ExternalLink, FileText, FolderOpen, Link2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { SelectField, TextField } from '@/components/ui/FormFields';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { inputClassName } from '@/components/ui/styles';
import { useModules, useResources, useSessions } from '@/hooks/useAppData';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { addResource, deleteResource } from '@/services/resourceService';
import type { Resource, TrainingModule, TrainingSession } from '@/types/models';
import { formatDate, formatTimestamp } from '@/utils/dates';
import { notifyError } from '@/utils/errors';
import { getLinkHost, isHttpUrl } from '@/utils/links';
import { fullName, matchesSearch } from '@/utils/names';

const ALL = '__all__';

interface AddResourceModalProps {
  modules: TrainingModule[];
  sessions: TrainingSession[];
  onClose: () => void;
}

function AddResourceModal({ modules, sessions, onClose }: AddResourceModalProps) {
  const { t } = useTranslation();
  const { uid, profile } = useCurrentUser();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!isHttpUrl(url)) {
      toast.error(t('resources.invalidUrl'));
      return;
    }
    setSaving(true);
    try {
      await addResource({
        title,
        url,
        moduleId: moduleId || null,
        sessionId: sessionId || null,
        uploadedBy: uid,
        uploadedByName: fullName(profile),
      });
      toast.success(t('resources.added'));
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
      title={t('resources.addTitle')}
      description={t('resources.addHint')}
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {t('resources.add')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextField
          label={t('resources.fields.title')}
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <TextField
          label={t('resources.fields.url')}
          type="url"
          required
          placeholder="https://drive.google.com/…"
          hint={t('resources.urlHint')}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        <SelectField label={t('resources.fields.module')} value={moduleId} onChange={(event) => setModuleId(event.target.value)}>
          <option value="">{t('common.none')}</option>
          {modules.map((trainingModule) => (
            <option key={trainingModule.id} value={trainingModule.id}>
              {trainingModule.code} — {trainingModule.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('resources.fields.session')}
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
        >
          <option value="">{t('common.none')}</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {formatDate(session.date, { dateStyle: 'short' })} — {session.title}
            </option>
          ))}
        </SelectField>
      </div>
    </Modal>
  );
}

export function ResourcesPage() {
  const { t } = useTranslation();
  const { isAdmin, isStaff } = useAuth();
  const { uid } = useCurrentUser();
  const { data: resources, loading } = useResources();
  const { data: modules } = useModules();
  const { data: sessions } = useSessions();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState(ALL);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);

  const modulesById = useMemo(() => new Map(modules.map((trainingModule) => [trainingModule.id, trainingModule])), [modules]);
  const sessionsById = useMemo(() => new Map(sessions.map((session) => [session.id, session])), [sessions]);

  const visibleResources = resources.filter(
    (resource) =>
      (moduleFilter === ALL || resource.moduleId === moduleFilter) &&
      matchesSearch(search, resource.title, sessionsById.get(resource.sessionId ?? '')?.title),
  );

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <PageHeader
        title={t('resources.title')}
        description={t('resources.description')}
        actions={
          isStaff && (
            <Button icon={<Link2 className="size-4" />} onClick={() => setIsAddOpen(true)}>
              {t('resources.add')}
            </Button>
          )
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <SearchInput value={search} onChange={setSearch} placeholder={t('resources.searchPlaceholder')} />
        <select
          aria-label={t('resources.fields.module')}
          className={inputClassName}
          value={moduleFilter}
          onChange={(event) => setModuleFilter(event.target.value)}
        >
          <option value={ALL}>{t('resources.allModules')}</option>
          {modules.map((trainingModule) => (
            <option key={trainingModule.id} value={trainingModule.id}>
              {trainingModule.code} — {trainingModule.label}
            </option>
          ))}
        </select>
      </div>

      <Card>
        {visibleResources.length === 0 ? (
          <EmptyState icon={<FolderOpen className="size-6" />} title={t('resources.empty')} />
        ) : (
          <ul className="divide-y divide-brand-50">
            {visibleResources.map((resource) => {
              const trainingModule = resource.moduleId ? modulesById.get(resource.moduleId) : undefined;
              const session = resource.sessionId ? sessionsById.get(resource.sessionId) : undefined;
              const canDelete = isAdmin || (isStaff && resource.uploadedBy === uid);
              return (
                <li key={resource.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fire-50 text-fire-600">
                    <FileText className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium text-brand-900 hover:underline"
                    >
                      {resource.title}
                    </a>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      {trainingModule && <Badge tone="brand">{trainingModule.code}</Badge>}
                      {session && <Badge tone="neutral">{session.title}</Badge>}
                      <span>
                        {getLinkHost(resource.url)} · {resource.uploadedByName} · {formatTimestamp(resource.createdAt)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={t('resources.open')}
                    title={t('resources.open')}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 hover:bg-brand-100 hover:text-brand-800"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  {canDelete && (
                    <IconButton
                      label={t('common.delete')}
                      tone="danger"
                      icon={<Trash2 className="size-4" />}
                      onClick={() => setResourceToDelete(resource)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {isAddOpen && <AddResourceModal modules={modules} sessions={sessions} onClose={() => setIsAddOpen(false)} />}

      <ConfirmDialog
        open={resourceToDelete !== null}
        title={t('resources.deleteTitle')}
        message={t('resources.deleteMessage', { title: resourceToDelete?.title ?? '' })}
        onConfirm={() => (resourceToDelete ? deleteResource(resourceToDelete) : Promise.resolve())}
        onClose={() => setResourceToDelete(null)}
      />
    </>
  );
}
