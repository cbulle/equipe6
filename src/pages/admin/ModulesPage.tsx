import clsx from 'clsx';
import { Eye, EyeOff, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DragHandle } from '@/components/ui/DragHandle';
import { EmptyState, PageLoader } from '@/components/ui/Feedback';
import { CheckboxField, SelectField, TextField } from '@/components/ui/FormFields';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCompetencies, useModules, useReferentCandidates } from '@/hooks/useAppData';
import { useSortableList } from '@/hooks/useSortableList';
import {
  createCompetency,
  createModule,
  deleteCompetency,
  deleteModule,
  reorderCompetencies,
  reorderModules,
  updateCompetency,
  updateModule,
  type CompetencyInput,
  type ModuleInput,
} from '@/services/trainingService';
import {
  type Competency,
  type TrainingModule,
  type UserProfile,
} from '@/types/models';
import { notifyError } from '@/utils/errors';
import { fullName } from '@/utils/names';

interface ModuleFormModalProps {
  trainingModule: TrainingModule | null;
  referentCandidates: UserProfile[];
  nextOrder: number;
  onSaved: (moduleId: string) => void;
  onClose: () => void;
}

function ModuleFormModal({ trainingModule, referentCandidates, nextOrder, onSaved, onClose }: ModuleFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ModuleInput>({
    code: trainingModule?.code ?? '',
    label: trainingModule?.label ?? '',
    order: trainingModule?.order ?? nextOrder,
    referentId: trainingModule?.referentId ?? null,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const input = { ...form, code: form.code.trim().toUpperCase() };
      if (trainingModule) {
        await updateModule(trainingModule.id, input);
        onSaved(trainingModule.id);
      } else {
        onSaved(await createModule(input));
      }
      toast.success(t(trainingModule ? 'modules.updated' : 'modules.created'));
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
      title={t(trainingModule ? 'modules.editTitle' : 'modules.createTitle')}
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
          label={t('modules.fields.code')}
          required
          placeholder="PS, SEE, OD…"
          value={form.code}
          onChange={(event) => setForm((previous) => ({ ...previous, code: event.target.value }))}
        />
        <TextField
          label={t('modules.fields.label')}
          required
          value={form.label}
          onChange={(event) => setForm((previous) => ({ ...previous, label: event.target.value }))}
        />
        <SelectField
          label={t('modules.fields.referent')}
          hint={t('modules.referentHint')}
          value={form.referentId ?? ''}
          onChange={(event) => setForm((previous) => ({ ...previous, referentId: event.target.value || null }))}
        >
          <option value="">{t('modules.noReferent')}</option>
          {referentCandidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {fullName(candidate)} — {t(`roles.${candidate.role}`)}
            </option>
          ))}
        </SelectField>
      </div>
    </Modal>
  );
}

interface CompetencyFormModalProps {
  competency: Competency | null;
  moduleId: string;
  nextOrder: number;
  onClose: () => void;
}

function CompetencyFormModal({ competency, moduleId, nextOrder, onClose }: CompetencyFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CompetencyInput>({
    moduleId,
    code: competency?.code ?? '',
    label: competency?.label ?? '',
    criteria: competency?.criteria ?? '',
    order: competency?.order ?? nextOrder,
    active: competency?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (competency) {
        await updateCompetency(competency.id, form);
      } else {
        await createCompetency(form);
      }
      toast.success(t(competency ? 'modules.competencyUpdated' : 'modules.competencyCreated'));
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
      title={t(competency ? 'modules.editCompetencyTitle' : 'modules.createCompetencyTitle')}
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
          label={t('modules.fields.competencyCode')}
          required
          placeholder="OS 2, C1, Atelier N°1…"
          value={form.code}
          onChange={(event) => setForm((previous) => ({ ...previous, code: event.target.value }))}
        />
        <TextField
          label={t('modules.fields.competencyLabel')}
          required
          value={form.label}
          onChange={(event) => setForm((previous) => ({ ...previous, label: event.target.value }))}
        />
        <TextField
          label={t('modules.fields.criteria')}
          hint={t('modules.criteriaHint')}
          value={form.criteria}
          onChange={(event) => setForm((previous) => ({ ...previous, criteria: event.target.value }))}
        />
        <CheckboxField
          label={t('modules.fields.active')}
          description={t('modules.activeHint')}
          checked={form.active}
          onChange={(event) => setForm((previous) => ({ ...previous, active: event.target.checked }))}
        />
      </div>
    </Modal>
  );
}

export function ModulesPage() {
  const { t } = useTranslation();
  const { data: modules, loading } = useModules();
  const { data: competencies } = useCompetencies();
  const { data: referentCandidates, loading: referentsLoading } = useReferentCandidates();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editedModule, setEditedModule] = useState<TrainingModule | null | undefined>(undefined);
  const [moduleToDelete, setModuleToDelete] = useState<TrainingModule | null>(null);
  const [editedCompetency, setEditedCompetency] = useState<Competency | null | undefined>(undefined);
  const [competencyToDelete, setCompetencyToDelete] = useState<Competency | null>(null);

  const selectedModule = modules.find((trainingModule) => trainingModule.id === selectedModuleId) ?? modules[0];
  const competencyCountByModule = useMemo(() => {
    const counts = new Map<string, number>();
    competencies.forEach((competency) => counts.set(competency.moduleId, (counts.get(competency.moduleId) ?? 0) + 1));
    return counts;
  }, [competencies]);
  const moduleCompetencies = selectedModule
    ? competencies.filter((competency) => competency.moduleId === selectedModule.id)
    : [];
  const nextCompetencyOrder = Math.max(0, ...moduleCompetencies.map((competency) => competency.order)) + 1;

  const moduleSortable = useSortableList(modules, (orderedIds) => reorderModules(orderedIds).catch(notifyError));
  const competencySortable = useSortableList(moduleCompetencies, (orderedIds) =>
    reorderCompetencies(orderedIds).catch(notifyError),
  );

  const handleToggleActive = (competency: Competency) => {
    updateCompetency(competency.id, { active: !competency.active }).catch(notifyError);
  };

  if (loading || referentsLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <PageHeader
        title={t('modules.title')}
      />

      {modules.length === 0 ? (
        <div className="space-y-3">
          <Card>
            <EmptyState icon={<ListChecks className="size-6" />} title={t('modules.empty')} />
          </Card>
          <Button className="min-h-11 w-full lg:w-auto" icon={<Plus className="size-4" />} onClick={() => setEditedModule(null)}>
            {t('modules.create')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div>
            <p className="mb-2 hidden text-xs text-slate-500 lg:block">{t('modules.dragHint')}</p>
            <SelectField
              label={t('modules.selectModule')}
              className="mb-3 lg:hidden"
              value={selectedModule?.id ?? ''}
              onChange={(event) => setSelectedModuleId(event.target.value)}
            >
              {modules.map((trainingModule) => (
                <option key={trainingModule.id} value={trainingModule.id}>
                  {trainingModule.code} — {trainingModule.label}
                </option>
              ))}
            </SelectField>
            <nav
              className="hidden gap-2 pb-1 lg:flex lg:flex-col lg:overflow-visible"
              aria-label={t('modules.title')}
            >
              {moduleSortable.orderedItems.map((trainingModule) => {
                const isSelected = trainingModule.id === selectedModule?.id;
                return (
                  <div
                    key={trainingModule.id}
                    ref={moduleSortable.itemRef(trainingModule.id)}
                    className={clsx(
                      'relative flex min-w-56 items-center rounded-xl pl-1 ring-1 transition-shadow lg:min-w-0',
                      isSelected ? 'bg-brand-800 text-white ring-brand-800' : 'bg-white text-slate-700 ring-brand-200 hover:ring-brand-300',
                      moduleSortable.draggedId === trainingModule.id && 'z-10 shadow-lg ring-2 ring-fire-400',
                    )}
                  >
                    <DragHandle
                      label={t('modules.dragModule', { code: trainingModule.code })}
                      tone={isSelected ? 'inverted' : 'default'}
                      {...moduleSortable.handleProps(trainingModule.id)}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedModuleId(trainingModule.id)}
                      aria-current={isSelected}
                      className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-3 pl-1 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold opacity-70">{trainingModule.code}</span>
                        <span className="block truncate text-sm font-medium">{trainingModule.label}</span>
                      </span>
                      <span className="rounded-sm bg-black/10 px-2 py-0.5 text-xs font-semibold">
                        {competencyCountByModule.get(trainingModule.id) ?? 0}
                      </span>
                    </button>
                  </div>
                );
              })}
            </nav>
            <Button className="mt-3 min-h-11 w-full" icon={<Plus className="size-4" />} onClick={() => setEditedModule(null)}>
              {t('modules.create')}
            </Button>
          </div>

          {selectedModule && (
            <Card>
              <CardHeader
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    <Badge tone="fire">{selectedModule.code}</Badge>
                    {selectedModule.label}
                  </span>
                }
              />
              <div className="grid grid-cols-2 gap-2 border-b border-brand-100 p-3 sm:grid-cols-3">
                <Button
                  className="col-span-2 min-h-11 sm:col-span-1"
                  variant="secondary"
                  icon={<Plus className="size-4" />}
                  onClick={() => setEditedCompetency(null)}
                >
                  {t('modules.addCompetency')}
                </Button>
                <Button
                  className="min-h-11"
                  variant="secondary"
                  icon={<Pencil className="size-4" />}
                  onClick={() => setEditedModule(selectedModule)}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  className="min-h-11"
                  variant="danger"
                  icon={<Trash2 className="size-4" />}
                  onClick={() => setModuleToDelete(selectedModule)}
                >
                  {t('common.delete')}
                </Button>
              </div>
              {moduleCompetencies.length === 0 ? (
                <EmptyState title={t('modules.noCompetencies')} />
              ) : (
                <ul className="divide-y divide-brand-50">
                  {competencySortable.orderedItems.map((competency) => (
                    <li
                      key={competency.id}
                      ref={competencySortable.itemRef(competency.id)}
                      className={clsx(
                        'relative flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-2 sm:py-3 sm:pr-5 sm:pl-2',
                        competency.active ? 'bg-white' : 'bg-slate-50',
                        competencySortable.draggedId === competency.id && 'z-10 rounded-lg shadow-lg ring-2 ring-fire-400',
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <DragHandle
                          className="size-11 sm:size-8"
                          label={t('modules.dragCompetency', { code: competency.code })}
                          {...competencySortable.handleProps(competency.id)}
                        />
                        <div className={clsx('min-w-0 flex-1', !competency.active && 'opacity-50')}>
                          <p className="text-sm leading-6">
                            <span className="mr-2 font-bold text-fire-700">{competency.code}</span>
                            {competency.label}
                          </p>
                          {competency.criteria && <p className="mt-0.5 text-xs leading-5 text-slate-500">{competency.criteria}</p>}
                          {!competency.active && (
                            <Badge tone="neutral" className="mt-1">
                              {t('modules.hidden')}
                            </Badge>
                          )}
                        </div>
                        <IconButton
                          className="size-11 shrink-0"
                          label={competency.active ? t('modules.hide') : t('modules.show')}
                          icon={competency.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          onClick={() => handleToggleActive(competency)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="min-h-11 sm:min-h-9"
                          icon={<Pencil className="size-4" />}
                          onClick={() => setEditedCompetency(competency)}
                        >
                          {t('common.edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="min-h-11 sm:min-h-9"
                          icon={<Trash2 className="size-4" />}
                          onClick={() => setCompetencyToDelete(competency)}
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      )}

      {editedModule !== undefined && (
        <ModuleFormModal
          key={editedModule?.id ?? 'new'}
          trainingModule={editedModule}
          referentCandidates={referentCandidates}
          nextOrder={Math.max(0, ...modules.map((trainingModule) => trainingModule.order)) + 1}
          onSaved={setSelectedModuleId}
          onClose={() => setEditedModule(undefined)}
        />
      )}

      {editedCompetency !== undefined && selectedModule && (
        <CompetencyFormModal
          key={editedCompetency?.id ?? 'new'}
          competency={editedCompetency}
          moduleId={selectedModule.id}
          nextOrder={nextCompetencyOrder}
          onClose={() => setEditedCompetency(undefined)}
        />
      )}

      <ConfirmDialog
        open={moduleToDelete !== null}
        title={t('modules.deleteTitle')}
        message={t('modules.deleteMessage', { label: moduleToDelete?.label ?? '' })}
        onConfirm={() =>
          moduleToDelete
            ? deleteModule(
                moduleToDelete.id,
                competencies.filter((competency) => competency.moduleId === moduleToDelete.id).map((competency) => competency.id),
              )
            : Promise.resolve()
        }
        onClose={() => setModuleToDelete(null)}
      />

      <ConfirmDialog
        open={competencyToDelete !== null}
        title={t('modules.deleteCompetencyTitle')}
        message={t('modules.deleteCompetencyMessage', { code: competencyToDelete?.code ?? '' })}
        onConfirm={() => (competencyToDelete ? deleteCompetency(competencyToDelete.id) : Promise.resolve())}
        onClose={() => setCompetencyToDelete(null)}
      />
    </>
  );
}
