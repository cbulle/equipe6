/**
 * Seeds the Firestore referential (modules, competencies, training sessions, default group)
 * and creates the first administrator account. The role is stored in the `users` profile.
 * Works on the free Spark plan (the Admin SDK only needs a service account key).
 *
 * Usage:
 *   npm run seed:emulator                  -> seeds the local emulators (+ demo accounts)
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run seed   -> seeds a real project
 *
 * Flags: --emulator (target local emulators), --demo (also create demo trainer / trainees).
 * The script is idempotent: documents use deterministic ids and are merged.
 */

const args = new Set(process.argv.slice(2));
const useEmulator = args.has('--emulator');
const withDemoData = args.has('--demo');

if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
  process.env.GCLOUD_PROJECT ??= 'demo-spv-booklet';
}

const { initializeApp, applicationDefault } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore } = await import('firebase-admin/firestore');

initializeApp(useEmulator ? { projectId: process.env.GCLOUD_PROJECT } : { credential: applicationDefault() });

const auth = getAuth();
const db = getFirestore();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@spv.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
const DEFAULT_GROUP_ID = 'team-6';

const MODULES = [
  {
    id: 'ps',
    code: 'PS',
    label: 'Stage 1 — Prompt Secours',
    targetType: 'ALL',
    evaluationScale: 'levels',
    order: 1,
    competencies: [
      ['OS 2', 'Assurer la sécurité (soi, victime, tiers) et réaliser un dégagement d’urgence', 'Accrochage & sécurisation zone'],
      ['OS 3', 'Réaliser un bilan circonstanciel, renseigner la fiche bilan et rendre compte au CA (GFO)', 'Bilan GFO complet'],
      ['OS 4', 'Conduire un bilan primaire (démarche d’ensemble)', 'Application protocole XABCDE'],
      ['OS 5', 'Bilan X : arrêter une hémorragie externe (compression, garrot, pansement compressif)', 'Pose garrot < 1 min / Pansement'],
      ['OS 6', 'Bilan primaire (A) : LVA, obstruction, maintien tête, retrait de casque, collier, canule', 'Technique de retrait de casque à 2'],
      ['OS 7', 'Bilan primaire (B) : détresse respiratoire, positions d’attente, oxygène (MHC, lunette)', 'Inhalation O2 & constantes'],
      ['OS 8', 'Bilan primaire (B) : RCP et DAE (adulte, enfant, nourrisson)', 'Massage / Insufflation & pose DAE'],
      ['OS 9', 'Bilan primaire (C) : apprécier et agir face à une détresse circulatoire', 'Pouls, TRC, rehaussement'],
      ['OS 10', 'Bilan primaire (D) : apprécier et agir face à une détresse neurologique', 'Score AVPU, GCS, pupilles'],
      ['OS 11', 'Bilan primaire (E) : rechercher les lésions cachées', 'Examen tête aux pieds'],
      ['OS 12', 'Réaliser un bilan secondaire', 'Interrogatoire SAMPLE / PQRST'],
      ['OS 13', 'Immobiliser un membre et prendre en charge une victime debout', 'Pose d’attelles et écharpes'],
      ['OS 14', 'Prendre en charge une atteinte de la peau (plaies, brûlures) et aider au déplacement', 'Rinçage, emballage stérile'],
    ],
  },
  {
    id: 'see',
    code: 'SEE',
    label: 'Stage 2 — Secours en Équipe',
    targetType: 'ALL',
    evaluationScale: 'levels',
    order: 2,
    competencies: [
      ['OS 3', 'Prendre en charge une atteinte liée aux circonstances (chaleur, froid, électrisation...)'],
      ['OS 4', 'Se protéger des maladies infectieuses et transmissibles (hygiène, habillage / déshabillage)'],
      ['OS 5', 'Prendre en compte les comportements inhabituels, la souffrance psychique, les violences conjugales'],
      ['OS 6', 'Prendre en charge des pathologies diverses (dont mesure de la glycémie)'],
      ['OS 7', 'Prendre en charge une intoxication (CO, fumées d’incendie ; testeur CO)'],
      ['OS 8', 'Prendre en charge une grossesse, un accouchement, un nouveau-né'],
      ['OS 9', 'Réaliser les immobilisations de traumatologie (attelles dépression/traction/Davis, ceinture pelvienne, tête)'],
      ['OS 10', 'Réaliser relevages et brancardages (plan dur, MID, sangles araignées, drap de glisse)'],
      ['OS 11', 'Agir en situation à multiples victimes (SMV)'],
      ['OS 12', 'Intervenir en secours routier (abords, sécurité, dégagements, sortie de victime)'],
    ],
  },
  {
    id: 'od',
    code: 'OD',
    label: 'Stage 3 — Opérations Diverses',
    targetType: 'ALL',
    evaluationScale: 'levels',
    order: 3,
    competencies: [
      ['C1', 'Appliquer les règles de sécurité, porter les EPI, connaître l’inventaire du VTU et des lots'],
      ['Atelier N°1', 'Mettre en œuvre le matériel d’épuisement / assèchement, d’éclairage et de forcement'],
      ['Atelier N°2', 'Réaliser une capture / un sauvetage d’animaux ; intervenir sur hyménoptères'],
      ['Atelier N°3', 'Mettre en œuvre échelles à coulisse et de toit, lot de maintien au poste de travail, lot bâchage'],
      ['Atelier N°4', 'Utiliser les tronçonneuses en sécurité'],
      ['Atelier N°5', 'LSPCC : réaliser une protection contre les chutes'],
      ['Atelier N°6', 'Réaliser une reconnaissance d’appartement'],
      ['Atelier N°7', 'Mettre en œuvre le lot de sécurisation route et autoroute'],
      ['Atelier N°8 / MSP', 'Réaliser une mise en situation professionnelle (MSP) d’opérations diverses'],
    ],
  },
  {
    id: 'protec',
    code: 'PROTEC',
    label: 'Stage 4 — Protection Incendie',
    targetType: 'ALL',
    evaluationScale: 'levels',
    order: 4,
    competencies: [
      ['C1', 'Analyser son environnement et adapter son comportement à la situation'],
      ['C2', 'Réaliser un sauvetage'],
      ['C3', 'Sécuriser la zone d’intervention et évoluer en sécurité'],
      ['C4', 'Évoluer avec aisance (en ARI)'],
      ['C5', 'Réaliser un établissement et une extinction (dévidoir, LDV, division, tuyaux, lance à mousse et proportionneur)'],
      ['C6', 'Communiquer avec son équipier et rendre compte au CA'],
      ['C7', 'Maintenir la capacité opérationnelle des équipements (remise en état)'],
      ['C8', 'Connaissances — MGO, combustion, coupure des fluides et énergies'],
      ['C9', 'Technique — échelle à coulisse avec établissement, commande (hisser), prolongement / changement de tuyaux, manœuvre combinée M2->M6'],
    ],
  },
  {
    id: 'inc',
    code: 'INC',
    label: 'Stage 5 — Incendie',
    targetType: 'ALL',
    evaluationScale: 'levels',
    order: 5,
    competencies: [],
  },
  {
    id: 'jsp-bn',
    code: 'JSP_BN',
    label: 'Fiche complémentaire — Brevet National JSP',
    targetType: 'JSP_ONLY',
    evaluationScale: 'status',
    order: 6,
    competencies: [
      ['SUAP', 'Secours à personne'],
      ['INC', 'Incendie'],
      ['OD', 'Opérations diverses'],
      ['APS', 'Activités physiques et sportives'],
      ['CULT', 'Culture administrative / Épreuve écrite'],
    ],
  },
];

// Wednesday 18:30 - 20:30 planning (school year 2026-2027).
const SESSIONS = [
  ['2026-09-23', 'Ouverture', 'opening'],
  ['2026-09-30', 'Sport', 'sport'],
  ['2026-10-07', 'Séance 1', 'course'],
  ['2026-10-14', 'Séance 2', 'course'],
  ['2026-11-04', 'Sport', 'sport'],
  ['2026-11-18', 'Séance 3', 'course'],
  ['2026-11-25', 'Séance 4', 'course'],
  ['2026-12-02', 'Sport', 'sport'],
  ['2026-12-09', 'Séance 5', 'course'],
  ['2026-12-16', 'Séance 6', 'course'],
  ['2027-01-06', 'Sport', 'sport'],
  ['2027-01-13', 'Séance 7', 'course'],
  ['2027-02-03', 'Sport', 'sport'],
  ['2027-02-10', 'Séance 10', 'course'],
  ['2027-03-10', 'Séance 11', 'course'],
  ['2027-03-17', 'Séance 12', 'course'],
  ['2027-03-24', 'Séance 13', 'course'],
  ['2027-03-31', 'Séance 14', 'course'],
  ['2027-05-05', 'Sport', 'sport'],
  ['2027-05-12', 'Séance 16', 'course'],
  ['2027-05-19', 'Séance 17', 'course'],
  ['2027-05-26', 'Séance 18', 'course'],
  ['2027-06-02', 'Sport', 'sport'],
  ['2027-06-30', 'Séance 22', 'course'],
];

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function upsertAccount({ email, password, firstName, lastName, role, apprenticeType = null, groupId = null }) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, displayName: `${firstName} ${lastName}` });
  }
  await db.doc(`users/${user.uid}`).set(
    {
      email,
      firstName,
      lastName,
      role,
      apprenticeType,
      groupId,
      fireStation: 'CIS Centre',
      phone: '',
      active: true,
      createdAt: Date.now(),
    },
    { merge: true },
  );
  return user.uid;
}

async function seedReferential(adminUid) {
  const batch = db.batch();

  for (const { competencies, ...trainingModule } of MODULES) {
    batch.set(db.doc(`modules/${trainingModule.id}`), trainingModule, { merge: true });
    competencies.forEach(([code, label, criteria = ''], index) => {
      batch.set(
        db.doc(`competencies/${trainingModule.id}-${slugify(code)}`),
        { moduleId: trainingModule.id, code, label, criteria, order: index + 1, active: true },
        { merge: true },
      );
    });
  }

  for (const [date, title, type] of SESSIONS) {
    batch.set(
      db.doc(`sessions/session-${date}`),
      {
        date,
        startTime: '18:30',
        endTime: '20:30',
        title,
        theme: '',
        moduleId: null,
        type,
        createdBy: adminUid,
      },
      { merge: true },
    );
  }

  batch.set(
    db.doc(`groups/${DEFAULT_GROUP_ID}`),
    { label: 'Équipe 6', referentId: null, promoYear: 2026, active: true },
    { merge: true },
  );

  await batch.commit();
}

async function seedDemoAccounts() {
  const trainerUid = await upsertAccount({
    email: 'formateur@spv.local',
    password: 'Formateur1234!',
    firstName: 'Camille',
    lastName: 'Martin',
    role: 'trainer',
  });
  await db.doc(`groups/${DEFAULT_GROUP_ID}`).set({ referentId: trainerUid }, { merge: true });

  await upsertAccount({
    email: 'spv@spv.local',
    password: 'Stagiaire1234!',
    firstName: 'Lucas',
    lastName: 'Bernard',
    role: 'trainee',
    apprenticeType: 'SPV',
    groupId: DEFAULT_GROUP_ID,
  });
  await upsertAccount({
    email: 'jsp@spv.local',
    password: 'Stagiaire1234!',
    firstName: 'Inès',
    lastName: 'Petit',
    role: 'trainee',
    apprenticeType: 'JSP_N3',
    groupId: DEFAULT_GROUP_ID,
  });
  await upsertAccount({
    email: 'sansgroupe@spv.local',
    password: 'Stagiaire1234!',
    firstName: 'Noah',
    lastName: 'Roux',
    role: 'trainee',
    apprenticeType: 'JSP_N4',
  });
}

const adminUid = await upsertAccount({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  firstName: 'Admin',
  lastName: 'SPV',
  role: 'admin',
});
await seedReferential(adminUid);
if (withDemoData) {
  await seedDemoAccounts();
}

console.log(`Seed completed. Administrator: ${ADMIN_EMAIL}`);
if (withDemoData) {
  console.log('Demo accounts: formateur@spv.local / Formateur1234!, spv@spv.local, jsp@spv.local, sansgroupe@spv.local / Stagiaire1234!');
}
