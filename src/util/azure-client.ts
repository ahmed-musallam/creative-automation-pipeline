import { AzureOpenAI, OpenAI } from "openai";
import { AzureKeyCredential } from "@azure/core-auth";
import type { CampaignBrief, Product } from "./campaign-brief-parser";
import {
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources";

export type ScenePlan = {
  concept: string;
  environment: string;
  surface: string;
  color_grade: string;
  background: string;
  lighting: string;
  camera: {
    angle: "eye" | "low" | "high" | "top" | "three-quarter";
    focal_length_mm: number;
    fov_deg: number;
  };
  props: string[];
  negative_cues: string[];
  compliance_notes: string;
  rationale: string;
  image_generation_prompt: string;
};

const ScenePlanSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    concept: { type: "string", description: "Concept description" },
    environment: { type: "string", description: "Environment description" },
    surface: { type: "string", description: "Surface description" },
    color_grade: { type: "string", description: "Color grade description" },
    background: { type: "string", description: "Backdrop description" },
    lighting: { type: "string", description: "Lighting description" },
    camera: {
      type: "object",
      additionalProperties: false,
      properties: {
        angle: {
          type: "string",
          enum: ["eye", "low", "high", "top", "three-quarter"],
        },
        focal_length_mm: { type: "number" },
        fov_deg: { type: "number" },
      },
      required: ["angle", "focal_length_mm", "fov_deg"],
    },
    props: { type: "array", items: { type: "string" } },
    negative_cues: { type: "array", items: { type: "string" } },
    compliance_notes: { type: "string" },
    rationale: { type: "string" },
    image_generation_prompt: { type: "string", maxLength: 1024 },
  },
  required: [
    "concept",
    "environment",
    "surface",
    "color_grade",
    "lighting",
    "background",
    "camera",
    "props",
    "negative_cues",
    "compliance_notes",
    "rationale",
    "image_generation_prompt",
  ],
} as const;

type AzureCampaignClientOptions = {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
  modelName: string;
};

export class AzureCampaignClient {
  private client: AzureOpenAI;
  private modelName: string;

  constructor(options: AzureCampaignClientOptions) {
    this.client = new AzureOpenAI({
      endpoint: options.endpoint,
      apiKey: options.apiKey,
      deployment: options.deployment,
      apiVersion: options.apiVersion || "2024-04-01-preview",
    });
    this.modelName = options.modelName;
  }

  async generateSceneForProductCampaign(
    product: Product,
    campaign: CampaignBrief
  ) {
    const systemMessage: ChatCompletionSystemMessageParam = {
      role: "system",
      content:
        "You turn marketing briefs into explicit, literal, and detailed scene plans for object composition of beverage cutouts. " +
        "The scene plan should be detailed enough to be used as a prompt for a photo generation model, the scene plan should not mention the product itself, only the scene and the props" +
        "Bias the scene plan towards the provided target region, which is a hyphen-separated string combining the ISO 639-1 language code and the ISO 3166-1 region (e.g., en-US). " +
        "The image generation prompt should be a single sentence that describes the image generation prompt and is no longer than 1024 characters. " +
        "Only output JSON that strictly matches the provided schema. The canvas origin is the center; units are centimeters.",
    };

    const userMessage: ChatCompletionUserMessageParam = {
      role: "user",
      content: `BRIEF:\n${campaign.campaignMessage}\nConstraints: social-first asset, exclude glassware and alcohol cues.\nProduct Name: ${product.name}\nProduct Description: ${product.description}\n target region: ${campaign.targetRegion}`,
    };

    const messages = [systemMessage, userMessage];
    const completion = await this.client.chat.completions.create({
      model: this.modelName,
      messages,
      // Enforce structured JSON:
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ScenePlan",
          schema: ScenePlanSchema,
          strict: true,
        },
      },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    return JSON.parse(content);
  }
}
