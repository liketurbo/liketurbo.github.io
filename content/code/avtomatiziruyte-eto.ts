export function solution(input: string) {
  const tableTag = TableTag.parse(input);

  let lines: string[] = [];

  let line: string | null = null;
  if (tableTag.thead) line = createRowLine(tableTag.thead.children[0]);
  // На случай если у нас нету thead(а),
  // тогда нам по условию нужно взять 1-ую строчку из tbody
  else line = createRowLine((tableTag.tbody as TbodyTag).children[0]);
  lines.push(line);

  if (tableTag.colgroup) {
    line = createAlignmentLine(tableTag.colgroup);
  } else {
    // Если у нас нету colgroup,
    // то мы определяем кол-во столбцов через thead ил tbody
    const colNum = tableTag.thead
      ? tableTag.thead.children[0].children.length
      : // Typescript не знает, что у нас по условию точно будет или thead или tbody,
        // поэтому нужно указать это keyword(ом) "as"
        (tableTag.tbody as TbodyTag).children[0].children.length;
    const dummyColgroup = new ColgroupTag(Array(colNum).fill(new ColTag()));
    line = createAlignmentLine(dummyColgroup);
  }
  lines.push(line);

  // Обработать case, когда у нас больше 1-ого заголовка
  if (tableTag.thead && tableTag.thead.children.length > 1) {
    for (let i = 1; i < tableTag.thead.children.length; i++) {
      const tr = tableTag.thead.children[i];
      line = createRowLine(tr);
      lines.push(line);
    }
  }

  if (tableTag.tbody) {
    // Если мы использовали первый ряд как заголовок, то мы его пропускаем
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

/**
 * Remove newlines and trims the text
 */
function straightenText(text: string) {
  // Удаление новых линий
  text = text.replace(/\n/g, "");
  // Trim по обеим сторонам текста
  text = text.trim();
  // Замена более 2-х последовательных пробелов
  text = text.replace(/\s{2,}/g, " ");
  return text;
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
    // У нас может может только один colgroup, поэтому без g флага.
    // И s флаг, чтобы .* не останавливался на newline(ах)
    let matches = html.match(/<colgroup>.*<\/colgroup>/s);
    // Здесь уже с g флагом, может быть несколько сol(ов)
    if (!matches) return undefined;
    matches = matches[0].match(/<col.*?\/>/g);
    if (!matches) throw new GuaranteeError("colgroup must contain cols");
    const children = matches.map((c) => ColTag.parse(c));
    return new ColgroupTag(children);
  }
}

class ColTag {
  constructor(public align?: "left" | "center" | "right") {}

  static parse(html: string) {
    const matches = html.match(
      // Хватаем тэг с группой align, но игнорим само слово align
      /<col\s*(?:align="(left|center|right)")?\s*\/?>/
    );
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
    this.name = "GuaranteeError";
  }
}
