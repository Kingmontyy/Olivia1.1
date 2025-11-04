// Convert stored sheet data to display array for Handsontable
export function evaluateDisplayAoA(sheets: any[], activeIndex: number): any[][] {
  try {
    const sheet = sheets[activeIndex];
    if (!sheet || !sheet.data) return [];

    const sheetData = sheet.data;
    console.log(`Processing sheet ${activeIndex} with ${sheetData.length} rows`);
    
    // Convert cell objects to display values
    const displayData = sheetData.map((row: any[], rowIdx: number) => 
      row.map((cell: any, colIdx: number) => {
        if (!cell) return "";
        if (typeof cell === 'object') {
          // Skip empty cells (type "z" with no value)
          if (cell.t === 'z' && !cell.v) {
            return "";
          }
          // Use formatted text first, then calculated value, then raw value
          const displayValue = cell.w !== undefined ? cell.w : (cell.v !== undefined ? cell.v : "");
          // Debug first few cells
          if (rowIdx < 3 && colIdx < 3) {
            console.log(`Cell [${rowIdx},${colIdx}]:`, { t: cell.t, v: cell.v, w: cell.w, display: displayValue });
          }
          return displayValue;
        }
        return cell;
      })
    );
    
    console.log(`Converted to ${displayData.length} display rows`);
    return displayData;
  } catch (err) {
    console.error("evaluateDisplayAoA error:", err);
    return [];
  }
}
