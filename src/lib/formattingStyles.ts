export type FormattingStyle = 'abnt' | 'apa' | 'chicago';

export interface StyleConfig {
  name: string;
  description: string;
  font: string;
  fontSize: number;
  lineSpacing: number;
  title: {
    alignment: 'left' | 'center' | 'right' | 'both';
    bold: boolean;
    uppercase: boolean;
    spacingBefore: number;
    spacingAfter: number;
    indent: { left: number; firstLine: number };
  };
  subtitle: {
    alignment: 'left' | 'center' | 'right' | 'both';
    bold: boolean;
    uppercase: boolean;
    spacingBefore: number;
    spacingAfter: number;
    indent: { left: number; firstLine: number };
  };
  paragraph: {
    alignment: 'left' | 'center' | 'right' | 'both';
    spacingBefore: number;
    spacingAfter: number;
    firstLineIndent: number;
  };
}

export const formattingStyles: Record<FormattingStyle, StyleConfig> = {
  abnt: {
    name: 'ABNT',
    description: 'Normas da Associação Brasileira de Normas Técnicas',
    font: 'Times New Roman',
    fontSize: 24, // 12pt
    lineSpacing: 360, // 1.5
    title: {
      alignment: 'left',
      bold: true,
      uppercase: true,
      spacingBefore: 360,
      spacingAfter: 240,
      indent: { left: 0, firstLine: 0 },
    },
    subtitle: {
      alignment: 'left',
      bold: true,
      uppercase: false,
      spacingBefore: 240,
      spacingAfter: 120,
      indent: { left: 0, firstLine: 0 },
    },
    paragraph: {
      alignment: 'both',
      spacingBefore: 0,
      spacingAfter: 0,
      firstLineIndent: 708, // 1.25cm
    },
  },
  apa: {
    name: 'APA',
    description: 'American Psychological Association Style',
    font: 'Times New Roman',
    fontSize: 24, // 12pt
    lineSpacing: 480, // 2.0 (double spacing)
    title: {
      alignment: 'center',
      bold: true,
      uppercase: false,
      spacingBefore: 0,
      spacingAfter: 240,
      indent: { left: 0, firstLine: 0 },
    },
    subtitle: {
      alignment: 'left',
      bold: true,
      uppercase: false,
      spacingBefore: 240,
      spacingAfter: 0,
      indent: { left: 0, firstLine: 0 },
    },
    paragraph: {
      alignment: 'left',
      spacingBefore: 0,
      spacingAfter: 0,
      firstLineIndent: 720, // 0.5 inch
    },
  },
  chicago: {
    name: 'Chicago',
    description: 'The Chicago Manual of Style',
    font: 'Times New Roman',
    fontSize: 24, // 12pt
    lineSpacing: 480, // 2.0 (double spacing)
    title: {
      alignment: 'center',
      bold: true,
      uppercase: false,
      spacingBefore: 0,
      spacingAfter: 240,
      indent: { left: 0, firstLine: 0 },
    },
    subtitle: {
      alignment: 'left',
      bold: true,
      uppercase: false,
      spacingBefore: 240,
      spacingAfter: 120,
      indent: { left: 0, firstLine: 0 },
    },
    paragraph: {
      alignment: 'both',
      spacingBefore: 0,
      spacingAfter: 240,
      firstLineIndent: 720, // 0.5 inch
    },
  },
};
