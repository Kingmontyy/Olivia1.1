/**
 * XLSX CELL DISPLAY EVALUATOR
 * 
 * This function converts stored XLSX cell objects into a plain 2D array for Handsontable display.
 * 
 * BACKGROUND - HOW XLSX STORES CELLS:
 * SheetJS (XLSX library) stores each cell as an object with these properties:
 * - t: Cell type (s=string, n=number, b=boolean, z=empty, d=date)
 * - v: Raw value (the actual data - number 42, string "hello", etc.)
 * - w: Formatted display text (what you see - "42.00", "$42", "hello")
 * - s: Style object (colors, bold, italic, borders, alignment, etc.)
 * - f: Formula string (e.g., "=SUM(A1:A10)" - the formula itself, not the result)
 * 
 * Example XLSX cell object:
 * {
 *   t: 'n',           // number type
 *   v: 42.5,          // raw numeric value
 *   w: '42.50',       // formatted as "42.50" for display
 *   s: {              // styles
 *     font: { bold: true, color: { rgb: 'FF0000' } },
 *     fill: { fgColor: { rgb: 'FFFF00' } }
 *   }
 * }
 * 
 * WHAT HANDSONTABLE NEEDS:
 * Handsontable doesn't understand XLSX cell objects. It needs a simple 2D array of display values:
 * - Just strings/numbers/booleans
 * - Styles are applied separately via cell metadata (setCellMeta)
 * - Formulas are shown in the formula bar but display the calculated result in the grid
 * 
 * Example Handsontable data:
 * [
 *   ["Name", "Price", "Total"],
 *   ["Item 1", 42.50, "=B2*2"],
 *   ["Item 2", 100, "=B3*2"]
 * ]
 * 
 * WHAT THIS FUNCTION DOES:
 * 1. Takes a sheets array and the active sheet index
 * 2. Extracts the display value (w or v) from each XLSX cell object
 * 3. Returns a clean 2D array of display values for Handsontable to render
 * 4. Handles null/undefined rows gracefully (prevents blank editor after re-open)
 * 
 * WHY WE PREFER cell.w OVER cell.v:
 * - cell.w is the formatted display text (e.g., "42.50" with 2 decimals)
 * - cell.v is the raw value (e.g., 42.5 as a number)
 * - Using cell.w preserves the user's intended number formatting
 * 
 * CRITICAL FIX:
 * - Always check if row is null/undefined before mapping (prevents blank editor bug)
 * - This happens when saved data has null rows from optimization
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
    
    // Convert each XLSX cell object to its display value for the Handsontable grid
    const displayData = sheetData.map((row: any[], rowIdx: number) => {
      // CRITICAL GUARD: Handle null/undefined rows (prevents blank editor on re-open)
      // This can happen if saved data has null rows from optimization or corruption
      if (!row || !Array.isArray(row)) {
        console.warn(`[LOAD] Row ${rowIdx} is null/invalid, using empty array`);
        return [];
      }
      
      // Map each cell in the row to its display value
      return row.map((cell: any, colIdx: number) => {
        // Empty cell or null -> return empty string
        if (!cell) return "";
        
        // XLSX cell object -> extract display value
        if (typeof cell === 'object') {
          // Skip truly empty cells (type "z" = empty, no value)
          if (cell.t === 'z' && !cell.v) {
            return "";
          }
          
          // Priority: Use formatted text (w) if available, fallback to raw value (v)
          // This preserves number formatting, date formatting, etc.
          const displayValue = cell.w !== undefined ? cell.w : (cell.v !== undefined ? cell.v : "");
          
          // Debug logging for first few cells (helps troubleshoot display issues after save/load)
          if (rowIdx < 3 && colIdx < 3) {
            console.log(`Cell [${rowIdx},${colIdx}]:`, { 
              type: cell.t, 
              rawValue: cell.v, 
              formattedText: cell.w, 
              displayValue: displayValue 
            });
          }
          
          return displayValue;
        }
        
        // Primitive value (string/number) - not an XLSX object, use as-is
        // This shouldn't normally happen, but handle it gracefully
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
