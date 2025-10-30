/**
 * Parser HTML para Estrutura de Documento
 * Converte HTML extraído de DOCX em estrutura preservando elementos complexos
 */

import { DocumentElement, DocumentStructure, ElementType } from './documentStructure'

/**
 * Converte HTML em estrutura de documento preservando elementos
 */
export const parseHtmlToStructure = (html: string): DocumentStructure => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const elements: DocumentElement[] = []
  
  const stats = {
    titles: 0,
    subtitles: 0,
    paragraphs: 0
  }

  const processNode = (node: Node): void => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      const tagName = element.tagName.toLowerCase()

      // Tabelas - preservar intactas (ignorar tabelas aninhadas)
      if (tagName === 'table') {
        // Ignorar tabelas que estão dentro de células (tabelas aninhadas)
        if (element.closest('td')) {
          console.log('⚠️ Tabela aninhada ignorada')
          return
        }
        
        const tableData = extractTableData(element)
        
        // Validar se tabela foi extraída corretamente
        const isValidTable = tableData.length > 0 && 
                            tableData[0].length > 1 &&
                            tableData[0][0].length < 500
        
        if (!isValidTable) {
          console.log('⚠️ Tabela com formato inválido, tentando extrair texto:', {
            rows: tableData.length,
            firstCellLength: tableData[0]?.[0]?.length || 0
          })
        }
        
        elements.push({
          type: 'table',
          content: element.outerHTML,
          originalHtml: element.outerHTML,
          preserveAsIs: true,
          metadata: {
            tableData,
            rows: element.querySelectorAll('tr').length,
            columns: element.querySelector('tr')?.querySelectorAll('td, th').length || 0,
            isValid: isValidTable
          }
        })
        return
      }

      // Imagens - preservar
      if (tagName === 'img') {
        const img = element as HTMLImageElement
        elements.push({
          type: 'image',
          content: img.alt || 'Imagem',
          originalHtml: element.outerHTML,
          preserveAsIs: true,
          metadata: {
            imageUrl: img.src,
            imageData: img.src
          }
        })
        return
      }

      // Citações - preservar formatação especial
      if (tagName === 'blockquote') {
        elements.push({
          type: 'quote',
          content: element.textContent?.trim() || '',
          originalHtml: element.outerHTML,
          preserveAsIs: true,
          metadata: {
            isQuote: true
          }
        })
        return
      }

      // Listas - preservar estrutura
      if (tagName === 'ul' || tagName === 'ol') {
        elements.push({
          type: 'list',
          content: element.textContent?.trim() || '',
          originalHtml: element.outerHTML,
          preserveAsIs: true,
          metadata: {
            listType: tagName === 'ol' ? 'ordered' : 'unordered'
          }
        })
        return
      }

      // Código - preservar
      if (tagName === 'pre' || tagName === 'code') {
        elements.push({
          type: 'code',
          content: element.textContent?.trim() || '',
          originalHtml: element.outerHTML,
          preserveAsIs: true
        })
        return
      }

      // Parágrafos - analisar se é título ou parágrafo
      if (tagName === 'p' || tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
        const text = element.textContent?.trim() || ''
        
        if (!text) {
          // Processa filhos de elementos vazios
          Array.from(element.childNodes).forEach(processNode)
          return
        }

        // Detectar se é título
        const isTitle = tagName.startsWith('h') || isTitlePattern(text)
        
        if (isTitle) {
          const level = tagName === 'h1' ? 1 : tagName === 'h2' ? 2 : getTitleLevel(text)
          elements.push({
            type: level === 1 ? 'title' : 'subtitle',
            content: text,
            level,
            needsFormatting: true
          })
          
          if (level === 1) {
            stats.titles++
          } else {
            stats.subtitles++
          }
        } else {
          elements.push({
            type: 'paragraph',
            content: text,
            needsFormatting: true
          })
          stats.paragraphs++
        }
        return
      }

      // Processa filhos recursivamente
      Array.from(element.childNodes).forEach(processNode)
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        elements.push({
          type: 'paragraph',
          content: text,
          needsFormatting: true
        })
        stats.paragraphs++
      }
    }
  }

  Array.from(doc.body.childNodes).forEach(processNode)

  return { elements, stats }
}

/**
 * Extrai dados de uma tabela HTML
 */
const extractTableData = (table: Element): any[][] => {
  const rows: any[][] = []
  
  // Extrair apenas TR diretos (não de tabelas aninhadas)
  const trs = Array.from(table.children).filter(child => 
    child.tagName === 'TBODY' || child.tagName === 'THEAD'
  ).flatMap(section => Array.from(section.children))
  
  // Se não encontrou TBODY/THEAD, pegar TRs diretos
  const directTrs = trs.length > 0 ? trs : Array.from(table.querySelectorAll(':scope > tr'))
  
  console.log('📊 Extraindo tabela:', {
    totalLinhas: directTrs.length,
    html: table.outerHTML.substring(0, 200)
  })
  
  directTrs.forEach((tr, rowIndex) => {
    if (tr.tagName !== 'TR') return
    
    const cells: string[] = []
    // Pegar apenas TD/TH diretos, não de tabelas aninhadas
    const tdElements = Array.from(tr.children).filter(child => 
      child.tagName === 'TD' || child.tagName === 'TH'
    )
    
    tdElements.forEach(cell => {
      // Se célula contém tabela aninhada, extrair texto sem a tabela
      const nestedTable = cell.querySelector('table')
      if (nestedTable) {
        const textWithoutTable = Array.from(cell.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeName !== 'TABLE' && !node.contains(nestedTable)))
          .map(node => node.textContent?.trim() || '')
          .join(' ')
          .trim()
        cells.push(textWithoutTable)
      } else {
        cells.push(cell.textContent?.trim() || '')
      }
    })
    
    if (cells.length > 0) {
      rows.push(cells)
      console.log(`  Linha ${rowIndex}: ${cells.length} células`, cells)
    }
  })
  
  console.log('✅ Tabela extraída:', rows.length, 'linhas')
  return rows
}

/**
 * Verifica se uma linha é um título baseado em padrões
 */
const isTitlePattern = (line: string): boolean => {
  const trimmed = line.trim()
  
  if (!trimmed || trimmed.length < 2) return false
  if (trimmed.length > 200) return false
  
  // Detectar títulos numerados: 1, 1.1, 2.1, 2.2, 2.2.1, etc.
  const hasNumbering = /^\d+(\.\d+)*\.?\s+/.test(trimmed)
  if (hasNumbering) {
    console.log('✅ Título numerado detectado:', trimmed.substring(0, 80))
    return true
  }
  
  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]/.test(trimmed)
  
  const COMMON_TITLE_KEYWORDS = [
    'INTRODUÇÃO', 'DESENVOLVIMENTO', 'CONCLUSÃO', 'REFERÊNCIAS',
    'BIBLIOGRAFIA', 'RESUMO', 'ABSTRACT', 'METODOLOGIA',
    'RESULTADOS', 'DISCUSSÃO', 'CONSIDERAÇÕES FINAIS',
    'AGRADECIMENTOS', 'SUMÁRIO', 'LISTA DE', 'ANEXO', 'APÊNDICE'
  ]
  
  const hasKeyword = COMMON_TITLE_KEYWORDS.some(keyword => 
    trimmed.toUpperCase().includes(keyword)
  )
  
  const isShortWithoutPeriod = trimmed.length < 80 && !trimmed.endsWith('.')
  
  return isAllCaps || hasKeyword || (isShortWithoutPeriod && hasKeyword)
}

/**
 * Determina o nível do título
 */
const getTitleLevel = (line: string): number => {
  const trimmed = line.trim()
  
  // Detectar numeração: 1 = nível 1, 1.1 = nível 2, 1.1.1 = nível 3, 2.1 = nível 2
  const numberingMatch = trimmed.match(/^(\d+(\.\d+)*)\.?\s+/)
  if (numberingMatch) {
    const numbering = numberingMatch[1]
    const dots = (numbering.match(/\./g) || []).length
    const level = dots + 1
    console.log(`📊 Nível detectado para "${trimmed.substring(0, 50)}": nível ${level} (${dots} pontos)`)
    return Math.min(level, 3) // Máximo nível 3
  }
  
  const mainKeywords = ['INTRODUÇÃO', 'CONCLUSÃO', 'REFERÊNCIAS', 'DESENVOLVIMENTO', 'RESUMO', 'ABSTRACT']
  if (mainKeywords.some(keyword => trimmed.toUpperCase().includes(keyword))) {
    return 1
  }
  
  if (trimmed === trimmed.toUpperCase()) {
    return 1
  }
  
  return 2
}
