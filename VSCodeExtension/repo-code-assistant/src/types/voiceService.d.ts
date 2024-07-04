/**
 * Describes a service that can synthesize voice from text input.
 */
export type VoiceService = {
  /**
   * Synthesizes voice using the given input parameters.
   * @param refer_wav_path - Path to a reference WAV file, if needed.
   * @param prompt_text - Initial prompt text, if needed.
   * @param prompt_language - Language of the prompt text.
   * @param text - The main text to synthesize into speech.
   * @param text_language - Language of the main text.
   * @returns A promise that resolves to audio data in Uint8Array format.
   */
  synthesizeVoice(
    refer_wav_path: string | undefined,
    prompt_text: string | undefined,
    prompt_language: string | undefined,
    text: string | undefined,
    text_language: string | undefined,
  ): Promise<Uint8Array>;
};
