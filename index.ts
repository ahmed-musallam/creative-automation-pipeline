#!/usr/bin/env node
import { Command } from "commander";
import "dotenv/config";
import {
  generateCreativeAssets,
  createFireflyClient,
  type GenerationOptions,
} from "./src/app.ts";
import { parseCampaignBrief } from "./src/util/campaign-brief-parser.ts";
import ora from "ora";

const program = new Command();

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
  .option("-l, --log-level <level>", "Log level.", "info")
  .action(
    async (
      campaignBriefPath: string,
      options: { input: string; output: string; logLevel: string }
    ) => {
      process.env.LOG_LEVEL = options.logLevel || "info";
      // Validate environment variables
      if (!process.env.FFS_CLIENT_ID) {
        console.error(
          "FFS_CLIENT_ID environment variable is required, but not set."
        );
        process.exit(1);
      } else if (!process.env.FFS_CLIENT_SECRET) {
        console.error(
          "FFS_CLIENT_SECRET environment variable is required, but not set."
        );
        process.exit(1);
      }
      // Generate creative assets
      const spinner = ora("").start();

      try {
        spinner.text = "Parsing campaign brief...";
        // Parse the campaign brief
        const brief = parseCampaignBrief(campaignBriefPath);

        // Create Firefly client
        const firefly = createFireflyClient(
          process.env.FFS_CLIENT_ID,
          process.env.FFS_CLIENT_SECRET
        );

        // Set up generation options
        const generationOptions: GenerationOptions = {
          inputDir: options.input,
          outputDir: options.output,
        };

        spinner.text = "Generating creative assets...\n";

        await generateCreativeAssets(
          brief,
          generationOptions,
          firefly,
          (progress) => {
            spinner.info(
              `Generated creative assets for Product: ${progress.product.name} in ${progress.ratio} ratio`
            );
            spinner.start("Generating creative assets...");
          }
        );
        spinner.succeed(
          "Creative assets generated successfully. and saved to: " +
            options.output
        );
      } catch (error) {
        console.error("Error during creative generation:", error);
        spinner.fail("Creative generation failed.");
        process.exit(1);
      }
    }
  );

program.parse(process.argv);
