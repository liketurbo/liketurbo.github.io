---
title: "Решение задачи \"Автоматизируй это\" | Яндекс Контест"
date: 2022-06-26T19:46:21+03:00
---

Задача взята c платформы Яндекс Контест - https://contest.yandex.ru/contest/19380/problems/D.

> P.S. Для просмотра на платформе вам скорее всего придется войти/зарегистрироваться.

## Описание задачи

На государственном портале предоставления услуг сделали возможность подавать заявление на получение документов полностью автоматически, для этого надо только заполнить таблицу с персональными данными.

Эти данные затем передаются на проверку в несколько инстанций, включая МВД. После начала тестирования выяснилось, что МВД принимает данные в формате markdown, а ГосУслуги пользуются html-форматом. Помогите написать скрипт миграции одного формата в другой, чтобы ребята поскорее запустились.

Вам нужно написать функцию, которая на вход принимает HTML-таблицу и преобразует ее в markdown-подобную разметку.

В качестве решения этого задания отправьте файл .js, в котором объявлена функция solution:

```js
function solution(input) {  
    // ...  
}
```

## Условия ввода
- HTML-таблица приходит в виде строки
  ```html
  <table>  
      <colgroup>  
          <col align="right" />  
          <col />  
          <col align="center" />  
      </colgroup>  
      <thead>  
          <tr>  
              <td>Command         </td>  
              <td>Description     </td>  
              <th>Is implemented  </th>  
          </tr>  
      </thead>  
      <tbody>  
          <tr>  
              <th>git status</th>  
              <td>List all new or modified    files</td>  
              <th>Yes</th>  
          </tr>  
          <tr>  
              <th>git diff</th>  
              <td>Show file differences that haven’t been  
  staged</td>  
              <td>No</td>  
          </tr>  
      </tbody>  
  </table>
  ```
- В таблице могут содержаться теги `colgroup`, `thead` и `tbody`  в фиксированном порядке.  
  Все эти теги опциональны, но всегда будет присутствовать как минимум thead либо tbody.
  - `colgroup` содержит теги `col`, у которых может быть опциональный атрибут `align` с одним из трех значений `(left|center|right)`.
  - `thead` и `tbody` содержат 1 или более `tr`
  - `tr`, в свою очередь, содержат как `td`, так и `th`.
- В таблице всегда будет хотя бы одна строка.  
  В строке всегда будет хотя бы одна ячейка.  
  В ячейке всегда присутствует хотя бы один не-whitespace символ.
- Количество элементов `th/td` в строках всегда совпадает между всеми строками и с количеством элементов `col` в `colgroup`, при наличии `colgroup`.
- Пробелы и переносы строк в исходном HTML могут встречаться в любом месте, не нарушающем валидность HTML.

## Условия вывода
 - На выходе должна получиться строка с markdown-разметкой
   ```md
   | Command | Description | **Is implemented** |  
   | ---: | :--- | :---: |  
   | **git status** | List all new or modified files | **Yes** |  
   | **git diff** | Show file differences that haven’t been staged | No |
   ```
- Первая встретившаяся строка в таблице должна всегда превращаться в строку-заголовок в markdown-разметке.  
  Все остальные строки идут в тело таблицы.  
  Разделитель заголовка выводится всегда.
- Пробелы по краям содержимого тегов td и th должны быть удалены.  
  Переносы строк в содержимом ячеек должны быть удалены.  
  Более одного пробела подряд в содержимом ячеек должны быть заменены одним пробелом.
- За выравнивание в ячейках столбцов markdown-таблицы отвечает форматирование разделителя заголовка:  
  `| :--- |` значит выравнивание по левому краю  
  `| :---: |` значит выравнивание по центру  
  `| ---: |` значит выравнивание по правому краю 
- При отсутствии заданного в теге `col` атрибута `align` выравнивание должно быть задано влево.

## Примечания
- Для перевода строки нужно использовать символ `\n`.
- Решение будет проверяться в браузерном окружении **(Chrome 78)** с доступом к объектам `document` и `window`. 
- Можно использовать синтаксис до **es2018** включительно.

## Решение

Мой план такой: сначала отпарсить HTML-таблицу в [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree), а затем из последнего построить MD-таблицу.

### Часть 1: Постройка AST

Для начала создадим классы под каждый тэг, которые позже будут использоваться как ноды [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree).

```typescript
class TableTag {
  constructor(
    public colgroup?: ColgroupTag,
    public thead?: TheadTag,
    public tbody?: TbodyTag
  ) {}
}

class ColgroupTag {
  constructor(public children: ColTag[]) {}
}

class TheadTag {
  constructor(public children: TrTag[]) {}
}

class TbodyTag {
  constructor(public children: TrTag[]) {}
}

class ColTag {
  constructor(public align?: "left" | "center" | "right") {}
}

class TrTag {
  constructor(public children: (TdTag | ThTag)[]) {}
}

class TdTag {
  constructor(public content: string) {}
}

class ThTag {
  constructor(public content: string) {}
}
```

А теперь по порядку будем [RegExp(ом)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) вытаскивать наши теги.  
На примере `col` и `colgroup` тэга.
```typescript
class ColgroupTag {
  // ...
  static parse(html: string) {
    // У нас может может только один colgroup, поэтому без g флага.
    // И s флаг, чтобы .* не останавливался на newline(ах)
    let matches = html.match(/<colgroup>.*<\/colgroup>/s);
    if (!matches) return undefined;
    // Здесь уже с g флагом, может быть несколько сol(ов)
    matches = matches[0].match(/<col.*?\/>/g);
    if (!matches) throw new GuaranteeError("colgroup must contain cols");
    const children = matches.map((c) => ColTag.parse(c));
    return new ColgroupTag(children);
  }
}

class ColTag {
  // ...
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
```

> `GuaranteeError` это класс ошибки по тому, что нам гарантируется условиями задачи.
> ```typescript
>  class GuaranteeError extends Error {
>    constructor(message: string) {
>      super(message);
>      this.name = "GuaranteeError";
>    }
>  }
> ```

Если если мы вызовем `ColgroupTag.parse(arg)`, где `arg` это:

```html
<colgroup>  
  <col align="right" />  
  <col />  
  <col align="center" />  
</colgroup>  
```
То у нас должно "выплюнуться":

```
class ColgroupTag {
  children: [
    class ColTag { align: "right" },
    class ColTag { },
    class ColTag { align: "center" }
  ]
}
```

Парсинг-методы для остальных тэгов:

```typescript
class TheadTag {
  // ...
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
  // ...
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
  // ...
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
  // ...
  static parse(html: string) {
    const matches = html.match(/(?<=<td>).+(?=<\/td>)/s);
    if (!matches) throw new GuaranteeError("'td can't be empty");
    return new TdTag(matches[0]);
  }
}

class ThTag {
  // ...
  static parse(html: string) {
    const matches = html.match(/(?<=<th>).+(?=<\/th>)/s);
    if (!matches) throw new GuaranteeError("'th can't be empty");
    return new ThTag(matches[0]);
  }
}
```

Вроде бы у нас теперь генерится [AST](https://en.wikipedia.org/wiki/Abstract_syntax_tree) и можно приступить ко второй части нашего процесса решения. 

### Часть 2: Сборка MD-таблицы

Создадим helper-функцию, которая создавала бы md-строчку из `TrTag` тэг-класса:

```typescript
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
```

> `straightenText` это функцию, которая очищает текст от whitespace(ов).
> ```typescript
> function straightenText(text: string) {
>   // Удаление новых линий
>   text = text.replace(/\n/g, "");
>   // Trim по обеим сторонам текста
>   text = text.trim();
>   // Замена более 2-х последовательных пробелов
>   text = text.replace(/\s{2,}/g, " ");
>   return text;
> }
> ```

И ещё одну helper-функцию, которая создавала бы md-строчку alignment(а) из `ColgroupTag` тэг-класса:

```typescript
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
```

Наконец-то, после написания всех наших helper(ов) мы можем приступить к написанию кода который будет возвращать финальный output:

```typescript
function solution() {
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
      // Typescript не знает, что у нас по условию точно будет или thead или tbody,
      // поэтому нужно указать это keyword(ом) "as"
      : (tableTag.tbody as TbodyTag).children[0].children.length;
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
```

Вроде всё. Ссылка на [полный код](./code.txt)