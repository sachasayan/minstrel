import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, pdf } from '@react-pdf/renderer' // Removed unused Font import
import { Project } from '@/types' // Removed ProjectFile as it's implicitly used via Project
import { toast } from 'sonner'

// Register fonts (example - replace with actual fonts if needed)
// Font.register({
//   family: 'Times-Roman', // Standard PDF font, might not need registration
//   fonts: [
//      { src: '', fontWeight: 'normal' }, // Placeholder, likely built-in
//      { src: '', fontWeight: 'bold' }, // Placeholder
//      { src: '', fontStyle: 'italic' }, // Placeholder
//      { src: '', fontWeight: 'bold', fontStyle: 'italic' }, // Placeholder
//   ]
// });

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    fontFamily: 'Times-Roman', // Default font
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
  titlePageView: { // Added specific view for title page content centering
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    padding: 60, // Add padding within the centered view
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
    fontFamily: 'Times-Roman',
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Times-Roman',
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'justify', // Justify text for a more formal look
    fontFamily: 'Times-Roman',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
    fontFamily: 'Times-Roman',
  },
})

// Helper to convert base64 to data URL for images
const dataUrlFromBase64 = (base64: string | null | undefined, mimeType: string | null | undefined): string | undefined => {
  if (!base64 || !mimeType) return undefined
  return `data:${mimeType};base64,${base64}`
}

// Helper to strip Markdown (basic version)
const stripMarkdown = (markdown: string): string => {
  if (!markdown) return ''; // Handle null/undefined input
  // Remove headings, bold, italics, links, etc.
  return markdown
    .replace(/#{1,6}\s/g, '') // Remove heading hashes
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italics
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/!\[(.*?)\]\(.*?\)/g, '') // Remove images
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Remove inline code/code blocks
    .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\s*>\s+/gm, '') // Remove blockquote markers
    .replace(/\n{2,}/g, '\n') // Collapse multiple newlines
    .trim()
}

// --- PDF Document Component ---
interface ProjectPdfProps {
  project: Project
}

const ProjectPdfDocument: React.FC<ProjectPdfProps> = ({ project }) => {
  const coverDataUrl = dataUrlFromBase64(project.coverImageBase64, project.coverImageMimeType)

  // Filter and sort chapters
  const chapters = project.files
    .filter(file => file.type === 'chapter')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  // Return the Document structure using correct JSX syntax
  return (
    <Document>
      {/* Title Page */}
      <Page size="A4" style={styles.titlePage}>
        <View style={styles.titlePageView}>
          {coverDataUrl && (
            <Image style={styles.coverImage} src={coverDataUrl} />
          )}
          <Text style={styles.titleText}>{project.title || 'Untitled Project'}</Text>
        </View>
        {/* No page number on title page */}
      </Page>

      {/* Chapter Pages */}
      {chapters.map((chapter, index) => (
        <Page key={chapter.title || index} size="A4" style={styles.page}>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          {/* Split content into paragraphs and render */}
          {stripMarkdown(chapter.content).split('\n').map((paragraph, pIndex) => (
            <Text key={pIndex} style={styles.paragraph}>
              {paragraph || ' '} {/* Render empty paragraphs to maintain spacing */}
            </Text>
          ))}
          {/* Use fixed Text for page number */}
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `${pageNumber} / ${totalPages}`
          )} fixed />
        </Page>
      ))}
    </Document>
  )
}

// --- Service Function ---
export const generateProjectPdf = async (project: Project): Promise<Blob | null> => {
  if (!project) {
    toast.error('No project data provided for PDF export.')
    return null
  }

  try {
    // Create the React element for the document
    const docElement = <ProjectPdfDocument project={project} />;
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
