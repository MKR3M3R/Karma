// The words on the Nutrition screen, in English and Portuguese (pt also serves pt-BR); any other
// language shows the English until it is translated. Same approach as lib/mobility-ui.js: words
// the app already translates (Save, Delete, Done...) go through t() on the screen, only what is new
// lives here. The tone is a log's: numbers and options, never a verdict on what someone ate.
import { getLang } from './i18n-core.js'

const T = {
  en: {
    subtitle: 'Meals, water and plans',
    notice: 'A food diary and calculator, not medical or nutrition advice. For a diet that suits your health, ask a doctor or a registered dietitian.',
    tabToday: 'Today', tabFoods: 'Foods', tabPlans: 'Plans', tabTrends: 'Trends',
    slot_breakfast: 'Breakfast', slot_lunch: 'Lunch', slot_dinner: 'Dinner', slot_snack: 'Snack',
    addFood: 'Add food', nothingLogged: 'Nothing logged yet.', totals: 'Day total', kcal: 'kcal', protein: 'Protein', carbs: 'Carbs', fat: 'Fat', fiber: 'Fibre',
    ofTarget: 'of {0}', noTarget: 'No target set', setTargets: 'Targets and preferences',
    water: 'Water', glass: '+{0} ml', undo: '-{0} ml', ml: 'ml', waterOf: '{0} ml of {1} ml',
    logFromPlan: 'Log a plan for this day', planLogged: 'Plan added to this day', noPlans: 'No plans yet.',
    search: 'Search foods', searchButton: 'Search', lookingUp: 'Looking in food databases…', noFoodResults: 'No matching foods found.', someSourcesUnavailable: 'Some food databases could not be reached. You can try again or add the food manually.', dataSource: 'Data source', barcode: 'Barcode', fiberShort: 'fiber {0} g', fiberUnavailable: 'fiber data unavailable', yours: 'Yours', reference: 'Reference', per100: 'per 100 {0}',
    amount: 'Amount', unitG: 'grams', unitMl: 'millilitres', add: 'Add', adjust: 'Change amount', removeItem: 'Remove from meal', saved: 'Saved',
    newFood: 'New food', editFood: 'Edit food', foodName: 'Name', brand: 'Brand (optional)', baseUnit: 'Figures are per 100',
    errName: 'Give the food a name.', errNumbers: 'Fill in calories, protein, carbs and fat as numbers.', errTooMuch: 'Protein, carbs and fat together can’t pass 100 g in 100 g of food.',
    yourFoods: 'Your foods', yourFoodsEmpty: 'You haven’t added any food yet. Add the ones from your labels and they take priority in search.',
    referenceFoods: 'Reference foods', refNotice: 'Reference values are rounded, generic figures per 100 g or 100 ml, in line with general food-composition tables. Brands and cooking change them: when you have a label, add the food yourself.',
    deleteFood: 'Delete this food?', deleteFoodNote: 'Meals you already logged keep their numbers.',
    newPlan: 'New plan', editPlan: 'Edit plan', planName: 'Plan name', addMeal: 'Add a meal', planDay: 'One day',
    deletePlan: 'Delete this plan?', itemsN: '{0} items', shopping: 'Shopping list', shoppingDays: 'Days to shop for', copyList: 'Copy list', copied: 'List copied', shoppingEmpty: 'Add a plan to build a list.',
    range7: '7 days', range30: '30 days', range90: '90 days', avgOver: 'Average over {0} days with food logged', noData: 'Nothing logged in this period.',
    perDay: 'Calories per day', daysLogged: 'Days with food logged', waterAvg: 'Water (days with water logged)',
    exportData: 'Export', exportJson: 'All nutrition data (JSON)', exportCsv: 'Diary (CSV)', deleteAll: 'Delete all nutrition data', deleteAllAsk: 'Delete all nutrition data?',
    deleteAllNote: 'Foods, meals, water, plans and targets. Your workouts and body data stay.', deleted: 'Nutrition data deleted',
    profile: 'Targets and preferences', profileHint: 'All optional. Targets are your own numbers; Karma doesn’t set them for you and never counts a day as a failure.',
    goal: 'Goal', goal_maintain: 'Maintain', goal_lose: 'Lose weight', goal_gain: 'Gain weight', goalNone: 'None',
    tKcal: 'Calories per day', tP: 'Protein per day (g)', tC: 'Carbs per day (g)', tF: 'Fat per day (g)', tWater: 'Water per day (ml)',
    diet: 'Eating style', diet_vegetarian: 'Vegetarian', diet_vegan: 'Vegan', 'diet_gluten-free': 'Gluten-free', 'diet_lactose-free': 'Lactose-free',
    avoid: 'Foods to avoid', avoidHint: 'Separate with commas. Used to flag matches while you search.', avoidFlag: 'On your avoid list',
    cancel: 'Cancel', prevDay: 'Previous day', nextDay: 'Next day', today: 'Today',
  },
  pt: {
    subtitle: 'Refeições, água e planos',
    notice: 'Um diário alimentar e uma calculadora, não orientação médica nem nutricional. Para uma dieta adequada à sua saúde, consulte um médico ou nutricionista.',
    tabToday: 'Hoje', tabFoods: 'Alimentos', tabPlans: 'Planos', tabTrends: 'Evolução',
    slot_breakfast: 'Café da manhã', slot_lunch: 'Almoço', slot_dinner: 'Jantar', slot_snack: 'Lanche',
    addFood: 'Adicionar alimento', nothingLogged: 'Nada registrado ainda.', totals: 'Total do dia', kcal: 'kcal', protein: 'Proteína', carbs: 'Carboidratos', fat: 'Gordura', fiber: 'Fibras',
    ofTarget: 'de {0}', noTarget: 'Sem meta definida', setTargets: 'Metas e preferências',
    water: 'Água', glass: '+{0} ml', undo: '-{0} ml', ml: 'ml', waterOf: '{0} ml de {1} ml',
    logFromPlan: 'Registrar um plano neste dia', planLogged: 'Plano adicionado a este dia', noPlans: 'Nenhum plano ainda.',
    search: 'Buscar alimentos', searchButton: 'Buscar', lookingUp: 'Buscando em bancos de alimentos…', noFoodResults: 'Nenhum alimento correspondente encontrado.', someSourcesUnavailable: 'Não foi possível acessar alguns bancos de alimentos. Tente novamente ou cadastre o alimento manualmente.', dataSource: 'Fonte dos dados', barcode: 'Código de barras', fiberShort: 'fibras {0} g', fiberUnavailable: 'dados de fibras indisponíveis', yours: 'Seus', reference: 'Referência', per100: 'por 100 {0}',
    amount: 'Quantidade', unitG: 'gramas', unitMl: 'mililitros', add: 'Adicionar', adjust: 'Mudar quantidade', removeItem: 'Remover da refeição', saved: 'Salvo',
    newFood: 'Novo alimento', editFood: 'Editar alimento', foodName: 'Nome', brand: 'Marca (opcional)', baseUnit: 'Os valores são por 100',
    errName: 'Dê um nome ao alimento.', errNumbers: 'Preencha calorias, proteína, carboidratos e gordura com números.', errTooMuch: 'Proteína, carboidratos e gordura juntos não passam de 100 g em 100 g de alimento.',
    yourFoods: 'Seus alimentos', yourFoodsEmpty: 'Você ainda não cadastrou alimentos. Cadastre os dos seus rótulos e eles têm prioridade na busca.',
    referenceFoods: 'Alimentos de referência', refNotice: 'Os valores de referência são números genéricos e arredondados por 100 g ou 100 ml, em linha com tabelas gerais de composição de alimentos. Marcas e preparo mudam esses valores: quando tiver o rótulo, cadastre o alimento você mesmo.',
    deleteFood: 'Excluir este alimento?', deleteFoodNote: 'Refeições já registradas mantêm os valores.',
    newPlan: 'Novo plano', editPlan: 'Editar plano', planName: 'Nome do plano', addMeal: 'Adicionar refeição', planDay: 'Um dia',
    deletePlan: 'Excluir este plano?', itemsN: '{0} itens', shopping: 'Lista de compras', shoppingDays: 'Dias para comprar', copyList: 'Copiar lista', copied: 'Lista copiada', shoppingEmpty: 'Crie um plano para montar a lista.',
    range7: '7 dias', range30: '30 dias', range90: '90 dias', avgOver: 'Média de {0} dias com alimentos registrados', noData: 'Nada registrado neste período.',
    perDay: 'Calorias por dia', daysLogged: 'Dias com alimentos registrados', waterAvg: 'Água (dias com água registrada)',
    exportData: 'Exportar', exportJson: 'Todos os dados de nutrição (JSON)', exportCsv: 'Diário (CSV)', deleteAll: 'Excluir todos os dados de nutrição', deleteAllAsk: 'Excluir todos os dados de nutrição?',
    deleteAllNote: 'Alimentos, refeições, água, planos e metas. Seus treinos e dados corporais ficam.', deleted: 'Dados de nutrição excluídos',
    profile: 'Metas e preferências', profileHint: 'Tudo opcional. As metas são números seus; o Karma não define por você e nunca conta um dia como fracasso.',
    goal: 'Objetivo', goal_maintain: 'Manter', goal_lose: 'Perder peso', goal_gain: 'Ganhar peso', goalNone: 'Nenhum',
    tKcal: 'Calorias por dia', tP: 'Proteína por dia (g)', tC: 'Carboidratos por dia (g)', tF: 'Gordura por dia (g)', tWater: 'Água por dia (ml)',
    diet: 'Estilo alimentar', diet_vegetarian: 'Vegetariano', diet_vegan: 'Vegano', 'diet_gluten-free': 'Sem glúten', 'diet_lactose-free': 'Sem lactose',
    avoid: 'Alimentos a evitar', avoidHint: 'Separe por vírgulas. Serve para sinalizar resultados na busca.', avoidFlag: 'Na sua lista de evitar',
    cancel: 'Cancelar', prevDay: 'Dia anterior', nextDay: 'Próximo dia', today: 'Hoje',
  },
}

const pack = lang => (lang === 'pt' || lang === 'pt-BR' ? T.pt : T.en)

/** The Nutrition screen's text for `key` in the app's language (English when it has none), with {0}, {1} filled in. */
export function nt(key, ...args) {
  const s = pack(getLang())[key] ?? T.en[key] ?? key
  return s.replace(/\{(\d+)\}/g, (m, i) => (args[i] == null ? m : String(args[i])))
}

export const NUTRITION_TEXT = T
