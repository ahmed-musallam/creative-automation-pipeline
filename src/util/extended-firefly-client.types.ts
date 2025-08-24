export type SimpleGenerateImagesOptions = {
  prompt: string;
  aspectRatio: "1:1" | "16:9";
  promptBiasingLocaleCode: string;
  modelVersion?: ModelVersion;
};

export type SimpleGenerateObjectCompositeOptions = {
  prompt: string;
  objectImage: string;
  aspectRatio: "1:1" | "16:9";
};

export type ModelVersion =
  | "image3"
  | "image4"
  | "image3_custom"
  | "image4_standard"
  | "image4_ultra"
  | "image4_custom";

/**
 * Types for Custom Models API response based on OpenAPI spec.
 */

export interface BaseModel {
  name?: string;
  version?: string;
}

export interface CustomModelFF3pInfo {
  version?: string;
  assetName?: string;
  size?: number;
  etag?: string;
  trainingMode?: "subject" | "style";
  assetId?: string;
  mediaType?: string;
  createdDate?: string;
  modifiedDate?: string;
  publishedState?: "never" | "published" | "unpublished";
  baseModel?: BaseModel;
  samplePrompt?: string;
  displayName?: string;
  conceptId?: string;
}

export interface CustomModelsFF3pInfo {
  custom_models?: CustomModelFF3pInfo[];
  total_count?: number;
}

export interface ErrorResponse {
  reason?: string;
  message?: string;
}

export type GenerateImagesAsyncResponse = {
  jobId: string;
};

export type AsyncAcceptResponseV3 = {
  jobId: string;
  statusUrl: string;
  cancelUrl: string;
};

export type PublicBinaryInputV3 = {
  url?: string;
  uploadId?: string;
};

export type InputMaskV3 = {
  source: PublicBinaryInputV3;
  invert?: boolean;
};

export type InputImageV3 = {
  source: PublicBinaryInputV3;
  mask?: InputMaskV3;
};

export type BaseInputMaskV3 = {
  source: PublicBinaryInputV3;
};

export type StylesImageReferenceV3 = {
  source: PublicBinaryInputV3;
};

export type StylesV3 = {
  imageReference?: StylesImageReferenceV3;
  presets?: string[];
  strength?: number;
};

export type StructureImageReferenceV3 = {
  source: PublicBinaryInputV3;
};

export type StructureReferenceV3 = {
  imageReference?: StructureImageReferenceV3;
  strength?: number;
};

export type PlacementAlignment = {
  horizontal?: "center" | "left" | "right";
  vertical?: "center" | "top" | "bottom";
};

export type PlacementInset = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

export type Placement = {
  alignment?: PlacementAlignment;
  inset?: PlacementInset;
};

export type SizeV3 = {
  width: number;
  height: number;
};

export type GenerateImagesRequestV3 = {
  prompt: string;
  contentClass?: "photo" | "art";
  image?: InputImageV3;
  seeds?: number[];
  numVariations?: number;
  size?: SizeV3;
  style?: StylesV3;
  structureReference?: StructureReferenceV3;
  placement?: Placement;
  customModelId?: string;
  promptBiasingLocaleCode?: string;
  upsamplerType?: "default" | "low_creativity";
  visualIntensity?: number;
};

export type GenerateObjectCompositeRequestV3 = {
  prompt: string; // required, 1-1024 characters
  image: InputImageV3; // required
  mask?: BaseInputMaskV3; // optional based on spec description
  contentClass?: "photo" | "art";
  numVariations?: number; // 1-4
  placement?: Placement;
  seeds?: number[]; // 1-4 items
  size?: SizeV3;
  style?: StylesV3;
};

export type GenerateObjectCompositeResponseV3 = {
  contentClass?: "photo" | "art";
  outputs: OutputImageV3[];
  size: Size;
};

// Types for /v3/status/{jobId} (Job Result) endpoint

// Output image type
export type OutputImageV3 = {
  image: {
    url: string;
  };
  seed: number;
};

// Size type
export type Size = {
  width: number;
  height: number;
};

// Success response (status: "succeeded")
export type JobResultSucceeded = {
  jobId: string;
  status: "succeeded";
  result: GenerateObjectCompositeResponseV3; // Can be any of the response types based on which API was called
};

// Running response (status: "running")
export type JobResultRunning = {
  jobId: string;
  status: "running";
};

// Cancel pending response (status: "cancel_pending")
export type JobResultCancelPending = {
  jobId: string;
  status: "cancel_pending";
  error_code?: string;
  message?: string;
};

// Cancelled response (status: "cancelled")
export type JobResultCancelled = {
  jobId: string;
  status: "cancelled";
  error_code?: string;
  message?: string;
};

// Failed response (status: "failed")
export type JobResultFailed = {
  jobId: string;
  status: "failed";
  error_code?: string;
  message?: string;
};

// Timeout response (status: "timeout")
export type JobResultTimeout = {
  jobId: string;
  status: "timeout";
  error_code?: string;
  message?: string;
};

// Not found error (404)
export type JobResultNotFound = {
  error_code: "unknown_job_id";
  message: string;
};

// Validation error (422)
export type ValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};
export type HTTPValidationError = {
  detail?: ValidationError[];
};

// Union type for all possible job result responses (200)
export type JobResultResponse =
  | JobResultSucceeded
  | JobResultRunning
  | JobResultCancelPending
  | JobResultCancelled
  | JobResultFailed
  | JobResultTimeout;
