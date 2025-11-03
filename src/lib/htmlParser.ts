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

      // Tabelas - preservar intactas
      if (tagName === 'table') {
        // NÃO ignorar tabelas - processar todas
        const tableData = extractTableData(element)
        
        console.log('📊 Tabela detectada:', {
          rows: tableData.length,
          cols: tableData[0]?.length || 0,
          firstCell: tableData[0]?.[0]?.substring(0, 30)
        })
        
        // Validar apenas se tem conteúdo
        const hasContent = tableData.length > 0 && tableData[0].length > 0
        
        if (!hasContent) {
          console.log('⚠️ Tabela vazia, ignorando')
          return
        }
        
        elements.push({
          type: 'table',
          content: element.outerHTML,
          originalHtml: element.outerHTML,
          preserveAsIs: true,
          metadata: {
            tableData,
            rows: tableData.length,
            columns: tableData[0]?.length || 0,
            isValid: true
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
        
        console.log('🔍 Analisando elemento:', { 
          text: text.substring(0, 50), 
          tagName, 
          isTitle,
          isTitlePattern: isTitlePattern(text)
        })
        
        if (isTitle) {
          const level = tagName === 'h1' ? 1 : tagName === 'h2' ? 2 : getTitleLevel(text)
          
          console.log('✅ Elemento classificado como título:', {
            text: text.substring(0, 50),
            level,
            type: level === 1 ? 'title' : 'subtitle'
          })
          
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
  
  // NOVO: Verificar se a primeira célula contém uma tabela aninhada
  const firstCell = table.querySelector('td, th')
  const nestedTable = firstCell?.querySelector('table')
  
  if (nestedTable) {
    console.log('🔄 Detectada tabela aninhada, extraindo tabela interna recursivamente...')
    return extractTableData(nestedTable) // Recursão para extrair a tabela real
  }
  
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
      const cellNestedTable = cell.querySelector('table')
      if (cellNestedTable) {
        const textWithoutTable = Array.from(cell.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeName !== 'TABLE' && !node.contains(cellNestedTable)))
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
  const hasMainNumbering = /^\d+\s+/.test(trimmed) // "2 TÍTULO"
  const hasSubNumbering = /^\d+(\.\d+)+\.?\s+/.test(trimmed) // "2.1 SUBTÍTULO"
  const hasNumbering = hasMainNumbering || hasSubNumbering
  
  if (hasNumbering) {
    console.log('✅ Título numerado detectado:', trimmed.substring(0, 80), {
      isMain: hasMainNumbering,
      isSub: hasSubNumbering
    })
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
  
  // NÃO considerar "Palavras-chave" ou "Keywords" como título
  const isKeywordLine = /^(palavras-chave|keywords):/i.test(trimmed)
  if (isKeywordLine) return false
  
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
