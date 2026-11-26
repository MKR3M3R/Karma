// The words for exporting a training programme and for matching a CSV's columns, English and
// Portuguese (see lib/mobility-ui.js; other languages show English).
import { getLang } from './i18n-core.js'

const T = {
  en: {
    exportJson: 'Export programme file (JSON)', exportCsv: 'Export programme (CSV)',
    exportSub: 'Your routines as a training programme file other tools can read. Routines only.',
    saved: 'Programme file saved.',
    mapTitle: 'Match your columns', mapHint: 'We couldn’t tell which column is which. Pick them once: the Exercise column is the only one required.',
    notInFile: 'Not in my file', continue: 'Continue', cancel: 'Cancel', needExercise: 'Pick the Exercise column to continue.',
    f_exercise: 'Exercise', f_day: 'Day or routine', f_sets: 'Sets', f_reps: 'Reps', f_rest_seconds: 'Rest (seconds)', f_load: 'Load', f_notes: 'Notes', f_superset_group: 'Superset group', f_duration_seconds: 'Duration (seconds)',
    column: 'Column {0}',
  },
  pt: {
    exportJson: 'Exportar arquivo de programa (JSON)', exportCsv: 'Exportar programa (CSV)',
    exportSub: 'Suas rotinas como arquivo de programa de treino que outras ferramentas leem. Só as rotinas.',
    saved: 'Arquivo de programa salvo.',
    mapTitle: 'Associe suas colunas', mapHint: 'Não deu para saber qual coluna é qual. Escolha uma vez: só a coluna de Exercício é obrigatória.',
    notInFile: 'Não está no meu arquivo', continue: 'Continuar', cancel: 'Cancelar', needExercise: 'Escolha a coluna de Exercício para continuar.',
    f_exercise: 'Exercício', f_day: 'Dia ou rotina', f_sets: 'Séries', f_reps: 'Repetições', f_rest_seconds: 'Descanso (segundos)', f_load: 'Carga', f_notes: 'Observações', f_superset_group: 'Grupo de superset', f_duration_seconds: 'Duração (segundos)',
    column: 'Coluna {0}',
  },
}
const pack = lang => (lang === 'pt' || lang === 'pt-BR' ? T.pt : T.en)

/** The text for `key` in the app's language (English when it has none), with {0} filled in. */
export function pt(key, ...args) {
  const s = pack(getLang())[key] ?? T.en[key] ?? key
  return s.replace(/\{(\d+)\}/g, (m, i) => (args[i] == null ? m : String(args[i])))
}
export const MAP_FIELDS = ['exercise', 'day', 'sets', 'reps', 'rest_seconds', 'load', 'notes', 'superset_group', 'duration_seconds']
export const PROGRAM_TEXT = T
