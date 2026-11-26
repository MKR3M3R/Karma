// The words on the Goals and Progress screen, English and Portuguese (see lib/mobility-ui.js for the
// approach; other languages show English). A goal is the person's own number; a week that did not
// reach is just a week that did not reach.
import { getLang } from './i18n-core.js'

const T = {
  en: {
    subtitle: 'Your goals and how the days add up',
    tabGoals: 'Goals', tabProgress: 'Progress',
    none: 'No goals yet. Set one that matters to you.', newGoal: 'New goal', editGoal: 'Edit goal',
    type_workouts: 'Workouts per week', type_mobility: 'Mobility days per week', type_meals: 'Days with food logged per week', type_lift: 'Lift an estimated 1RM',
    typeHint_meals: 'A habit goal: it only counts days you logged, never calories.',
    target: 'Target', perWeek: '{0} per week', thisWeek: 'This week: {0} of {1}', reached: 'Reached', weeksHit: 'Weeks that reached, last 8',
    pickExercise: 'Choose exercise', changeExercise: 'Change exercise', noExercise: 'Choose an exercise first.',
    liftNow: 'Now {0}', liftStart: 'Started at {0}', liftNoData: 'No estimate yet. Log a set of this exercise and it shows up here.', liftTarget: 'Target ({0})',
    note: 'Note (optional)', deleteGoal: 'Delete this goal?', saved: 'Saved', cancel: 'Cancel',
    r7d: '7 days', r30d: '30 days', r90d: '90 days', r6m: '6 months', r1y: '1 year', rall: 'All',
    workouts: 'Workouts', mobilitySessions: 'Mobility sessions', mobilityMinutes: 'Mobility minutes', foodDays: 'Days with food logged', weight: 'Body weight',
    weightChange: '{0} to {1} ({2})', weightNone: 'Needs two weigh-ins in this period.', nothing: 'Nothing logged in this period.',
  },
  pt: {
    subtitle: 'Suas metas e o que os dias somam',
    tabGoals: 'Metas', tabProgress: 'Progresso',
    none: 'Nenhuma meta ainda. Defina uma que importe para você.', newGoal: 'Nova meta', editGoal: 'Editar meta',
    type_workouts: 'Treinos por semana', type_mobility: 'Dias de mobilidade por semana', type_meals: 'Dias com alimentação registrada por semana', type_lift: 'Atingir uma estimativa de 1RM',
    typeHint_meals: 'Uma meta de hábito: conta só os dias em que você registrou, nunca calorias.',
    target: 'Meta', perWeek: '{0} por semana', thisWeek: 'Esta semana: {0} de {1}', reached: 'Atingida', weeksHit: 'Semanas atingidas, últimas 8',
    pickExercise: 'Escolher exercício', changeExercise: 'Trocar exercício', noExercise: 'Escolha um exercício primeiro.',
    liftNow: 'Agora {0}', liftStart: 'Começou em {0}', liftNoData: 'Ainda sem estimativa. Registre uma série deste exercício e ela aparece aqui.', liftTarget: 'Meta ({0})',
    note: 'Observação (opcional)', deleteGoal: 'Excluir esta meta?', saved: 'Salvo', cancel: 'Cancelar',
    r7d: '7 dias', r30d: '30 dias', r90d: '90 dias', r6m: '6 meses', r1y: '1 ano', rall: 'Tudo',
    workouts: 'Treinos', mobilitySessions: 'Sessões de mobilidade', mobilityMinutes: 'Minutos de mobilidade', foodDays: 'Dias com alimentação registrada', weight: 'Peso corporal',
    weightChange: '{0} para {1} ({2})', weightNone: 'Precisa de duas pesagens neste período.', nothing: 'Nada registrado neste período.',
  },
}
const pack = lang => (lang === 'pt' || lang === 'pt-BR' ? T.pt : T.en)

/** The Goals screen's text for `key` in the app's language (English when it has none), with {0}, {1} filled in. */
export function gt(key, ...args) {
  const s = pack(getLang())[key] ?? T.en[key] ?? key
  return s.replace(/\{(\d+)\}/g, (m, i) => (args[i] == null ? m : String(args[i])))
}
export const GOALS_TEXT = T
