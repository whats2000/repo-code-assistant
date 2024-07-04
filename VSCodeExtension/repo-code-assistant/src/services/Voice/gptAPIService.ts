import * as vscode from 'vscode';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import SettingsManager from '../../api/settingsManager';
import { AbstractVoiceService } from './abstractVoiceService';

export class gptAPIService extends AbstractVoiceService {
  private apiKey: string;
  private readonly settingsListener: vscode.Disposable;

  constructor(
    context: vscode.ExtensionContext,
    settingsManager: SettingsManager,
  ) {
    super(
    );
    this.apiKey = settingsManager.get('openaiApiKey');

    // Listen for settings changes
    this.settingsListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('repo-code-assistant.openAiApiKey')) {
        this.apiKey = settingsManager.get('openaiApiKey');
      }
    });
    context.subscriptions.push(this.settingsListener);
  }
    public async TextToSpeech(generatedText:string){
      const openai = new OpenAI({
        apiKey: this.apiKey,
      });
        try {
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "nova",
          input: generatedText,
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());

        const mediaPath = path.join(__dirname, '..', 'dist', 'media');
        // Define the file name

        const mp3FilePath = path.join(mediaPath, 'generated.mp3');
        // Write the MP3 file to the specified path
        fs.writeFileSync(mp3FilePath, buffer);
        return mp3FilePath;
      }catch(err){
        return 'Failed on Text to Speech.';
      }
    }

    public async SpeechToText(speechFile:string) {
      const openai = new OpenAI({
        apiKey: this.apiKey,
      });
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(speechFile),
          model: "whisper-1",
          response_format: "text",
        });
        return transcription;
      }catch(err){
        return 'Failed on Speech to Text.';
      }    
  }
}