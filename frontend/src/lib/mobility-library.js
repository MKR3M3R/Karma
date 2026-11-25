// The mobility library: joint mobility, flexibility, stability, balance and recovery work that
// anyone can do, with no equipment and no particular sport in mind. Written for this app (not
// taken from a database), so it has no media and no licence to carry.
//
// Each exercise: { id, cat, regions, level, tags, dose, text: { en, pt } } where a text is
//   [name, description, startingPosition, steps[], commonMistakes[], caution, easier, harder]
// `pt` is Brazilian Portuguese and also serves pt-PT; any other language shows the English text.
//
// `dose` is { sec } for a hold or { reps } for a movement; `sides: true` means it is done on each
// side. `tags` say when it fits: warmup, cooldown, morning, desk, evening.
//
// This is general movement guidance, not treatment: pain, numbness or a recent injury is a reason
// to see a professional first (the screen says so; see MOBILITY_NOTICE).

export const MOBILITY_CATEGORIES = [
  'joint-mobility', 'static-flexibility', 'dynamic-flexibility', 'stretching', 'joint-stability',
  'motor-control', 'balance', 'coordination', 'body-awareness', 'activation', 'recovery', 'preparation',
]
export const MOBILITY_REGIONS = ['neck', 'shoulders', 'thoracic', 'lumbar', 'hips', 'knees', 'ankles', 'feet', 'wrists', 'elbows']
export const MOBILITY_LEVELS = ['beginner', 'intermediate', 'advanced']
export const MOBILITY_TAGS = ['warmup', 'cooldown', 'morning', 'desk', 'evening']

// English names; the screen puts them through t().
export const CATEGORY_LABEL = {
  'joint-mobility': 'Joint mobility', 'static-flexibility': 'Static flexibility', 'dynamic-flexibility': 'Dynamic flexibility',
  stretching: 'Stretching', 'joint-stability': 'Joint stability', 'motor-control': 'Motor control', balance: 'Balance',
  coordination: 'Coordination', 'body-awareness': 'Body awareness', activation: 'Muscle activation',
  recovery: 'Recovery and relaxation', preparation: 'Preparation for activity',
}
export const REGION_LABEL = {
  neck: 'Neck', shoulders: 'Shoulders', thoracic: 'Upper back', lumbar: 'Lower back', hips: 'Hips', knees: 'Knees',
  ankles: 'Ankles', feet: 'Feet', wrists: 'Wrists', elbows: 'Elbows',
}
export const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

const E = (id, cat, regions, level, tags, dose, en, pt) => ({ id: 'mob-' + id, cat, regions, level, tags, dose, text: { en, pt } })

export const MOBILITY_EXERCISES = [
  E('neck-rotations', 'joint-mobility', ['neck'], 'beginner', ['morning', 'desk'], { reps: 8, sides: true }, [
    'Neck rotations', 'Slow turns of the head to each side to keep the neck moving.',
    'Sit or stand tall, shoulders relaxed, eyes forward.',
    ['Turn your head to the right as far as is comfortable.', 'Pause for a breath.', 'Return to the middle and turn to the left.'],
    ['Lifting the shoulders toward the ears', 'Forcing the turn past the comfortable range'],
    'Stop if you feel dizziness, tingling or sharp pain.', 'Make the turn smaller and slower.', 'Add a small look-up and look-down at the end of each turn.',
  ], [
    'Rotações do pescoço', 'Giros lentos da cabeça para cada lado para manter o pescoço em movimento.',
    'Sente ou fique em pé com a coluna alta, ombros soltos e olhos à frente.',
    ['Gire a cabeça para a direita até onde for confortável.', 'Pause por uma respiração.', 'Volte ao centro e gire para a esquerda.'],
    ['Levantar os ombros em direção às orelhas', 'Forçar o giro além do que é confortável'],
    'Pare se sentir tontura, formigamento ou dor aguda.', 'Faça o giro menor e mais lento.', 'Acrescente um pequeno olhar para cima e para baixo no fim de cada giro.',
  ]),
  E('neck-side-stretch', 'stretching', ['neck', 'shoulders'], 'beginner', ['desk', 'evening'], { sec: 30, sides: true }, [
    'Neck side stretch', 'A gentle stretch along the side of the neck.',
    'Sit tall with both shoulders low.',
    ['Tilt your right ear toward your right shoulder.', 'Let the weight of the head do the work, without pulling.', 'Breathe slowly, then change sides.'],
    ['Pulling the head with the hand', 'Raising the opposite shoulder'],
    'It should feel like a mild stretch, never pain or tingling down the arm.', 'Tilt less and keep the hands resting in your lap.', 'Reach the opposite hand toward the floor.',
  ], [
    'Alongamento lateral do pescoço', 'Um alongamento suave ao longo do lado do pescoço.',
    'Sente com a coluna alta e os dois ombros baixos.',
    ['Incline a orelha direita em direção ao ombro direito.', 'Deixe o peso da cabeça trabalhar, sem puxar.', 'Respire devagar e troque de lado.'],
    ['Puxar a cabeça com a mão', 'Levantar o ombro do lado oposto'],
    'Deve parecer um alongamento leve, nunca dor ou formigamento no braço.', 'Incline menos e deixe as mãos descansando no colo.', 'Estenda a mão oposta em direção ao chão.',
  ]),
  E('shoulder-circles', 'joint-mobility', ['shoulders'], 'beginner', ['warmup', 'morning', 'desk'], { reps: 10, sides: false }, [
    'Shoulder circles', 'Large, slow circles that move the shoulder joint through its range.',
    'Stand tall with your arms hanging loose.',
    ['Draw a big circle with both shoulders: up, back, down.', 'Keep the movement slow and smooth.', 'After half of the reps, reverse the direction.'],
    ['Making tiny, quick circles', 'Arching the lower back'],
    'Skip any part of the circle that pinches the shoulder.', 'Do one shoulder at a time.', 'Hold your arms out to the sides and circle them as well.',
  ], [
    'Círculos de ombro', 'Círculos grandes e lentos que movem a articulação do ombro em toda a amplitude.',
    'Fique em pé com a coluna alta e os braços soltos.',
    ['Desenhe um círculo grande com os dois ombros: para cima, para trás, para baixo.', 'Mantenha o movimento lento e contínuo.', 'Na metade das repetições, inverta o sentido.'],
    ['Fazer círculos pequenos e rápidos', 'Arquear a lombar'],
    'Evite a parte do círculo que causar beliscão no ombro.', 'Faça um ombro de cada vez.', 'Estenda os braços para os lados e faça os círculos também com eles.',
  ]),
  E('wall-slides', 'motor-control', ['shoulders', 'thoracic'], 'beginner', ['warmup', 'desk'], { reps: 10 }, [
    'Wall slides', 'Slide the arms up a wall to train smooth shoulder blade movement.',
    'Stand with your back, head and hips near a wall, elbows bent and the backs of your hands on the wall.',
    ['Slide your arms up the wall as high as you can without lifting your ribs.', 'Keep your hands and forearms in light contact with the wall.', 'Slide back down with control.'],
    ['Flaring the ribs forward', 'Shrugging as the arms go up'],
    'Reduce the height if the front of the shoulder pinches.', 'Move only through the pain-free height.', 'Do it lying on the floor, keeping the lower back flat.',
  ], [
    'Deslizamento na parede', 'Deslize os braços pela parede para treinar o movimento suave das escápulas.',
    'Fique de costas para a parede, com cabeça e quadril próximos a ela, cotovelos dobrados e as costas das mãos na parede.',
    ['Deslize os braços para cima o quanto conseguir sem levantar as costelas.', 'Mantenha mãos e antebraços em leve contato com a parede.', 'Desça com controle.'],
    ['Projetar as costelas para a frente', 'Encolher os ombros ao subir os braços'],
    'Reduza a altura se a frente do ombro beliscar.', 'Faça apenas até a altura sem dor.', 'Faça deitado no chão, mantendo a lombar apoiada.',
  ]),
  E('doorway-chest-stretch', 'static-flexibility', ['shoulders', 'elbows'], 'beginner', ['desk', 'cooldown'], { sec: 30, sides: true }, [
    'Doorway chest stretch', 'A held stretch for the front of the chest and shoulder.',
    'Stand in a doorway with your forearm on the frame, elbow at about shoulder height.',
    ['Step one foot forward until you feel a stretch across the chest.', 'Keep the ribs down and the shoulder relaxed.', 'Hold, breathing slowly, then change sides.'],
    ['Leaning too far forward', 'Letting the lower back arch'],
    'Ease off if you feel tingling in the hand or a pinch at the front of the shoulder.', 'Place the elbow lower than the shoulder.', 'Turn your body gently away from the arm.',
  ], [
    'Alongamento de peitoral no batente', 'Um alongamento mantido para a frente do peito e do ombro.',
    'Fique em um batente de porta com o antebraço apoiado no batente, cotovelo na altura do ombro.',
    ['Dê um passo à frente até sentir o alongamento no peito.', 'Mantenha as costelas baixas e o ombro relaxado.', 'Segure respirando devagar e depois troque de lado.'],
    ['Inclinar-se demais para a frente', 'Deixar a lombar arquear'],
    'Alivie se sentir formigamento na mão ou beliscão na frente do ombro.', 'Apoie o cotovelo abaixo da altura do ombro.', 'Gire o corpo suavemente para longe do braço.',
  ]),
  E('cat-cow', 'joint-mobility', ['thoracic', 'lumbar'], 'beginner', ['warmup', 'morning'], { reps: 10 }, [
    'Cat-cow', 'Alternate rounding and arching the spine to move it one segment at a time.',
    'On hands and knees, wrists under shoulders and knees under hips.',
    ['Breathe in and let the belly drop as you lift the chest and tailbone.', 'Breathe out and round the back, tucking the chin and tailbone.', 'Move slowly, as if each vertebra moved in turn.'],
    ['Moving only the lower back', 'Rushing through the movement'],
    'Keep the range small if you feel pressure in the wrists or knees; a pad under the knees helps.', 'Do it seated on a chair, with the hands on the knees.', 'Add a slow hip shift side to side at each end.',
  ], [
    'Gato-vaca', 'Alterne arredondar e arquear a coluna para movê-la segmento por segmento.',
    'Em quatro apoios, punhos sob os ombros e joelhos sob o quadril.',
    ['Inspire deixando a barriga descer enquanto levanta o peito e o cóccix.', 'Expire arredondando as costas, recolhendo o queixo e o cóccix.', 'Mova-se devagar, como se cada vértebra se movesse em sequência.'],
    ['Mover só a lombar', 'Fazer o movimento com pressa'],
    'Faça uma amplitude menor se sentir pressão nos punhos ou joelhos; um apoio sob os joelhos ajuda.', 'Faça sentado em uma cadeira, com as mãos nos joelhos.', 'Acrescente um deslocamento lento do quadril para os lados em cada extremo.',
  ]),
  E('open-book', 'joint-mobility', ['thoracic', 'shoulders'], 'beginner', ['warmup', 'evening'], { reps: 8, sides: true }, [
    'Open book rotation', 'Rotate the upper back while lying on your side.',
    'Lie on your side with knees bent at 90 degrees and arms straight in front of you, palms together.',
    ['Lift the top arm and open it to the other side, following the hand with your eyes.', 'Keep the knees stacked and together.', 'Come back slowly and repeat, then change sides.'],
    ['Letting the knees fall apart', 'Forcing the arm toward the floor'],
    'Stay within a comfortable range; the stretch should be in the upper back, not the lower back.', 'Place a cushion under the head.', 'Hold the open position for three breaths.',
  ], [
    'Rotação do livro aberto', 'Gire a parte alta das costas deitado de lado.',
    'Deite de lado com os joelhos dobrados a 90 graus e os braços estendidos à frente, palmas juntas.',
    ['Levante o braço de cima e abra-o para o outro lado, acompanhando a mão com os olhos.', 'Mantenha os joelhos juntos e empilhados.', 'Volte devagar e repita, depois troque de lado.'],
    ['Deixar os joelhos se afastarem', 'Forçar o braço em direção ao chão'],
    'Fique em uma amplitude confortável; o alongamento deve estar na parte alta das costas, não na lombar.', 'Coloque uma almofada sob a cabeça.', 'Segure a posição aberta por três respirações.',
  ]),
  E('childs-pose', 'recovery', ['lumbar', 'hips', 'shoulders'], 'beginner', ['cooldown', 'evening'], { sec: 45 }, [
    'Child’s pose', 'A restful position that lets the back, hips and shoulders soften.',
    'Kneel with your knees apart and your big toes together, sitting back toward your heels.',
    ['Fold forward and rest your arms on the floor in front of you.', 'Let your forehead rest down and your shoulders drop.', 'Breathe slowly into the back of your ribs.'],
    ['Holding the breath', 'Forcing the hips down'],
    'Place a cushion between hips and heels, or under the knees, if the position is uncomfortable.', 'Rest your head on stacked fists or a pillow.', 'Walk the hands to one side to feel the opposite flank stretch.',
  ], [
    'Postura da criança', 'Uma posição de descanso que deixa costas, quadril e ombros relaxarem.',
    'Ajoelhe com os joelhos afastados e os dedões dos pés juntos, sentando para trás em direção aos calcanhares.',
    ['Incline-se para a frente e apoie os braços no chão à sua frente.', 'Deixe a testa descansar e os ombros caírem.', 'Respire devagar para a parte de trás das costelas.'],
    ['Prender a respiração', 'Forçar o quadril para baixo'],
    'Coloque uma almofada entre o quadril e os calcanhares, ou sob os joelhos, se a posição incomodar.', 'Apoie a cabeça nos punhos empilhados ou em um travesseiro.', 'Caminhe com as mãos para um lado para sentir o alongamento no flanco oposto.',
  ]),
  E('pelvic-tilts', 'body-awareness', ['lumbar', 'hips'], 'beginner', ['morning', 'evening'], { reps: 12 }, [
    'Pelvic tilts', 'Small rocking movements of the pelvis to feel and control the lower back.',
    'Lie on your back with knees bent and feet flat on the floor.',
    ['Breathe out and gently flatten your lower back toward the floor.', 'Breathe in and let a small curve return.', 'Keep the movement small and smooth.'],
    ['Pushing with the legs or lifting the hips high', 'Holding the breath'],
    'Keep the range small if the lower back is sore.', 'Do it with a hand under the lower back to feel the contact change.', 'Lift the hips a little at the end of each tilt.',
  ], [
    'Inclinações pélvicas', 'Pequenos movimentos de balanço da pelve para perceber e controlar a lombar.',
    'Deite de costas com os joelhos dobrados e os pés apoiados no chão.',
    ['Expire e achate suavemente a lombar em direção ao chão.', 'Inspire e deixe uma pequena curva voltar.', 'Mantenha o movimento pequeno e suave.'],
    ['Empurrar com as pernas ou levantar muito o quadril', 'Prender a respiração'],
    'Mantenha a amplitude pequena se a lombar estiver dolorida.', 'Faça com uma mão sob a lombar para sentir a mudança de contato.', 'Eleve um pouco o quadril ao fim de cada inclinação.',
  ]),
  E('dead-bug', 'motor-control', ['lumbar', 'hips'], 'intermediate', ['warmup'], { reps: 8, sides: true }, [
    'Dead bug', 'Move arms and legs while keeping the trunk still and the lower back steady.',
    'Lie on your back with hips and knees bent at 90 degrees and arms pointing to the ceiling.',
    ['Breathe out and slowly lower the right arm overhead and the left leg toward the floor.', 'Keep the lower back in light contact with the floor.', 'Come back and repeat on the other side.'],
    ['Letting the lower back arch off the floor', 'Moving too fast'],
    'Reduce the range of the arm and leg if the lower back lifts.', 'Move only the legs, one at a time, with the arms still.', 'Hold a light weight in each hand.',
  ], [
    'Dead bug', 'Mova braços e pernas mantendo o tronco parado e a lombar estável.',
    'Deite de costas com quadril e joelhos dobrados a 90 graus e os braços apontando para o teto.',
    ['Expire e abaixe devagar o braço direito acima da cabeça e a perna esquerda em direção ao chão.', 'Mantenha a lombar em leve contato com o chão.', 'Volte e repita do outro lado.'],
    ['Deixar a lombar descolar do chão', 'Mover rápido demais'],
    'Reduza a amplitude de braço e perna se a lombar subir.', 'Mova só as pernas, uma de cada vez, com os braços parados.', 'Segure um peso leve em cada mão.',
  ]),
  E('bird-dog', 'joint-stability', ['lumbar', 'hips', 'shoulders'], 'beginner', ['warmup'], { reps: 8, sides: true }, [
    'Bird dog', 'Reach one arm and the opposite leg while holding the trunk steady.',
    'On hands and knees, wrists under shoulders, knees under hips, back neutral.',
    ['Slowly extend the right arm forward and the left leg back.', 'Keep the hips and shoulders level, as if balancing a cup on your back.', 'Pause, return, and switch sides.'],
    ['Twisting the hips open', 'Lifting the leg higher than the back'],
    'Pad the knees if they are sensitive.', 'Lift only the leg, or only the arm.', 'Draw the elbow and knee together under the body between reps.',
  ], [
    'Bird dog', 'Estenda um braço e a perna oposta mantendo o tronco firme.',
    'Em quatro apoios, punhos sob os ombros, joelhos sob o quadril e coluna neutra.',
    ['Estenda devagar o braço direito para a frente e a perna esquerda para trás.', 'Mantenha quadril e ombros nivelados, como se equilibrasse um copo nas costas.', 'Pause, volte e troque de lado.'],
    ['Abrir o quadril girando', 'Levantar a perna acima da linha das costas'],
    'Use um apoio sob os joelhos se forem sensíveis.', 'Levante só a perna, ou só o braço.', 'Aproxime cotovelo e joelho sob o corpo entre as repetições.',
  ]),
  E('hip-90-90', 'joint-mobility', ['hips', 'knees'], 'intermediate', ['warmup', 'evening'], { reps: 6, sides: true }, [
    'Hip 90/90 switches', 'Rotate the hips from one side to the other while seated.',
    'Sit on the floor with both knees bent at 90 degrees, legs falling to the same side, hands behind you.',
    ['Lift the knees and swing them to the other side.', 'Keep your chest tall and move slowly.', 'Pause at each side, then switch again.'],
    ['Leaning back and dropping the spine', 'Forcing the knees to the floor'],
    'If the knees complain, reduce the range or sit on a cushion.', 'Sit on a cushion and keep the hands on the floor.', 'Lean the trunk over the front shin at each side.',
  ], [
    'Troca de quadril 90/90', 'Gire o quadril de um lado para o outro sentado.',
    'Sente no chão com os dois joelhos dobrados a 90 graus, pernas caídas para o mesmo lado e mãos atrás do corpo.',
    ['Levante os joelhos e leve-os para o outro lado.', 'Mantenha o peito alto e mova-se devagar.', 'Pause em cada lado e troque de novo.'],
    ['Inclinar-se para trás e deixar a coluna cair', 'Forçar os joelhos ao chão'],
    'Se os joelhos reclamarem, reduza a amplitude ou sente em uma almofada.', 'Sente em uma almofada e apoie as mãos no chão.', 'Incline o tronco sobre a canela da frente em cada lado.',
  ]),
  E('hip-flexor-stretch', 'stretching', ['hips'], 'beginner', ['desk', 'cooldown', 'evening'], { sec: 40, sides: true }, [
    'Kneeling hip flexor stretch', 'A stretch for the front of the hip, helpful after long periods of sitting.',
    'Kneel on one knee with the other foot in front, both knees at about 90 degrees; pad the kneeling knee.',
    ['Tuck the tailbone under slightly.', 'Shift your weight forward until you feel a stretch at the front of the back hip.', 'Hold, breathing slowly, then change sides.'],
    ['Arching the lower back', 'Letting the front knee fall inward'],
    'The stretch should be at the front of the hip; ease off if you feel it in the lower back or knee.', 'Reduce the forward shift and hold a chair for balance.', 'Raise the arm on the back-leg side and lean slightly away.',
  ], [
    'Alongamento do flexor do quadril ajoelhado', 'Um alongamento para a frente do quadril, útil depois de muito tempo sentado.',
    'Ajoelhe em um joelho com o outro pé à frente, ambos os joelhos a cerca de 90 graus; proteja o joelho de apoio.',
    ['Recolha levemente o cóccix para baixo.', 'Desloque o peso para a frente até sentir o alongamento na frente do quadril de trás.', 'Segure respirando devagar e depois troque de lado.'],
    ['Arquear a lombar', 'Deixar o joelho da frente cair para dentro'],
    'O alongamento deve ser na frente do quadril; alivie se sentir na lombar ou no joelho.', 'Reduza o deslocamento para a frente e segure em uma cadeira para se equilibrar.', 'Levante o braço do lado da perna de trás e incline-se levemente para longe.',
  ]),
  E('hamstring-stretch', 'stretching', ['hips', 'knees'], 'beginner', ['cooldown', 'evening'], { sec: 30, sides: true }, [
    'Lying hamstring stretch', 'A stretch for the back of the thigh, done lying down so the back stays relaxed.',
    'Lie on your back, one leg bent with the foot on the floor, the other leg raised.',
    ['Hold behind the raised thigh (or use a towel around the foot).', 'Gently straighten the knee until you feel a stretch at the back of the thigh.', 'Hold, breathing slowly, then change sides.'],
    ['Pulling hard until it hurts', 'Lifting the hips off the floor'],
    'A mild stretch is the goal; stop at any sharp pain or tingling down the leg.', 'Keep the knee bent a little.', 'Pull the toes toward you for a little more stretch.',
  ], [
    'Alongamento de posterior deitado', 'Um alongamento da parte de trás da coxa, feito deitado para a lombar ficar relaxada.',
    'Deite de costas, uma perna dobrada com o pé no chão e a outra levantada.',
    ['Segure atrás da coxa levantada (ou use uma toalha em volta do pé).', 'Estenda suavemente o joelho até sentir o alongamento atrás da coxa.', 'Segure respirando devagar e depois troque de lado.'],
    ['Puxar com força até doer', 'Tirar o quadril do chão'],
    'O objetivo é um alongamento leve; pare diante de dor aguda ou formigamento na perna.', 'Mantenha o joelho um pouco dobrado.', 'Puxe os dedos dos pés em sua direção para alongar um pouco mais.',
  ]),
  E('glute-bridge', 'activation', ['hips', 'lumbar'], 'beginner', ['warmup', 'morning'], { reps: 12 }, [
    'Glute bridge', 'Wake up the muscles at the back of the hips before activity.',
    'Lie on your back with knees bent and feet flat, hip-width apart.',
    ['Press through your feet and lift the hips until the body forms a line from knees to shoulders.', 'Squeeze the buttocks at the top without arching the back.', 'Lower slowly.'],
    ['Pushing with the lower back instead of the hips', 'Letting the knees fall in'],
    'If the back of the thigh cramps, move the feet a little closer.', 'Lift only a little and hold for a few seconds.', 'Do it on one leg.',
  ], [
    'Ponte de glúteos', 'Desperte os músculos de trás do quadril antes de uma atividade.',
    'Deite de costas com os joelhos dobrados e os pés apoiados, afastados na largura do quadril.',
    ['Empurre os pés no chão e levante o quadril até o corpo formar uma linha dos joelhos aos ombros.', 'Contraia os glúteos no alto sem arquear as costas.', 'Desça devagar.'],
    ['Empurrar com a lombar em vez do quadril', 'Deixar os joelhos caírem para dentro'],
    'Se a parte de trás da coxa der câimbra, aproxime um pouco os pés.', 'Suba só um pouco e segure por alguns segundos.', 'Faça com uma perna só.',
  ]),
  E('clamshell', 'activation', ['hips'], 'beginner', ['warmup'], { reps: 12, sides: true }, [
    'Clamshell', 'Wake up the muscles on the side of the hip.',
    'Lie on your side with hips and knees bent and feet together, head resting on your arm.',
    ['Keeping the feet together, lift the top knee without rolling the pelvis back.', 'Pause for a second.', 'Lower slowly and repeat, then change sides.'],
    ['Rolling the body backward', 'Lifting with momentum'],
    'Keep the movement small; you should feel it at the side of the hip, not the lower back.', 'Place a hand on the pelvis to keep it still.', 'Hold the top position for three seconds.',
  ], [
    'Concha (clamshell)', 'Desperte os músculos do lado do quadril.',
    'Deite de lado com quadril e joelhos dobrados, pés juntos e a cabeça apoiada no braço.',
    ['Mantendo os pés juntos, levante o joelho de cima sem rolar a pelve para trás.', 'Pause por um segundo.', 'Desça devagar e repita, depois troque de lado.'],
    ['Rolar o corpo para trás', 'Levantar com impulso'],
    'Mantenha o movimento pequeno; você deve senti-lo no lado do quadril, não na lombar.', 'Coloque uma mão na pelve para mantê-la parada.', 'Segure a posição alta por três segundos.',
  ]),
  E('leg-swings', 'dynamic-flexibility', ['hips'], 'beginner', ['warmup'], { reps: 10, sides: true }, [
    'Leg swings', 'Controlled swings of the leg to warm up the hips.',
    'Stand next to a wall or chair for support, standing tall on one leg.',
    ['Swing the free leg forward and back in a smooth arc.', 'Keep the trunk upright and the movement controlled.', 'After the reps, swing across the body and out to the side, then change legs.'],
    ['Swinging so hard the body is thrown off balance', 'Leaning the trunk with each swing'],
    'Start with small swings and let the range grow gradually.', 'Hold on with both hands and keep the swings small.', 'Let the swings grow in height as the hips warm up.',
  ], [
    'Balanço de pernas', 'Balanços controlados da perna para aquecer o quadril.',
    'Fique ao lado de uma parede ou cadeira para apoio, em pé e alto sobre uma perna.',
    ['Balance a perna livre para a frente e para trás em um arco suave.', 'Mantenha o tronco ereto e o movimento controlado.', 'Depois das repetições, balance a perna cruzando o corpo e para o lado, e troque de perna.'],
    ['Balançar com tanta força que perde o equilíbrio', 'Inclinar o tronco a cada balanço'],
    'Comece com balanços pequenos e deixe a amplitude crescer aos poucos.', 'Segure com as duas mãos e mantenha os balanços pequenos.', 'Deixe os balanços ficarem mais altos conforme o quadril aquece.',
  ]),
  E('worlds-greatest-stretch', 'preparation', ['hips', 'thoracic', 'ankles'], 'intermediate', ['warmup'], { reps: 5, sides: true }, [
    'Lunge with rotation', 'A multi-joint warm-up that moves hips, upper back and ankles together.',
    'Start standing, then step into a long lunge with both hands on the floor inside the front foot.',
    ['Rotate the chest toward the front leg and lift the inner arm to the ceiling.', 'Return the hand to the floor.', 'Step forward into the next lunge on the other leg.'],
    ['Letting the front knee collapse inward', 'Rushing the rotation'],
    'Keep the lunge shorter and the hand on a block or a chair if the hips are tight.', 'Keep the back knee on the floor.', 'Lift the back knee and straighten the back leg.',
  ], [
    'Avanço com rotação', 'Um aquecimento de várias articulações que move quadril, parte alta das costas e tornozelos juntos.',
    'Comece em pé e dê um passo em um avanço longo, com as duas mãos no chão dentro do pé da frente.',
    ['Gire o peito em direção à perna da frente e levante o braço de dentro para o teto.', 'Volte a mão ao chão.', 'Dê um passo à frente para o próximo avanço com a outra perna.'],
    ['Deixar o joelho da frente cair para dentro', 'Fazer a rotação com pressa'],
    'Faça o avanço mais curto e apoie a mão em um bloco ou cadeira se o quadril estiver rígido.', 'Mantenha o joelho de trás no chão.', 'Levante o joelho de trás e estenda a perna de trás.',
  ]),
  E('deep-squat-hold', 'static-flexibility', ['hips', 'knees', 'ankles'], 'intermediate', ['morning', 'evening'], { sec: 45 }, [
    'Deep squat hold', 'Sit in a deep squat to build comfort at the hips, knees and ankles.',
    'Stand with feet a little wider than the hips, toes turned out slightly.',
    ['Lower into a squat as deep as you comfortably can, heels down.', 'Press the elbows gently against the inside of the knees with the palms together.', 'Hold, breathing slowly, then stand up.'],
    ['Letting the heels lift', 'Collapsing the knees inward'],
    'Do not hold a position that pinches the front of the hip or the knee.', 'Hold on to a post or a door frame, or rest the heels on a rolled towel.', 'Move gently side to side while holding the squat.',
  ], [
    'Agachamento profundo isométrico', 'Permaneça em um agachamento profundo para ganhar conforto em quadril, joelhos e tornozelos.',
    'Fique em pé com os pés um pouco mais afastados que o quadril e as pontas levemente para fora.',
    ['Desça em um agachamento o mais fundo que conseguir com conforto, calcanhares no chão.', 'Empurre suavemente os cotovelos contra a parte interna dos joelhos, com as palmas juntas.', 'Segure respirando devagar e depois levante.'],
    ['Deixar os calcanhares levantarem', 'Deixar os joelhos caírem para dentro'],
    'Não mantenha uma posição que beliscar a frente do quadril ou o joelho.', 'Segure em um poste ou batente, ou apoie os calcanhares em uma toalha enrolada.', 'Mova-se suavemente de um lado para o outro durante o agachamento.',
  ]),
  E('mini-squat-control', 'joint-stability', ['knees', 'hips'], 'beginner', ['warmup'], { reps: 10 }, [
    'Controlled mini squat', 'A small squat that practises keeping the knee in line with the foot.',
    'Stand with feet hip-width apart and a hand on a wall or chair if you like.',
    ['Bend the knees a little, sending the hips back, with the knees following the line of the toes.', 'Pause for a second.', 'Stand up slowly.'],
    ['Letting the knees drift inward', 'Dropping into the squat quickly'],
    'Keep the depth where the knee feels comfortable.', 'Hold on with both hands.', 'Do it on one leg, with the other foot lightly touching the floor.',
  ], [
    'Mini agachamento controlado', 'Um agachamento curto para praticar manter o joelho alinhado ao pé.',
    'Fique em pé com os pés na largura do quadril e, se quiser, uma mão na parede ou cadeira.',
    ['Dobre um pouco os joelhos, levando o quadril para trás, com os joelhos seguindo a linha dos pés.', 'Pause por um segundo.', 'Levante devagar.'],
    ['Deixar os joelhos irem para dentro', 'Descer rápido no agachamento'],
    'Mantenha a profundidade em que o joelho fica confortável.', 'Segure com as duas mãos.', 'Faça com uma perna só, com o outro pé tocando levemente o chão.',
  ]),
  E('ankle-circles', 'joint-mobility', ['ankles', 'feet'], 'beginner', ['warmup', 'desk'], { reps: 10, sides: true }, [
    'Ankle circles', 'Slow circles of the foot to move the ankle in all directions.',
    'Sit with one leg lifted or crossed over the other, foot relaxed.',
    ['Draw the biggest circle you can with your toes.', 'Move only the foot, keeping the leg still.', 'Reverse the direction halfway.'],
    ['Moving the whole leg', 'Making small, fast circles'],
    'Stay within the pain-free range, especially after an ankle sprain.', 'Point and flex the foot instead of circling.', 'Do it standing on one leg, with support.',
  ], [
    'Círculos de tornozelo', 'Círculos lentos do pé para mover o tornozelo em todas as direções.',
    'Sente com uma perna levantada ou cruzada sobre a outra, o pé relaxado.',
    ['Desenhe o maior círculo que conseguir com os dedos dos pés.', 'Mova só o pé, mantendo a perna parada.', 'Inverta o sentido na metade.'],
    ['Mover a perna inteira', 'Fazer círculos pequenos e rápidos'],
    'Fique na amplitude sem dor, principalmente depois de uma torção no tornozelo.', 'Aponte e flexione o pé em vez de girar.', 'Faça em pé sobre uma perna, com apoio.',
  ]),
  E('knee-to-wall', 'joint-mobility', ['ankles', 'knees'], 'beginner', ['warmup'], { reps: 10, sides: true }, [
    'Knee-to-wall ankle drill', 'Move the knee over the toes to build ankle movement.',
    'Stand facing a wall, one foot a few centimetres from it, the other foot behind.',
    ['Bend the front knee and try to touch the wall with it, keeping the heel down.', 'Return to the start.', 'Move the foot back a little at a time as it gets easier.'],
    ['Lifting the heel', 'Letting the knee fall inward'],
    'Stop if you feel pinching at the front of the ankle.', 'Place the foot closer to the wall.', 'Place the foot farther from the wall.',
  ], [
    'Joelho na parede para o tornozelo', 'Leve o joelho sobre os dedos dos pés para ganhar movimento no tornozelo.',
    'Fique de frente para uma parede, com um pé a poucos centímetros dela e o outro atrás.',
    ['Dobre o joelho da frente e tente tocar a parede com ele, mantendo o calcanhar no chão.', 'Volte ao início.', 'Afaste o pé aos poucos conforme ficar mais fácil.'],
    ['Levantar o calcanhar', 'Deixar o joelho cair para dentro'],
    'Pare se sentir beliscão na frente do tornozelo.', 'Posicione o pé mais perto da parede.', 'Posicione o pé mais longe da parede.',
  ]),
  E('calf-stretch', 'stretching', ['ankles'], 'beginner', ['cooldown', 'evening'], { sec: 30, sides: true }, [
    'Wall calf stretch', 'A stretch for the calf muscles.',
    'Stand facing a wall with the hands on it, one foot back with the heel down.',
    ['Keep the back leg straight and press the heel into the floor.', 'Lean the hips toward the wall until you feel the calf stretch.', 'Hold, then change legs.'],
    ['Lifting the back heel', 'Turning the back foot outward'],
    'Ease off if you feel pain at the back of the heel.', 'Shorten the step.', 'Bend the back knee slightly to reach the lower part of the calf.',
  ], [
    'Alongamento de panturrilha na parede', 'Um alongamento para os músculos da panturrilha.',
    'Fique de frente para uma parede com as mãos nela, um pé atrás com o calcanhar no chão.',
    ['Mantenha a perna de trás estendida e pressione o calcanhar no chão.', 'Incline o quadril em direção à parede até sentir a panturrilha alongar.', 'Segure e depois troque de perna.'],
    ['Levantar o calcanhar de trás', 'Virar o pé de trás para fora'],
    'Alivie se sentir dor atrás do calcanhar.', 'Encurte o passo.', 'Dobre levemente o joelho de trás para alcançar a parte baixa da panturrilha.',
  ]),
  E('single-leg-balance', 'balance', ['ankles', 'feet', 'knees'], 'beginner', ['morning', 'desk'], { sec: 30, sides: true }, [
    'Single-leg balance', 'Stand on one leg to train balance and the small muscles of the foot and ankle.',
    'Stand near a wall or chair, weight on one foot.',
    ['Lift the other foot slightly off the floor.', 'Keep the standing knee soft and the hips level.', 'Hold, then change legs.'],
    ['Locking the standing knee', 'Gripping the wall hard'],
    'Keep a hand close to a stable support so you can catch yourself.', 'Keep the lifted toe touching the floor.', 'Close your eyes, or stand on a folded towel.',
  ], [
    'Equilíbrio em uma perna', 'Fique em uma perna para treinar o equilíbrio e os pequenos músculos do pé e do tornozelo.',
    'Fique perto de uma parede ou cadeira, com o peso em um pé.',
    ['Levante o outro pé levemente do chão.', 'Mantenha o joelho de apoio solto e o quadril nivelado.', 'Segure e depois troque de perna.'],
    ['Travar o joelho de apoio', 'Agarrar a parede com força'],
    'Mantenha uma mão perto de um apoio estável para se segurar se precisar.', 'Mantenha a ponta do pé levantado tocando o chão.', 'Feche os olhos ou fique sobre uma toalha dobrada.',
  ]),
  E('heel-toe-walk', 'coordination', ['ankles', 'feet'], 'beginner', ['warmup'], { reps: 10 }, [
    'Heel-to-toe walk', 'Walk in a straight line placing one foot directly in front of the other.',
    'Stand tall with your arms out to the sides for balance, near a wall if needed.',
    ['Step forward placing the heel of one foot against the toes of the other.', 'Keep your eyes ahead and walk slowly.', 'Take the number of steps, turn and come back.'],
    ['Looking down the whole time', 'Rushing the steps'],
    'Walk next to a wall so you can touch it if you wobble.', 'Walk with the feet a little apart.', 'Walk backward, or carry a light object in each hand.',
  ], [
    'Caminhada calcanhar-ponta', 'Caminhe em linha reta colocando um pé diretamente à frente do outro.',
    'Fique em pé com os braços abertos para os lados para se equilibrar, perto de uma parede se precisar.',
    ['Dê um passo colocando o calcanhar de um pé encostado nos dedos do outro.', 'Olhe para a frente e caminhe devagar.', 'Dê o número de passos, vire e volte.'],
    ['Olhar para baixo o tempo todo', 'Fazer os passos com pressa'],
    'Caminhe ao lado de uma parede para poder tocá-la se balançar.', 'Caminhe com os pés um pouco afastados.', 'Caminhe de costas ou carregue um objeto leve em cada mão.',
  ]),
  E('cross-crawl', 'coordination', ['shoulders', 'hips'], 'beginner', ['warmup', 'morning'], { reps: 16 }, [
    'Cross crawl march', 'Touch a hand to the opposite knee in a marching rhythm.',
    'Stand tall with your feet hip-width apart.',
    ['Lift the right knee and tap it with the left hand.', 'Lower and repeat on the other side.', 'Keep a steady, relaxed rhythm.'],
    ['Collapsing the trunk forward', 'Rushing so the touches become sloppy'],
    'Slow down if you lose the rhythm, then speed up again.', 'March without touching the knees.', 'Touch the hand to the opposite heel behind you.',
  ], [
    'Marcha cruzada', 'Toque a mão no joelho oposto em ritmo de marcha.',
    'Fique em pé com o corpo alto e os pés na largura do quadril.',
    ['Levante o joelho direito e toque-o com a mão esquerda.', 'Desça e repita do outro lado.', 'Mantenha um ritmo constante e relaxado.'],
    ['Curvar o tronco para a frente', 'Acelerar até os toques ficarem desleixados'],
    'Reduza a velocidade se perder o ritmo e depois acelere de novo.', 'Marche sem tocar os joelhos.', 'Toque a mão no calcanhar oposto atrás de você.',
  ]),
  E('short-foot', 'joint-stability', ['feet'], 'beginner', ['desk', 'morning'], { reps: 10 }, [
    'Short foot', 'Gently shorten the foot to activate the muscles of the arch.',
    'Sit or stand with the foot flat on the floor.',
    ['Draw the ball of the foot toward the heel without curling the toes.', 'Feel the arch lift slightly.', 'Hold for five seconds, then relax.'],
    ['Curling the toes', 'Pressing too hard into the floor'],
    'Stop if the foot or calf cramps; relax and try again with less effort.', 'Practise seated first.', 'Practise standing, then on one leg.',
  ], [
    'Pé curto', 'Encurte suavemente o pé para ativar os músculos do arco.',
    'Sente ou fique em pé com o pé apoiado no chão.',
    ['Aproxime a base dos dedos do calcanhar sem encolher os dedos.', 'Sinta o arco subir levemente.', 'Segure por cinco segundos e relaxe.'],
    ['Encolher os dedos', 'Pressionar o chão com força demais'],
    'Pare se o pé ou a panturrilha derem câimbra; relaxe e tente de novo com menos esforço.', 'Pratique sentado primeiro.', 'Pratique em pé e depois em uma perna.',
  ]),
  E('foot-roll', 'recovery', ['feet'], 'beginner', ['desk', 'evening'], { sec: 60, sides: true }, [
    'Foot roll', 'Roll the sole of the foot over a ball to release tension.',
    'Sit on a chair with a small ball (tennis or massage ball) under one foot.',
    ['Roll the ball slowly from the heel to the base of the toes.', 'Press as much as is comfortable.', 'Pause on tender spots and breathe, then change feet.'],
    ['Pressing so hard it hurts', 'Rolling quickly'],
    'Avoid if the sole is inflamed or painful; the pressure should feel pleasant.', 'Use a softer ball, or less pressure.', 'Do it standing with more body weight.',
  ], [
    'Rolamento plantar', 'Role a sola do pé sobre uma bola para soltar a tensão.',
    'Sente em uma cadeira com uma bolinha (de tênis ou de massagem) sob um pé.',
    ['Role a bola devagar do calcanhar até a base dos dedos.', 'Pressione o quanto for confortável.', 'Pare nos pontos sensíveis e respire, depois troque de pé.'],
    ['Pressionar tão forte que dói', 'Rolar rápido'],
    'Evite se a sola estiver inflamada ou dolorida; a pressão deve ser agradável.', 'Use uma bola mais macia ou menos pressão.', 'Faça em pé com mais peso do corpo.',
  ]),
  E('wrist-circles', 'joint-mobility', ['wrists'], 'beginner', ['warmup', 'desk'], { reps: 10 }, [
    'Wrist circles', 'Circle the wrists to prepare them for work and keep them moving.',
    'Sit or stand with your arms in front of you and fists loosely closed.',
    ['Draw slow circles with the fists.', 'Keep the forearms still.', 'Reverse the direction halfway.'],
    ['Moving the whole arm', 'Making circles too small to matter'],
    'Skip any position that pinches the wrist.', 'Move only up and down, then side to side.', 'Do it with the hands open and fingers spread.',
  ], [
    'Círculos de punho', 'Faça círculos com os punhos para prepará-los para o trabalho e mantê-los em movimento.',
    'Sente ou fique em pé com os braços à frente e os punhos levemente fechados.',
    ['Desenhe círculos lentos com os punhos.', 'Mantenha os antebraços parados.', 'Inverta o sentido na metade.'],
    ['Mover o braço inteiro', 'Fazer círculos tão pequenos que não adiantam'],
    'Evite qualquer posição que beliscar o punho.', 'Mova só para cima e para baixo e depois de um lado para o outro.', 'Faça com as mãos abertas e os dedos afastados.',
  ]),
  E('forearm-stretch', 'stretching', ['wrists', 'elbows'], 'beginner', ['desk', 'cooldown'], { sec: 20, sides: true }, [
    'Forearm stretch', 'Stretch the muscles on both sides of the forearm.',
    'Extend one arm in front of you at shoulder height.',
    ['With the palm up, gently pull the fingers back with the other hand.', 'Hold, then turn the palm down and gently press the back of the hand toward you.', 'Change arms.'],
    ['Pulling hard on the fingers', 'Bending the elbow'],
    'Keep the pull gentle; stop if you feel tingling in the hand.', 'Bend the elbow slightly.', 'Rest the palm flat on a table and lean gently.',
  ], [
    'Alongamento de antebraço', 'Alongue os músculos dos dois lados do antebraço.',
    'Estenda um braço à frente na altura do ombro.',
    ['Com a palma para cima, puxe suavemente os dedos para trás com a outra mão.', 'Segure, depois vire a palma para baixo e pressione suavemente as costas da mão em sua direção.', 'Troque de braço.'],
    ['Puxar os dedos com força', 'Dobrar o cotovelo'],
    'Mantenha a tração suave; pare se sentir formigamento na mão.', 'Dobre levemente o cotovelo.', 'Apoie a palma aberta em uma mesa e incline-se suavemente.',
  ]),
  E('forearm-rotation', 'joint-mobility', ['elbows', 'wrists'], 'beginner', ['desk', 'warmup'], { reps: 10, sides: true }, [
    'Forearm rotations', 'Turn the forearm palm-up and palm-down to move the elbow and wrist.',
    'Sit tall with the elbow bent at 90 degrees and tucked at your side.',
    ['Slowly turn the palm up.', 'Slowly turn the palm down.', 'Keep the elbow against your side throughout.'],
    ['Letting the elbow drift away from the body', 'Turning using the shoulder'],
    'Stay in the comfortable range, especially if the elbow is sensitive.', 'Make the turn smaller.', 'Hold a light object, like a small water bottle.',
  ], [
    'Rotações de antebraço', 'Gire o antebraço com a palma para cima e para baixo para mover cotovelo e punho.',
    'Sente com a coluna alta e o cotovelo dobrado a 90 graus junto ao corpo.',
    ['Vire devagar a palma para cima.', 'Vire devagar a palma para baixo.', 'Mantenha o cotovelo junto ao corpo o tempo todo.'],
    ['Deixar o cotovelo se afastar do corpo', 'Girar usando o ombro'],
    'Fique na amplitude confortável, principalmente se o cotovelo estiver sensível.', 'Faça o giro menor.', 'Segure um objeto leve, como uma garrafinha de água.',
  ]),
  E('diaphragmatic-breathing', 'recovery', ['thoracic', 'lumbar'], 'beginner', ['cooldown', 'evening', 'morning'], { sec: 120 }, [
    'Diaphragmatic breathing', 'Slow breathing into the belly and lower ribs to help the body settle.',
    'Lie on your back with knees bent, one hand on the chest and one on the belly.',
    ['Breathe in slowly through the nose, letting the belly and lower ribs expand.', 'Breathe out slowly through the mouth, a little longer than the inhale.', 'Keep the chest quiet and the shoulders soft.'],
    ['Lifting the chest and shoulders with each breath', 'Forcing a very deep breath'],
    'If you feel lightheaded, return to normal breathing for a while.', 'Practise lying down first.', 'Practise seated, then while walking slowly.',
  ], [
    'Respiração diafragmática', 'Respiração lenta para a barriga e as costelas inferiores para ajudar o corpo a se acalmar.',
    'Deite de costas com os joelhos dobrados, uma mão no peito e outra na barriga.',
    ['Inspire devagar pelo nariz, deixando a barriga e as costelas inferiores se expandirem.', 'Expire devagar pela boca, um pouco mais longo que a inspiração.', 'Mantenha o peito quieto e os ombros soltos.'],
    ['Levantar peito e ombros a cada respiração', 'Forçar uma respiração muito profunda'],
    'Se sentir tontura, volte a respirar normalmente por um tempo.', 'Pratique deitado primeiro.', 'Pratique sentado e depois caminhando devagar.',
  ]),
  E('body-scan', 'body-awareness', ['neck', 'shoulders', 'thoracic', 'lumbar', 'hips', 'knees', 'ankles', 'feet', 'wrists', 'elbows'], 'beginner', ['evening', 'cooldown'], { sec: 180 }, [
    'Body scan', 'Move your attention slowly through the body to notice tension and ease.',
    'Lie on your back or sit comfortably and close your eyes if you wish.',
    ['Start at the feet and notice how they feel: warm, heavy, tense, relaxed.', 'Move your attention slowly up through the legs, trunk, arms and head.', 'At each area, breathe out and let the muscles soften if they can.'],
    ['Trying to force every area to relax', 'Judging what you notice'],
    'If paying attention to the body feels uncomfortable, stop and open your eyes.', 'Scan only three areas.', 'Extend the scan to ten minutes.',
  ], [
    'Escaneamento corporal', 'Leve a atenção devagar pelo corpo para perceber tensão e alívio.',
    'Deite de costas ou sente confortavelmente e, se quiser, feche os olhos.',
    ['Comece pelos pés e perceba como estão: quentes, pesados, tensos, relaxados.', 'Leve a atenção devagar pelas pernas, tronco, braços e cabeça.', 'Em cada área, expire e deixe os músculos relaxarem se puderem.'],
    ['Tentar forçar o relaxamento de cada área', 'Julgar o que percebe'],
    'Se prestar atenção ao corpo causar desconforto, pare e abra os olhos.', 'Percorra só três áreas.', 'Estenda o escaneamento para dez minutos.',
  ]),
  E('marching-warmup', 'preparation', ['hips', 'knees', 'ankles', 'shoulders'], 'beginner', ['warmup', 'morning'], { sec: 60 }, [
    'Marching warm-up', 'An easy marching rhythm with arm swings to raise body temperature.',
    'Stand tall in a space where you can move freely.',
    ['March on the spot, lifting the knees to a comfortable height.', 'Swing the arms naturally, opposite to the legs.', 'Gradually make the march a little bigger and quicker.'],
    ['Starting too fast', 'Holding the breath'],
    'Choose a pace that lets you speak in full sentences.', 'March slowly with small steps.', 'Lift the knees higher or travel forward and back.',
  ], [
    'Aquecimento com marcha', 'Uma marcha em ritmo fácil com balanço dos braços para elevar a temperatura do corpo.',
    'Fique em pé em um espaço onde possa se mover livremente.',
    ['Marche no lugar, levantando os joelhos até uma altura confortável.', 'Balance os braços naturalmente, em oposição às pernas.', 'Aumente aos poucos a marcha, deixando-a um pouco maior e mais rápida.'],
    ['Começar rápido demais', 'Prender a respiração'],
    'Escolha um ritmo que permita falar frases completas.', 'Marche devagar com passos curtos.', 'Levante mais os joelhos ou desloque-se para a frente e para trás.',
  ]),
]

export const MOBILITY_NOTICE = 'Mobility work is general guidance, not treatment. Stop if something hurts, and see a doctor or physiotherapist for pain, numbness, dizziness or a recent injury.'

const LANG_TEXT = { pt: 'pt', 'pt-BR': 'pt' }

/** An exercise with its text in the given language (English when there is none), as named fields. */
export function mobilityText(ex, lang = 'en') {
  const a = ex.text[LANG_TEXT[lang] || 'en'] || ex.text.en
  return { name: a[0], description: a[1], start: a[2], steps: a[3], mistakes: a[4], caution: a[5], easier: a[6], harder: a[7] }
}

const BY_ID = new Map(MOBILITY_EXERCISES.map(e => [e.id, e]))
export const mobilityExercise = id => BY_ID.get(id) || null
