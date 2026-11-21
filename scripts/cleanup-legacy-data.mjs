const args = new Set(process.argv.slice(2));
const projectArg = process.argv.find((argument) => argument.startsWith('--project-id='));
const projectId = projectArg?.slice('--project-id='.length);
const useEmulator = args.has('--emulator');
const useProduction = args.has('--production');

if (useEmulator === useProduction) {
  throw new Error('Choose exactly one target: --emulator or --production.');
}

if (useProduction && (!args.has('--confirm-production') || !projectId)) {
  throw new Error('Production cleanup requires --confirm-production and --project-id=<project-id>.');
}

const { initializeApp, applicationDefault } = await import('firebase-admin/app');
const { FieldPath, FieldValue, getFirestore } = await import('firebase-admin/firestore');

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.GCLOUD_PROJECT ??= 'demo-spv-booklet';
  initializeApp({ projectId: process.env.GCLOUD_PROJECT });
} else {
  initializeApp({ credential: applicationDefault(), projectId });
}

const db = getFirestore();
const PAGE_SIZE = 400;

async function mutateCollection(collectionName, mutate) {
  let cursor;
  let changedCount = 0;

  while (true) {
    let page = db.collection(collectionName).orderBy(FieldPath.documentId()).limit(PAGE_SIZE);
    if (cursor) {
      page = page.startAfter(cursor);
    }

    const snapshot = await page.get();
    if (snapshot.empty) {
      break;
    }

    const batch = db.batch();
    let pageChanges = 0;
    snapshot.docs.forEach((document) => {
      const change = mutate(document);
      if (!change) {
        return;
      }

      if (change.type === 'delete') {
        batch.delete(document.ref);
      } else {
        batch.update(document.ref, change.data);
      }
      pageChanges += 1;
    });

    if (pageChanges > 0) {
      await batch.commit();
      changedCount += pageChanges;
    }

    cursor = snapshot.docs[snapshot.docs.length - 1];
    if (snapshot.size < PAGE_SIZE) {
      break;
    }
  }

  return changedCount;
}

const legacyModules = await db.collection('modules').get();
const legacyModuleIds = new Set(
  legacyModules.docs
    .filter((document) => {
      const data = document.data();
      return (
        document.id === 'jsp-bn' ||
        data.code === 'JSP_BN' ||
        data.targetType === 'JSP_ONLY' ||
        data.evaluationScale === 'status' ||
        /\bJSP\b|Jeunes Sapeurs/i.test(`${data.code ?? ''} ${data.label ?? ''}`)
      );
    })
    .map((document) => document.id),
);
legacyModuleIds.add('jsp-bn');
const competencies = await db.collection('competencies').get();
const legacyCompetencyIds = new Set(
  competencies.docs.filter((document) => legacyModuleIds.has(document.get('moduleId'))).map((document) => document.id),
);

const deletedAttendances = await mutateCollection('attendances', () => ({ type: 'delete' }));
const deletedEvaluations = await mutateCollection('evaluations', (document) =>
  legacyModuleIds.has(document.get('moduleId')) || legacyCompetencyIds.has(document.get('competencyId'))
    ? { type: 'delete' }
    : null,
);
const deletedCompetencies = await mutateCollection('competencies', (document) =>
  legacyModuleIds.has(document.get('moduleId')) ? { type: 'delete' } : null,
);
const deletedModules = await mutateCollection('modules', (document) =>
  legacyModuleIds.has(document.id) ? { type: 'delete' } : null,
);
const updatedUsers = await mutateCollection('users', (document) =>
  Object.hasOwn(document.data(), 'apprenticeType')
    ? { type: 'update', data: { apprenticeType: FieldValue.delete() } }
    : null,
);
const updatedModules = await mutateCollection('modules', (document) => {
  const data = document.data();
  const changes = {};
  if (Object.hasOwn(data, 'targetType')) {
    changes.targetType = FieldValue.delete();
  }
  if (Object.hasOwn(data, 'evaluationScale')) {
    changes.evaluationScale = FieldValue.delete();
  }
  return Object.keys(changes).length > 0 ? { type: 'update', data: changes } : null;
});
const updatedWishes = await mutateCollection('internshipWishes', (document) => {
  const choices = document.get('choices');
  if (!choices || typeof choices !== 'object') {
    return null;
  }

  let changed = false;
  const cleanedChoices = Object.fromEntries(
    Object.entries(choices).map(([code, choice]) => {
      if (!choice || typeof choice !== 'object' || !Object.hasOwn(choice, 'exempted')) {
        return [code, choice];
      }

      changed = true;
      const cleanedChoice = { ...choice };
      delete cleanedChoice.exempted;
      return [code, cleanedChoice];
    }),
  );
  return changed ? { type: 'update', data: { choices: cleanedChoices } } : null;
});

console.log(`Legacy data cleanup completed for ${projectId ?? process.env.GCLOUD_PROJECT}.`);
console.log(
  JSON.stringify(
    {
      deletedAttendances,
      deletedEvaluations,
      deletedCompetencies,
      deletedModules,
      updatedUsers,
      updatedModules,
      updatedWishes,
    },
    null,
    2,
  ),
);
