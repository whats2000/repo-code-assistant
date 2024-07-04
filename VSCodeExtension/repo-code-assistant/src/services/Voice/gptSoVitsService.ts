import { AbstractVoiceService } from './abstractVoiceService';
import axios, { AxiosResponse } from 'axios';

export class GptSoVitsApiService extends AbstractVoiceService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    super();
    this.apiUrl = apiUrl;
  }

  public async synthesizeVoice(
    refer_wav_path: string | undefined,
    prompt_text: string | undefined,
    prompt_language: string | undefined,
    text: string | undefined,
    text_language: string | undefined,
  ): Promise<Uint8Array> {
    // 修改返回类型为 Promise<Uint8Array>
    try {
      // 构造请求数据
      const requestData: any = {};
      if (refer_wav_path) requestData.refer_wav_path = refer_wav_path;
      if (prompt_text) requestData.prompt_text = prompt_text;
      if (prompt_language) requestData.prompt_language = prompt_language;
      if (text) requestData.text = text;
      if (text_language) requestData.text_language = text_language;

      // 发起 POST 请求
      const response: AxiosResponse<ArrayBuffer> = await axios.post(
        `${this.apiUrl}/`,
        requestData,
        {
          responseType: 'arraybuffer', // 设置响应类型为 arraybuffer
        },
      );

      // 检查响应状态码
      if (response.status === 200) {
        // 将 ArrayBuffer 转换为 Uint8Array
        const audioData = new Uint8Array(response.data);
        return audioData;
      } else {
        console.error(`API responded with status: ${response.status}`);
        throw new Error('Failed to synthesize voice');
      }
    } catch (error) {
      // 错误处理和日志记录
      console.error('Error during API call:', (error as Error).message);
      throw new Error(
        `Failed to synthesize voice: ${(error as Error).message}`,
      );
    }
  }
}
