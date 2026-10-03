declare module 'pdfmake/build/pdfmake.js' {
  const pdfMake: {
    addVirtualFileSystem?: (vfs: unknown) => void
    createPdf: (docDefinition: unknown) => {
      getBlob: () => Promise<Blob>
      download: (filename?: string) => void
    }
  }
  export default pdfMake
}

declare module 'pdfmake/build/vfs_fonts.js' {
  const pdfFonts: Record<string, string>
  export default pdfFonts
}
