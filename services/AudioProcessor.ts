
// A global AudioContext, lazy-loaded.
let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const reverseAudioBuffer = async (audioBlob: Blob): Promise<AudioBuffer | null> => {
  const context = getAudioContext();
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    
    const numberOfChannels = audioBuffer.numberOfChannels;
    const reversedBuffer = context.createBuffer(
      numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    for (let i = 0; i < numberOfChannels; i++) {
      const channelData = audioBuffer.getChannelData(i);
      // Create a copy before reversing to avoid modifying the original buffer's data in place
      const reversedChannelData = Float32Array.from(channelData).reverse();
      reversedBuffer.copyToChannel(reversedChannelData, i);
    }
    return reversedBuffer;
  } catch (error) {
    console.error("Error decoding or reversing audio data:", error);
    return null;
  }
};


function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function interleave(buffer: AudioBuffer): Float32Array {
    const numChannels = buffer.numberOfChannels;
    const numSamples = buffer.length;
    const result = new Float32Array(numSamples * numChannels);
    
    const channels = [];
    for(let i=0; i < numChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let offset = 0;
    for (let i = 0; i < numSamples; i++) {
        for (let j = 0; j < numChannels; j++) {
            result[offset++] = channels[j][i];
        }
    }
    return result;
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
}


export const audioBufferToWavBlob = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const interleaved = interleave(buffer);
  const dataLength = interleaved.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Sub-chunk size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // Byte rate
  view.setUint16(32, numChannels * (bitDepth / 8), true); // Block align
  view.setUint16(34, bitDepth, true);
  
  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  // Write PCM data
  floatTo16BitPCM(view, 44, interleaved);

  return new Blob([view], { type: 'audio/wav' });
};
