/**
 * Sistema de Limpeza e Correção de Texto
 * Remove espaçamentos excessivos, corrige pontuação e normaliza formatação
 */

interface CleaningStats {
  multipleSpacesRemoved: number
  punctuationFixed: number
  lineBreaksNormalized: number
  excessiveSpacingRemoved: number
  tabsConverted: number
  totalChanges: number
}

/**
 * Remove espaços múltiplos (2 ou mais espaços consecutivos)
 */
export const cleanMultipleSpaces = (text: string): { text: string; count: number } => {
  let count = 0
  const cleaned = text.replace(/ {2,}/g, (match) => {
    count += match.length - 1
    return ' '
  })
  return { text: cleaned, count }
}

/**
 * Remove espaços antes de pontuação
 */
export const fixPunctuation = (text: string): { text: string; count: number } => {
  let count = 0
  const cleaned = text.replace(/ +([.,;:!?])/g, (match) => {
    count++
    return match.trim()
  })
  return { text: cleaned, count }
}

/**
 * Normaliza quebras de linha (máximo 2 consecutivas)
 */
export const normalizeLineBreaks = (text: string): { text: string; count: number } => {
  let count = 0
  const cleaned = text.replace(/\n{3,}/g, (match) => {
    count += match.length - 2
    return '\n\n'
  })
  return { text: cleaned, count }
}

/**
 * Remove espaços no início e fim de cada parágrafo
 */
export const trimParagraphs = (text: string): { text: string; count: number } => {
  let count = 0
  const lines = text.split('\n')
  const trimmed = lines.map(line => {
    const original = line.length
    const trimmedLine = line.trim()
    count += original - trimmedLine.length
    return trimmedLine
  })
  return { text: trimmed.join('\n'), count }
}

/**
 * Detecta e corrige espaçamentos grandes que causam problemas em texto justificado
 * Remove sequências de 3+ espaços que aparecem no meio do texto
 */
export const fixJustificationSpacing = (text: string): { text: string; count: number } => {
  let count = 0
  const cleaned = text.replace(/(\S) {3,}(\S)/g, (match, before, after) => {
    count += match.length - 3
    return `${before} ${after}`
  })
  return { text: cleaned, count }
}

/**
 * Converte tabs para espaços
 */
export const normalizeWhitespace = (text: string): { text: string; count: number } => {
  let count = 0
  const cleaned = text.replace(/\t/g, () => {
    count++
    return ' '
  })
  return { text: cleaned, count }
}

/**
 * Remove espaçamentos excessivos (3+ espaços) em qualquer contexto
 */
export const removeExcessiveSpacing = (text: string): { text: string; count: number } => {
  let count = 0
  const cleaned = text.replace(/ {3,}/g, (match) => {
    count += match.length - 1
    return ' '
  })
  return { text: cleaned, count }
}

/**
 * Função principal que aplica todas as correções na ordem adequada
 */
export const cleanText = (text: string): { text: string; stats: CleaningStats } => {
  const stats: CleaningStats = {
    multipleSpacesRemoved: 0,
    punctuationFixed: 0,
    lineBreaksNormalized: 0,
    excessiveSpacingRemoved: 0,
    tabsConverted: 0,
    totalChanges: 0
  }

  let cleaned = text

  // 1. Converter tabs para espaços
  const step1 = normalizeWhitespace(cleaned)
  cleaned = step1.text
  stats.tabsConverted = step1.count

  // 2. Normalizar quebras de linha
  const step2 = normalizeLineBreaks(cleaned)
  cleaned = step2.text
  stats.lineBreaksNormalized = step2.count

  // 3. Limpar espaços no início/fim de parágrafos
  const step3 = trimParagraphs(cleaned)
  cleaned = step3.text

  // 4. Corrigir espaçamentos de justificação
  const step4 = fixJustificationSpacing(cleaned)
  cleaned = step4.text
  stats.excessiveSpacingRemoved = step4.count

  // 5. Remover espaços múltiplos
  const step5 = cleanMultipleSpaces(cleaned)
  cleaned = step5.text
  stats.multipleSpacesRemoved = step5.count

  // 6. Corrigir pontuação
  const step6 = fixPunctuation(cleaned)
  cleaned = step6.text
  stats.punctuationFixed = step6.count

  // Calcular total de mudanças
  stats.totalChanges = 
    stats.multipleSpacesRemoved +
    stats.punctuationFixed +
    stats.lineBreaksNormalized +
    stats.excessiveSpacingRemoved +
    stats.tabsConverted

  return { text: cleaned, stats }
}
