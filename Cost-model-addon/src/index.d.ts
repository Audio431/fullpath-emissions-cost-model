declare module "*.svg" {
    const content: any;
    export default content;
  }

declare var process: {
    env: {
      REACT_APP_SUPABASE_URL: string;
      REACT_APP_SUPABASE_ANON_KEY: string;
    }
}