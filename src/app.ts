import { FireflyClient, GenerateImagesResponse } from "@adobe/firefly-apis";
import { ApiOptions, ApiResponse } from "@adobe/firefly-services-sdk-core";

import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { ExtendedFireflyClient } from "./util/extended-firefly-client.js";
import {
  CampaignBrief,
  type Product,
  validateCampaignBrief,
} from "./util/campaign-brief-parser.js";

import { logger } from "./util/logger.js";
import { AzureCampaignClient } from "./util/azure-client.js";
import {
  FireflyAspectRatios,
  FireflyAspectRatioKey,
} from "./util/aspect-ratio-util.js";

export interface GenerationOptions {
  outputDir: string;
  aspectRatios: FireflyAspectRatioKey[];
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
  azureClient,
  product,
  brief,
  options,
  ratio,
}: {
  firefly: ExtendedFireflyClient;
  azureClient: AzureCampaignClient;
  product: Product;
  brief: CampaignBrief;
  options: GenerationOptions;
  ratio: keyof typeof FireflyAspectRatios;
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

  logger.verbose(
    `\n  - Asking Azure for scene plan for product: ${product.name}`
  );

  const scenePlan = await azureClient.generateSceneForProductCampaign(
    product,
    brief
  );

  logger.verbose(
    `\n  - Azure scene plan: ${JSON.stringify(scenePlan, null, 2)}`
  );
  const prompt = scenePlan.image_generation_prompt;
  // const prompt = [
  //   // core environment
  //   `${scenePlan.concept}. ${scenePlan.environment}. ${scenePlan.surface}.`,
  //   // product-photo framing
  //   `Photorealistic beverage product scene, high detail, realistic materials and reflections, clean composition.`,
  //   // lighting & camera
  //   `Lighting: ${scenePlan.lighting}.`,
  //   `Camera: ${scenePlan.camera.angle} angle, ~${scenePlan.camera.focal_length_mm}mm look.`,
  //   // color / styling
  //   `Color grade: ${scenePlan.color_grade}.`,
  //   // props (beverage-friendly)
  //   scenePlan.props?.length ? `Props: ${scenePlan.props.join(", ")}.` : "",
  // ]
  //   .filter(Boolean)
  //   .join("\n") as string;

  logger.debug(`\n  - Generation Prompt: ${prompt}`);

  try {
    // const resp = await firefly.simpleGenerateImages({
    //   prompt: prompt,
    //   aspectRatio: ratio as keyof typeof AspectRatios,
    //   promptBiasingLocaleCode: brief.targetRegion,
    //   // modelVersion: "image4",
    // });

    const resp = await firefly.simpleGenerateObjectComposite({
      prompt,
      objectImage: product.cutoutImage || "",
      aspectRatio: ratio as keyof typeof FireflyAspectRatios,
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
  azureClient: AzureCampaignClient,
  onProgress: (progress: {
    product: Product;
    ratio: keyof typeof FireflyAspectRatios;
  }) => void
): Promise<void> {
  // fail fast
  validateCampaignBrief(brief);

  // Create output directory
  fs.mkdirSync(options.outputDir, { recursive: true });

  const promises = [];

  for (const product of brief.products) {
    for (const ratio of options.aspectRatios) {
      await generateProductImages({
        firefly,
        azureClient,
        product,
        brief,
        options,
        ratio: ratio as keyof typeof FireflyAspectRatios,
      });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second between products
      onProgress &&
        onProgress({
          product: product,
          ratio: ratio as keyof typeof FireflyAspectRatios,
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
