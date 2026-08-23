import ZAI from "z-ai-web-dev-sdk";

async function testPrompt(prompt: string, label: string) {
  const zai = await ZAI.create();
  try {
    const task = await zai.video.generations.create({
      prompt,
      quality: "speed",
      size: "1080x1920",
      fps: 30,
      duration: 5,
    });
    console.log(`${label}: OK task=${task.id}`);
    return true;
  } catch (err: any) {
    console.log(`${label}: FAIL -> ${String(err?.message || err).substring(0, 300)}`);
    return false;
  }
}

async function main() {
  const prompts = [
    ["scene2", "Close-up on the serum's texture. A small amount of the golden serum is gently spread on a pristine glass surface, showing its rich, non-greasy consistency. The camera slowly pans across the glossy texture."],
    ["scene3", "The Hydra Glow bottle is placed centrally, surrounded by soft, diffused light. A subtle golden aura radiates from the bottle, symbolizing its brightening power. Elegant, premium commercial mood."],
  ];
  for (const [label, p] of prompts) {
    await testPrompt(p, label);
  }
}

main();
