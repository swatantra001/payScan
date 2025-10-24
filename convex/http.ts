// // convex/http.ts
// import { httpRouter } from "convex/server";
// import { httpAction } from "./_generated/server";
// import { api } from "./_generated/api";

// const http = httpRouter();

// http.route({
//   path: "/extractDetails",
//   method: "POST",
//   handler: httpAction(async (ctx, request) => {
//     // Get the base64 image and mimeType from the request body
//     const { image, mimeType } = await request.json();

//     // Call your secure backend action
//     const result = await ctx.runAction(api.gemini.run, {
//       base64Image: image,
//       mimeType: mimeType,
//     });
    
//     // Return the raw text result from Gemini
//     return new Response(result);
//   }),
// });

// export default http;




















// // convex/http.ts
// import { httpRouter } from "convex/server";
// import { httpAction } from "./_generated/server";
// import { api } from "./_generated/api";

// const http = httpRouter();

// http.route({
//   path: "/extractDetails",
//   method: "POST",
//   handler: httpAction(async (ctx, request) => {
//     // Handle preflight CORS request
//     if (request.method === "OPTIONS") {
//       return new Response(null, {
//         status: 200,
//         headers: {
//           "Access-Control-Allow-Origin": "*",
//           "Access-Control-Allow-Methods": "POST, OPTIONS",
//           "Access-Control-Allow-Headers": "Content-Type",
//         },
//       });
//     }

//     try {
//       // Get the base64 image and mimeType from the request body
//       const { image, mimeType } = await request.json();

//       // Call your backend action with correct function name
//       const result = await ctx.runAction(api.gemini.run, {
//         base64Image: image,
//         mimeType: mimeType || "image/jpeg",
//       });
      
//       // Return successful response
//       return new Response(JSON.stringify({ success: true, data: result }), {
//         status: 200,
//         headers: {
//           "Content-Type": "application/json",
//           "Access-Control-Allow-Origin": "*",
//         },
//       });
//     } catch (error) {
//       // Return error response
//       console.error("Error in extractDetails:", error);
//       const errorMessage = error instanceof Error ? error.message : String(error);
//       return new Response(JSON.stringify({ 
//         success: false, 
//         error: errorMessage 
//       }), {
//         status: 500,
//         headers: {
//           "Content-Type": "application/json",
//           "Access-Control-Allow-Origin": "*",
//         },
//       });
//     }
//   }),
// });

// export default http;