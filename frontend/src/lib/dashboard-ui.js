// The words on Home's "Today" card for nutrition and mobility, English and Portuguese (see
// lib/mobility-ui.js for the approach; other languages show English).
import { getLang } from './i18n-core.js'

const T = {
  en: {
    title: 'Beyond the lifts', eyebrow: 'Today',
    meals: 'Meals', mealsNone: 'Nothing logged today', water: 'Water', ofTarget: 'of {0}',
    mobility: 'Mobility', mobilityWeek: '{0} days with a session in the last 7', mobilityToday: 'Done today', mobilityLast: 'Last session {0}',
    windDown: 'Wind down after training', windDownSub: 'A short recovery routine is a tap away.',
  },
  pt: {
    title: 'Além dos treinos', eyebrow: 'Hoje',
    meals: 'Refeições', mealsNone: 'Nada registrado hoje', water: 'Água', ofTarget: 'de {0}',
    mobility: 'Mobilidade', mobilityWeek: '{0} dias com sessão nos últimos 7', mobilityToday: 'Feita hoje', mobilityLast: 'Última sessão {0}',
    windDown: 'Desacelerar depois do treino', windDownSub: 'Uma rotina curta de recuperação a um toque.',
  },
}
const pack = lang => (lang === 'pt' || lang === 'pt-BR' ? T.pt : T.en)

/** Home's extras text for `key` in the app's language (English when it has none), with {0} filled in. */
export function dt(key, ...args) {
  const s = pack(getLang())[key] ?? T.en[key] ?? key
  return s.replace(/\{(\d+)\}/g, (m, i) => (args[i] == null ? m : String(args[i])))
}
export const DASHBOARD_TEXT = T
