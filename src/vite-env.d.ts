/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Sobrescreve a URL da planilha Superior + Pós-Grad (ex.: export Google Sheets). */
  readonly VITE_EXCEL_SUPERIOR_POSGRAD_URL?: string
  /** Sobrescreve a URL de export da planilha Cursos Técnicos — Manhã. */
  readonly VITE_EXCEL_TECNICOS_MANHA_URL?: string
  /** Sobrescreve a URL de export da planilha Cursos Técnicos — Tarde. */
  readonly VITE_EXCEL_TECNICOS_TARDE_URL?: string
  /** Sobrescreve a URL de export da planilha Avisos/Eventos. */
  readonly VITE_EXCEL_AVISOS_URL?: string
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}
