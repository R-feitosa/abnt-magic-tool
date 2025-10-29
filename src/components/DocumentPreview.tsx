import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx'
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
      const children: any[] = []

      structure.elements.forEach((element) => {
        // Elementos preservados - tabelas
        if (element.type === 'table' && element.preserveAsIs && element.metadata?.tableData) {
          const tableRows = element.metadata.tableData.map((rowData: string[]) => {
            return new TableRow({
              children: rowData.map(cellText => 
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cellText,
                          font: 'Times New Roman',
                          size: 24
                        })
                      ]
                    })
                  ],
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1 },
                    bottom: { style: BorderStyle.SINGLE, size: 1 },
                    left: { style: BorderStyle.SINGLE, size: 1 },
                    right: { style: BorderStyle.SINGLE, size: 1 }
                  }
                })
              )
            })
          })

          children.push(
            new Table({
              rows: tableRows,
              width: {
                size: 100,
                type: WidthType.PERCENTAGE
              }
            })
          )
          
          // Espaço após tabela
          children.push(
            new Paragraph({
              text: '',
              spacing: { after: 200 }
            })
          )
          return
        }

        // Listas preservadas
        if (element.type === 'list' && element.preserveAsIs) {
          const listItems = element.content.split('\n').filter((item: string) => item.trim())
          listItems.forEach((item: string, index: number) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: element.metadata?.listType === 'ordered' 
                      ? `${index + 1}. ${item}` 
                      : `• ${item}`,
                    font: 'Times New Roman',
                    size: 24
                  })
                ],
                spacing: {
                  before: 120,
                  after: 120,
                  line: 360
                }
              })
            )
          })
          return
        }

        // Citações preservadas
        if (element.type === 'quote' && element.preserveAsIs) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: element.content,
                  font: 'Times New Roman',
                  size: 22,
                  italics: true
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              indent: {
                left: 1134,
                right: 1134
              },
              spacing: {
                before: 200,
                after: 200,
                line: 276
              }
            })
          )
          return
        }

        // Títulos principais - formatação ABNT
        if (element.type === 'title') {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: element.content.toUpperCase(),
                  font: 'Times New Roman',
                  size: 24,
                  bold: true,
                  color: '000000'
                })
              ],
              alignment: AlignmentType.LEFT,
              spacing: {
                before: 360,
                after: 240,
                line: 360
              }
            })
          )
        } 
        // Subtítulos - formatação ABNT
        else if (element.type === 'subtitle') {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: element.content,
                  font: 'Times New Roman',
                  size: 24,
                  bold: true,
                  color: '000000'
                })
              ],
              alignment: AlignmentType.LEFT,
              spacing: {
                before: 240,
                after: 120,
                line: 360
              }
            })
          )
        } 
        // Parágrafos - formatação ABNT completa
        else if (element.type === 'paragraph') {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: element.content,
                  font: 'Times New Roman',
                  size: 24,
                  color: '000000'
                })
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: {
                line: 360,
                after: 0
              },
              indent: {
                firstLine: 708
              }
            })
          )
        }
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
            children: children
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
                // Tabelas preservadas
                if (element.type === 'table' && element.preserveAsIs) {
                  return (
                    <div key={index} className="my-6 relative">
                      <span className="absolute -top-2 -left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
                        🔒 Preservado
                      </span>
                      <div dangerouslySetInnerHTML={{ __html: element.originalHtml || '' }} />
                    </div>
                  )
                }

                // Listas preservadas
                if (element.type === 'list' && element.preserveAsIs) {
                  return (
                    <div key={index} className="my-4 relative">
                      <span className="absolute -top-2 -left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
                        🔒 Preservado
                      </span>
                      <div dangerouslySetInnerHTML={{ __html: element.originalHtml || '' }} />
                    </div>
                  )
                }

                // Citações preservadas
                if (element.type === 'quote' && element.preserveAsIs) {
                  return (
                    <div key={index} className="my-6 relative">
                      <span className="absolute -top-2 -left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
                        🔒 Preservado
                      </span>
                      <blockquote 
                        className="border-l-4 border-gray-300 pl-4 py-2 italic text-gray-700"
                        style={{ fontFamily: 'Times New Roman, serif' }}
                      >
                        {element.content}
                      </blockquote>
                    </div>
                  )
                }

                // Imagens preservadas
                if (element.type === 'image' && element.preserveAsIs) {
                  return (
                    <div key={index} className="my-6 relative">
                      <span className="absolute -top-2 -left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
                        🔒 Preservado
                      </span>
                      <div className="text-center">
                        <div className="inline-block bg-gray-100 p-4 rounded">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-600 mt-2">{element.content}</p>
                        </div>
                      </div>
                    </div>
                  )
                }

                // Títulos - formatação ABNT
                if (element.type === 'title') {
                  return (
                    <div key={index} className="relative">
                      {element.needsFormatting && (
                        <span className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-10">
                          ✏️ Formatado ABNT
                        </span>
                      )}
                      <h2
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
                    </div>
                  )
                } 
                
                // Subtítulos - formatação ABNT
                else if (element.type === 'subtitle') {
                  return (
                    <div key={index} className="relative">
                      {element.needsFormatting && (
                        <span className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-10">
                          ✏️ Formatado ABNT
                        </span>
                      )}
                      <h3
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
                    </div>
                  )
                }

                // Parágrafos - formatação ABNT
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
