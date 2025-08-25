import { ContentClass, FireflyClient } from "@adobe/firefly-apis";
import { ApiOptions, ApiResponse } from "@adobe/firefly-services-sdk-core";
import type {
  CustomModelsFF3pInfo,
  ModelVersion,
  GenerateImagesAsyncResponse,
  AsyncAcceptResponseV3,
  JobResultResponse,
  SimpleGenerateImagesOptions,
  GenerateImagesRequestV3,
  GenerateObjectCompositeRequestV3,
  SimpleGenerateObjectCompositeOptions,
} from "./extended-firefly-client.types.js";
import {
  FireflyAspectRatioKey,
  FireflyAspectRatios,
  getApproximatedAspectRatio,
} from "./aspect-ratio-util.js";
const fs = await import("fs/promises");

const allowedAspectRatios = ["1:1", "16:9", "9:16"];

/**
 * Extended because default impl does not support custom model versions, even though the API supports it.
 * https://github.com/Firefly-Services/firefly-services-sdk-js/blob/4838df5eda424c5bf6fe6caae01882d9136b5e32/packages/firefly/src/Firefly.ts#L105
 */
export class ExtendedFireflyClient extends FireflyClient {
  /**
   * Generate Images Async (POST /v3/images/generate-async)
   * @see: https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/V3_Async/
   */
  public generateImagesAsync(
    requestBody: GenerateImagesRequestV3, // Accepts both JSON and multipart/form-data bodies
    options?: ApiOptions & {
      xModelVersion?: ModelVersion;
      mediaType?: "application/json" | "multipart/form-data";
    }
  ): Promise<ApiResponse<GenerateImagesAsyncResponse>> {
    // Default to application/json if not specified
    const mediaType = options?.mediaType || "application/json";
    return this._httpRequest.request({
      method: "POST",
      url: "/v3/images/generate-async",
      body: requestBody,
      headers: {
        ...(options?.xModelVersion
          ? { "x-model-version": options.xModelVersion }
          : {}),
      },
      mediaType,
      errors: {
        400: `Bad Request`,
        403: `Forbidden`,
        408: `Request Timeout`,
        413: `Request Entity Too Large`,
        415: `Unsupported Media Type`,
        422: `Unprocessable Entity`,
        429: `Too Many Requests`,
        500: `Internal Server Error`,
      },
      signal: options?.signal,
    });
  }

  /**
   * Generate Object Composite Async (POST /v3/images/generate-object-composite-async)
   * @see: https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/V3_Async/
   */
  public generateObjectCompositeAsync(
    requestBody: GenerateObjectCompositeRequestV3, // Accepts both JSON and multipart/form-data bodies
    options?: ApiOptions & {
      xModelVersion?: ModelVersion;
      mediaType?: "application/json" | "multipart/form-data";
    }
  ): Promise<ApiResponse<AsyncAcceptResponseV3>> {
    // Default to application/json if not specified
    const mediaType = options?.mediaType || "application/json";
    return this._httpRequest.request({
      method: "POST",
      url: "/v3/images/generate-object-composite-async",
      body: requestBody,
      headers: {
        ...(options?.xModelVersion
          ? { "x-model-version": options.xModelVersion }
          : {}),
      },
      mediaType,
      errors: {
        400: `Bad Request`,
        403: `Forbidden`,
        408: `Request Timeout`,
        415: `Unsupported Media Type`,
        422: `Unprocessable Entity`,
        429: `Too Many Requests`,
        500: `Internal Server Error`,
      },
      signal: options?.signal,
    });
  }

  /**
   * Get Result iof a job - Async (GET /v3/status/{jobId})
   * @see: https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/V3_Async/
   */
  public getJobResult(
    jobId: string,
    options?: ApiOptions
  ): Promise<ApiResponse<JobResultResponse>> {
    return this._httpRequest.request({
      method: "GET",
      url: `/v3/status/${encodeURIComponent(jobId)}`,
      errors: {
        404: `Not Found`,
        422: `Validation Error`,
      },
      signal: options?.signal,
    });
  }

  /**
   * List custom models for the user.
   * @see: https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/V3_Custom_Models/
   */
  async listCustomModels(params?: {
    xUserToken?: string;
    xRequestId?: string;
    sortBy?: "assetName" | "createdDate" | "modifiedDate";
    start?: string;
    limit?: string;
    publishedState?:
      | "all"
      | "ready"
      | "published"
      | "unpublished"
      | "queued"
      | "training"
      | "failed"
      | "cancelled";
    signal?: AbortSignal;
  }): Promise<CustomModelsFF3pInfo> {
    const {
      xUserToken,
      xRequestId,
      sortBy,
      start,
      limit,
      publishedState,
      signal,
    } = params || {};

    // Compose query parameters
    const query: Record<string, string | undefined> = {};
    if (sortBy) query.sortBy = sortBy;
    if (start) query.start = start;
    if (limit) query.limit = limit;
    if (publishedState) query.publishedState = publishedState;

    // Compose headers
    const headers: Record<string, string | undefined> = {};
    if (xUserToken) headers["x-user-token"] = xUserToken;
    if (xRequestId) headers["x-request-id"] = xRequestId;

    const response = await this._httpRequest.request({
      method: "GET",
      url: "/v3/custom-models",
      query,
      headers,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        406: `Not Acceptable`,
        500: `Internal Server Error`,
        503: `Service Unavailable`,
      },
      signal,
    });

    // The SDK returns { result, headers }, so unwrap result if present
    if (response && typeof response === "object" && "result" in response) {
      return response.result as CustomModelsFF3pInfo;
    }
    return response as CustomModelsFF3pInfo;
  }

  private models: CustomModelsFF3pInfo | undefined = undefined;

  // automatically pick a model id based on the model version
  async getModelId(modelVersion: ModelVersion) {
    if (!this.models) {
      this.models = await this.listCustomModels();
    }
    return this.models.custom_models?.find(
      (model) => model.baseModel?.name === modelVersion
    )?.assetId;
  }

  // a convenience method to wait for a job to complete
  async awaitJobCompletion(jobId: string): Promise<JobResultResponse> {
    const jobResult = await this.getJobResult(jobId);
    if (
      jobResult.result.status === "running" ||
      jobResult.result.status === "cancel_pending"
    ) {
      console.debug(`Job ${jobId} is still running, waiting 1 second...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.awaitJobCompletion(jobId);
    }
    return jobResult.result;
  }

  async simpleGenerateObjectComposite({
    prompt,
    objectImage,
    aspectRatio,
  }: SimpleGenerateObjectCompositeOptions) {
    let size = FireflyAspectRatios[aspectRatio as FireflyAspectRatioKey];

    const needsExpand = !size;
    if (needsExpand) {
      const newRatio = getApproximatedAspectRatio(aspectRatio);
      size = FireflyAspectRatios[newRatio as keyof typeof FireflyAspectRatios];
      throw new Error(
        `Unsupported aspect ratio: ${aspectRatio}, closest supported ratio is ${newRatio} with size ${size.width}x${size.height}`
      );
    }

    // create a blob from the local file

    const imageBuffer = await fs.readFile(objectImage);
    const objectImageBlob = new Blob([new Uint8Array(imageBuffer)], {
      type: "image/png",
    });
    const image = await this.upload(objectImageBlob);
    const job = await this.generateObjectCompositeAsync({
      contentClass: "photo",
      prompt,
      image: {
        source: {
          uploadId: image.result.images?.[0]?.id,
        },
      },
      numVariations: 3,
      placement: {
        // defaulting to center placement for POC purposes
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
      },
      size,
    });
    const jobId = job.result.jobId;
    const jobResult = await this.awaitJobCompletion(jobId);
    return jobResult;
  }

  /**
   *  a convienience method to generate images with a simple interface
   */
  async simpleGenerateImages({
    prompt,
    aspectRatio,
    promptBiasingLocaleCode,
    modelVersion,
  }: SimpleGenerateImagesOptions) {
    if (!allowedAspectRatios.includes(aspectRatio)) {
      throw new Error(
        `Invalid aspect ratio: ${aspectRatio}. Allowed ratios are: ${allowedAspectRatios.join(
          ", "
        )}`
      );
    }

    // const customModelId = modelVersion
    //   ? await this.getModelId(modelVersion)
    //   : undefined;

    const size = FireflyAspectRatios[aspectRatio as FireflyAspectRatioKey];

    const job = await this.generateImagesAsync(
      {
        prompt,
        size,
        contentClass: ContentClass.PHOTO,
        promptBiasingLocaleCode,
        numVariations: 3,
        // customModelId,
      },
      {
        xModelVersion: modelVersion, // used to satisfy the aspect ratio constraint, and seems to generate better images than the default model
      }
    );
    const jobId = job.result.jobId;
    const jobResult = await this.awaitJobCompletion(jobId);
    return jobResult;
  }
}
