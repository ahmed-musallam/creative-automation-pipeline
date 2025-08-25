#!/usr/bin/env node
import { Command } from "commander";
import "dotenv/config";
import {
  generateCreativeAssets,
  createFireflyClient,
  type GenerationOptions,
} from "./src/app";
import { parseCampaignBrief } from "./src/util/campaign-brief-parser";
import ora from "ora";
import path from "path";
import { logger, setLogLevel } from "./src/util/logger";
import { AzureCampaignClient } from "./src/util/azure-client";
import {
  FireflyAspectRatioKey,
  FireflyAspectRatios,
  getApproximatedAspectRatio,
  isValidAspectRatio,
} from "./src/util/aspect-ratio-util";

const program = new Command();

const REQUIRED_ENV_VARS = [
  "FFS_CLIENT_ID",
  "FFS_CLIENT_SECRET",
  "AZURE_ENDPOINT",
  "AZURE_API_KEY",
  "AZURE_API_VERSION",
  "AZURE_MODEL_NAME",
  "AZURE_DEPLOYMENT",
];

program
  .name("creative-cli")
  .description("A CLI to automate creative asset generation.")
  .version("1.0.0");

program
  .command("generate")
  .description("Generate creative assets based on a campaign brief.")
  .argument("<campaign-brief>", "Path to the campaign brief YAMLfile.")
  .option("-i, --input <dir>", "Path to input assets directory.", "inputs")
  .option("-o, --output <dir>", "Path to output directory.", "outputs")
  .option(
    "-r, --aspect-ratios <ratios>",
    "Comma-separated list of aspect ratios to generate. Allowed values: (1:1, 16:9, 9:16, 4:3, 3:4, 7:4, 9:7, 7:9). Any other aspect ratio will be approximated to the closest supported one.",
    (value) => {
      const ratios = value.split(",").map((r) => r.trim());
      const invalid = ratios.filter((r) => !isValidAspectRatio(r));
      if (invalid.length > 0) {
        throw new Error(
          `Invalid aspect ratio(s): ${invalid.join(
            ", "
          )}. Each must be in the format number:number (e.g. 1:1, 16:9).`
        );
      }
      return ratios;
    },
    ["1:1", "16:9"]
  )
  .option(
    "-l, --log-level <level>",
    "Log level. One of: error, warning, info, debug",
    (value) => {
      const allowed = ["error", "warning", "info", "debug"];
      if (!allowed.includes(value)) {
        logger.warn(
          `Warning: Invalid log level "${value}". Allowed values are: ${allowed.join(
            ", "
          )}. Defaulting to "info".`
        );
        return "info";
      }
      return value;
    },
    "info"
  )
  .action(
    async (
      campaignBriefPath: string,
      options: {
        output: string;
        logLevel: string;
        aspectRatios: string[];
      }
    ) => {
      console.log("log level", options.logLevel);
      process.env.LOG_LEVEL = options.logLevel || "info";
      setLogLevel(options.logLevel);
      // Validate environment variables
      for (const varName of REQUIRED_ENV_VARS) {
        if (!process.env[varName]) {
          console.error(
            `${varName} environment variable is required, but not set.`
          );
          process.exit(1);
        }
      }
      // Generate creative assets
      const spinner = ora("\n").start();

      try {
        spinner.text = "Parsing campaign brief...\n";
        // Parse the campaign brief
        const brief = parseCampaignBrief(campaignBriefPath);

        // ensure full path to the cutout image
        brief.products.forEach((product) => {
          if (product.cutoutImage) {
            product.cutoutImage = path.join(process.cwd(), product.cutoutImage);
          }
        });

        // Create Firefly client
        const firefly = createFireflyClient(
          process.env.FFS_CLIENT_ID!,
          process.env.FFS_CLIENT_SECRET!
        );

        const azureClient = new AzureCampaignClient({
          endpoint: process.env.AZURE_ENDPOINT!,
          apiKey: process.env.AZURE_API_KEY!,
          deployment: process.env.AZURE_DEPLOYMENT!,
          apiVersion: process.env.AZURE_API_VERSION!,
          modelName: process.env.AZURE_MODEL_NAME!,
        });

        const unsupportedAspectRatios = options.aspectRatios.filter(
          (r) => !Object.keys(FireflyAspectRatios).includes(r)
        );

        const approximatedAspectRatios = unsupportedAspectRatios.map((r) =>
          getApproximatedAspectRatio(r)
        );

        if (unsupportedAspectRatios.length > 0) {
          logger.warn(
            `Unsupported aspect ratio(s): ${unsupportedAspectRatios.join(
              ", "
            )}. We will approximate them to the closest supported ratio(s): ${approximatedAspectRatios.join(
              ", "
            )}`
          );
        }

        // Remove unsupported aspect ratios and add approximated ones if any
        const allAspectRatios = [
          ...options.aspectRatios.filter(
            (r) => !unsupportedAspectRatios.includes(r)
          ),
          ...approximatedAspectRatios,
        ];

        // Set up generation options
        const generationOptions: GenerationOptions = {
          outputDir: path.resolve(process.cwd(), options.output),
          aspectRatios: allAspectRatios as FireflyAspectRatioKey[],
        };

        spinner.text = "Generating creative assets...\n";

        await generateCreativeAssets(
          brief,
          generationOptions,
          firefly,
          azureClient,
          (progress) => {
            spinner.info(
              `Generated creative assets for Product: ${progress.product.name} in ${progress.ratio} ratio\n`
            );
            spinner.start("Generating creative assets...\n");
          }
        );
        spinner.succeed(
          "Creative assets generated successfully. and saved to: " +
            options.output +
            "\n"
        );
      } catch (error) {
        console.error("Error during creative generation:", error);
        spinner.fail("Creative generation failed.");
        process.exit(1);
      }
    }
  );

program.parse(process.argv);
