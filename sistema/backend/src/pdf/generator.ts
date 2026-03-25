import PDFDocument from "pdfkit";
import { Question } from "../models";

export type ExamMeta = {
  subject?: string;
  professor?: string;
  date?: string; // ISO or human
  semester?: string;
};

// Generate a single PDF document containing multiple individual tests (may span pages)
// This generator writes to any writable stream (e.g., Express response).
export function generateTestsPdf(
  tests: Question[][],
  outStream: NodeJS.WritableStream,
  meta: ExamMeta = {},
) {
  const doc = new PDFDocument({ autoFirstPage: false });
  doc.pipe(outStream);

  const pageWidth = 612; // letter-ish
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  function renderHeader(testNumber: number) {
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(meta.subject || "Exam", {
        align: "center",
        width: contentWidth,
      });
    doc.moveDown(0.2);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `${meta.professor ? `Professor: ${meta.professor}` : ""}`,
        margin,
        doc.y,
        { align: "left" },
      );
    const rightInfo = [
      meta.date ? `Date: ${meta.date}` : "",
      meta.semester ? `Semester: ${meta.semester}` : "",
    ]
      .filter(Boolean)
      .join("  |  ");
    if (rightInfo) {
      doc.fontSize(10).text(rightInfo, margin, doc.y - 12, {
        align: "right",
        width: contentWidth,
      });
    }
    doc.moveDown(0.6);
    // horizontal rule
    const currentY = doc.y;
    doc
      .moveTo(margin, currentY)
      .lineTo(margin + contentWidth, currentY)
      .strokeColor("#eeeeee")
      .stroke();
    doc.moveDown(0.6);
  }

  function renderFooter(testNumber: number) {
    const footerY = doc.page.height - margin + 10;
    doc
      .fontSize(9)
      .fillColor("gray")
      .text(`Test ${testNumber}`, margin, footerY, {
        align: "center",
        width: contentWidth,
      });
    doc.fillColor("black");
  }

  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  tests.forEach((testQuestions, idx) => {
    let testNum = idx + 1;
    doc.addPage({ size: "LETTER", margin });
    renderHeader(testNum);

    // track vertical space
    const availableHeight = doc.page.height - margin - 80; // reserve space for footer and padding
    let y = doc.y;

    testQuestions.forEach((q, qIdx) => {
      const qText = `${qIdx + 1}. ${q.description}`;
      doc.fontSize(12).font("Helvetica").text(qText, { width: contentWidth });
      y = doc.y;

      q.alternatives.forEach((a, aIdx) => {
        const label = labels[aIdx] ?? String(aIdx + 1);
        doc
          .fontSize(11)
          .text(`   ${label}) ${a.text}`, { width: contentWidth });
        y = doc.y;
      });

      doc.moveDown(0.4);
      y = doc.y;

      // if we're near the bottom, add footer then new page with header
      if (y > availableHeight) {
        renderFooter(testNum);
        doc.addPage({ size: "LETTER", margin });
        renderHeader(testNum);
      }
    });

    // After all questions, add space for name/CPF and footer
    doc.moveDown(1.5);
    doc.text("Name: ________________________________");
    doc.moveDown(0.4);
    doc.text("CPF: ________________________________");

    renderFooter(testNum);
  });

  doc.end();
}
