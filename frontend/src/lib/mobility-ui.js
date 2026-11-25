// The words on the Mobility screen. Kept beside the mobility library, in English and Portuguese
// (pt also serves pt-BR); any other language shows the English until it is translated. Words the
// app already translates elsewhere (Save, Delete, Start, Sessions...) go through t() on the screen;
// only what is new lives here, so adding a language later is one table, not a change in 25 packs.
import { getLang } from './i18n-core.js'

const T = {
  en: {
    subtitle: 'Move, stretch and recover',
    notice: 'Mobility work is general guidance, not treatment. Stop if something hurts, and see a doctor or physiotherapist for pain, numbness, dizziness or a recent injury.',
    tabRoutines: 'Routines', tabLibrary: 'Library', tabProgress: 'Progress',
    ready: 'Ready-made routines', mine: 'Your routines', mineEmpty: 'No routine of your own yet. Start from a ready-made one and edit it, or build one from the library.',
    newRoutine: 'New routine', editRoutine: 'Edit routine', routineName: 'Routine name', addExercises: 'Add exercises', suggest: 'Suggest for me',
    about: 'About {0} min', exercisesN: '{0} exercises', empty: 'Nothing here yet.', up: 'Move up', down: 'Move down', remove: 'Remove',
    startPos: 'Starting position', mistakes: 'Common mistakes', caution: 'Caution', easier: 'Easier', harder: 'Harder', steps: 'Steps',
    addToRoutine: 'Add to a routine', added: 'Added to {0}', allAreas: 'All areas', allTypes: 'All types', allLevels: 'All levels', noMatch: 'Nothing matches. Loosen a filter.',
    reps: '{0} reps', sec: '{0} sec', eachSide: 'each side', sets: '{0} sets',
    stepOf: 'Exercise {0} of {1}', hold: 'Hold', markDone: 'Done', skip: 'Skip', next: 'Next', finish: 'Finish', cancel: 'Cancel',
    howHard: 'How hard did it feel?', e1: 'Very easy', e2: 'Easy', e3: 'Just right', e4: 'Hard', e5: 'Very hard',
    rom: 'Range of motion (optional)', romHint: 'A number you can measure the same way each time, such as the angle in degrees or how far you reach in cm.',
    value: 'Value', unitDeg: 'degrees', unitCm: 'cm', unitIn: 'in', note: 'Note', saved: 'Session saved', noneDone: 'Mark at least one exercise as done.',
    minutesDone: 'Minutes', sessionsN: '{0} sessions',
    week: 'This week', month: 'This month', daysWeek: 'Days with a session, last {0} weeks', mostDone: 'Most done', romTitle: 'Range of motion over time',
    romChange: 'Change since the first reading: {0} {1}', noSessions: 'No sessions yet. Finish a routine and it shows up here.', avgEffort: 'Average effort',
    exercisesDone: 'Exercises done', days: 'Days', sessions: 'Sessions', minutes: 'Minutes', history: 'History', deleteSession: 'Remove this session?',
    profile: 'Your preferences', level: 'Your level', focus: 'Areas to work on', avoid: 'Areas to leave out', avoidHint: 'Optional. Exercises that load these areas are left out of suggestions.',
    time: 'Time available', profileHint: 'All optional. They only shape what is suggested, and stay on this device and your account.',
    done: 'Done', confirmDelete: 'Delete this routine?', fromPreset: 'Start from "{0}"', renamed: 'Saved',
    'cat.joint-mobility': 'Joint mobility', 'cat.static-flexibility': 'Static flexibility', 'cat.dynamic-flexibility': 'Dynamic flexibility',
    'cat.stretching': 'Stretching', 'cat.joint-stability': 'Joint stability', 'cat.motor-control': 'Motor control', 'cat.balance': 'Balance',
    'cat.coordination': 'Coordination', 'cat.body-awareness': 'Body awareness', 'cat.activation': 'Muscle activation',
    'cat.recovery': 'Recovery and relaxation', 'cat.preparation': 'Preparation for activity',
    'reg.neck': 'Neck', 'reg.shoulders': 'Shoulders', 'reg.thoracic': 'Upper back', 'reg.lumbar': 'Lower back', 'reg.hips': 'Hips',
    'reg.knees': 'Knees', 'reg.ankles': 'Ankles', 'reg.feet': 'Feet', 'reg.wrists': 'Wrists', 'reg.elbows': 'Elbows',
    'lvl.beginner': 'Beginner', 'lvl.intermediate': 'Intermediate', 'lvl.advanced': 'Advanced',
    'preset.morning': 'Morning routine', 'preset.beginner': 'Mobility for beginners', 'preset.general': 'General mobility', 'preset.prep': 'Before exercise',
    'preset.recover': 'After exercise', 'preset.desk': 'Desk break', 'preset.flex': 'Flexibility', 'preset.relax': 'Wind down',
    moduleDesc: 'Mobility and flexibility routines for anyone, with a library of exercises and your own history.',
  },
  pt: {
    subtitle: 'Mova-se, alongue e recupere',
    notice: 'Mobilidade é orientação geral, não tratamento. Pare se algo doer e procure um médico ou fisioterapeuta em caso de dor, formigamento, tontura ou lesão recente.',
    tabRoutines: 'Rotinas', tabLibrary: 'Biblioteca', tabProgress: 'Progresso',
    ready: 'Rotinas prontas', mine: 'Suas rotinas', mineEmpty: 'Você ainda não tem rotinas próprias. Comece por uma pronta e edite, ou monte uma pela biblioteca.',
    newRoutine: 'Nova rotina', editRoutine: 'Editar rotina', routineName: 'Nome da rotina', addExercises: 'Adicionar exercícios', suggest: 'Sugerir para mim',
    about: 'Cerca de {0} min', exercisesN: '{0} exercícios', empty: 'Nada por aqui ainda.', up: 'Subir', down: 'Descer', remove: 'Remover',
    startPos: 'Posição inicial', mistakes: 'Erros comuns', caution: 'Cuidado', easier: 'Mais fácil', harder: 'Mais difícil', steps: 'Passos',
    addToRoutine: 'Adicionar a uma rotina', added: 'Adicionado a {0}', allAreas: 'Todas as áreas', allTypes: 'Todos os tipos', allLevels: 'Todos os níveis', noMatch: 'Nada corresponde. Afrouxe um filtro.',
    reps: '{0} repetições', sec: '{0} s', eachSide: 'cada lado', sets: '{0} séries',
    stepOf: 'Exercício {0} de {1}', hold: 'Segure', markDone: 'Feito', skip: 'Pular', next: 'Próximo', finish: 'Concluir', cancel: 'Cancelar',
    howHard: 'Quão difícil foi?', e1: 'Muito fácil', e2: 'Fácil', e3: 'No ponto', e4: 'Difícil', e5: 'Muito difícil',
    rom: 'Amplitude de movimento (opcional)', romHint: 'Um número que você consiga medir sempre do mesmo jeito, como o ângulo em graus ou até onde alcança em cm.',
    value: 'Valor', unitDeg: 'graus', unitCm: 'cm', unitIn: 'pol', note: 'Observação', saved: 'Sessão salva', noneDone: 'Marque pelo menos um exercício como feito.',
    minutesDone: 'Minutos', sessionsN: '{0} sessões',
    week: 'Esta semana', month: 'Este mês', daysWeek: 'Dias com sessão, últimas {0} semanas', mostDone: 'Mais feitos', romTitle: 'Amplitude de movimento ao longo do tempo',
    romChange: 'Variação desde a primeira medição: {0} {1}', noSessions: 'Nenhuma sessão ainda. Conclua uma rotina e ela aparece aqui.', avgEffort: 'Esforço médio',
    exercisesDone: 'Exercícios feitos', days: 'Dias', sessions: 'Sessões', minutes: 'Minutos', history: 'Histórico', deleteSession: 'Remover esta sessão?',
    profile: 'Suas preferências', level: 'Seu nível', focus: 'Áreas para trabalhar', avoid: 'Áreas para evitar', avoidHint: 'Opcional. Exercícios que exigem essas áreas ficam fora das sugestões.',
    time: 'Tempo disponível', profileHint: 'Tudo opcional. Só molda o que é sugerido e fica neste aparelho e na sua conta.',
    done: 'Feito', confirmDelete: 'Excluir esta rotina?', fromPreset: 'Começar de "{0}"', renamed: 'Salvo',
    'cat.joint-mobility': 'Mobilidade articular', 'cat.static-flexibility': 'Flexibilidade estática', 'cat.dynamic-flexibility': 'Flexibilidade dinâmica',
    'cat.stretching': 'Alongamentos', 'cat.joint-stability': 'Estabilidade articular', 'cat.motor-control': 'Controle motor', 'cat.balance': 'Equilíbrio',
    'cat.coordination': 'Coordenação', 'cat.body-awareness': 'Consciência corporal', 'cat.activation': 'Ativação muscular',
    'cat.recovery': 'Recuperação e relaxamento', 'cat.preparation': 'Preparação para atividades',
    'reg.neck': 'Pescoço', 'reg.shoulders': 'Ombros', 'reg.thoracic': 'Parte alta das costas', 'reg.lumbar': 'Lombar', 'reg.hips': 'Quadris',
    'reg.knees': 'Joelhos', 'reg.ankles': 'Tornozelos', 'reg.feet': 'Pés', 'reg.wrists': 'Punhos', 'reg.elbows': 'Cotovelos',
    'lvl.beginner': 'Iniciante', 'lvl.intermediate': 'Intermediário', 'lvl.advanced': 'Avançado',
    'preset.morning': 'Rotina matinal', 'preset.beginner': 'Mobilidade para iniciantes', 'preset.general': 'Mobilidade geral', 'preset.prep': 'Antes do exercício',
    'preset.recover': 'Depois do exercício', 'preset.desk': 'Pausa na mesa de trabalho', 'preset.flex': 'Flexibilidade', 'preset.relax': 'Desacelerar',
    moduleDesc: 'Rotinas de mobilidade e flexibilidade para qualquer pessoa, com biblioteca de exercícios e seu próprio histórico.',
  },
}

const pack = lang => (lang === 'pt' || lang === 'pt-BR' ? T.pt : T.en)

/** The Mobility screen's text for `key` in the app's language (English when it has none), with {0}, {1} filled in. */
export function mt(key, ...args) {
  const s = pack(getLang())[key] ?? T.en[key] ?? key
  return s.replace(/\{(\d+)\}/g, (m, i) => (args[i] == null ? m : String(args[i])))
}

export const MOBILITY_TEXT = T
