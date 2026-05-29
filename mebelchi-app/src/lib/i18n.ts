/**
 * Minimal i18n — RU (default) / UZ Latin.
 *
 * HANDOVER §11 explicitly defers full UZ translation to a later sprint.
 * This covers the high-visibility strings so the language toggle in
 * Settings produces an obvious effect.
 *
 * Usage:
 *   const t = useT();
 *   <Text>{t('save')}</Text>
 */
import { useUI } from '@/store/uiStore';

const RU = {
  /* Brand / tags */
  brand_tag_home:    'КУХНИ',
  brand_tag_studio:  'STUDIO',

  /* Home */
  home_recent:       'Недавние',
  home_new_kitchen:  'Новая кухня',
  home_tip_title:    'Соберите кухню за 5 минут',
  home_tip_body:     'Выберите длину стены, цвет фасадов и тип шкафов. Смета и раскрой — автоматически.',

  /* Studio chrome */
  cost_label:        'Стоимость',
  currency:          'сум',
  unit_mm:           'мм',
  save:              'Сохранить',
  material:          'материал',
  variant:           'Вариант',
  adjacency_warn:    '⚠  Раковина рядом с плитой',

  /* Selection pill */
  pill_color:        'Цвет фасада',
  pill_hint:         'tap door · tap handle · tap worktop · tap sink · tap stove',

  /* Material drawer */
  palette_title:     'Палитра кухни  ·  6 вариантов',
  palette_toast:     'Палитра:',

  /* Setup wizard */
  setup_title:       'Настроим ваш цех',
  setup_subtitle:    'Эти настройки применятся ко всем будущим кухням',
  setup_name:        'Название цеха',
  setup_supplier:    'Поставщик ЛДСП',
  setup_thickness:   'Толщина ЛДСП',
  setup_thickness_hint: 'Используется по умолчанию для корпусов',
  setup_hardware:    'Бренд фурнитуры',
  setup_hardware_hint:  'Можно поменять для каждой кухни',
  setup_start:       'Начать работу',
  setup_shop_default:'Мебельный цех',

  /* Settings */
  settings_title:    'Настройки',
  settings_shop:     'Цех',
  settings_name:     'Название',
  settings_lang:     'Язык интерфейса',
  settings_about:    'О приложении',
  settings_version:  'Версия',
  settings_build:    'Сборка',
  lang_ru:           'Русский',
  lang_uz:           "O'zbek",

  /* Lock */
  lock_ldsp:         'ЛДСП',
  lock_hardware:     'Фурнитура',
  lock_edge:         'Кромка',
  lock_labor:        'Работа',
  lock_usage:        'Использование листа',
  lock_share_pdf:    'Поделиться PDF',
  lock_send_tg:      'Отправить в Telegram',
} as const;

type Key = keyof typeof RU;

const UZ: Record<Key, string> = {
  brand_tag_home:    'OSHXONALAR',
  brand_tag_studio:  'STUDIO',

  home_recent:       "So'nggi",
  home_new_kitchen:  'Yangi oshxona',
  home_tip_title:    'Oshxonani 5 daqiqada yig\'ing',
  home_tip_body:     "Devor uzunligi, fasad rangi va shkaf turini tanlang. Smeta va kesim — avtomatik.",

  cost_label:        'Narx',
  currency:          "so'm",
  unit_mm:           'mm',
  save:              'Saqlash',
  material:          'material',
  variant:           'Variant',
  adjacency_warn:    '⚠  Mojka plita yonida',

  pill_color:        'Fasad rangi',
  pill_hint:         'eshik · dasta · ish stoli · mojka · plita',

  palette_title:     "Oshxona palettasi  ·  6 variant",
  palette_toast:     'Palette:',

  setup_title:       "Sexingizni sozlaymiz",
  setup_subtitle:    "Bu sozlamalar barcha kelajakdagi oshxonalarga qo'llaniladi",
  setup_name:        "Sex nomi",
  setup_supplier:    "LDSP yetkazib beruvchi",
  setup_thickness:   "LDSP qalinligi",
  setup_thickness_hint: "Korpuslar uchun standart",
  setup_hardware:    "Furnitura brendi",
  setup_hardware_hint: "Har oshxona uchun o'zgartirish mumkin",
  setup_start:       "Ishni boshlash",
  setup_shop_default:"Mebel sexi",

  settings_title:    "Sozlamalar",
  settings_shop:     "Sex",
  settings_name:     "Nomi",
  settings_lang:     "Interfeys tili",
  settings_about:    "Ilova haqida",
  settings_version:  "Versiya",
  settings_build:    "Build",
  lang_ru:           "Ruscha",
  lang_uz:           "O'zbek",

  lock_ldsp:         'LDSP',
  lock_hardware:     'Furnitura',
  lock_edge:         'Kromka',
  lock_labor:        'Ish',
  lock_usage:        'List foydalanishi',
  lock_share_pdf:    "PDF bilan ulashish",
  lock_send_tg:      "Telegram'ga yuborish",
};

type Lang = 'ru' | 'uz';
const TABLE: Record<Lang, Record<Key, string>> = { ru: RU, uz: UZ };

/** Translator hook — subscribes to lang, returns t(key). */
export function useT(): (key: Key) => string {
  const lang = useUI((s) => s.language) as Lang;
  return (key) => TABLE[lang][key] ?? RU[key];
}

export type TKey = Key;
