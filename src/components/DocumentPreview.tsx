import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'

interface DocumentPreviewProps {
  content: string
}

export const DocumentPreview = ({ content }: DocumentPreviewProps) => {
  const formatTextForPreview = (text: string) => {
    return text.split('\n').filter(p => p.trim())
  }

  const generateDocx = async () => {
    try {
      const paragraphs = content.split('\n').filter(p => p.trim())

      const docParagraphs = paragraphs.map(para => {
        // Lógica para identificar títulos (linhas curtas, todas em maiúsculas ou começando com número)
        const isTitle =
          (para.length < 60 && para.toUpperCase() === para) ||
          /^\d+\.?\s/.test(para)

        if (isTitle) {
          // **NOVO ESTILO PARA TÍTULOS - IGUAL AO SEU MODELO**
          // Apenas negrito, cor preta e sem ser um "Heading" nativo do Word
          return new Paragraph({
            children: [
              new TextRun({
                text: para,
                font: 'Arial',
                size: 24, // 12pt
                bold: true,
                color: '000000' // Preto
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 240, // Espaçamento antes do título
              after: 120 // Espaçamento depois do título
            }
          })
        }

        // **NOVO ESTILO PARA PARÁGRAFOS - IGUAL AO SEU MODELO**
        return new Paragraph({
          children: [
            new TextRun({
              text: para,
              font: 'Arial',
              size: 24 // 12pt
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            line: 360 // Espaçamento 1,5
          },
          indent: {
            firstLine: 708.66 // Recuo de 1,25cm
          }
        })
      })

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Arial',
                color: '000000' // Garante a cor preta como padrão
              }
            }
          }
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  // **MARGENS DO MODELO ABNT**
                  top: 1701, // 3cm
                  right: 1134, // 2cm
                  bottom: 1134, // 2cm
                  left: 1701 // 3cm
                }
              }
            },
            children: docParagraphs
          }
        ]
      })

      const blob = await Packer.toBlob(doc)
      saveAs(blob, 'documento-formatado.docx')
      toast.success('Documento baixado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
      toast.error('Erro ao gerar documento. Tente novamente.')
    }
  }

  const formattedParagraphs = formatTextForPreview(content)

  return (
    <Card className="p-8 shadow-elegant backdrop-blur-sm bg-card/95">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Pré-visualização
          </h2>
          <Button
            onClick={generateDocx}
            className="bg-secondary hover:bg-secondary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar DOCX
          </Button>
        </div>

        <div className="bg-white p-12 rounded-lg shadow-inner min-h-[600px] border border-border">
          <div className="max-w-[21cm] mx-auto space-y-4 font-serif text-foreground">
            {formattedParagraphs.map((para, index) => {
              const isTitle =
                (para.length < 60 && para.toUpperCase() === para) ||
                /^\d+\.?\s/.test(para)

              if (isTitle) {
                return (
                  <h3
                    key={index}
                    className="text-base font-bold uppercase mt-6 mb-3"
                    style={{ fontFamily: 'Arial' }}
                  >
                    {para}
                  </h3>
                )
              }

              return (
                <p
                  key={index}
                  className="text-justify leading-relaxed indent-8"
                  style={{ fontSize: '12pt', fontFamily: 'Arial' }}
                >
                  {para}
                </p>
              )
            })}
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">
            Padrão de formatação aplicado (baseado no seu modelo):
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Margens: 3cm (superior/esquerda), 2cm (inferior/direita)</li>
            <li>• Fonte: Arial 12pt</li>
            <li>• Espaçamento entre linhas: 1,5</li>
            <li>• Recuo de primeira linha: 1,25cm</li>
            <li>• Alinhamento: Justificado</li>
            <li>• Títulos: Em negrito e cor preta</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
