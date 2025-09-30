import { useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface DocumentUploaderProps {
  onTextSubmit: (text: string) => void;
}

export const DocumentUploader = ({ onTextSubmit }: DocumentUploaderProps) => {
  const [text, setText] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (file.type === "application/pdf" || 
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setText(content);
        toast.success("Arquivo carregado com sucesso!");
      };
      reader.readAsText(file);
    } else {
      toast.error("Formato de arquivo não suportado. Use PDF, DOCX ou TXT.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text);
      toast.success("Documento pronto para formatação!");
    } else {
      toast.error("Por favor, insira ou carregue um texto.");
    }
  };

  return (
    <Card className="p-8 shadow-elegant backdrop-blur-sm bg-card/95">
      <div className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
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
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  Arraste seu documento aqui
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
            onChange={(e) => setText(e.target.value)}
            className="min-h-[300px] resize-none text-base"
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-gradient-hero hover:opacity-90 transition-opacity"
          size="lg"
        >
          <FileText className="mr-2 h-5 w-5" />
          Formatar Documento
        </Button>
      </div>
    </Card>
  );
};
