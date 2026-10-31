// axios is replaced so no test can reach the OpenAI API.
jest.mock('axios');

import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ImageRecognitionService } from './image-recognition.service';

describe('ImageRecognitionService.recognizeFood', () => {
  // A dummy OpenAI key and no Google credentials select the OpenAI path, which
  // is where a missing buffer used to throw a TypeError that was swallowed.
  const config = {
    get: (key: string) => (key === 'OPENAI_API_KEY' ? 'test-only-openai-key' : undefined),
  } as unknown as ConfigService;
  const service = new ImageRecognitionService(config);

  const file = (buffer?: Buffer) =>
    ({
      fieldname: 'image',
      originalname: 'meal.jpg',
      mimetype: 'image/jpeg',
      size: buffer?.length ?? 3,
      buffer,
    }) as unknown as Express.Multer.File;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a file without a buffer with 400 instead of returning no foods', async () => {
    const result = service.recognizeFood(file(undefined));
    await expect(result).rejects.toBeInstanceOf(BadRequestException);
    await expect(result).rejects.toMatchObject({ status: 400 });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('rejects an empty buffer with 400', async () => {
    await expect(service.recognizeFood(file(Buffer.alloc(0)))).rejects.toMatchObject({ status: 400 });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('sends the buffer to OpenAI as a base64 data URL when it is present', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: { choices: [{ message: { content: '{"foods":[{"name":"rice","confidence":0.9}]}' } }] },
    });

    const result = await service.recognizeFood(file(Buffer.from('abc')));

    expect(result.foods).toEqual([{ name: 'rice', confidence: 0.9, estimatedWeight: 100 }]);
    const body = (axios.post as jest.Mock).mock.calls[0][1];
    expect(JSON.stringify(body)).toContain('data:image/jpeg;base64,YWJj');
  });
});
