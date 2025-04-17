import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer'
import { Project } from '@/types'
import { toast } from 'sonner'
import { PdfExportConfig } from '@/components/PdfExportConfigModal' // Import the config type

// Define the specific type expected by the Page component's size prop
type PdfPageSize = 'A4' | 'LETTER' | [number, number]; // Add other standard sizes like 'LEGAL', 'A3' etc. if needed
// Removed duplicate import below

// Define styles dynamically based on config
const createStyles = (config: PdfExportConfig) => StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    fontFamily: config.fontFamily, // Use selected font
    fontSize: 12,
    lineHeight: 1.5,
  },
  titlePage: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: '100%', // Ensure it takes full page height for centering
  },
  titlePageView: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    padding: 60,
  },
  coverImage: {
    maxWidth: '60%',
    maxHeight: '60%',
    marginBottom: 40,
    objectFit: 'contain',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: config.fontFamily, // Use selected font
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: config.fontFamily, // Use selected font
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify',
    fontFamily: config.fontFamily, // Use selected font
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
    fontFamily: config.fontFamily, // Use selected font
  },
});

// Helper to convert base64 to data URL for images
const dataUrlFromBase64 = (base64: string | null | undefined, mimeType: string | null | undefined): string | undefined => {
  if (!base64 || !mimeType) return undefined
  return `data:${mimeType};base64,${base64}`
}

// Helper to strip Markdown (basic version)
const stripMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  return markdown
    .replace(/#{1,6}\s/g, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/!\[(.*?)\]\(.*?\)/g, '')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
};

// --- PDF Document Component ---
interface ProjectPdfProps {
  project: Project;
  config: PdfExportConfig; // Add config to props
}

// Export the component so it can be used by the previewer
export const ProjectPdfDocument: React.FC<ProjectPdfProps> = ({ project, config }) => {
  // Create styles dynamically based on config
  const styles = createStyles(config);
  const coverDataUrl = dataUrlFromBase64(project.coverImageBase64, project.coverImageMimeType)

  // Filter and sort chapters
  const chapters = project.files
    .filter(file => file.type === 'chapter')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  // Helper to get the correct paper size format for @react-pdf/renderer
  const getPaperSize = (): PdfPageSize => { // Use the specific type alias
    if (config.paperSize === 'Letter') return 'LETTER'; // Uppercase standard name
    if (config.paperSize === 'A4') return 'A4'; // Standard name
    if (Array.isArray(config.paperSize)) return config.paperSize; // Custom dimensions [width, height]
    return 'A4'; // Default fallback
  }

  const paperSize: PdfPageSize = getPaperSize(); // Assign the specific type

  // Return the Document structure using correct JSX syntax
  return (
    <Document>
      {/* Title Page */}
      <Page size={paperSize} style={styles.titlePage}>
        <View style={styles.titlePageView}>
          {coverDataUrl && (
            <Image style={styles.coverImage} src={coverDataUrl} />
          )}
          <Text style={styles.titleText}>{project.title || 'Untitled Project'}</Text>
        </View>
      </Page>

      {/* Chapter Pages */}
      {chapters.map((chapter, index) => (
        <Page key={chapter.title || index} size={paperSize} style={styles.page}>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          {stripMarkdown(chapter.content).split('\n').map((paragraph, pIndex) => (
            <Text key={pIndex} style={styles.paragraph}>
              {paragraph || ' '}
            </Text>
          ))}
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} fixed />
        </Page>
      ))}
    </Document>
  );
};

// --- Service Function ---
// Update signature to accept config
export const generateProjectPdf = async (project: Project, config: PdfExportConfig): Promise<Blob | null> => {
  if (!project) {
    toast.error('No project data provided for PDF export.')
    return null
  }

  try {
    // Create the React element for the document, passing config
    const docElement = <ProjectPdfDocument project={project} config={config} />;
    // Generate the blob directly from the element
    const blob = await pdf(docElement).toBlob();
    return blob;
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    toast.error('Failed to generate PDF. See console for details.')
    return null
  }
}

// Example of how to trigger download (can be used in FloatingToolbar)
export const triggerDownload = (blob: Blob, filename: string) => {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default {
  generateProjectPdf,
  triggerDownload, // Export triggerDownload as well
}
