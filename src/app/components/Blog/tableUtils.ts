export const MAX_GRID = 8;
export const TD_STYLE =
  "border:1px solid #bbb;padding:6px 10px;min-width:80px;word-break:break-word;vertical-align:top";

export function genRowId() {
  return `row-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeTableHtml(rows: number, cols: number) {
  let html =
    '<table style="border-collapse:collapse;width:100%;margin:8px 0;table-layout:fixed"><tbody>';
  for (let r = 0; r < rows; r++) {
    const rid = genRowId();
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      html += `<td data-row="${rid}" style="${TD_STYLE}"><br></td>`;
    }
    html += "</tr>";
  }
  return html + "</tbody></table>";
}
