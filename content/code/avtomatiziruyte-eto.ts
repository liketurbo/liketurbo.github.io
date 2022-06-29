abstract class Tag {
  constructor(public name: string) {}
}

class TableTag extends Tag {
  constructor(
    public colgroup?: ColgroupTag, 
    public thead?: TheadTag, 
    public tbody?: TbodyTag
  ) {
    super('table');
  }
}

class ColgroupTag extends Tag {
  constructor(public children: ColTag[]) {
    super('colgroup');
  }

  static parse(html: string) {
    const matches = html.match(/<colgroup>.*<\/colgroup>/s);
    if (!matches) return null;
  }
}

class TheadTag extends Tag {
  constructor(public children: TrTag[]) {
    super('thead');
  }
}

class TbodyTag extends Tag {
  constructor(public children: TrTag[]) {
    super('tbody');
  }
}

class ColTag extends Tag {
  constructor(public align?: 'left'|'center'|'right') {
    super('col');
  }
}

class TrTag extends Tag {
  constructor(public children: (TdTag|ThTag)[]) {
    super('tr');
  }
}

class TdTag extends Tag {
  constructor(public content: string) {
    super('td');
  }
}

class ThTag extends Tag {
  constructor(public content: string) {
    super('th');
  }
}

export function solution(input: string) {
  return ''
}