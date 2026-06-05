import type Anthropic from '@anthropic-ai/sdk';
import type { UploadedFile } from '../../types';

export type ImageMedia = 'image/png' | 'image/jpeg' | 'image/webp';

/** Builds an Anthropic image block from a base64-encoded string and media type. */
export function buildImageBlock(
  base64: string,
  mediaType: ImageMedia,
): Anthropic.Messages.ImageBlockParam {
  return {
    type: 'image',
    source: { type: 'base64', media_type: mediaType, data: base64 },
  };
}

/** Converts an UploadedFile (from ScreenshotUpload) to an Anthropic image block. */
export function uploadedFileToImageBlock(
  uf: UploadedFile,
): Anthropic.Messages.ImageBlockParam {
  return buildImageBlock(uf.base64, uf.file.type as ImageMedia);
}

/**
 * Converts an array of UploadedFiles to Anthropic image blocks.
 * Intended to be spread into a messages array before the text block:
 * `[...buildImageBlocks(uploads), { type: 'text', text: userMessage }]`
 */
export function buildImageBlocks(
  uploads: UploadedFile[],
): Anthropic.Messages.ImageBlockParam[] {
  return uploads.map(uploadedFileToImageBlock);
}
