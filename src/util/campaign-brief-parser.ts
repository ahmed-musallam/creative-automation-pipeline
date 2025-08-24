import * as yaml from "js-yaml";
import fs from "fs";
import ISO639_1 from "iso-639-1";
import ISO3166_1 from "iso-3166-1";
import { logger } from "./logger.ts";

import { type } from "arktype";
import { parseNarrowTuple } from "arktype/internal/parser/tupleExpressions.ts";

export const Product = type({
  name: "string",
  description: "string",
});

export const CampaignBrief = type({
  name: "string",
  products: Product.array(),
  targetRegion: type("string").narrow((value, ctx) => {
    const [langCode, countryCode] = value.split("-");
    if (!langCode || !countryCode) {
      return ctx.mustBe(
        "in the format of 'lang-country'. Example: en-US\n refer to languages here: https://localizely.com/iso-639-1-list\n and country codes here here: https://localizely.com/iso-3166-1-alpha-2-list"
      );
    }
    if (!ISO639_1.validate(langCode)) {
      return ctx.mustBe(
        `in the format 'lang-country' eg. en-US. your supplied language code portion: ${langCode}\n is invalid. refer to languages here: https://localizely.com/iso-639-1-list\n`
      );
    }
    if (!ISO3166_1.whereAlpha2(countryCode)) {
      return ctx.mustBe(
        `in the format 'lang-country' eg. en-US. your supplied country code portion: ${countryCode}\n is invalid. refer to country codes here: https://localizely.com/iso-3166-1-alpha-2-list`
      );
    }
    return true; // Validation passed
  }),
  targetAudience: "string",
  campaignMessage: "string",
});

export type CampaignBrief = typeof CampaignBrief.infer;

export type Product = typeof Product.infer;

export function validateCampaignBrief(campaignBrief: CampaignBrief): void {
  const out = CampaignBrief(campaignBrief);
  if (out instanceof type.errors) {
    logger.error(out.summary);
    process.exit(1);
  }
}

/**
 * Parse the campaign brief from a YAML file.
 */
export function parseCampaignBrief(campaignBriefPath: string): CampaignBrief {
  const briefContent = fs.readFileSync(campaignBriefPath, "utf-8");

  if ([".yaml", ".yml"].some((ext) => campaignBriefPath.endsWith(ext))) {
    return yaml.load(briefContent) as CampaignBrief;
  } else {
    return JSON.parse(briefContent);
  }
}
