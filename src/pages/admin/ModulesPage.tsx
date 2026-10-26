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
import { useCompetencies, useModules } from '@/hooks/useAppData';
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
  EVALUATION_SCALES,
  MODULE_TARGET_TYPES,
  type Competency,
  type EvaluationScale,
  type ModuleTargetType,
  type TrainingModule,
} from '@/types/models';
import { notifyError } from '@/utils/errors';

interface ModuleFormModalProps {
  trainingModule: TrainingModule | null;
  nextOrder: number;
  onSaved: (moduleId: string) => void;
  onClose: () => void;
}

function ModuleFormModal({ trainingModule, nextOrder, onSaved, onClose }: ModuleFormModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ModuleInput>({
    code: trainingModule?.code ?? '',
    label: trainingModule?.label ?? '',
    targetType: trainingModule?.targetType ?? 'ALL',
    evaluationScale: trainingModule?.evaluationScale ?? 'levels',
    order: trainingModule?.order ?? nextOrder,
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
          label={t('modules.fields.targetType')}
          value={form.targetType}
          onChange={(event) => setForm((previous) => ({ ...previous, targetType: event.target.value as ModuleTargetType }))}
        >
          {MODULE_TARGET_TYPES.map((targetType) => (
            <option key={targetType} value={targetType}>
              {t(`targetTypes.${targetType}`)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t('modules.fields.evaluationScale')}
          value={form.evaluationScale}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, evaluationScale: event.target.value as EvaluationScale }))
          }
        >
          {EVALUATION_SCALES.map((scale) => (
            <option key={scale} value={scale}>
              {t(`evaluationScales.${scale}`)}
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

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <PageHeader
        title={t('modules.title')}
        description={t('modules.description')}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setEditedModule(null)}>
            {t('modules.create')}
          </Button>
        }
      />

      {modules.length === 0 ? (
        <Card>
          <EmptyState icon={<ListChecks className="size-6" />} title={t('modules.empty')} />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div>
            <p className="mb-2 hidden text-xs text-slate-500 lg:block">{t('modules.dragHint')}</p>
            <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label={t('modules.title')}>
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
                description={
                  <span className="mt-1 flex flex-wrap gap-2">
                    <Badge tone="brand">{t(`targetTypes.${selectedModule.targetType}`)}</Badge>
                    <Badge tone="neutral">{t(`evaluationScales.${selectedModule.evaluationScale}`)}</Badge>
                  </span>
                }
                actions={
                  <>
                    <IconButton
                      label={t('common.edit')}
                      icon={<Pencil className="size-4" />}
                      onClick={() => setEditedModule(selectedModule)}
                    />
                    <IconButton
                      label={t('common.delete')}
                      tone="danger"
                      icon={<Trash2 className="size-4" />}
                      onClick={() => setModuleToDelete(selectedModule)}
                    />
                  </>
                }
              />
              {moduleCompetencies.length === 0 ? (
                <EmptyState title={t('modules.noCompetencies')} />
              ) : (
                <ul className="divide-y divide-brand-50">
                  {competencySortable.orderedItems.map((competency) => (
                    <li
                      key={competency.id}
                      ref={competencySortable.itemRef(competency.id)}
                      className={clsx(
                        'relative flex items-start gap-2 py-3 pr-4 pl-2 sm:pr-5',
                        competency.active ? 'bg-white' : 'bg-slate-50',
                        competencySortable.draggedId === competency.id && 'z-10 rounded-lg shadow-lg ring-2 ring-fire-400',
                      )}
                    >
                      <DragHandle
                        label={t('modules.dragCompetency', { code: competency.code })}
                        {...competencySortable.handleProps(competency.id)}
                      />
                      <div className={clsx('min-w-0 flex-1', !competency.active && 'opacity-50')}>
                        <p className="text-sm">
                          <span className="mr-2 font-bold text-fire-700">{competency.code}</span>
                          {competency.label}
                        </p>
                        {competency.criteria && <p className="mt-0.5 text-xs text-slate-500">{competency.criteria}</p>}
                        {!competency.active && (
                          <Badge tone="neutral" className="mt-1">
                            {t('modules.hidden')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <IconButton
                          label={competency.active ? t('modules.hide') : t('modules.show')}
                          icon={competency.active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          onClick={() => handleToggleActive(competency)}
                        />
                        <IconButton
                          label={t('common.edit')}
                          icon={<Pencil className="size-4" />}
                          onClick={() => setEditedCompetency(competency)}
                        />
                        <IconButton
                          label={t('common.delete')}
                          tone="danger"
                          icon={<Trash2 className="size-4" />}
                          onClick={() => setCompetencyToDelete(competency)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-brand-100 p-4">
                <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setEditedCompetency(null)}>
                  {t('modules.addCompetency')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {editedModule !== undefined && (
        <ModuleFormModal
          key={editedModule?.id ?? 'new'}
          trainingModule={editedModule}
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
