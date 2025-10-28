import { useState } from "react";
import { DocumentUploader } from "@/components/DocumentUploader";
import { DocumentPreview } from "@/components/DocumentPreview";
import { DocumentStructure } from "@/lib/documentStructure";
import logo from "@/assets/logo.png";
import fundo from "@/assets/fundo3.png";

const Index = () => {
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [documentStructure, setDocumentStructure] = useState<DocumentStructure | null>(null);

  const handleTextSubmit = (text: string, structure: DocumentStructure) => {
    setDocumentContent(text);
    setDocumentStructure(structure);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${fundo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-md bg-card/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <img 
                src={logo} 
                alt="Feitosa Group" 
                className="h-20 min-w-20"
              />
              <div className="text-right">
                <h1 className="text-2xl font-bold text-primary">
                  Formatador ABNT
                </h1>
                <p className="text-sm text-muted-foreground">
                  Formatação automática de documentos acadêmicos
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            {!documentContent ? (
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    Formate seus documentos acadêmicos
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Carregue ou cole seu texto e receba um documento formatado nas normas ABNT
                  </p>
                </div>
                <DocumentUploader onTextSubmit={handleTextSubmit} />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    Documento Formatado
                  </h2>
                  <button
                    onClick={() => {
                      setDocumentContent(null);
                      setDocumentStructure(null);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                  >
                    ← Voltar ao início
                  </button>
                </div>
                {documentStructure && (
                  <DocumentPreview content={documentContent} structure={documentStructure} />
                )}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/50 backdrop-blur-md bg-card/30 mt-20">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2025 Feitosa Group. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
