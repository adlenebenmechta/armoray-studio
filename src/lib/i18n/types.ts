export interface Dictionary {
  dir: "ltr" | "rtl";
  langName: string;
  nav: { features: string; how: string; agents: string; pricing: string; getStarted: string };
  hero: {
    badge: string;
    titleA: string;
    titleB: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: { value: string; label: string }[];
    demoLabel: string;
  };
  how: { title: string; subtitle: string; steps: { title: string; desc: string }[] };
  features: { title: string; subtitle: string; items: { title: string; desc: string }[] };
  agents: { title: string; subtitle: string; items: { name: string; role: string; desc: string }[] };
  testimonials: { title: string; items: { quote: string; author: string; role: string }[] };
  pricing: {
    title: string;
    subtitle: string;
    plans: {
      name: string;
      price: string;
      period: string;
      desc: string;
      features: string[];
      cta: string;
      popular?: boolean;
    }[];
  };
  footer: { tagline: string; rights: string; cols: { title: string; links: string[] }[] };
  studio: {
    sidebar: { newProject: string; agents: string; projects: string; brand: string; settings: string; backToSite: string };
    chat: {
      agentName: string;
      agentRole: string;
      placeholder: string;
      send: string;
      uploadVideo: string;
      uploadImage: string;
      addProduct: string;
      thinking: string;
      greeting: string;
      waitingFrames: string;
      analyzing: string;
      analyzedIntro: string;
      productSavedIntro: string;
      adaptedIntro: string;
      generateIntro: string;
      paidGenIntro: string;
      freeEditIntro: string;
      creditsLabel: string;
      freeEditNote: string;
      doneIntro: string;
      videoAttached: string;
      suggestions: { addVideo: string; addProduct: string; recreate: string; generate: string; regenerate: string; moreAngles: string };
    };
    cards: {
      reference: { title: string; duration: string; analyzing: string };
      analysis: {
        title: string; hook: string; structure: string; tone: string; pacing: string;
        scenes: string; scene: string; camera: string; onScreen: string; productScene: string; seconds: string;
        xray: string; format: string; roles: Record<string, string>;
      };
      product: { title: string; edit: string };
      storyboard: {
        title: string; prompt: string; voiceover: string; onScreen: string; listen: string;
        pending: string; generating: string; done: string; error: string;
        speechQa: string; words: string; wps: string; passed: string; failed: string;
        hookLine: string; ctaLine: string; roles: Record<string, string>;
      };
      result: { title: string; download: string; sceneN: string };
    };
    productDialog: {
      title: string; desc: string; nameLabel: string; namePh: string; urlLabel: string; urlPh: string;
      descLabel: string; descPh: string; imageLabel: string; imagePh: string;
      sizeLabel: string; sizePh: string; sizeHint: string;
      factsLabel: string; factsPh: string; factsHint: string;
      save: string; cancel: string; savedToast: string;
    };
    views: {
      projects: { title: string; empty: string; open: string; del: string; scenes: string };
      brand: { title: string; subtitle: string; productName: string; productUrl: string; productDesc: string; notSet: string; editHere: string };
      settings: { title: string; subtitle: string; language: string; languageDesc: string; about: string; aboutText: string; pipeline: string; pipelineText: string };
    };
    status: { chat: string; analyzing: string; analyzed: string; adapting: string; adapted: string; generating: string; done: string; error: string };
    errors: {
      uploadFailed: string; analyzeFailed: string; adaptFailed: string; generateFailed: string;
      needVideo: string; needProduct: string; generic: string;
    };
  };
}
