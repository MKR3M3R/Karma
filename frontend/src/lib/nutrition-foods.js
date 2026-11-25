// A small starter list of common foods, so the diary is usable before you add your own.
//
// These are REFERENCE values: rounded, generic figures per 100 g (or 100 ml) of the food in the
// state named, in line with general food-composition tables such as USDA FoodData Central.
// They are not a verified database. Brands, ripeness and cooking change them, and a label beats
// this list. Foods you add yourself are marked as yours (lib/nutrition.js), and the two are never
// mixed up. Nothing here is a default for anyone: it is only offered when searching.
//
// Each row: [id, English, Portuguese, base, kcal, protein, carbs, fat, fibre?]
const ROWS = [
  ['rice-white', 'White rice, cooked', 'Arroz branco cozido', 'g', 130, 2.7, 28, 0.3, 0.4],
  ['rice-brown', 'Brown rice, cooked', 'Arroz integral cozido', 'g', 123, 2.7, 25.6, 1, 1.6],
  ['black-beans', 'Black beans, cooked', 'Feijão preto cozido', 'g', 132, 8.9, 23.7, 0.5, 8.7],
  ['lentils', 'Lentils, cooked', 'Lentilha cozida', 'g', 116, 9, 20.1, 0.4, 7.9],
  ['chickpeas', 'Chickpeas, cooked', 'Grão-de-bico cozido', 'g', 164, 8.9, 27.4, 2.6, 7.6],
  ['oats', 'Rolled oats, dry', 'Aveia em flocos', 'g', 379, 13.2, 67.7, 6.5, 10.1],
  ['quinoa', 'Quinoa, cooked', 'Quinoa cozida', 'g', 120, 4.4, 21.3, 1.9, 2.8],
  ['pasta', 'Pasta, cooked', 'Macarrão cozido', 'g', 158, 5.8, 30.9, 0.9, 1.8],
  ['bread-white', 'White bread', 'Pão branco', 'g', 265, 9, 49, 3.2, 2.7],
  ['bread-whole', 'Whole wheat bread', 'Pão integral', 'g', 252, 12.3, 42.7, 3.5, 6],
  ['potato', 'Potato, boiled', 'Batata cozida', 'g', 87, 1.9, 20.1, 0.1, 1.8],
  ['sweet-potato', 'Sweet potato, baked', 'Batata-doce assada', 'g', 90, 2, 20.7, 0.2, 3.3],
  ['cassava', 'Cassava, cooked', 'Mandioca cozida', 'g', 160, 1.4, 38.1, 0.3, 1.8],
  ['chicken-breast', 'Chicken breast, cooked, skinless', 'Peito de frango cozido, sem pele', 'g', 165, 31, 0, 3.6, 0],
  ['beef-ground', 'Ground beef, cooked', 'Carne moída cozida', 'g', 250, 25.9, 0, 15.4, 0],
  ['egg', 'Egg, boiled', 'Ovo cozido', 'g', 155, 12.6, 1.1, 10.6, 0],
  ['salmon', 'Salmon, cooked', 'Salmão cozido', 'g', 206, 22.1, 0, 12.4, 0],
  ['tuna', 'Tuna, canned in water', 'Atum em lata, ao natural', 'g', 116, 25.5, 0, 0.8, 0],
  ['milk-whole', 'Whole milk', 'Leite integral', 'ml', 61, 3.2, 4.8, 3.3, 0],
  ['milk-skim', 'Skim milk', 'Leite desnatado', 'ml', 34, 3.4, 5, 0.1, 0],
  ['yogurt', 'Plain yoghurt, whole milk', 'Iogurte natural integral', 'g', 61, 3.5, 4.7, 3.3, 0],
  ['cottage', 'Cottage cheese', 'Queijo cottage', 'g', 98, 11.1, 3.4, 4.3, 0],
  ['banana', 'Banana', 'Banana', 'g', 89, 1.1, 22.8, 0.3, 2.6],
  ['apple', 'Apple', 'Maçã', 'g', 52, 0.3, 13.8, 0.2, 2.4],
  ['orange', 'Orange', 'Laranja', 'g', 47, 0.9, 11.8, 0.1, 2.4],
  ['avocado', 'Avocado', 'Abacate', 'g', 160, 2, 8.5, 14.7, 6.7],
  ['broccoli', 'Broccoli, raw', 'Brócolis cru', 'g', 34, 2.8, 6.6, 0.4, 2.6],
  ['tomato', 'Tomato', 'Tomate', 'g', 18, 0.9, 3.9, 0.2, 1.2],
  ['carrot', 'Carrot', 'Cenoura', 'g', 41, 0.9, 9.6, 0.2, 2.8],
  ['lettuce', 'Lettuce', 'Alface', 'g', 15, 1.4, 2.9, 0.2, 1.3],
  ['olive-oil', 'Olive oil', 'Azeite de oliva', 'ml', 884, 0, 0, 100, 0],
  ['butter', 'Butter', 'Manteiga', 'g', 717, 0.9, 0.1, 81.1, 0],
  ['almonds', 'Almonds', 'Amêndoas', 'g', 579, 21.2, 21.6, 49.9, 12.5],
  ['peanuts', 'Peanuts', 'Amendoim', 'g', 567, 25.8, 16.1, 49.2, 8.5],
  ['peanut-butter', 'Peanut butter', 'Pasta de amendoim', 'g', 588, 25, 20, 50, 6],
  ['sugar', 'Sugar', 'Açúcar', 'g', 387, 0, 100, 0, 0],
]

export const REFERENCE_FOODS = ROWS.map(([id, en, pt, base, kcal, p, c, f, fiber]) => ({
  id: 'ref-' + id, src: 'reference', names: { en, pt }, name: en, base, kcal, p, c, f, fiber,
}))
const BY_ID = new Map(REFERENCE_FOODS.map(f => [f.id, f]))

/** A reference food by id (`ref-…`), or undefined. */
export const referenceFood = id => BY_ID.get(id)

/** The food's name in `lang` (pt also serves pt-BR); a food without translations keeps its own name. */
export const foodName = (food, lang) => (food.names && (lang === 'pt' || lang === 'pt-BR' ? food.names.pt : food.names.en)) || food.name

export const REFERENCE_NOTICE = {
  en: 'Reference values are rounded, generic figures per 100 g or 100 ml, in line with general food-composition tables. Brands and cooking change them: when you have a label, add the food yourself.',
  pt: 'Os valores de referência são números genéricos e arredondados por 100 g ou 100 ml, em linha com tabelas gerais de composição de alimentos. Marcas e preparo mudam esses valores: quando tiver o rótulo, cadastre o alimento você mesmo.',
}
