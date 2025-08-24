# Challenges

This document outlines challenges (techniucal or otherwiser) encountered while building this application.

## Broad Requirnments

typically, clients have specific workflows that they want to improve, which includes specifics around their products, brrnad identitiy, communication channels, and the part of the proccess they want to improve. The assignment is very broad, so I choose a mix of products in the same category (beverages) for this demo.

## Image Inputs

input classification was not defined in the exercise, no designation of "what" assets a user might input. I have restricted it to product cutouts for this implementation.

Note: while it is easily feasible to remove backgerounds automatically from the product images via [photoshop API](https://developer.adobe.com/firefly-services/docs/photoshop/api/#operation/removeBackground), I elected not to implement here to keep the pipeline simple. Referencing this part of the exercise:

> Please plan to spend 3-4 hours on the overall assignment

## Firefly SDK does not use the latest async APIs

I elected to use https://www.npmjs.com/package/@adobe/firefly-apis only to descover that it used the depricated V3 APIs and not the new Async APIs described in the dev docs.

example:
new async API: https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/V3_Async/
Deprecated API: https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/V3/

the SDK uses the depricated API. so I enhanced it in `src/util/extended-firefly-client.ts`

## 9:16 aspect ration

Firefly Image Gen and Objeect Composition API do not provide a way to produce 9:16 aspect ration images. There are aspect rations that are close, but not exactly matching the requirnment. One could use Firefly Image Expand to produce any size image (aspect ration) automatically, but this is not built into the pipeline at this time. I elected to log warnings and approximate the closest aspect ration that firefly does support.

Note: I'd argue this would be completely unneccessary for a POC to go to that length, but my implementation keeps the user experience reasonable.

## Prompt generation for the campaign brief

This impl uses an azure deployed `gpt-4o-mini`, provides the brief to the model and asks for reasonable image gen prompt which is then fed to firefly for image generation.

The request to `gpt-4o-mini` does include all of the information in the brief. I would need specific negative use-cases to ensure that it is sensetive to locale/audience; but I have not validate that due to time constraints.

## Object composition result quality

as expected, firefly hullucinates quite a bit, but does generate relatively usable results. With further tweaking to the prompt generation process, it can produce better results, but there is not enough time to do that for this POC.

## Exact image size - AKA resizing of the result of the Firefly API

while this is not currently implemented, it would be easy to use [Sharp](https://www.npmjs.com/package/sharp) to do this transformation. Was not implemented due to lack of time.
