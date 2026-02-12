import { z } from "zod";
import { ComfyPrompt, Workflow } from "../../src/types";
import config from "../../src/config";

/**
 * ACE-Step 1.5 Meditation Music Generation Workflow
 *
 * Generates meditation music based on mood and stress level using ACE-Step 1.5 model.
 *
 * ComfyUI Node Flow:
 * CheckpointLoader → TextEncode → EmptyLatentAudio → KSampler → SaveAudio
 *
 * References:
 * - https://docs.comfy.org/tutorials/audio/ace-step/ace-step-v1-5
 * - https://comfyui-wiki.com/en/tutorial/advanced/audio/ace-step/ace-step-v1
 */

// Request schema matching Celery task parameters
const RequestSchema = z.object({
  mood: z.enum(['calm', 'anxious', 'stressed', 'tired', 'energized'])
    .describe("Meditation mood/intention for music generation"),

  stress_level: z.number().int().min(1).max(10)
    .describe("User stress level (1-10, affects intensity)"),

  duration: z.number().int().min(5).max(60)
    .describe("Music duration in minutes"),

  style: z.enum(['ambient', 'nature', 'binaural', 'silence'])
    .optional()
    .default('ambient')
    .describe("Music style/genre for meditation"),

  tempo: z.enum(['slow', 'medium', 'upbeat'])
    .optional()
    .default('slow')
    .describe("Music tempo/pace"),

  seed: z.number().int()
    .optional()
    .default(() => Math.floor(Math.random() * 1000000000000000))
    .describe("Random seed for reproducibility"),

  // Advanced sampling parameters
  steps: z.number().int().min(1).max(50)
    .optional()
    .default(20)
    .describe("Number of sampling steps (more steps = higher quality)"),

  cfg_scale: z.number().min(1).max(20)
    .optional()
    .default(7.0)
    .describe("Classifier-free guidance scale (how closely to follow prompt)"),

  sampler_name: config.samplers
    .optional()
    .default("euler")
    .describe("Sampler algorithm to use"),

  scheduler: config.schedulers
    .optional()
    .default("normal")
    .describe("Scheduler for sampling"),

  denoise: z.number().min(0.1).max(1.0)
    .optional()
    .default(1.0)
    .describe("Denoising strength (1.0 = full generation from noise)"),

  // Model configuration
  checkpoint_name: z.string()
    .optional()
    .default("ace_step_1.5_turbo_aio.safetensors")
    .describe("ACE-Step checkpoint model name"),
});

type InputType = z.infer<typeof RequestSchema>;

/**
 * Generate ACE-Step prompt tags based on mood and parameters
 */
function generatePromptTags(input: InputType): string {
  // Base meditation style mapping
  const styleDescriptors: Record<string, string> = {
    'ambient': 'ambient soundscape, peaceful atmosphere, soft textures',
    'nature': 'nature sounds, forest ambiance, water flowing, birds chirping',
    'binaural': 'binaural beats, theta waves, isochronic tones, brainwave entrainment',
    'silence': 'minimal music, sparse notes, deep silence, space between sounds'
  };

  // Mood-specific descriptors
  const moodDescriptors: Record<string, string> = {
    'calm': 'peaceful, serene, gentle, calming frequencies, relaxation',
    'anxious': 'soothing, anxiety relief, grounding, stability, comfort',
    'stressed': 'stress relief, tension release, deep relaxation, unwinding',
    'tired': 'restful, sleep-inducing, deep relaxation, drowsy, bedtime music',
    'energized': 'uplifting, energizing, focus enhancement, clarity, alertness'
  };

  // Tempo adjustments
  const tempoDescriptors: Record<string, string> = {
    'slow': 'slow tempo, 40-60 BPM, very slow, meditative pace',
    'medium': 'medium tempo, 70-90 BPM, moderate pace, flowing',
    'upbeat': 'upbeat tempo, 100-120 BPM, energizing rhythm'
  };

  // Stress level influences intensity
  let intensityDescriptor = '';
  if (input.stress_level >= 8) {
    intensityDescriptor = 'deep healing, profound relaxation, intensive therapy';
  } else if (input.stress_level >= 5) {
    intensityDescriptor = 'moderate relaxation, balanced energy, gentle healing';
  } else {
    intensityDescriptor = 'light relaxation, subtle energy, maintenance';
  }

  // Combine all descriptors into prompt tags
  const tags = [
    'meditation music',
    'instrumental',
    moodDescriptors[input.mood],
    styleDescriptors[input.style],
    tempoDescriptors[input.tempo],
    intensityDescriptor,
    'no vocals',
    'continuous flow',
    'smooth transitions'
  ].join(', ');

  return tags;
}

/**
 * Generate ComfyUI workflow for ACE-Step meditation music
 */
function generateWorkflow(input: InputType): ComfyPrompt {
  const promptTags = generatePromptTags(input);
  const duration_seconds = input.duration * 60;

  return {
    // Node 1: Load ACE-Step checkpoint
    "1": {
      inputs: {
        ckpt_name: input.checkpoint_name,
      },
      class_type: "CheckpointLoaderSimple",
      _meta: {
        title: "Load ACE-Step Checkpoint",
      },
    },

    // Node 2: Create empty latent audio with specified duration
    "2": {
      inputs: {
        seconds: duration_seconds,
        batch_size: 1,
      },
      class_type: "EmptyAceStepLatentAudio",
      _meta: {
        title: "Empty Latent Audio",
      },
    },

    // Node 3: Encode positive prompt (meditation tags)
    "3": {
      inputs: {
        text: promptTags,
        clip: ["1", 1], // CLIP output from checkpoint
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "Encode Meditation Prompt",
      },
    },

    // Node 4: Encode negative prompt (unwanted elements)
    "4": {
      inputs: {
        text: "harsh sounds, loud noises, aggressive music, vocals, singing, lyrics, drums, percussion, dissonance, jarring transitions, abrupt changes",
        clip: ["1", 1], // CLIP output from checkpoint
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "Encode Negative Prompt",
      },
    },

    // Node 5: KSampler - generate audio
    "5": {
      inputs: {
        seed: input.seed,
        steps: input.steps,
        cfg: input.cfg_scale,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: ["1", 0], // MODEL output from checkpoint
        positive: ["3", 0], // Positive conditioning
        negative: ["4", 0], // Negative conditioning
        latent_image: ["2", 0], // Empty latent audio
      },
      class_type: "KSampler",
      _meta: {
        title: "KSampler (Audio Generation)",
      },
    },

    // Node 6: VAE Decode - convert latent to audio
    "6": {
      inputs: {
        samples: ["5", 0], // Latent output from KSampler
        vae: ["1", 2], // VAE output from checkpoint
      },
      class_type: "VAEDecode",
      _meta: {
        title: "VAE Decode Audio",
      },
    },

    // Node 7: Save audio to output directory
    "7": {
      inputs: {
        filename_prefix: `meditation_${input.mood}_${input.stress_level}`,
        audio: ["6", 0], // Decoded audio
      },
      class_type: "SaveAudio",
      _meta: {
        title: "Save Meditation Music",
      },
    },
  };
}

const workflow: Workflow = {
  RequestSchema,
  generateWorkflow,
  summary: "ACE-Step 1.5 Meditation Music Generation",
  description: "Generate meditation music based on mood, stress level, and preferences using ACE-Step 1.5. Supports multiple styles (ambient, nature, binaural, silence) and moods (calm, anxious, stressed, tired, energized) with configurable duration (5-60 minutes) and tempo.",
};

export default workflow;
