import PDFDocument from "pdfkit";
import { Question } from "../models";

export type TestSpec = {
  questions: Question[];
  testNumber: number;
};

// Generate a single PDF document containing multiple individual tests (one per page block)
// This generator writes to any writable stream (e.g., Express response).
export function generateTestsPdf(
  tests: Question[][],
  outStream: NodeJS.WritableStream,
) {
  const doc = new PDFDocument({ autoFirstPage: false });
  doc.pipe(outStream);

  const pageWidth = 612; // letter-ish
  const margin = 48;

  tests.forEach((testQuestions, idx) => {
    doc.addPage({ size: "LETTER", margin });

    // Header
    doc.fontSize(14).text("Exam", { align: "center" });
    doc.moveDown(0.2);
    doc.fontSize(10).text(`Test #${idx + 1}`, { align: "right" });
    doc.moveDown(0.6);

    // Questions
    testQuestions.forEach((q, qIdx) => {
      doc.fontSize(12).text(`${qIdx + 1}. ${q.description}`);
      doc.moveDown(0.1);

      // Alternatives labeled A, B, C...
      const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      q.alternatives.forEach((a, aIdx) => {
        const label = labels[aIdx] ?? String(aIdx + 1);
        doc.fontSize(11).text(`   ${label}) ${a.text}`);
      });

      doc.moveDown(0.4);
    });

    // Space for name/ID at the end
    doc.moveDown(1.5);
    doc.text("Name: ________________________________");
    doc.moveDown(0.4);
    doc.text("CPF: ________________________________");

    // Footer with test number centered at bottom
    const footerY = doc.page.height - 50;
    doc.fontSize(9).text(`Test ${idx + 1}`, margin, footerY, {
      align: "center",
      width: pageWidth - margin * 2,
    });
  });

  doc.end();
}
