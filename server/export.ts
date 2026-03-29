import { Document, Packer, Paragraph, Table, TableRow, TableCell, VerticalAlign, HeadingLevel } from "docx";

export interface ArticleForExport {
  id: string;
  title: string;
  authors?: string[];
  source: string;
  pubdate: string;
  abstract?: string;
  url: string;
}

/**
 * Export articles to CSV format
 */
export function exportToCSV(articles: ArticleForExport[], query: string): string {
  const headers = ["PMID", "Title", "Authors", "Journal", "Publication Date", "Abstract", "URL"];
  
  const rows = articles.map((article) => [
    article.id,
    `"${article.title.replace(/"/g, '""')}"`, // Escape quotes
    `"${(article.authors || []).join("; ").replace(/"/g, '""')}"`,
    `"${article.source.replace(/"/g, '""')}"`,
    article.pubdate,
    `"${(article.abstract || "").replace(/"/g, '""').substring(0, 500)}"`, // Limit abstract length
    article.url,
  ]);

  const csv = [
    `"Search Query","${query.replace(/"/g, '""')}"`,
    `"Export Date","${new Date().toISOString()}"`,
    `"Total Results","${articles.length}"`,
    "",
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csv;
}

/**
 * Export articles to PDF format using docx library
 */
export async function exportToPDF(articles: ArticleForExport[], query: string): Promise<Buffer> {
  const sections = [];

  // Title
  sections.push(
    new Paragraph({
      text: "PubMed Search Results",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  // Search info
  sections.push(
    new Paragraph({
      text: `Query: ${query}`,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `Export Date: ${new Date().toLocaleDateString()}`,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `Total Results: ${articles.length}`,
      spacing: { after: 400 },
    })
  );

  // Articles table
  const tableRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph("PMID")],
          shading: { fill: "4472C4" },
        }),
        new TableCell({
          children: [new Paragraph("Title")],
          shading: { fill: "4472C4" },
        }),
        new TableCell({
          children: [new Paragraph("Authors")],
          shading: { fill: "4472C4" },
        }),
        new TableCell({
          children: [new Paragraph("Journal")],
          shading: { fill: "4472C4" },
        }),
        new TableCell({
          children: [new Paragraph("Date")],
          shading: { fill: "4472C4" },
        }),
      ],
    }),
  ];

  // Add article rows
  articles.forEach((article) => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(article.id)],
            verticalAlign: VerticalAlign.TOP,
          }),
          new TableCell({
            children: [new Paragraph(article.title)],
            verticalAlign: VerticalAlign.TOP,
          }),
          new TableCell({
            children: [new Paragraph((article.authors || []).join("; "))],
            verticalAlign: VerticalAlign.TOP,
          }),
          new TableCell({
            children: [new Paragraph(article.source)],
            verticalAlign: VerticalAlign.TOP,
          }),
          new TableCell({
            children: [new Paragraph(article.pubdate)],
            verticalAlign: VerticalAlign.TOP,
          }),
        ],
      })
    );
  });

  sections.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: "pct" },
    })
  );

  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * Generate filename for export
 */
export function generateExportFilename(query: string, format: "csv" | "pdf"): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
  const sanitizedQuery = query.replace(/[^a-z0-9]/gi, "_").substring(0, 20);
  return `pubmed_${sanitizedQuery}_${timestamp}.${format}`;
}
