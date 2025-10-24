// // convex/auth.config.ts
// declare global {
//   interface ImportMetaEnv {
//     readonly CLERK_ISSUER_URL?: string;
//     // add other env vars here as needed
//   }

//   interface ImportMeta {
//     readonly env: ImportMetaEnv;
//   }
// }

// export default {
//   providers: [
//     {
//       domain: import.meta.env.CLERK_ISSUER_URL,
//       applicationID: "convex",
//     },
//   ]
// };




// convex/auth.config.ts - SAHI (yeh use karein)
export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL, // ✅ process.env use karein
      applicationID: "convex",
    },
  ]
};