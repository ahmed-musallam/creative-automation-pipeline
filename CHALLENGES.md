# Challenges

This document outlines challenges (techniucal or otherwiser) encountered while building this application.

## Broad Requirnments

typically, clients have specific workflows that they want to improve, which includes specifics around their products, brrnad identitiy, communication channels, and the part of the proccess they want to improve. The assignment is very broad, so I choose a mix of products in the same category (beverages) for this demo.

## Image Inputs

input classification was not defined in the exercise, no designation of "what" assets a user might input. I have restricted it to product cutouts for this implementation.

Note: while it is easily feasible to remove backgerounds automatically from the product images via [photoshop API](https://developer.adobe.com/firefly-services/docs/photoshop/api/#operation/removeBackground), I elected not to implement here to keep the pipeline simple. Referencing this part of the exercise:

> Please plan to spend 3-4 hours on the overall assignment

## Firefly SDS does not use the latest async APIs

I elected to use https://www.npmjs.com/package/@adobe/firefly-apis only to descover that it used the depricated V3 APIs and not the new Async APIs described in the dev docs.

example:
new async API: https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/V3_Async/
Deprecated API: https://developer.adobe.com/firefly-services/docs/firefly-api/guides/api/image_generation/V3/

the SDK uses the depricated API. so I enhanced it in `src/util/extended-firefly-client.ts`

## 9:16 aspect ration

Firefly Image Gen and Objeect Composition API do not provide a way to produce 9:16 aspect ration images. There are aspect rations that are close, but not exactly matching the requirnment. I elected to use Epand Image API for that specific aspect ration to demonstraite that it is possible.

I'd argue this would be completely unneccessary for a POC to go to that length, but figured I'd implement to show that it is technically possible.
