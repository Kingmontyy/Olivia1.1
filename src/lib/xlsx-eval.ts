import * as XLSX from "xlsx";
// @ts-ignore - xlsx-calc has no types
import XLSX_CALC from "xlsx-calc";

// Build a SheetJS-compatible workbook from our stored JSON structure
function buildWorkbook(sheets: any[]) {
  const wb: any = { Sheets: {}, SheetNames: [] };
  sheets.forEach((sheet: any) => {
    const name = sheet.name || `Sheet${sheet.index + 1}`;
    wb.SheetNames.push(name);
    const ws: any = {};
    const rows: any[][] = sheet.data || [];
    let maxC = 0;
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (cell === null || cell === undefined || cell === "") continue;
        const addr = XLSX.utils.encode_cell({ r, c });
        if (typeof cell === "object") {
          const out: any = {};
          if (cell.t !== undefined) out.t = cell.t;
          if (cell.v !== undefined) out.v = cell.v;
          if (cell.f !== undefined) out.f = cell.f?.toString().replace(/^=/, "");
          if (cell.w !== undefined) out.w = cell.w;
          if (cell.s !== undefined) out.s = cell.s;
          ws[addr] = out;
        } else {
          // Primitive
          ws[addr] = { v: cell, t: typeof cell === "number" ? "n" : "s" };
        }
        if (c + 1 > maxC) maxC = c + 1;
      }
    }
    const maxR = rows.length > 0 ? rows.length : 1;
    ws["!ref"] = `A1:${XLSX.utils.encode_cell({ r: Math.max(maxR - 1, 0), c: Math.max(maxC - 1, 0) })}`;
    wb.Sheets[name] = ws;
  });
  return wb;
}

export function evaluateDisplayAoA(sheets: any[], activeIndex: number): any[][] {
  try {
    const wb = buildWorkbook(sheets);
    // Compute formulas (fills .v for all cells with .f)
    try {
      XLSX_CALC(wb);
    } catch (e) {
      // Calculation engine may fail for unsupported functions; still proceed
      console.warn("XLSX_CALC evaluation warning:", e);
    }

    const sheetName = sheets[activeIndex]?.name || wb.SheetNames[activeIndex];
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws["!ref"]) return [];

    const range = XLSX.utils.decode_range(ws["!ref"]);
    const out: any[][] = [];
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const row: any[] = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[addr];
        if (!cell) {
          row.push("");
          continue;
        }
        // Prefer formatted text, then calculated value, then raw value
        const val = cell.w !== undefined ? cell.w : (cell.v !== undefined ? cell.v : "");
        row.push(val ?? "");
      }
      out.push(row);
    }
    return out;
  } catch (err) {
    console.error("evaluateDisplayAoA error:", err);
    return [];
  }
}
