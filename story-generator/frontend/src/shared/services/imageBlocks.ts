import type Anthropic from '@anthropic-ai/sdk';
import type { UploadedFile } from '../../types';

export type ImageMedia = 'image/png' | 'image/jpeg' | 'image/webp';

export function buildImageBlock(
  base64: string,
  mediaType: ImageMedia,
): Anthropic.Messages.ImageBlockParam {
  return {
    type: 'image',
    source: { type: 'base64', media_type: mediaType, data: base64 },
  };
}

export function uploadedFileToImageBlock(
  uf: UploadedFile,
): Anthropic.Messages.ImageBlockParam {
  return buildImageBlock(uf.base64, uf.file.type as ImageMedia);
}

export function buildImageBlocks(
  uploads: UploadedFile[],
): Anthropic.Messages.ImageBlockParam[] {
  return uploads.map(uploadedFileToImageBlock);
}
