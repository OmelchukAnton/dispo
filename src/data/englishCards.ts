import type {
  EnglishCard,
  EnglishCardKind,
  EnglishGrade,
  EnglishTopicId,
} from '../types'

export const ENGLISH_STORAGE_KEY = 'dispatch-english-v1'

export const ENGLISH_TOPICS: {
  id: EnglishTopicId
  label: string
  hint: string
}[] = [
  { id: 'connectors', label: 'Connectors', hint: 'however, although…' },
  { id: 'daily', label: 'Daily phrases', hint: 'everyday speak' },
  { id: 'work', label: 'Work / office', hint: 'meetings, tasks' },
  { id: 'logistics', label: 'Logistics', hint: 'transport job' },
  { id: 'travel', label: 'Travel', hint: 'trips & cities' },
  { id: 'food', label: 'Food / cafe', hint: 'ordering food' },
  { id: 'health', label: 'Health / gym', hint: 'body & fitness' },
  { id: 'time', label: 'Time', hint: 'schedule words' },
  { id: 'grammar', label: 'Grammar', hint: 'rules & tips' },
  { id: 'past-present', label: 'Past vs Present', hint: 'stories & habits' },
  { id: 'plans', label: 'Plans & goals', hint: 'will / going to' },
  { id: 'calls', label: 'Calls', hint: 'phone English' },
  { id: 'email', label: 'Email / messages', hint: 'write clearly' },
  { id: 'polite', label: 'Polite English', hint: 'soft requests' },
  { id: 'road', label: 'On the road', hint: 'delays & problems' },
  { id: 'describe-day', label: 'Describe your day', hint: 'structured talk' },
]

type StarterSeed = {
  front: string
  back: string
  example: string
  kind: EnglishCardKind
  topic: EnglishTopicId
}

const STARTER: StarterSeed[] = [
  // —— Connectors ——
  { topic: 'connectors', kind: 'word', front: 'however', back: 'однако / тем не менее', example: 'It is late; however, we can still finish.' },
  { topic: 'connectors', kind: 'word', front: 'although', back: 'хотя', example: 'Although it rains, we continue.' },
  { topic: 'connectors', kind: 'word', front: 'instead', back: 'вместо этого', example: 'Take the train instead of the bus.' },
  { topic: 'connectors', kind: 'word', front: 'already', back: 'уже', example: 'I have already called him.' },
  { topic: 'connectors', kind: 'word', front: 'yet', back: 'ещё (в вопросах/отрицаниях)', example: 'Has he arrived yet?' },
  { topic: 'connectors', kind: 'word', front: 'enough', back: 'достаточно', example: 'We have enough time.' },
  { topic: 'connectors', kind: 'word', front: 'almost', back: 'почти', example: 'We are almost there.' },
  { topic: 'connectors', kind: 'word', front: 'probably', back: 'вероятно', example: 'He will probably be late.' },
  { topic: 'connectors', kind: 'word', front: 'suddenly', back: 'внезапно', example: 'Suddenly the phone rang.' },
  { topic: 'connectors', kind: 'word', front: 'carefully', back: 'осторожно / внимательно', example: 'Drive carefully in the rain.' },
  { topic: 'connectors', kind: 'word', front: 'quickly', back: 'быстро', example: 'Please reply quickly.' },
  { topic: 'connectors', kind: 'word', front: 'usually', back: 'обычно', example: 'I usually start at 7.' },
  { topic: 'connectors', kind: 'word', front: 'rarely', back: 'редко', example: 'He rarely takes a break.' },
  { topic: 'connectors', kind: 'word', front: 'often', back: 'часто', example: 'We often work on weekends.' },
  { topic: 'connectors', kind: 'word', front: 'also', back: 'также', example: 'I also want to learn logistics.' },
  { topic: 'connectors', kind: 'word', front: 'because', back: 'потому что', example: 'I am late because of traffic.' },
  { topic: 'connectors', kind: 'word', front: 'so', back: 'поэтому', example: 'It was raining, so we stayed inside.' },
  { topic: 'connectors', kind: 'phrase', front: 'after that', back: 'после этого', example: 'I go to the gym. After that, I cook dinner.' },
  { topic: 'connectors', kind: 'phrase', front: 'for example', back: 'например', example: 'I like sports, for example swimming.' },
  { topic: 'connectors', kind: 'phrase', front: 'in addition', back: 'кроме того', example: 'In addition, I want to study logistics.' },

  // —— Daily phrases ——
  { topic: 'daily', kind: 'phrase', front: 'How are you?', back: 'Как дела?', example: 'Hi! How are you today?' },
  { topic: 'daily', kind: 'phrase', front: 'Nice to meet you', back: 'Приятно познакомиться', example: 'Nice to meet you, Anna.' },
  { topic: 'daily', kind: 'phrase', front: 'See you later', back: 'Увидимся позже', example: 'Okay, see you later.' },
  { topic: 'daily', kind: 'phrase', front: 'Take care', back: 'Береги себя', example: 'Drive safe. Take care!' },
  { topic: 'daily', kind: 'phrase', front: 'No problem', back: 'Без проблем', example: 'Thanks! — No problem.' },
  { topic: 'daily', kind: 'phrase', front: 'I am not sure', back: 'Я не уверен', example: 'I am not sure about the time.' },
  { topic: 'daily', kind: 'phrase', front: 'It depends', back: 'Зависит от ситуации', example: 'It depends on the traffic.' },
  { topic: 'daily', kind: 'phrase', front: 'In my opinion', back: 'По моему мнению', example: 'In my opinion, we should wait.' },
  { topic: 'daily', kind: 'phrase', front: 'As far as I know', back: 'Насколько мне известно', example: 'As far as I know, he left at 6.' },
  { topic: 'daily', kind: 'phrase', front: 'To be honest', back: 'Честно говоря', example: 'To be honest, I forgot.' },
  { topic: 'daily', kind: 'phrase', front: 'Let me check', back: 'Дай мне проверить', example: 'Let me check and call you back.' },
  { topic: 'daily', kind: 'phrase', front: 'I will call you back', back: 'Я перезвоню', example: 'I am busy now. I will call you back.' },
  { topic: 'daily', kind: 'phrase', front: 'Could you speak slower?', back: 'Можете говорить медленнее?', example: 'Sorry, could you speak slower, please?' },
  { topic: 'daily', kind: 'phrase', front: 'What does it mean?', back: 'Что это значит?', example: 'What does this word mean?' },
  { topic: 'daily', kind: 'phrase', front: 'I did not catch that', back: 'Я не расслышал', example: 'Sorry, I did not catch that.' },
  { topic: 'daily', kind: 'phrase', front: 'Can you repeat, please?', back: 'Можете повторить, пожалуйста?', example: 'Can you repeat the address, please?' },
  { topic: 'daily', kind: 'phrase', front: 'That makes sense', back: 'Это логично / понятно', example: 'Okay, that makes sense.' },
  { topic: 'daily', kind: 'phrase', front: 'I am looking forward to…', back: 'Я с нетерпением жду…', example: 'I am looking forward to the weekend.' },
  { topic: 'daily', kind: 'phrase', front: 'Never mind', back: 'Неважно / забудь', example: 'Never mind, I found it.' },
  { topic: 'daily', kind: 'phrase', front: 'Hang on a second', back: 'Подожди секунду', example: 'Hang on a second, please.' },
  { topic: 'daily', kind: 'word', front: 'remind', back: 'напомнить', example: 'Please remind me tomorrow.' },
  { topic: 'daily', kind: 'word', front: 'prefer', back: 'предпочитать', example: 'I prefer morning meetings.' },
  { topic: 'daily', kind: 'word', front: 'suggest', back: 'предлагать', example: 'I suggest we call the client.' },
  { topic: 'daily', kind: 'word', front: 'expect', back: 'ожидать', example: 'I expect him at 10.' },
  { topic: 'daily', kind: 'word', front: 'avoid', back: 'избегать', example: 'Avoid the city centre today.' },
  { topic: 'daily', kind: 'word', front: 'improve', back: 'улучшать', example: 'I want to improve my English.' },
  { topic: 'daily', kind: 'word', front: 'decide', back: 'решить', example: 'We need to decide now.' },
  { topic: 'daily', kind: 'word', front: 'explain', back: 'объяснить', example: 'Can you explain the problem?' },
  { topic: 'daily', kind: 'word', front: 'agree', back: 'соглашаться', example: 'I agree with you.' },
  { topic: 'daily', kind: 'word', front: 'disagree', back: 'не соглашаться', example: 'I disagree with this plan.' },

  // —— Work / office ——
  { topic: 'work', kind: 'word', front: 'deadline', back: 'срок сдачи', example: 'The deadline is Friday.' },
  { topic: 'work', kind: 'word', front: 'meeting', back: 'встреча / совещание', example: 'We have a meeting at 9.' },
  { topic: 'work', kind: 'word', front: 'schedule', back: 'расписание / график', example: 'Check the schedule, please.' },
  { topic: 'work', kind: 'word', front: 'shift', back: 'смена', example: 'He works the night shift.' },
  { topic: 'work', kind: 'word', front: 'overtime', back: 'сверхурочная работа', example: 'We did two hours of overtime.' },
  { topic: 'work', kind: 'word', front: 'colleague', back: 'коллега', example: 'Ask your colleague for help.' },
  { topic: 'work', kind: 'word', front: 'manager', back: 'менеджер / руководитель', example: 'Talk to the manager.' },
  { topic: 'work', kind: 'word', front: 'task', back: 'задача', example: 'This is your next task.' },
  { topic: 'work', kind: 'word', front: 'issue', back: 'проблема / вопрос', example: 'There is an issue with the papers.' },
  { topic: 'work', kind: 'word', front: 'solution', back: 'решение', example: 'We need a quick solution.' },
  { topic: 'work', kind: 'word', front: 'responsible', back: 'ответственный', example: 'I am responsible for this truck.' },
  { topic: 'work', kind: 'word', front: 'experience', back: 'опыт', example: 'I have experience as a transport manager.' },
  { topic: 'work', kind: 'word', front: 'promotion', back: 'повышение', example: 'I want a promotion in logistics.' },
  { topic: 'work', kind: 'phrase', front: 'I am on it', back: 'Я уже занимаюсь этим', example: 'Got it — I am on it.' },
  { topic: 'work', kind: 'phrase', front: 'Let us follow up', back: 'Давай продолжим / уточним позже', example: 'Let us follow up tomorrow morning.' },
  { topic: 'work', kind: 'phrase', front: 'Please keep me in the loop', back: 'Держи меня в курсе', example: 'Please keep me in the loop.' },
  { topic: 'work', kind: 'phrase', front: 'I will take care of it', back: 'Я этим займусь', example: 'Do not worry, I will take care of it.' },
  { topic: 'work', kind: 'phrase', front: 'Any updates?', back: 'Есть новости / обновления?', example: 'Any updates on the order?' },
  { topic: 'work', kind: 'phrase', front: 'I start work at…', back: 'Я начинаю работу в…', example: 'I start work at 8:00.' },
  { topic: 'work', kind: 'phrase', front: 'I am looking for orders', back: 'Я ищу заказы', example: 'Today I am looking for orders for drivers.' },

  // —— Logistics ——
  { topic: 'logistics', kind: 'phrase', front: 'ETA', back: 'Estimated Time of Arrival — расчётное время прибытия', example: 'What is your ETA?' },
  { topic: 'logistics', kind: 'phrase', front: 'Please confirm', back: 'Пожалуйста, подтвердите', example: 'Everything clear? Please confirm.' },
  { topic: 'logistics', kind: 'phrase', front: 'Safe parking', back: 'Безопасная парковка', example: 'We need safe parking tonight.' },
  { topic: 'logistics', kind: 'phrase', front: 'Traffic ban', back: 'Запрет движения', example: 'There is a traffic ban until 16:00.' },
  { topic: 'logistics', kind: 'phrase', front: 'As soon as possible (ASAP)', back: 'Как можно скорее', example: 'Please call me ASAP.' },
  { topic: 'logistics', kind: 'phrase', front: 'I will keep you updated', back: 'Буду держать в курсе', example: 'I will keep you updated.' },
  { topic: 'logistics', kind: 'word', front: 'delay', back: 'задержка', example: 'Sorry for the delay.' },
  { topic: 'logistics', kind: 'word', front: 'available', back: 'доступен / свободен', example: 'Are you available now?' },
  { topic: 'logistics', kind: 'word', front: 'warehouse', back: 'склад', example: 'Go to the warehouse.' },
  { topic: 'logistics', kind: 'word', front: 'breakdown', back: 'поломка', example: 'We had a breakdown.' },
  { topic: 'logistics', kind: 'word', front: 'load', back: 'загрузка / груз', example: 'The load is ready.' },
  { topic: 'logistics', kind: 'word', front: 'unload', back: 'выгрузка', example: 'Unload at gate 3.' },
  { topic: 'logistics', kind: 'word', front: 'trailer', back: 'прицеп', example: 'We need a trailer swap.' },
  { topic: 'logistics', kind: 'word', front: 'driver', back: 'водитель', example: 'Call the driver, please.' },
  { topic: 'logistics', kind: 'word', front: 'dispatch', back: 'диспетчеризация', example: 'I work in dispatch.' },
  { topic: 'logistics', kind: 'word', front: 'freight', back: 'груз / перевозка', example: 'This freight goes to Poland.' },
  { topic: 'logistics', kind: 'word', front: 'route', back: 'маршрут', example: 'Check the route for bans.' },
  { topic: 'logistics', kind: 'word', front: 'delivery', back: 'доставка', example: 'Delivery is tomorrow morning.' },
  { topic: 'logistics', kind: 'word', front: 'pickup', back: 'забор груза', example: 'Pickup is at 10:00.' },
  { topic: 'logistics', kind: 'word', front: 'CMR', back: 'международная ТТН', example: 'Please send the CMR.' },
  { topic: 'logistics', kind: 'phrase', front: 'The truck is empty', back: 'Машина пустая', example: 'The truck is empty after unloading.' },
  { topic: 'logistics', kind: 'phrase', front: 'The truck is loaded', back: 'Машина загружена', example: 'The truck is loaded and ready.' },
  { topic: 'logistics', kind: 'phrase', front: 'Waiting for documents', back: 'Ждём документы', example: 'We are waiting for documents.' },
  { topic: 'logistics', kind: 'phrase', front: 'Go to the parking from the task', back: 'Езжай на паркинг из задания', example: 'Please go to the parking from the task.' },

  // —— Travel ——
  { topic: 'travel', kind: 'word', front: 'airport', back: 'аэропорт', example: 'Meet me at the airport.' },
  { topic: 'travel', kind: 'word', front: 'passport', back: 'паспорт', example: 'Do not forget your passport.' },
  { topic: 'travel', kind: 'word', front: 'luggage', back: 'багаж', example: 'Where is my luggage?' },
  { topic: 'travel', kind: 'word', front: 'ticket', back: 'билет', example: 'I bought a train ticket.' },
  { topic: 'travel', kind: 'word', front: 'reservation', back: 'бронь', example: 'I have a hotel reservation.' },
  { topic: 'travel', kind: 'word', front: 'direction', back: 'направление / указание пути', example: 'Can you give me directions?' },
  { topic: 'travel', kind: 'word', front: 'trip', back: 'поездка', example: 'It was a nice trip to Gdansk.' },
  { topic: 'travel', kind: 'word', front: 'vacation', back: 'отпуск', example: 'We had a good vacation.' },
  { topic: 'travel', kind: 'phrase', front: 'How do I get to…?', back: 'Как мне добраться до…?', example: 'How do I get to the station?' },
  { topic: 'travel', kind: 'phrase', front: 'Is it far from here?', back: 'Это далеко отсюда?', example: 'Is the hotel far from here?' },
  { topic: 'travel', kind: 'phrase', front: 'I am lost', back: 'Я заблудился', example: 'Excuse me, I am lost.' },
  { topic: 'travel', kind: 'phrase', front: 'One way or return?', back: 'В одну сторону или туда-обратно?', example: 'A return ticket, please.' },
  { topic: 'travel', kind: 'phrase', front: 'We spent … days there', back: 'Мы провели там … дней', example: 'We spent five days there.' },
  { topic: 'travel', kind: 'phrase', front: 'I would like to go back', back: 'Я хотел бы вернуться', example: 'I would like to go back to this place.' },

  // —— Food ——
  { topic: 'food', kind: 'word', front: 'bill / check', back: 'счёт', example: 'Can I have the bill, please?' },
  { topic: 'food', kind: 'word', front: 'menu', back: 'меню', example: 'Could I see the menu?' },
  { topic: 'food', kind: 'word', front: 'spicy', back: 'острый', example: 'Is this dish spicy?' },
  { topic: 'food', kind: 'word', front: 'delicious', back: 'вкусно / восхитительно', example: 'This soup is delicious.' },
  { topic: 'food', kind: 'word', front: 'cook', back: 'готовить', example: 'I cook dinner after the gym.' },
  { topic: 'food', kind: 'phrase', front: 'I would like…', back: 'Я бы хотел…', example: 'I would like a coffee, please.' },
  { topic: 'food', kind: 'phrase', front: 'The same for me', back: 'Мне то же самое', example: 'The same for me, please.' },
  { topic: 'food', kind: 'phrase', front: 'I am allergic to…', back: 'У меня аллергия на…', example: 'I am allergic to nuts.' },
  { topic: 'food', kind: 'phrase', front: 'Is service included?', back: 'Чаевые / сервис включены?', example: 'Is service included in the bill?' },

  // —— Health / gym ——
  { topic: 'health', kind: 'word', front: 'tired', back: 'усталый', example: 'I am tired after the shift.' },
  { topic: 'health', kind: 'word', front: 'hungry', back: 'голодный', example: 'I am hungry.' },
  { topic: 'health', kind: 'word', front: 'thirsty', back: 'хочу пить', example: 'I am thirsty.' },
  { topic: 'health', kind: 'word', front: 'stressed', back: 'в стрессе', example: 'I feel stressed today.' },
  { topic: 'health', kind: 'word', front: 'pain', back: 'боль', example: 'I have a pain in my back.' },
  { topic: 'health', kind: 'word', front: 'gym', back: 'спортзал', example: 'I usually go to the gym.' },
  { topic: 'health', kind: 'word', front: 'sauna', back: 'сауна', example: 'I like the sauna after training.' },
  { topic: 'health', kind: 'word', front: 'swimming pool', back: 'бассейн', example: 'I would like to add a swimming pool.' },
  { topic: 'health', kind: 'phrase', front: 'I do not feel well', back: 'Мне нехорошо', example: 'I do not feel well today.' },
  { topic: 'health', kind: 'phrase', front: 'Get well soon', back: 'Выздоравливай скорее', example: 'Get well soon!' },
  { topic: 'health', kind: 'phrase', front: 'I am trying to…', back: 'Я стараюсь…', example: 'I am trying to go to the gym more often.' },

  // —— Time ——
  { topic: 'time', kind: 'phrase', front: 'the day after tomorrow', back: 'послезавтра', example: 'See you the day after tomorrow.' },
  { topic: 'time', kind: 'phrase', front: 'the day before yesterday', back: 'позавчера', example: 'He called the day before yesterday.' },
  { topic: 'time', kind: 'phrase', front: 'in advance', back: 'заранее', example: 'Please tell me in advance.' },
  { topic: 'time', kind: 'phrase', front: 'on time', back: 'вовремя', example: 'Please arrive on time.' },
  { topic: 'time', kind: 'phrase', front: 'ahead of schedule', back: 'раньше графика', example: 'We are ahead of schedule.' },
  { topic: 'time', kind: 'phrase', front: 'behind schedule', back: 'с отставанием от графика', example: 'We are behind schedule.' },
  { topic: 'time', kind: 'phrase', front: 'five months ago', back: 'пять месяцев назад', example: 'I got a new job five months ago.' },
  { topic: 'time', kind: 'phrase', front: 'until / till', back: 'до (времени)', example: 'I work until 15:00.' },
  { topic: 'time', kind: 'phrase', front: 'before 8:00', back: 'до 8:00', example: 'I go to the office before 8:00.' },

  // —— Grammar ——
  { topic: 'grammar', kind: 'rule', front: 'a / an', back: 'a — согласный звук; an — гласный звук', example: 'a car · an hour · an email' },
  { topic: 'grammar', kind: 'rule', front: 'Present Simple vs Continuous', back: 'Simple — факты/расписание; Continuous — сейчас', example: 'I work here. / I am working now.' },
  { topic: 'grammar', kind: 'rule', front: 'Prepositions of time', back: 'at + time, on + day, in + month/year', example: 'at 8 · on Monday · in July' },
  { topic: 'grammar', kind: 'rule', front: 'much / many', back: 'much — неисчисляемые; many — исчисляемые', example: 'much time · many trucks' },
  { topic: 'grammar', kind: 'rule', front: 'some / any', back: 'some — утверждение; any — вопрос/отрицание', example: 'I have some ideas. / Do you have any questions?' },
  { topic: 'grammar', kind: 'rule', front: 'for / since', back: 'for — период; since — точка начала', example: 'for 2 hours · since 9:00' },
  { topic: 'grammar', kind: 'rule', front: 'still / yet / already', back: 'still — всё ещё; yet — ещё? уже?; already — уже', example: 'still waiting · not yet · already done' },
  { topic: 'grammar', kind: 'rule', front: 'will vs going to', back: 'will — решение сейчас; going to — план', example: 'I will help. / I am going to rest.' },
  { topic: 'grammar', kind: 'rule', front: 'Comparative adjectives', back: 'короткие: -er; длинные: more + adj', example: 'faster · more important' },
  { topic: 'grammar', kind: 'rule', front: 'Countable vs uncountable', back: 'a/an/many — count; much/a little — uncount', example: 'a message · much information' },
  { topic: 'grammar', kind: 'rule', front: 'Polite softeners', back: 'Could / Would / Please делают просьбу мягче', example: 'Could you help me, please?' },
  { topic: 'grammar', kind: 'rule', front: 'Present Perfect idea', back: 'опыт/результат к настоящему: have/has + V3', example: 'I have already sent the email.' },
  { topic: 'grammar', kind: 'rule', front: 'go home (not go at home)', back: 'go home / get home — без at', example: 'After the gym I go home.' },
  { topic: 'grammar', kind: 'rule', front: 'have vs had', back: 'have — сейчас/обычно; had — в прошлом', example: 'We had a good vacation.' },

  // —— Past vs Present ——
  { topic: 'past-present', kind: 'phrase', front: 'I usually…', back: 'Обычно я…', example: 'I usually go to the gym.' },
  { topic: 'past-present', kind: 'phrase', front: 'Last time I…', back: 'В прошлый раз я…', example: 'Last time I visited Gdansk with my wife.' },
  { topic: 'past-present', kind: 'phrase', front: 'It was very nice', back: 'Это было очень приятно', example: 'It was a very nice trip.' },
  { topic: 'past-present', kind: 'phrase', front: 'We learned about…', back: 'Мы узнали о…', example: 'We learned more about Tricity.' },
  { topic: 'past-present', kind: 'phrase', front: 'I studied … years ago', back: 'Я учил(ся) … лет назад', example: 'I studied English more actively three years ago.' },
  { topic: 'past-present', kind: 'phrase', front: 'Now I just use what I know', back: 'Сейчас я просто использую то, что знаю', example: 'Now I just use what I know every day.' },
  { topic: 'past-present', kind: 'word', front: 'visited', back: 'посетил (Past)', example: 'I visited Poland last year.' },
  { topic: 'past-present', kind: 'word', front: 'spent', back: 'провёл (время) (Past)', example: 'We spent five days there.' },
  { topic: 'past-present', kind: 'rule', front: 'Past Simple —ed / irregular', back: 'факт в прошлом: V2', example: 'worked · went · had · learned' },
  { topic: 'past-present', kind: 'rule', front: 'Habits = Present Simple', back: 'привычки: every day / usually + V1', example: 'I go to the office before 8:00.' },

  // —— Plans & goals ——
  { topic: 'plans', kind: 'phrase', front: 'I would like to…', back: 'Я хотел бы…', example: 'I would like to become a logistician.' },
  { topic: 'plans', kind: 'phrase', front: 'I am going to…', back: 'Я собираюсь…', example: 'I am going to study for a logistics job.' },
  { topic: 'plans', kind: 'phrase', front: 'I will…', back: 'Я (сделаю)…', example: 'I will grow in this sphere.' },
  { topic: 'plans', kind: 'phrase', front: 'My goal is to…', back: 'Моя цель — …', example: 'My goal is to work with the USA marketplace.' },
  { topic: 'plans', kind: 'phrase', front: 'In the future I want to…', back: 'В будущем я хочу…', example: 'In the future I want to work as a logist.' },
  { topic: 'plans', kind: 'word', front: 'grow', back: 'расти (в карьере)', example: 'I want to grow in this sphere.' },
  { topic: 'plans', kind: 'word', front: 'marketplace', back: 'маркетплейс / площадка', example: 'I would like to find a job for the USA marketplace.' },
  { topic: 'plans', kind: 'rule', front: 'would like = soft want', back: 'вежливое «хочу»', example: 'I would like to add swimming.' },

  // —— Calls ——
  { topic: 'calls', kind: 'phrase', front: 'Speaking', back: 'Слушаю / у аппарата', example: 'Hello, Anton speaking.' },
  { topic: 'calls', kind: 'phrase', front: 'Who is calling?', back: 'Кто звонит?', example: 'Who is calling, please?' },
  { topic: 'calls', kind: 'phrase', front: 'The line is bad', back: 'Плохая связь', example: 'Sorry, the line is bad.' },
  { topic: 'calls', kind: 'phrase', front: 'Can you hear me?', back: 'Вы меня слышите?', example: 'Can you hear me now?' },
  { topic: 'calls', kind: 'phrase', front: 'I will put you on hold', back: 'Я поставлю вас на ожидание', example: 'Please hold, I will put you on hold.' },
  { topic: 'calls', kind: 'phrase', front: 'Thanks for calling', back: 'Спасибо за звонок', example: 'Thanks for calling. Bye.' },
  { topic: 'calls', kind: 'phrase', front: 'Could you call me back?', back: 'Можете перезвонить?', example: 'Could you call me back in 10 minutes?' },

  // —— Email / messages ——
  { topic: 'email', kind: 'phrase', front: 'Please find attached…', back: 'Во вложении…', example: 'Please find attached the CMR.' },
  { topic: 'email', kind: 'phrase', front: 'Just to confirm…', back: 'Просто чтобы подтвердить…', example: 'Just to confirm: unloading at 8:00.' },
  { topic: 'email', kind: 'phrase', front: 'Please advise', back: 'Прошу сообщить / подсказать', example: 'Please advise the new ETA.' },
  { topic: 'email', kind: 'phrase', front: 'Kind regards', back: 'С уважением', example: 'Kind regards, Anton' },
  { topic: 'email', kind: 'phrase', front: 'Sorry for the late reply', back: 'Извините за поздний ответ', example: 'Sorry for the late reply.' },
  { topic: 'email', kind: 'phrase', front: 'As discussed…', back: 'Как обсуждали…', example: 'As discussed, the truck is empty.' },
  { topic: 'email', kind: 'word', front: 'attachment', back: 'вложение', example: 'I sent the attachment.' },

  // —— Polite ——
  { topic: 'polite', kind: 'phrase', front: 'Could you please…?', back: 'Не могли бы вы…?', example: 'Could you please send the documents?' },
  { topic: 'polite', kind: 'phrase', front: 'Would you mind…?', back: 'Не возражаете…?', example: 'Would you mind waiting 10 minutes?' },
  { topic: 'polite', kind: 'phrase', front: 'I appreciate it', back: 'Я ценю это / спасибо', example: 'Thanks, I appreciate it.' },
  { topic: 'polite', kind: 'phrase', front: 'Sorry for the inconvenience', back: 'Извините за неудобства', example: 'Sorry for the inconvenience.' },
  { topic: 'polite', kind: 'phrase', front: 'If possible…', back: 'Если возможно…', example: 'If possible, please unload before 11.' },
  { topic: 'polite', kind: 'word', front: 'urgent', back: 'срочный', example: 'This is an urgent message.' },
  { topic: 'polite', kind: 'word', front: 'reliable', back: 'надёжный', example: 'He is a reliable driver.' },
  { topic: 'polite', kind: 'word', front: 'useful', back: 'полезный', example: 'This tip is very useful.' },
  { topic: 'polite', kind: 'word', front: 'borrow', back: 'взять взаймы', example: 'Can I borrow your pen?' },
  { topic: 'polite', kind: 'word', front: 'lend', back: 'дать взаймы', example: 'Can you lend me 10 euros?' },
  { topic: 'polite', kind: 'word', front: 'appoint', back: 'назначить (встречу/время)', example: 'Let us appoint a time.' },

  // —— On the road ——
  { topic: 'road', kind: 'phrase', front: 'I am running late', back: 'Я опаздываю', example: 'I am running late because of traffic.' },
  { topic: 'road', kind: 'phrase', front: 'There is a traffic jam', back: 'Пробка', example: 'There is a traffic jam near the border.' },
  { topic: 'road', kind: 'phrase', front: 'We have a problem with…', back: 'У нас проблема с…', example: 'We have a problem with the trailer.' },
  { topic: 'road', kind: 'phrase', front: 'The driver needs rest', back: 'Водителю нужен отдых', example: 'The driver needs rest now.' },
  { topic: 'road', kind: 'phrase', front: 'Waiting at the gate', back: 'Ждём у ворот', example: 'We are waiting at the gate.' },
  { topic: 'road', kind: 'word', front: 'border', back: 'граница', example: 'There is a queue at the border.' },
  { topic: 'road', kind: 'word', front: 'ferry', back: 'паром', example: 'After the ferry, go to parking.' },
  { topic: 'road', kind: 'word', front: 'fuel', back: 'топливо', example: 'We need fuel soon.' },

  // —— Describe your day ——
  { topic: 'describe-day', kind: 'phrase', front: 'First… Then… After that…', back: 'Сначала… Потом… После этого…', example: 'First I go to the office. Then I find orders. After that I go to the gym.' },
  { topic: 'describe-day', kind: 'phrase', front: 'On a normal day I…', back: 'В обычный день я…', example: 'On a normal day I go to the office before 8:00.' },
  { topic: 'describe-day', kind: 'phrase', front: 'I work as a…', back: 'Я работаю …', example: 'I work as a transport manager.' },
  { topic: 'describe-day', kind: 'phrase', front: 'I am happy with…', back: 'Я доволен…', example: 'I am very happy with my new job.' },
  { topic: 'describe-day', kind: 'phrase', front: 'In the evening I…', back: 'Вечером я…', example: 'In the evening I cook dinner.' },
  { topic: 'describe-day', kind: 'phrase', front: 'The main part of my job is…', back: 'Главная часть моей работы — …', example: 'The main part of my job is finding orders for drivers.' },
  { topic: 'describe-day', kind: 'rule', front: 'Structure: job → day → evening → goal', back: 'Говори блоками: работа, день, вечер, цель', example: 'I work as… / On a normal day… / In the evening… / My goal is…' },
]

function isTopicId(v: unknown): v is EnglishTopicId {
  return ENGLISH_TOPICS.some((t) => t.id === v)
}

function seedId(front: string, kind: EnglishCardKind): string {
  return `seed:${kind}:${front.toLowerCase().replace(/\s+/g, '-').slice(0, 48)}`
}

function cardFromSeed(seed: StarterSeed, now: number): EnglishCard {
  return {
    id: seedId(seed.front, seed.kind),
    front: seed.front,
    back: seed.back,
    example: seed.example,
    kind: seed.kind,
    topic: seed.topic,
    nextReview: now,
    intervalDays: 0,
    ease: 2.5,
    reps: 0,
  }
}

function newId(): string {
  return `card:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`
}

const SEED_TOPIC_BY_ID = new Map(
  STARTER.map((s) => [seedId(s.front, s.kind), s.topic] as const),
)

export function createEnglishCard(input: {
  front: string
  back: string
  example?: string
  kind?: EnglishCardKind
  topic?: EnglishTopicId
}): EnglishCard {
  const now = Date.now()
  return {
    id: newId(),
    front: input.front.trim(),
    back: input.back.trim(),
    example: (input.example ?? '').trim(),
    kind: input.kind ?? 'word',
    topic: input.topic ?? 'daily',
    nextReview: now,
    intervalDays: 0,
    ease: 2.5,
    reps: 0,
  }
}

function normalizeCard(raw: Partial<EnglishCard> & { topic?: unknown }): EnglishCard | null {
  if (!raw || typeof raw.front !== 'string' || typeof raw.back !== 'string') {
    return null
  }
  const front = raw.front.trim()
  const back = raw.back.trim()
  if (!front || !back) return null
  const kind: EnglishCardKind =
    raw.kind === 'phrase' || raw.kind === 'rule' || raw.kind === 'word'
      ? raw.kind
      : 'word'
  const id = typeof raw.id === 'string' && raw.id ? raw.id : newId()
  const topic: EnglishTopicId = isTopicId(raw.topic)
    ? raw.topic
    : (SEED_TOPIC_BY_ID.get(id) ?? 'daily')
  return {
    id,
    front,
    back,
    example: typeof raw.example === 'string' ? raw.example : '',
    kind,
    topic,
    nextReview: Number.isFinite(raw.nextReview) ? Number(raw.nextReview) : Date.now(),
    intervalDays: Number.isFinite(raw.intervalDays) ? Math.max(0, Number(raw.intervalDays)) : 0,
    ease: Number.isFinite(raw.ease) ? Math.max(1.3, Number(raw.ease)) : 2.5,
    reps: Number.isFinite(raw.reps) ? Math.max(0, Number(raw.reps)) : 0,
  }
}

export function loadEnglishCards(): EnglishCard[] {
  const now = Date.now()
  const seeded = STARTER.map((s) => cardFromSeed(s, now))
  const raw = localStorage.getItem(ENGLISH_STORAGE_KEY)

  if (!raw) {
    saveEnglishCards(seeded)
    return seeded
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) throw new Error('bad')
    const cards = parsed
      .map((c) => normalizeCard(c as Partial<EnglishCard>))
      .filter((c): c is EnglishCard => c != null)

    if (cards.length === 0) {
      saveEnglishCards(seeded)
      return seeded
    }

    const byId = new Set(cards.map((c) => c.id))
    const missing = seeded.filter((s) => !byId.has(s.id))
    // Backfill topic on old cards when possible
    let topicFixed = false
    const withTopics = cards.map((c) => {
      if (isTopicId(c.topic)) return c
      const fromSeed = SEED_TOPIC_BY_ID.get(c.id)
      if (!fromSeed) return c
      topicFixed = true
      return { ...c, topic: fromSeed }
    })
    if (missing.length === 0 && !topicFixed) return withTopics

    const merged = [...withTopics, ...missing]
    saveEnglishCards(merged)
    return merged
  } catch {
    saveEnglishCards(seeded)
    return seeded
  }
}

export function saveEnglishCards(cards: EnglishCard[]): void {
  localStorage.setItem(ENGLISH_STORAGE_KEY, JSON.stringify(cards))
}

export function dueEnglishCards(
  cards: EnglishCard[],
  now = Date.now(),
): EnglishCard[] {
  return cards
    .filter((c) => c.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview || a.front.localeCompare(b.front))
}

export function cardsForTopic(
  cards: EnglishCard[],
  topic: EnglishTopicId | 'all',
): EnglishCard[] {
  if (topic === 'all') return cards
  return cards.filter((c) => c.topic === topic)
}

/** Simple spaced-repetition step after a grade. */
export function gradeEnglishCard(
  card: EnglishCard,
  grade: EnglishGrade,
  now = Date.now(),
): EnglishCard {
  let { intervalDays, ease, reps } = card

  if (grade === 'again') {
    reps = 0
    intervalDays = 0
    ease = Math.max(1.3, ease - 0.2)
    return {
      ...card,
      reps,
      intervalDays,
      ease,
      nextReview: now + 10 * 60 * 1000,
    }
  }

  if (grade === 'good') {
    if (reps === 0) intervalDays = 1
    else if (reps === 1) intervalDays = 3
    else intervalDays = Math.max(1, Math.round(intervalDays * ease))
    reps += 1
  } else {
    if (reps === 0) intervalDays = 2
    else if (reps === 1) intervalDays = 5
    else intervalDays = Math.max(2, Math.round(intervalDays * ease * 1.3))
    ease = Math.min(3.0, ease + 0.15)
    reps += 1
  }

  return {
    ...card,
    reps,
    intervalDays,
    ease,
    nextReview: now + intervalDays * 24 * 60 * 60 * 1000,
  }
}

export const ENGLISH_TIPS: { title: string; body: string; example: string }[] = [
  {
    title: 'Polite requests',
    body: 'Вместо “Send CMR” лучше: “Could you please send the CMR?”',
    example: 'Could you please confirm the unloading time?',
  },
  {
    title: 'at / on / in',
    body: 'at — точное время; on — день/дата; in — месяц, год, период.',
    example: 'at 6:00 · on Monday · in the morning',
  },
  {
    title: 'will vs going to',
    body: 'will — решение сейчас / обещание; going to — уже запланировано.',
    example: 'I will call the driver. / We are going to unload at 8.',
  },
  {
    title: 'Articles a / an',
    body: 'Смотри на звук, не на букву: an hour, a European truck.',
    example: 'an ETA · a warehouse · an order',
  },
  {
    title: 'Sorry + reason',
    body: 'Извинение + because / due to звучит профессионально.',
    example: 'Sorry for the delay due to traffic.',
  },
  {
    title: 'Confirm clearly',
    body: 'В диспетчерских сообщениях заканчивай вопросом на подтверждение.',
    example: 'Everything clear? Please confirm.',
  },
  {
    title: 'Structure your answer',
    body: 'Говори блоками: работа → обычный день → вечер → цель.',
    example: 'I work as… On a normal day… In the evening… My goal is…',
  },
  {
    title: 'go home',
    body: 'После движения: go home / get home — без “at”.',
    example: 'After the gym I go home and cook dinner.',
  },
]
