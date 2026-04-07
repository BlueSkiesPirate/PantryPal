//FILE FOR DEFINING Dataypes for API keys
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GO_UPC_KEY: string;
      GEMINI_KEY: string;
    }
  }
}
export {};
