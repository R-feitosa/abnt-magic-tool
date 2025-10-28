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
        // Identifica títulos: linhas curtas em maiúsculas ou que começam com número
        const isTitle =
          (para.length < 60 && para.toUpperCase() === para) ||
          /^\d+\.?\s/.test(para)

        if (isTitle) {
          // Títulos ABNT: Times New Roman 12pt, negrito, sem recuo, alinhamento à esquerda
          return new Paragraph({
            children: [
              new TextRun({
                text: para,
                font: 'Times New Roman',
                size: 24, // 12pt
                bold: true,
                color: '000000'
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 240,
              after: 120,
              line: 360 // 1,5 entrelinhas
            }
          })
        }

        // Parágrafos ABNT: Times New Roman 12pt, justificado, 1,5 entrelinhas, recuo 1,25cm
        return new Paragraph({
          children: [
            new TextRun({
              text: para,
              font: 'Times New Roman',
              size: 24, // 12pt
              color: '000000'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            line: 360 // 1,5 entrelinhas
          },
          indent: {
            firstLine: 708 // 1,25cm exato
          }
        })
      })

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: 'Times New Roman',
                size: 24,
                color: '000000'
              },
              paragraph: {
                spacing: {
                  line: 360,
                  before: 0,
                  after: 0
                }
              }
            }
          }
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1701,    // 3cm
                  right: 1134,  // 2cm
                  bottom: 1134, // 2cm
                  left: 1701    // 3cm
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
          <div 
            className="mx-auto bg-white"
            style={{
              width: '21cm',
              paddingTop: '3cm',
              paddingRight: '2cm',
              paddingBottom: '2cm',
              paddingLeft: '3cm',
            }}
          >
            <div className="space-y-0">
              {formattedParagraphs.map((para, index) => {
                const isTitle =
                  (para.length < 60 && para.toUpperCase() === para) ||
                  /^\d+\.?\s/.test(para)

                if (isTitle) {
                  return (
                    <h3
                      key={index}
                      className="font-bold text-black"
                      style={{ 
                        fontFamily: 'Times New Roman, serif',
                        fontSize: '12pt',
                        lineHeight: '1.5',
                        marginTop: index === 0 ? '0' : '12pt',
                        marginBottom: '6pt',
                        textAlign: 'left'
                      }}
                    >
                      {para}
                    </h3>
                  )
                }

                return (
                  <p
                    key={index}
                    className="text-black"
                    style={{ 
                      fontFamily: 'Times New Roman, serif',
                      fontSize: '12pt',
                      lineHeight: '1.5',
                      textAlign: 'justify',
                      textIndent: '1.25cm',
                      margin: '0'
                    }}
                  >
                    {para}
                  </p>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">
            Formatação ABNT aplicada:
          </h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Margens: 3cm (superior e esquerda), 2cm (inferior e direita)</li>
            <li>• Fonte: Times New Roman 12pt</li>
            <li>• Espaçamento entre linhas: 1,5</li>
            <li>• Recuo de primeira linha: 1,25cm (apenas em parágrafos)</li>
            <li>• Alinhamento: Justificado (parágrafos) e Esquerda (títulos)</li>
            <li>• Títulos: Negrito, sem recuo</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
