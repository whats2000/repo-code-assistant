import * as vscode from 'vscode';
import { AbstractLanguageModelService } from './../languageModel/abstractLanguageModelService';
import SettingsManager from '../../api/settingsManager';
import { ConversationEntry } from '../../types/conversationHistory';
import { GptSoVitsApiService } from './gptSoVitsService';

export class GptSovitsIntegrationService extends AbstractLanguageModelService {
  private gptSovitsService: GptSoVitsApiService;
  private settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
    availableModelName: string[],
  ) {
    super(
      context,
      'gptSovitsConversationHistory.json',
      settingsManager,
      'gptSovits',
      availableModelName,
    );

    const apiUrl =
      this.settingsManager.get('gptSoVitsApiUrl') || 'http://127.0.0.1:9880';
    this.gptSovitsService = new GptSoVitsApiService(apiUrl);

    this.initialize().catch((error) =>
      vscode.window.showErrorMessage(
        'Failed to initialize GPT-SoVits Voice Service: ' + error.message,
      ),
    );

    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('repo-code-assistant.customModels') ||
        e.affectsConfiguration('repo-code-assistant.selectedCustomModel')
      ) {
        this.updateSettings();
      }
    });

    context.subscriptions.push(this.settingsListener);
  }

  private async initialize() {
    try {
      await this.loadHistories();
    } catch (error) {
      let errorMessage = 'Failed to initialize GPT-SoVits Voice Service: ';
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += 'An unknown error occurred';
      }
      vscode.window.showErrorMessage(errorMessage);
    }
  }

  private updateSettings() {
    const selectedModel = this.settingsManager.getSelectedCustomModel();
    if (selectedModel && selectedModel.apiUrl) {
      this.gptSovitsService = new GptSoVitsApiService(selectedModel.apiUrl);
      this.currentModel = selectedModel.name;
    } else {
      this.currentModel = 'gptSovits';
      vscode.window
        .showErrorMessage(
          'No custom model configuration found. Please configure a custom model.',
        )
        .then();
    }
  }

  public async getResponseForQuery(
    query: string,
    currentEntryID?: string,
  ): Promise<string> {
    const history = currentEntryID
      ? this.getHistoryBeforeEntry(currentEntryID)
      : this.history;

    const conversationHistory = this.conversationHistoryToJson(history.entries);
    console.log('對話歷史：', conversationHistory);

    try {
      const refer_wav_path = '';
      const prompt_text = '';
      const prompt_language = 'zh';
      const text_language = 'zh';

      const audioUint8Array = await this.gptSovitsService.synthesizeVoice(
        refer_wav_path,
        prompt_text,
        prompt_language,
        query,
        text_language,
      );

      const audioUrl = URL.createObjectURL(new Blob([audioUint8Array]));
      return audioUrl;
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to get response from GPT-SoVits Service: ' +
          (error as Error).message,
      );
      return 'Failed to connect to the GPT-SoVits service.';
    }
  }

  public async getResponseChunksForQuery(
    _query: string,
    _sendStreamResponse: (msg: string) => void,
    _currentEntryID?: string,
  ): Promise<string> {
    return '';
  }

  private conversationHistoryToJson(entries: {
    [key: string]: ConversationEntry;
  }): string {
    const historyArray = [];
    let currentEntry: ConversationEntry | null = entries[this.history.current];

    while (currentEntry) {
      historyArray.unshift({
        role: currentEntry.role,
        message: currentEntry.message,
      });
      currentEntry = currentEntry.parent
        ? (entries[currentEntry.parent] as ConversationEntry)
        : null;
    }

    return JSON.stringify(historyArray);
  }

  public async switchModel(modelName: string): Promise<void> {
    const customModels = this.settingsManager.getCustomModels();
    const selectedModel = customModels.find(
      (model) => model.name === modelName,
    );

    if (!selectedModel) {
      vscode.window.showErrorMessage(`Custom model ${modelName} not found.`);
      return;
    }

    this.settingsManager.selectCustomModel(modelName);
    this.gptSovitsService = new GptSoVitsApiService(selectedModel.apiUrl);
    await this.loadHistories();

    super.switchModel(modelName);
  }
}
