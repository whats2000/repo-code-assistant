import { VoiceService } from '../../types/voiceService';

export abstract class AbstractVoiceService implements VoiceService {
  public abstract synthesizeVoice(
    refer_wav_path: string,
    prompt_text: string,
    prompt_language: string,
    text: string,
    text_language: string,
  ): Promise<Uint8Array>; // 修改返回类型为 Uint8Array
}
