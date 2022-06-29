export function solution(input: string) {
  const tableTag = TableTag.parse(input);
  const output = buildMd(tableTag);
  return output;
}

function buildMd(tableTag: TableTag) {
  let lines: string[] = [];

  let line: string | null = null;
  if (tableTag.thead) line = createRowLine(tableTag.thead.children[0]);
  // Case when we don't have thead and we have first row as a title
  else line = createRowLine((tableTag.tbody as TbodyTag).children[0]);
  lines.push(line);

  if (tableTag.colgroup) {
    line = createAlignmentLine(tableTag.colgroup);
  } else {
    // Find out amount of columns
    const colNum = tableTag.thead
      ? tableTag.thead.children[0].children.length
      : (tableTag.tbody as TbodyTag).children[0].children.length;
    const dummyColgroup = new ColgroupTag(Array(colNum).fill(new ColTag()));
    line = createAlignmentLine(dummyColgroup);
  }
  lines.push(line);

  // Handle case when we more that 1 header
  if (tableTag.thead && tableTag.thead.children.length > 1) {
    for (let i = 1; i < tableTag.thead.children.length; i++) {
      const tr = tableTag.thead.children[i];
      line = createRowLine(tr);
      lines.push(line);
    }
  }

  if (tableTag.tbody) {
    // If we already used first row as header then we skip it
    for (
      let i = tableTag.thead ? 0 : 1;
      i < tableTag.tbody.children.length;
      i++
    ) {
      const tr = tableTag.tbody.children[i];
      line = createRowLine(tr);
      lines.push(line);
    }
  }

  const output = lines.join("\n");
  return output;
}
/**
 * Remove newlines and trims the text
 */
function straightenText(text: string) {
  // Remove new lines
  text = text.replace(/\n/g, "");
  // Trim
  text = text.trim();
  // Remove more than 1 spaces
  text = text.replace(/\s{2,}/g, " ");
  return text;
}

/**
 * Create a valid data md-row from
 */
function createRowLine(tr: TrTag) {
  let line: string[] | string = [];

  tr.children.forEach((d) => {
    if (d instanceof ThTag)
      (line as string[]).push(` **${straightenText(d.content)}** `);
    else (line as string[]).push(` ${straightenText(d.content)} `);
  });

  line = ["", ...line, ""].join("|");
  return line;
}

/**
 * Create an alignment md-line
 */
function createAlignmentLine(colgroupTag: ColgroupTag) {
  let line: string[] | string = [];

  colgroupTag.children.forEach((c) => {
    switch (c.align) {
      case "left":
        (line as string[]).push(" :--- ");
        break;
      case "center":
        (line as string[]).push(" :---: ");
        break;
      case "right":
        (line as string[]).push(" ---: ");
        break;
      default:
        (line as string[]).push(" :--- ");
    }
  });

  line = ["", ...line, ""].join("|");
  return line;
}

class TableTag {
  constructor(
    public colgroup?: ColgroupTag,
    public thead?: TheadTag,
    public tbody?: TbodyTag
  ) {}

  static parse(html: string) {
    return new TableTag(
      ColgroupTag.parse(html),
      TheadTag.parse(html),
      TbodyTag.parse(html)
    );
  }
}

class ColgroupTag {
  constructor(public children: ColTag[]) {}

  static parse(html: string) {
    let matches = html.match(/<colgroup>.*<\/colgroup>/s);
    if (!matches) return undefined;
    matches = matches[0].match(/<col.*?\/>/g);
    if (!matches) throw new GuaranteeError("colgroup must contain cols");
    const children = matches.map((c) => ColTag.parse(c));
    return new ColgroupTag(children);
  }
}

class TheadTag {
  constructor(public children: TrTag[]) {}

  static parse(html: string) {
    let matches = html.match(/<thead>.*<\/thead>/s);
    if (!matches) return undefined;
    matches = matches[0].match(/<tr>.*?<\/tr>/gs);
    if (!matches) throw new GuaranteeError("thead must have at least one row");
    const children = matches.map((r) => TrTag.parse(r));
    return new TheadTag(children);
  }
}

class TbodyTag {
  constructor(public children: TrTag[]) {}

  static parse(html: string) {
    let matches = html.match(/<tbody>.*<\/tbody>/s);
    if (!matches) return undefined;
    matches = matches[0].match(/<tr>.*?<\/tr>/gs);
    if (!matches) throw new GuaranteeError("tbody must have at least one row");
    const children = matches.map((r) => TrTag.parse(r));
    return new TbodyTag(children);
  }
}

class ColTag {
  constructor(public align?: "left" | "center" | "right") {}

  static parse(html: string) {
    const matches = html.match(/<col\s?(?:align="(left|center|right)")?\s?\/>/);
    if (!matches) throw new GuaranteeError("must be valid col");
    switch (matches[1]) {
      case "left":
        return new ColTag("left");
      case "center":
        return new ColTag("center");
      case "right":
        return new ColTag("right");
      default:
        return new ColTag();
    }
  }
}

class TrTag {
  constructor(public children: (TdTag | ThTag)[]) {}

  static parse(html: string) {
    const matches = html.match(/<(th|td)>.*?<\/(.*?)\1>/gs);
    if (!matches) throw new GuaranteeError("tr must have at least one td");
    const children = matches.map((d) => {
      const isHeader = Boolean(/<th>.*<\/th>/s.test(d));
      return isHeader ? ThTag.parse(d) : TdTag.parse(d);
    });
    return new TrTag(children);
  }
}

class TdTag {
  constructor(public content: string) {}

  static parse(html: string) {
    const matches = html.match(/(?<=<td>).+(?=<\/td>)/s);
    if (!matches) throw new GuaranteeError("'td can't be empty");
    return new TdTag(matches[0]);
  }
}

class ThTag {
  constructor(public content: string) {}

  static parse(html: string) {
    const matches = html.match(/(?<=<th>).+(?=<\/th>)/s);
    if (!matches) throw new GuaranteeError("'th can't be empty");
    return new ThTag(matches[0]);
  }
}

class GuaranteeError extends Error {
  constructor(message: string) {
    super(message);
  }
}
