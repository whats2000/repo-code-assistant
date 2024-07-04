import * as fs from 'fs';
import * as path from 'path';
import { GptSoVitsApiService } from './gptSoVitsService';

// 保存 Uint8Array 到 WAV 文件的函数
async function saveUint8ArrayToWav(
  data: Uint8Array,
  outputPath: string,
): Promise<void> {
  const buffer = Buffer.from(data);

  console.log(
    `Saving WAV file to ${outputPath} with buffer length ${buffer.length}`,
  );

  return new Promise<void>((resolve, reject) => {
    fs.writeFile(outputPath, buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

describe('GptSoVitsApiService', () => {
  let service: GptSoVitsApiService;
  const apiUrl = 'http://127.0.0.1:9880';
  const outputPathBase =
    'C:/Users/linli/PycharmProjects/course_mis324/VSCodeExtension/repo-code-assistant/dist/media';

  beforeEach(() => {
    service = new GptSoVitsApiService(apiUrl);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('testtovoice', async () => {
    const refer_wav_path =
      'C:/Users/linli/Downloads/phzbghodz5f29weqv8grq3nidwwgsdb.wav';
    const prompt_text =
      'Sure, Ill play you another tune, but it ll cost you an apple.';
    const prompt_language = 'en';
    const textToSynthesize =
      'Hello! This is a test message for speech synthesis. I hope you find it clear and understandable.';
    const language = 'en';

    try {
      const result = await service.synthesizeVoice(
        refer_wav_path,
        prompt_text,
        prompt_language,
        textToSynthesize,
        language,
      );

      console.log('Received audio data:', result);
      console.log('Data length:', result.length);
      expect(result instanceof Uint8Array).toBeTruthy();

      const outputPath = path.join(
        outputPathBase,
        `output_${Date.now()}.wav`, // 生成一个唯一的文件名
      );
      await saveUint8ArrayToWav(result as Uint8Array, outputPath);

      // 检查文件是否存在
      expect(fs.existsSync(outputPath)).toBe(true);
      console.log(`File saved at ${outputPath}`);
    } catch (error) {
      // 如果测试失败，打印错误并抛出以便 Jest 捕获和报告
      console.error('测试失败:', error);
      throw error; // 将错误抛出以便 Jest 捕获和报告
    }
  }, 20000);
});
