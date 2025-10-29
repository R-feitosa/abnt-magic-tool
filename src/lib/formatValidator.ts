/**
 * Validador de Formatação ABNT
 * Verifica se elementos já estão formatados corretamente
 */

export interface FormatValidation {
  isValid: boolean
  issues: string[]
}

/**
 * Valida se um elemento de texto está formatado segundo ABNT
 */
export const validateABNTFormat = (
  element: HTMLElement | null,
  type: 'title' | 'subtitle' | 'paragraph'
): FormatValidation => {
  if (!element) {
    return { isValid: false, issues: ['Elemento não encontrado'] }
  }

  const issues: string[] = []
  const computedStyle = window.getComputedStyle(element)

  // Verificar fonte (Times New Roman ou Arial, 12pt)
  const fontFamily = computedStyle.fontFamily.toLowerCase()
  const validFonts = ['times new roman', 'times', 'arial', 'calibri']
  const hasValidFont = validFonts.some(font => fontFamily.includes(font))
  
  if (!hasValidFont) {
    issues.push('Fonte não é Times New Roman ou Arial')
  }

  // Verificar tamanho da fonte (12pt = 16px aprox)
  const fontSize = parseFloat(computedStyle.fontSize)
  if (fontSize < 15 || fontSize > 17) {
    issues.push('Tamanho da fonte não é 12pt')
  }

  // Verificar espaçamento de linha (1.5 para parágrafos)
  if (type === 'paragraph') {
    const lineHeight = computedStyle.lineHeight
    const lineHeightNum = lineHeight === 'normal' ? 1.2 : parseFloat(lineHeight) / fontSize
    
    if (lineHeightNum < 1.4 || lineHeightNum > 1.6) {
      issues.push('Espaçamento de linha não é 1.5')
    }

    // Verificar alinhamento (justificado)
    const textAlign = computedStyle.textAlign
    if (textAlign !== 'justify') {
      issues.push('Texto não está justificado')
    }

    // Verificar recuo de primeira linha (1.25cm = ~47px)
    const textIndent = parseFloat(computedStyle.textIndent)
    if (textIndent < 40 || textIndent > 55) {
      issues.push('Recuo de primeira linha não é 1.25cm')
    }
  }

  // Títulos devem estar em negrito
  if (type === 'title' || type === 'subtitle') {
    const fontWeight = computedStyle.fontWeight
    if (parseInt(fontWeight) < 600 && fontWeight !== 'bold') {
      issues.push('Título não está em negrito')
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Verifica se um parágrafo precisa de formatação ABNT
 */
export const needsFormatting = (text: string, context?: any): boolean => {
  // Sempre formatar parágrafos de texto normal
  if (!context?.preserveAsIs) {
    return true
  }
  
  return false
}

/**
 * Valida margens ABNT (3cm superior, 2cm direita, 2cm inferior, 3cm esquerda)
 */
export const validateMargins = (element: HTMLElement): FormatValidation => {
  const issues: string[] = []
  const computedStyle = window.getComputedStyle(element)

  // Em um documento web, validar margens é complexo
  // Esta é uma validação simplificada
  const marginTop = parseFloat(computedStyle.marginTop)
  const marginBottom = parseFloat(computedStyle.marginBottom)

  if (marginTop < 0 || marginTop > 50) {
    issues.push('Margem superior precisa ajuste')
  }

  if (marginBottom < 0 || marginBottom > 50) {
    issues.push('Margem inferior precisa ajuste')
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}
