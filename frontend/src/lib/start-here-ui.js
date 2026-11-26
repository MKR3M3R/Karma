// The words on Home's "Make Karma yours" card, English and Portuguese (see lib/mobility-ui.js).
import { getLang } from './i18n-core.js'

const T = {
  en: {
    askTitle: 'Make Karma yours', askSub: 'Pick what you want to use. It takes a few seconds, you can change it any time, and nothing is required.',
    choose: 'Choose', notNow: 'Not now', pointTitle: 'Next up', pointSub: 'The parts you picked and have not tried yet.', putAway: 'Put this away',
    sheetTitle: 'What do you want to use?', sheetHint: 'Pick any, or none. Everything stays reachable from Stats either way.',
    area_training: 'Training', areaSub_training: 'Plan and log workouts.', area_mobility: 'Mobility', areaSub_mobility: 'Routines to move, stretch and recover.',
    area_nutrition: 'Nutrition', areaSub_nutrition: 'A food and water diary, plans and a shopping list.', area_goals: 'Goals', areaSub_goals: 'Your own targets and how the days add up.',
    level: 'Your level (optional)', levelHint: 'Used only to suggest mobility routines. You can change it later.',
    lvl_beginner: 'Beginner', lvl_intermediate: 'Intermediate', lvl_advanced: 'Advanced', save: 'Save', cancel: 'Cancel', saved: 'Saved',
  },
  pt: {
    askTitle: 'Deixe o Karma do seu jeito', askSub: 'Escolha o que quer usar. Leva poucos segundos, você muda quando quiser e nada é obrigatório.',
    choose: 'Escolher', notNow: 'Agora não', pointTitle: 'Próximos passos', pointSub: 'As partes que você escolheu e ainda não experimentou.', putAway: 'Guardar este cartão',
    sheetTitle: 'O que você quer usar?', sheetHint: 'Escolha quantas quiser, ou nenhuma. Tudo continua acessível em Estatísticas de qualquer forma.',
    area_training: 'Treino', areaSub_training: 'Planeje e registre treinos.', area_mobility: 'Mobilidade', areaSub_mobility: 'Rotinas para mover, alongar e recuperar.',
    area_nutrition: 'Nutrição', areaSub_nutrition: 'Diário de alimentos e água, planos e lista de compras.', area_goals: 'Metas', areaSub_goals: 'Seus próprios alvos e o que os dias somam.',
    level: 'Seu nível (opcional)', levelHint: 'Usado só para sugerir rotinas de mobilidade. Você pode mudar depois.',
    lvl_beginner: 'Iniciante', lvl_intermediate: 'Intermediário', lvl_advanced: 'Avançado', save: 'Salvar', cancel: 'Cancelar', saved: 'Salvo',
  },
}
const pack = lang => (lang === 'pt' || lang === 'pt-BR' ? T.pt : T.en)

/** The card's text for `key` in the app's language (English when it has none). */
export const st = key => pack(getLang())[key] ?? T.en[key] ?? key
export const START_TEXT = T
