/*
 * Converts stored XLSX cell objects into a plain 2D array for Handsontable display.
 * 
 * XLSX stores cells as objects with properties:
 * - t: type (s=string, n=number, z=empty)
 * - v: raw value
 * - w: formatted display text
 * - s: styling (bold, colors, etc.)
 * - f: formula
 * 
 * Handsontable needs a simple 2D array of display values (strings/numbers).
 * This function extracts the display value (w or v) from each cell object.
 */
export function evaluateDisplayAoA(sheets: any[], activeIndex: number): any[][] {
  try {
    const sheet = sheets[activeIndex];
    if (!sheet || !sheet.data) {
      console.log(`evaluateDisplayAoA: No sheet or data at index ${activeIndex}`);
      return [];
    }

    const sheetData = sheet.data;
    console.log(`[LOAD] Processing sheet ${activeIndex} with ${sheetData.length} rows`);
    
    // Convert each cell object to its display value for the grid
    // Handle null/undefined rows (critical fix for blank editor on re-open)
    const displayData = sheetData.map((row: any[], rowIdx: number) => {
      // Guard: if row is null/undefined, return empty row (prevents "Cannot read properties of null" error)
      if (!row || !Array.isArray(row)) {
        console.warn(`[LOAD] Row ${rowIdx} is null/invalid, using empty array`);
        return [];
      }
      return row.map((cell: any, colIdx: number) => {
        if (!cell) return "";
        if (typeof cell === 'object') {
          // Skip empty cells with no value (type "z" = empty)
          if (cell.t === 'z' && !cell.v) {
            return "";
          }
          // Priority: formatted text (w) > calculated value (v) > empty string
          const displayValue = cell.w !== undefined ? cell.w : (cell.v !== undefined ? cell.v : "");
          // Debug logging for first few cells (helps troubleshoot display issues)
          if (rowIdx < 3 && colIdx < 3) {
            console.log(`Cell [${rowIdx},${colIdx}]:`, { t: cell.t, v: cell.v, w: cell.w, display: displayValue });
          }
          return displayValue;
        }
        // If cell is already a primitive (string/number), use as-is
        return cell;
      });
    });
    
    console.log(`[LOAD] Converted to ${displayData.length} display rows, first row has ${displayData[0]?.length || 0} cols`);
    return displayData;
  } catch (err) {
    console.error("evaluateDisplayAoA error:", err);
    return [];
  }
}
