// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/extractDetails",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Get the base64 image and mimeType from the request body
    const { image, mimeType } = await request.json();

    // Call your secure backend action
    const result = await ctx.runAction(api.gemini.run, {
      base64Image: image,
      mimeType: mimeType,
    });
    
    // Return the raw text result from Gemini
    return new Response(result);
  }),
});

export default http;