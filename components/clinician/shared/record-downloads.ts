import type { RecordsExport } from "@/lib/record-export";

function downloadBlob(name: string, blob: Blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function downloadRecordsExcel(name: string, table: RecordsExport) {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([
    [table.title],
    ...table.lines.map((line) => [line]),
    [],
    table.headers,
    ...table.rows,
  ]);
  sheet["!cols"] = table.headers.map((header) => ({ wch: Math.min(48, Math.max(header.length + 2, 16)) }));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Daily records");
  const data = XLSX.write(book, { bookType: "xlsx", type: "array" }) as number[];
  downloadBlob(name, new Blob([new Uint8Array(data)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}

export async function downloadRecordsPdf(name: string, table: RecordsExport) {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
  const margin = 36;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(48, 42, 32);
  doc.text(table.title, margin, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let y = 58;
  for (const line of table.lines) {
    const wrapped = doc.splitTextToSize(line, width) as string[];
    doc.text(wrapped, margin, y);
    y += wrapped.length * 12;
  }
  autoTable(doc, {
    startY: y + 8,
    head: [table.headers],
    body: table.rows,
    styles: { font: "helvetica", fontSize: 8, cellPadding: 4, overflow: "linebreak", textColor: [48, 42, 32] },
    headStyles: { fillColor: [143, 65, 14], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 241, 230] },
    margin: { left: margin, right: margin },
  });
  doc.save(name);
}
