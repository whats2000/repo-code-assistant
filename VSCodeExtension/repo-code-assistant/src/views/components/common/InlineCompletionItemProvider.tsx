import * as vscode from 'vscode';
import fetch from 'node-fetch';

type Starcoder2ApiResponse = {
  results: Array<{ text: string }>;
};

export class Starcoder2InlineCompletionItemProvider
  implements vscode.InlineCompletionItemProvider
{
  private debounceTimeout: NodeJS.Timeout | null = null;
  private debounceTimeInMilliseconds = 500;

  provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.InlineCompletionList> {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    return new Promise((resolve) => {
      this.debounceTimeout = setTimeout(async () => {
        const completionItems = await this.fetchCompletionItems(
          document,
          position,
        );
        resolve({ items: completionItems });
      }, this.debounceTimeInMilliseconds);
    });
  }

  private async fetchCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.InlineCompletionItem[]> {
    const contextWindow = 500;
    let textAboveCursor = document.getText(
      new vscode.Range(new vscode.Position(0, 0), position),
    );
    let wordsAbove = textAboveCursor.split(/\s+/);
    if (wordsAbove.length > contextWindow) {
      wordsAbove = wordsAbove.slice(wordsAbove.length - contextWindow);
    }
    textAboveCursor = wordsAbove.join(' ');

    let textBelowCursor = document.getText(
      new vscode.Range(
        position,
        new vscode.Position(
          document.lineCount,
          document.lineAt(document.lineCount - 1).range.end.character,
        ),
      ),
    );
    let wordsBelow = textBelowCursor.split(/\s+/);
    if (wordsBelow.length > contextWindow) {
      wordsBelow = wordsBelow.slice(0, contextWindow);
    }
    textBelowCursor = wordsBelow.join(' ');

    const prompt = `<fim_prefix>${textAboveCursor}<fim_suffix>${textBelowCursor}<fim_middle>`;

    const completionItems: vscode.InlineCompletionItem[] = [];

    try {
      const apiEndpoint =
        vscode.workspace
          .getConfiguration('starcoder2')
          .get<string>('apiEndpoint') ?? '';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, max_new_tokens: 100 }),
      });

      const json = (await response.json()) as Starcoder2ApiResponse;
      const predictions = json.results;

      for (const prediction of predictions) {
        const code = prediction.text.trim();
        const completionText = code;
        const completionRange = new vscode.Range(
          position,
          position.translate(0, completionText.length),
        );
        completionItems.push({
          insertText: completionText,
          range: completionRange,
        });
      }
    } catch (err) {
      console.error('Error while calling Starcoder2 API:', err);
    }

    return completionItems;
  }
}
