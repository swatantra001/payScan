// convex/auth.config.ts
declare global {
  interface ImportMetaEnv {
    readonly CLERK_ISSUER_URL?: string;
    // add other env vars here as needed
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export default {
  providers: [
    {
      domain: import.meta.env.CLERK_ISSUER_URL,
      applicationID: "convex",
    },
  ]
};