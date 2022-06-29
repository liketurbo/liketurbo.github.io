import { solution } from "./avtomatiziruyte-eto";

test("example from task description", () => {
  const htmlInput = `<table>  
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
</table>`;

  const mdOutput = `| Command | Description | **Is implemented** |
| ---: | :--- | :---: |
| **git status** | List all new or modified files | **Yes** |
| **git diff** | Show file differences that haven’t been staged | No |`;

  expect(solution(htmlInput)).toBe(mdOutput);
});

test("alignment if not provided resets to left", () => {
  const htmlInput = `<table>  
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
</table>`;

  const mdOutput = `| Command | Description | **Is implemented** |
| :--- | :--- | :--- |
| **git status** | List all new or modified files | **Yes** |
| **git diff** | Show file differences that haven’t been staged | No |`;

  expect(solution(htmlInput)).toBe(mdOutput);
});

test("uses first row as header if thead absent", () => {
  const htmlInput = `<table>  
    <colgroup>  
        <col align="right" />  
        <col />  
        <col align="center" />  
    </colgroup>  
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
</table>`;

  const mdOutput = `| **git status** | List all new or modified files | **Yes** |
| ---: | :--- | :---: |
| **git diff** | Show file differences that haven’t been staged | No |`;

  expect(solution(htmlInput)).toBe(mdOutput);
});

test("lack of tbody doesn't break table", () => {
  const htmlInput = `<table>  
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
</table>`;

  const mdOutput = `| Command | Description | **Is implemented** |
| ---: | :--- | :---: |`;

  expect(solution(htmlInput)).toBe(mdOutput);
});

test("when we have more than 1 header row", () => {
  const htmlInput = `<table>  
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
</table>`;

  const mdOutput = `| Command | Description | **Is implemented** |
| ---: | :--- | :---: |
| Command | Description | **Is implemented** |
| **git status** | List all new or modified files | **Yes** |
| **git diff** | Show file differences that haven’t been staged | No |`;

  expect(solution(htmlInput)).toBe(mdOutput);
});
