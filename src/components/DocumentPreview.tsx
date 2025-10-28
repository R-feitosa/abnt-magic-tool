import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import { DocumentStructure } from '@/lib/documentStructure'

interface DocumentPreviewProps {
  content: string
  structure: DocumentStructure
}

export const DocumentPreview = ({ content, structure }: DocumentPreviewProps) => {
  const generateDocx = async () => {
    try {
      const docParagraphs = structure.elements.map(element => {
        if (element.type === 'title') {
          // Títulos principais ABNT: Times New Roman 12pt, negrito, sem recuo, maiúsculas
          return new Paragraph({
            children: [
              new TextRun({
                text: element.content.toUpperCase(),
                font: 'Times New Roman',
                size: 24, // 12pt
                bold: true,
                color: '000000'
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 360, // Espaço antes do título
              after: 240,  // Espaço depois do título
              line: 360    // 1,5 entrelinhas
            }
          })
        } else if (element.type === 'subtitle') {
          // Subtítulos ABNT: Times New Roman 12pt, negrito, sem recuo
          return new Paragraph({
            children: [
              new TextRun({
                text: element.content,
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
              text: element.content,
              font: 'Times New Roman',
              size: 24, // 12pt
              color: '000000'
            })
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            line: 360, // 1,5 entrelinhas
            after: 0
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
              {structure.elements.map((element, index) => {
                if (element.type === 'title') {
                  return (
                    <h2
                      key={index}
                      className="font-bold text-black uppercase"
                      style={{ 
                        fontFamily: 'Times New Roman, serif',
                        fontSize: '12pt',
                        lineHeight: '1.5',
                        marginTop: index === 0 ? '0' : '18pt',
                        marginBottom: '12pt',
                        textAlign: 'left'
                      }}
                    >
                      {element.content}
                    </h2>
                  )
                } else if (element.type === 'subtitle') {
                  return (
                    <h3
                      key={index}
                      className="font-bold text-black"
                      style={{ 
                        fontFamily: 'Times New Roman, serif',
                        fontSize: '12pt',
                        lineHeight: '1.5',
                        marginTop: '12pt',
                        marginBottom: '6pt',
                        textAlign: 'left'
                      }}
                    >
                      {element.content}
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
                    {element.content}
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
