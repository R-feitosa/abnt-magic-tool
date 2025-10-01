import { useState } from 'react'
import { Upload, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import mammoth from 'mammoth'

// --- INÍCIO DA MUDANÇA ---
// Importa o pdf.js e o worker de uma forma que o Vite entende
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'

// Configura o worker usando a importação direta
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker
// --- FIM DA MUDANÇA ---

interface DocumentUploaderProps {
  onTextSubmit: (text: string) => void
}

export const DocumentUploader = ({ onTextSubmit }: DocumentUploaderProps) => {
  const [text, setText] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    toast.info('Processando o arquivo...')

    const reader = new FileReader()

    if (file.type === 'text/plain') {
      reader.onload = e => {
        const content = e.target?.result as string
        setText(content)
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
          const result = await mammoth.extractRawText({ arrayBuffer })
          setText(result.value)
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
          setText(fullText)
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
      onTextSubmit(text)
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

        <div>
          <Textarea
            placeholder="Cole ou digite seu texto aqui..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="min-h-[300px] resize-none text-base"
            disabled={isLoading}
          />
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
