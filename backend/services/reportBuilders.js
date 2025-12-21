const ExcelJS = require("exceljs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
} = require("docx");

// ===== Excel =====
async function buildExcel({ title, columns, rows }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Report");

  ws.mergeCells(1, 1, 1, columns.length);
  ws.getCell(1, 1).value = title;
  ws.getRow(1).font = { bold: true, size: 14 };

  ws.addRow(columns.map((c) => c.header));
  ws.getRow(2).font = { bold: true };

  for (const r of rows) {
    ws.addRow(columns.map((c) => r[c.key]));
  }

  columns.forEach((c, idx) => {
    const col = ws.getColumn(idx + 1);
    let max = c.header.length;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value ? String(cell.value) : "";
      max = Math.max(max, v.length);
    });
    col.width = Math.min(60, max + 2);
  });

  return wb.xlsx.writeBuffer();
}

// ===== Word =====
async function buildWord({ title, columns, rows }) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 32 })],
          }),
          new Paragraph(""),
          new Table({
            rows: [
              new TableRow({
                children: columns.map(
                  (c) =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: c.header, bold: true }),
                          ],
                        }),
                      ],
                    })
                ),
              }),
              ...rows.map(
                (r) =>
                  new TableRow({
                    children: columns.map(
                      (c) =>
                        new TableCell({
                          children: [new Paragraph(String(r[c.key] ?? ""))],
                        })
                    ),
                  })
              ),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = { buildExcel, buildWord };
