/**
 * Sistema de Detecção Inteligente de Estrutura de Documentos
 * Identifica títulos, subtítulos e parágrafos automaticamente
 */

export type ElementType = 
  | 'title' 
  | 'subtitle' 
  | 'paragraph'
  | 'table'
  | 'image'
  | 'quote'
  | 'list'
  | 'code'
  | 'page-break'
  | 'unknown'

export interface DocumentElement {
  type: ElementType
  content: string | any
  level?: number
  originalHtml?: string
  preserveAsIs?: boolean
  needsFormatting?: boolean
  metadata?: {
    tableData?: any
    imageUrl?: string
    imageData?: string
    listType?: 'ordered' | 'unordered'
    isQuote?: boolean
    rows?: number
    columns?: number
  }
}

export interface DocumentStructure {
  elements: DocumentElement[]
  stats: {
    titles: number
    subtitles: number
    paragraphs: number
  }
}

/**
 * Palavras-chave comuns em títulos de trabalhos acadêmicos
 */
const COMMON_TITLE_KEYWORDS = [
  'INTRODUÇÃO',
  'DESENVOLVIMENTO',
  'CONCLUSÃO',
  'REFERÊNCIAS',
  'BIBLIOGRAFIA',
  'RESUMO',
  'ABSTRACT',
  'METODOLOGIA',
  'RESULTADOS',
  'DISCUSSÃO',
  'CONSIDERAÇÕES FINAIS',
  'AGRADECIMENTOS',
  'SUMÁRIO',
  'LISTA DE',
  'ANEXO',
  'APÊNDICE'
]

/**
 * Verifica se uma linha é um título baseado em padrões
 */
const isTitlePattern = (line: string): boolean => {
  const trimmed = line.trim()
  
  if (!trimmed || trimmed.length < 2) return false
  
  // Verifica se é muito longa para ser título
  if (trimmed.length > 150) return false
  
  // Verifica se está toda em MAIÚSCULAS
  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(trimmed)
  
  // Verifica se contém palavras-chave comuns
  const hasKeyword = COMMON_TITLE_KEYWORDS.some(keyword => 
    trimmed.toUpperCase().includes(keyword)
  )
  
  // Verifica se começa com numeração (1., 1.1, a), etc.)
  const hasNumbering = /^(\d+\.)+\s+/.test(trimmed) || /^[a-z]\)\s+/.test(trimmed)
  
  // Verifica se é curta e não termina com ponto (indicativo de título)
  const isShortWithoutPeriod = trimmed.length < 80 && !trimmed.endsWith('.')
  
  return isAllCaps || hasKeyword || hasNumbering || (isShortWithoutPeriod && hasKeyword)
}

/**
 * Determina o nível do título (1 = principal, 2 = subtítulo, etc.)
 */
const getTitleLevel = (line: string): number => {
  const trimmed = line.trim()
  
  // Detecta numeração do tipo 1., 1.1., 1.1.1.
  const numberingMatch = trimmed.match(/^(\d+\.)+/)
  if (numberingMatch) {
    const dots = (numberingMatch[0].match(/\./g) || []).length
    return dots
  }
  
  // Títulos com palavras-chave principais são nível 1
  const mainKeywords = ['INTRODUÇÃO', 'CONCLUSÃO', 'REFERÊNCIAS', 'DESENVOLVIMENTO', 'RESUMO', 'ABSTRACT']
  if (mainKeywords.some(keyword => trimmed.toUpperCase().includes(keyword))) {
    return 1
  }
  
  // Se for toda em maiúsculas sem numeração, provavelmente nível 1
  if (trimmed === trimmed.toUpperCase()) {
    return 1
  }
  
  // Caso contrário, subtítulo (nível 2)
  return 2
}

/**
 * Analisa um documento e retorna sua estrutura
 */
export const analyzeDocument = (text: string): DocumentStructure => {
  const lines = text.split('\n')
  const elements: DocumentElement[] = []
  let currentParagraph: string[] = []
  
  const stats = {
    titles: 0,
    subtitles: 0,
    paragraphs: 0
  }
  
  const finishParagraph = () => {
    if (currentParagraph.length > 0) {
      const content = currentParagraph.join(' ').trim()
      if (content) {
        elements.push({
          type: 'paragraph',
          content
        })
        stats.paragraphs++
      }
      currentParagraph = []
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Linha vazia - pode indicar fim de parágrafo
    if (!line) {
      finishParagraph()
      continue
    }
    
    // Verifica se é um título
    if (isTitlePattern(line)) {
      finishParagraph()
      
      const level = getTitleLevel(line)
      elements.push({
        type: level === 1 ? 'title' : 'subtitle',
        content: line,
        level
      })
      
      if (level === 1) {
        stats.titles++
      } else {
        stats.subtitles++
      }
    } else {
      // É parte de um parágrafo
      currentParagraph.push(line)
    }
  }
  
  // Finalizar último parágrafo se houver
  finishParagraph()
  
  // Se não encontrou nenhum título, trata tudo como parágrafos
  if (stats.titles === 0 && stats.subtitles === 0 && elements.length > 0) {
    // Reagrupa tudo em parágrafos
    const allText = elements.map(e => e.content).join('\n\n')
    const paragraphs = allText.split(/\n\n+/).filter(p => p.trim())
    
    return {
      elements: paragraphs.map(p => ({
        type: 'paragraph',
        content: p.trim()
      })),
      stats: {
        titles: 0,
        subtitles: 0,
        paragraphs: paragraphs.length
      }
    }
  }
  
  return { elements, stats }
}
