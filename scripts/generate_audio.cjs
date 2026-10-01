const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

function generateWavBuffer(durationSeconds = 5, frequency = 480) {
  const sampleRate = 22050;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate * durationSeconds;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const chunkSize = 36 + dataSize;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(chunkSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freqMod = frequency + Math.sin(t * 8) * 40 + Math.cos(t * 3) * 20;
    const env = Math.min(1, Math.min(t / 0.1, (durationSeconds - t) / 0.2));
    const sample = Math.sin(2 * Math.PI * freqMod * t) * env * 0.4;
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

const samples = [
  { file: 'sample-en.mp3', freq: 480, dur: 5 },
  { file: 'sample-kn.mp3', freq: 520, dur: 5 },
  { file: 'sample-ta.mp3', freq: 440, dur: 5 },
  { file: 'sample-te.mp3', freq: 500, dur: 5 },
  { file: 'sample-ml.mp3', freq: 460, dur: 5 }
];

samples.forEach(s => {
  const filePath = path.join(audioDir, s.file);
  const wavBuffer = generateWavBuffer(s.dur, s.freq);
  fs.writeFileSync(filePath, wavBuffer);
  console.log(`Generated ${filePath}`);
});
