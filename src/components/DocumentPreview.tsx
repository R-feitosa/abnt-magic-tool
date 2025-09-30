import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import { toast } from "sonner";

interface DocumentPreviewProps {
  content: string;
}

export const DocumentPreview = ({ content }: DocumentPreviewProps) => {
  const formatTextForABNT = (text: string) => {
    // Simples formatação para visualização
    const paragraphs = text.split("\n").filter(p => p.trim());
    return paragraphs;
  };

  const generateDocx = async () => {
    try {
      const paragraphs = content.split("\n").filter(p => p.trim());
      
      const docParagraphs = paragraphs.map((para, index) => {
        // Detecta títulos (linhas curtas ou que começam com número)
        const isTitle = para.length < 50 || /^\d+\.?\s/.test(para);
        
        if (isTitle) {
          return new Paragraph({
            text: para,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 240,
              after: 120,
            },
          });
        }
        
        return new Paragraph({
          children: [
            new TextRun({
              text: para,
              font: "Times New Roman",
              size: 24, // 12pt
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            line: 360, // 1.5 line spacing
            before: 0,
            after: 0,
          },
          indent: {
            firstLine: 720, // 1.25cm indent
          },
        });
      });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1701, // 3cm
                  right: 1134, // 2cm
                  bottom: 1134, // 2cm
                  left: 1701, // 3cm
                },
              },
            },
            children: docParagraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, "documento-abnt.docx");
      toast.success("Documento baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar documento:", error);
      toast.error("Erro ao gerar documento. Tente novamente.");
    }
  };

  const formattedParagraphs = formatTextForABNT(content);

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
              const isTitle = para.length < 50 || /^\d+\.?\s/.test(para);
              
              if (isTitle) {
                return (
                  <h3
                    key={index}
                    className="text-lg font-bold uppercase mt-8 mb-4"
                  >
                    {para}
                  </h3>
                );
              }
              
              return (
                <p
                  key={index}
                  className="text-justify leading-relaxed indent-8"
                  style={{ fontSize: "12pt" }}
                >
                  {para}
                </p>
              );
            })}
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Formatação ABNT aplicada:</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Margens: 3cm (superior e esquerda), 2cm (inferior e direita)</li>
            <li>• Fonte: Times New Roman 12pt</li>
            <li>• Espaçamento entre linhas: 1,5</li>
            <li>• Recuo de primeira linha: 1,25cm</li>
            <li>• Alinhamento: Justificado</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
