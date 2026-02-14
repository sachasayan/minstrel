import type { EditorThemeClasses } from 'lexical'

export const theme: EditorThemeClasses = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'mb-4 leading-relaxed font-serif text-lg text-neutral-900 dark:text-neutral-100',
  quote: 'border-l-4 border-highlight-300 pl-4 italic my-4',
  heading: {
    h1: 'text-4xl font-bold my-8 text-highlight-700 font-sans',
    h2: 'text-3xl font-semibold my-8 text-highlight-700 font-sans',
    h3: 'text-2xl font-medium my-8 text-highlight-700 font-sans',
    h4: 'text-xl font-semibold my-8 text-highlight-700 font-sans',
    h5: 'text-lg font-medium my-8 text-highlight-700 font-sans',
    h6: 'text-base font-semibold my-8 text-highlight-700 font-sans'
  },
  list: {
    nested: {
      listitem: 'list-none'
    },
    ol: 'list-decimal pl-8 my-4',
    ul: 'list-disc pl-8 my-4',
    listitem: 'mb-2'
  },
  image: 'editor-image',
  link: 'text-blue-600 underline cursor-pointer',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    underlineStrikethrough: 'underline line-through'
  },
  code: 'bg-neutral-200 dark:bg-neutral-800 rounded px-1 font-mono text-sm'
}
