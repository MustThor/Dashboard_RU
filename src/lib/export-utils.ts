"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ============================================================================
// PDF EXPORT
// ============================================================================

interface PdfExportOptions {
  title: string;
  headers: string[];
  rows: string[][];
  filename: string;
}

export function exportToPdf({ title, headers, rows, filename }: PdfExportOptions): void {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);

  // Subtitle with date
  doc.setFontSize(10);
  doc.text(
    `Dicetak pada: ${new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date())}`,
    14,
    28
  );

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  doc.save(`${filename}.pdf`);
}

// ============================================================================
// EXCEL EXPORT
// ============================================================================

interface ExcelExportOptions {
  title: string;
  headers: string[];
  rows: string[][];
  filename: string;
}

export function exportToExcel({ title, headers, rows, filename }: ExcelExportOptions): void {
  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet["!cols"] = headers.map(() => ({ wch: 20 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// ============================================================================
// CSV EXPORT
// ============================================================================

interface CsvExportOptions {
  headers: string[];
  rows: string[][];
  filename: string;
}

export function exportToCsv({ headers, rows, filename }: CsvExportOptions): void {
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
