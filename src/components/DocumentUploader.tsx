import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { formattingStyles } from '@/lib/formattingStyles'
import mammoth from 'mammoth'
import { cleanText } from '@/lib/textCleaner'
import { analyzeDocument, DocumentStructure } from '@/lib/documentStructure'
import { parseHtmlToStructure } from '@/lib/htmlParser'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

// --- INÍCIO DA MUDANÇA ---
// Importa o pdf.js e o worker de uma forma que o Vite entende
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

// Configura o worker usando a importação direta
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker
// --- FIM DA MUDANÇA ---

interface DocumentUploaderProps {
  onTextSubmit: (text: string, structure: DocumentStructure, style: string) => void
}

export const DocumentUploader = ({ onTextSubmit }: DocumentUploaderProps) => {
  const [text, setText] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cleaningStats, setCleaningStats] = useState<any>(null)
  const [documentStructure, setDocumentStructure] = useState<DocumentStructure | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<string>('abnt')

  const processText = (rawText: string) => {
    // Se já temos estrutura do HTML (de DOCX), usar ela
    if (!documentStructure) {
      // Para texto simples ou PDF, analisar normalmente
      const structure = analyzeDocument(rawText)
      setDocumentStructure(structure)
    }

    // Limpar apenas o texto que precisa formatação
    const { text: cleanedText, stats } = cleanText(rawText)
    setText(cleanedText)
    setCleaningStats(stats)

    // Mostrar resultados
    if (stats.totalChanges > 0) {
      toast.success(
        `Documento analisado: ${stats.totalChanges} problema${stats.totalChanges > 1 ? 's' : ''} corrigido${stats.totalChanges > 1 ? 's' : ''}!`
      )
    }

    const structure = documentStructure || analyzeDocument(cleanedText)
    if (structure.stats.titles > 0 || structure.stats.subtitles > 0) {
      toast.info(
        `Estrutura detectada: ${structure.stats.titles} título${structure.stats.titles !== 1 ? 's' : ''}, ${structure.stats.subtitles} subtítulo${structure.stats.subtitles !== 1 ? 's' : ''}, ${structure.stats.paragraphs} parágrafo${structure.stats.paragraphs !== 1 ? 's' : ''}`
      )
      setShowAnalysis(true)
    }
  }

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    toast.info('Processando o arquivo...')

    const reader = new FileReader()

    if (file.type === 'text/plain') {
      reader.onload = e => {
        const content = e.target?.result as string
        processText(content)
        toast.success('Arquivo de texto carregado com sucesso!')
        setIsLoading(false)
      }
      reader.readAsText(file)
    } else if (
      file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // DOCX
      reader.onload = async e => {
        const arrayBuffer = e.target?.result as ArrayBuffer
        try {
          // Extrair HTML estruturado ao invés de texto simples
          const result = await mammoth.convertToHtml({ arrayBuffer })
          
          // Parsear HTML para estrutura preservando elementos
          const htmlStructure = parseHtmlToStructure(result.value)
          setDocumentStructure(htmlStructure)
          
          // Extrair texto limpo apenas dos elementos que precisam formatação
          const rawText = htmlStructure.elements
            .filter(el => el.needsFormatting)
            .map(el => el.content)
            .join('\n\n')
          
          // Se houver elementos preservados, informar ao usuário
          const preservedCount = htmlStructure.elements.filter(el => el.preserveAsIs).length
          if (preservedCount > 0) {
            toast.success(`${preservedCount} elementos preservados (tabelas, imagens, listas)`, {
              description: 'Estes elementos serão mantidos intactos no documento final'
            })
          }
          
          processText(rawText)
          toast.success('Documento DOCX carregado com sucesso!')
        } catch (error) {
          console.error('Erro ao processar DOCX:', error)
          toast.error('Não foi possível ler o arquivo DOCX.')
        } finally {
          setIsLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } else if (file.type === 'application/pdf') {
      // PDF
      reader.onload = async e => {
        const arrayBuffer = e.target?.result as ArrayBuffer
        try {
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
          const pdf = await loadingTask.promise
          let fullText = ''
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            fullText +=
              textContent.items.map(item => (item as any).str).join(' ') + '\n'
          }
          processText(fullText)
          toast.success('Documento PDF carregado com sucesso!')
        } catch (error) {
          console.error('Erro ao processar PDF:', error)
          toast.error('Não foi possível ler o arquivo PDF.')
        } finally {
          setIsLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      toast.error('Formato de arquivo não suportado. Use PDF, DOCX ou TXT.')
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleSubmit = () => {
    if (text.trim()) {
      // Se não tiver estrutura ainda, processar o texto
      let structure = documentStructure
      if (!structure) {
        const processed = cleanText(text)
        structure = analyzeDocument(processed.text)
      }
      onTextSubmit(text, structure, selectedStyle)
      toast.success('Documento pronto para formatação!')
    } else {
      toast.error('Por favor, insira ou carregue um texto.')
    }
  }

  return (
    <Card className="p-8 shadow-elegant backdrop-blur-sm bg-card/95">
      <div className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          } ${isLoading ? 'cursor-wait' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.docx,.txt"
            disabled={isLoading}
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0])
              }
            }}
          />
          <label
            htmlFor="file-upload"
            className={isLoading ? 'cursor-wait' : 'cursor-pointer'}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-primary/10 rounded-full">
                {isLoading ? (
                  <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-primary"></div>
                ) : (
                  <Upload className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {isLoading ? 'Processando...' : 'Arraste seu documento aqui'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou clique para selecionar (PDF, DOCX, TXT)
                </p>
              </div>
            </div>
          </label>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              ou cole seu texto
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Seleção de Estilo */}
          <div className="p-4 bg-secondary/10 rounded-lg border border-border space-y-3">
            <Label className="text-sm font-semibold">Estilo de Formatação</Label>
            <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle} className="flex flex-col gap-3">
              {Object.entries(formattingStyles).map(([key, style]) => (
                <div key={key} className="flex items-start space-x-3">
                  <RadioGroupItem value={key} id={key} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={key} className="cursor-pointer font-medium">
                      {style.name}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{style.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Textarea
            placeholder="Cole ou digite seu texto aqui..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="min-h-[300px] resize-none text-base"
            disabled={isLoading}
          />

          {/* Análise do Documento */}
          {(cleaningStats || documentStructure) && (
            <Collapsible open={showAnalysis} onOpenChange={setShowAnalysis}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <AlertCircle className="w-4 h-4" />
                <span>
                  {showAnalysis ? 'Ocultar' : 'Ver'} análise do documento
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                {cleaningStats && cleaningStats.totalChanges > 0 && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Correções Aplicadas
                    </h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {cleaningStats.multipleSpacesRemoved > 0 && (
                        <li>✓ {cleaningStats.multipleSpacesRemoved} espaços múltiplos removidos</li>
                      )}
                      {cleaningStats.punctuationFixed > 0 && (
                        <li>✓ {cleaningStats.punctuationFixed} espaços antes de pontuação corrigidos</li>
                      )}
                      {cleaningStats.excessiveSpacingRemoved > 0 && (
                        <li>✓ {cleaningStats.excessiveSpacingRemoved} espaçamentos excessivos corrigidos</li>
                      )}
                      {cleaningStats.lineBreaksNormalized > 0 && (
                        <li>✓ {cleaningStats.lineBreaksNormalized} quebras de linha normalizadas</li>
                      )}
                      {cleaningStats.tabsConverted > 0 && (
                        <li>✓ {cleaningStats.tabsConverted} tabs convertidos para espaços</li>
                      )}
                    </ul>
                  </div>
                )}

                {documentStructure && (
                  <div className="p-4 bg-secondary/20 rounded-lg border border-border">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-secondary-foreground" />
                      Estrutura Detectada
                    </h4>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p>📄 {documentStructure.stats.titles} título(s) principal(is)</p>
                      <p>📑 {documentStructure.stats.subtitles} subtítulo(s)</p>
                      <p>📝 {documentStructure.stats.paragraphs} parágrafo(s)</p>
                      
                      {documentStructure.elements.filter(el => el.type === 'table').length > 0 && (
                        <p className="text-green-600 font-medium">
                          🔒 {documentStructure.elements.filter(el => el.type === 'table').length} tabela(s) preservada(s)
                        </p>
                      )}
                      
                      {documentStructure.elements.filter(el => el.type === 'image').length > 0 && (
                        <p className="text-green-600 font-medium">
                          🔒 {documentStructure.elements.filter(el => el.type === 'image').length} imagem(ns) preservada(s)
                        </p>
                      )}
                      
                      {documentStructure.elements.filter(el => el.type === 'list').length > 0 && (
                        <p className="text-green-600 font-medium">
                          🔒 {documentStructure.elements.filter(el => el.type === 'list').length} lista(s) preservada(s)
                        </p>
                      )}
                      
                      {documentStructure.elements.filter(el => el.type === 'quote').length > 0 && (
                        <p className="text-green-600 font-medium">
                          🔒 {documentStructure.elements.filter(el => el.type === 'quote').length} citação(ões) preservada(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
          size="lg"
          disabled={isLoading || !text.trim()}
        >
          <FileText className="mr-2 h-5 w-5" />
          Formatar Documento
        </Button>
      </div>
    </Card>
  )
}
