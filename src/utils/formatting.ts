/**
 * Utilitários de formatação para exibição no frontend.
 * 
 * Contém funções para formatar nomes de dias da semana.
 */

/**
 * Retorna o nome completo do dia da semana (0=Domingo, 1=Segunda-feira, etc)
 */
export function getDayName(day: number): string {
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ]
  return days[day] || ''
}
