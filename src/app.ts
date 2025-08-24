import { FireflyClient, GenerateImagesResponse } from "@adobe/firefly-apis";
import { ApiOptions, ApiResponse } from "@adobe/firefly-services-sdk-core";

import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import {
  AspectRatios,
  ExtendedFireflyClient,
} from "./util/extended-firefly-client.ts";
import {
  CampaignBrief,
  type Product,
  validateCampaignBrief,
} from "./util/campaign-brief-parser.ts";

import { logger } from "./util/logger.ts";

export interface GenerationOptions {
  inputDir: string;
  outputDir: string;
}

async function downloadFile(url: string, filePath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.body) {
    throw new Error(`Failed to download file from ${url}: No response body`);
  }
  const body = Readable.fromWeb(res.body as any);
  const download_write_stream = fs.createWriteStream(filePath);
  return await finished(body.pipe(download_write_stream));
}
async function generateProductImages({
  firefly,
  product,
  brief,
  options,
  ratio,
}: {
  firefly: ExtendedFireflyClient;
  product: Product;
  brief: CampaignBrief;
  options: GenerationOptions;
  ratio: keyof typeof AspectRatios;
}) {
  const outputDir = path.join(
    options.outputDir,
    brief.name,
    brief.targetRegion,
    product.name,
    ratio
  );

  fs.mkdirSync(outputDir, { recursive: true });

  logger.debug(
    `Product: "${product.name}" for target region: ${brief.targetRegion} and aspect ratio: ${ratio}`
  );

  const prompt = `A promotional image for a "${product.name}" (${product.description}) targeting ${brief.targetAudience}. The message is: "${brief.campaignMessage}".`;
  logger.debug(`  - Generation Prompt: ${prompt}`);

  try {
    const resp = await firefly.simpleGenerateImages({
      prompt: prompt,
      aspectRatio: ratio as keyof typeof AspectRatios,
      promptBiasingLocaleCode: brief.targetRegion,
      // modelVersion: "image4",
    });

    if (resp.status === "succeeded") {
      if (
        Array.isArray(resp.result.outputs) &&
        resp.result.outputs.length > 0
      ) {
        await Promise.all(
          resp.result.outputs.map(async (output, idx) => {
            if (output && output.image?.url) {
              const fileName = path.join(
                outputDir,
                `${output.seed || idx}-${brief.name}-${brief.targetRegion}-${
                  product.name
                }-${ratio}.jpg`
              );
              logger.debug(`  - Downloading generated image to: ${fileName}`);
              await downloadFile(output.image.url, fileName);
              logger.debug(`  - Successfully downloaded image.`);
            } else {
              logger.error(
                `  - Error: No image was generated for output #${idx}.`
              );
            }
          })
        );
      } else {
        logger.error("  - Error: No images were generated.");
      }
    } else {
      throw new Error(`Failed to generate image: ${resp.status}`);
    }
  } catch (error) {
    logger.error("  - Error generating image:", error);
  }
}

/**
 * Accepts a campaign brief, generation options, and a firefly client.
 * Generates creative assets for each product in the brief, and each aspect ratio.
 */
export async function generateCreativeAssets(
  brief: CampaignBrief,
  options: GenerationOptions,
  firefly: ExtendedFireflyClient,
  onProgress: (progress: {
    product: Product;
    ratio: keyof typeof AspectRatios;
  }) => void
): Promise<void> {
  // fail fast
  validateCampaignBrief(brief);

  // Create output directory
  fs.mkdirSync(options.outputDir, { recursive: true });

  const promises = [];

  for (const product of brief.products) {
    for (const ratio of Object.keys(AspectRatios)) {
      await generateProductImages({
        firefly,
        product,
        brief,
        options,
        ratio: ratio as keyof typeof AspectRatios,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second between products
      onProgress &&
        onProgress({
          product: product,
          ratio: ratio as keyof typeof AspectRatios,
        });
    }
  }
}

export function createFireflyClient(
  clientId: string,
  clientSecret: string
): ExtendedFireflyClient {
  return new ExtendedFireflyClient({
    clientId: clientId,
    clientSecret: clientSecret,
    scopes: "firefly_api, ff_apis",
  });
}
