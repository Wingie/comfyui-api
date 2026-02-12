import { z } from "zod";
import { ComfyPrompt, Workflow } from "../../src/types";
import config from "../../src/config";

/**
 * ACE-Step 1.5 Meditation Music Generation Workflow
 *
 * Generates instrumental meditation music based on mood and stress level using ACE-Step 1.5.
 *
 * ComfyUI Node Flow (verified against official workflow templates):
 * CheckpointLoader → ModelSamplingAuraFlow → TextEncodeAceStepAudio1.5 → EmptyAceStep1.5LatentAudio → KSampler → VAEDecodeAudio → SaveAudioMP3
 *
 * Based on official ComfyUI workflow:
 * https://github.com/Comfy-Org/workflow_templates/blob/main/templates/audio_ace_step_1_5_checkpoint.json
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
    .describe("User stress level (1-10, affects intensity and instrumentation)"),

  duration: z.number().int().min(5).max(60)
    .describe("Music duration in minutes"),

  // Advanced parameters (optional - reasonable defaults)
  seed: z.number().int()
    .optional()
    .default(() => Math.floor(Math.random() * 1000000000000000))
    .describe("Random seed for reproducibility"),

  steps: z.number().int().min(1).max(50)
    .optional()
    .default(8)
    .describe("Number of sampling steps (ACE-Step 1.5 Turbo default: 8)"),

  cfg_scale: z.number().min(1).max(20)
    .optional()
    .default(3.5)
    .describe("Classifier-free guidance scale (ACE-Step 1.5 Turbo default: 3.5)"),

  sampler_name: config.samplers
    .optional()
    .default("euler")
    .describe("Sampler algorithm to use"),

  scheduler: config.schedulers
    .optional()
    .default("simple")
    .describe("Scheduler for sampling"),

  denoise: z.number().min(0.1).max(1.0)
    .optional()
    .default(1.0)
    .describe("Denoising strength (1.0 = full generation from noise)"),

  // Model configuration
  checkpoint_name: z.string()
    .optional()
    .default("ace_step_1.5_turbo_aio.safetensors")
    .describe("ACE-Step 1.5 checkpoint model name"),
});

type InputType = z.infer<typeof RequestSchema>;

/**
 * Generate ACE-Step CAPTION (descriptive text about music style)
 *
 * This is the primary prompt that describes the music generation.
 * ACE-Step 1.5 uses natural language descriptions rather than comma-separated tags.
 */
function generateCaption(input: InputType): string {
  // Base meditation description
  let caption = "Meditation music: ";

  // Mood-specific descriptions
  const moodDescriptions: Record<string, string> = {
    'calm': 'A peaceful ambient soundscape with gentle textures and calming frequencies. Soft, serene atmosphere perfect for deep relaxation and mindfulness meditation.',
    'anxious': 'Soothing meditation music designed for anxiety relief. Grounding frequencies with stable, comforting tones that promote emotional balance and inner peace.',
    'stressed': 'Stress-relief meditation music with tension-releasing frequencies. Deep relaxation soundscape with unwinding, restorative qualities for mental clarity.',
    'tired': 'Restful sleep meditation music with sleep-inducing frequencies. Very slow, drowsy atmosphere perfect for bedtime relaxation and deep rest.',
    'energized': 'Uplifting meditation music for focus and mental clarity. Energizing yet calm frequencies that enhance alertness and concentration for morning meditation.'
  };

  caption += moodDescriptions[input.mood];

  // Add instrumentation based on stress level
  if (input.stress_level >= 8) {
    caption += ' Features singing bowls, deep drones, and minimal ambient pads for profound healing.';
  } else if (input.stress_level >= 5) {
    caption += ' Incorporates soft piano, ambient synth, gentle strings, and nature sounds for balanced healing.';
  } else {
    caption += ' Includes acoustic guitar, flute, chimes, and soft pads for light relaxation.';
  }

  caption += ' Pure instrumental with smooth transitions and continuous flow. No vocals.';

  return caption;
}

/**
 * Generate ACE-Step LYRICS field
 *
 * For meditation music, we use [inst] tag for pure instrumental sections.
 * Structure tags ([intro], [verse], [bridge], [outro]) help organize the music flow.
 */
function generateLyrics(input: InputType): string {
  // For meditation music, we want instrumental with structure
  const duration_minutes = input.duration;

  if (duration_minutes <= 10) {
    // Short meditation: simple structure
    return `[intro]\n[inst]\n[outro]`;
  } else if (duration_minutes <= 30) {
    // Medium meditation: more variation
    return `[intro]\n[inst]\n[bridge]\n[inst]\n[outro]`;
  } else {
    // Long meditation: full structure with multiple sections
    return `[intro]\n[inst]\n[bridge]\n[inst]\n[bridge]\n[inst]\n[outro]`;
  }
}

/**
 * Calculate BPM based on mood and stress level
 */
function calculateBPM(input: InputType): number {
  if (input.mood === 'energized') {
    return 100; // Upbeat for energy
  } else if (input.mood === 'tired') {
    return 40; // Very slow for sleep
  } else if (input.stress_level >= 8) {
    return 50; // Extra slow for high stress
  } else if (input.stress_level <= 3) {
    return 70; // Moderate for low stress
  } else {
    return 60; // Default slow
  }
}

/**
 * Generate ComfyUI workflow for ACE-Step 1.5 meditation music
 *
 * Structure verified against official ComfyUI workflow templates.
 */
function generateWorkflow(input: InputType): ComfyPrompt {
  const caption = generateCaption(input);
  const lyrics = generateLyrics(input);
  const duration_seconds = input.duration * 60;
  const bpm = calculateBPM(input);

  return {
    // Node 1: Load ACE-Step checkpoint
    "1": {
      inputs: {
        ckpt_name: input.checkpoint_name,
      },
      class_type: "CheckpointLoaderSimple",
      _meta: {
        title: "Load ACE-Step 1.5 Checkpoint",
      },
    },

    // Node 2: Model Sampling for ACE-Step (AuraFlow sampling)
    "2": {
      inputs: {
        model: ["1", 0], // MODEL from checkpoint
        shift: 3.0, // ACE-Step 1.5 uses shift of 3
      },
      class_type: "ModelSamplingAuraFlow",
      _meta: {
        title: "Model Sampling (AuraFlow)",
      },
    },

    // Node 3: Create empty latent audio with specified duration
    "3": {
      inputs: {
        seconds: duration_seconds,
        batch_size: 1,
      },
      class_type: "EmptyAceStep1.5LatentAudio",
      _meta: {
        title: `Empty Latent Audio (${input.duration} min)`,
      },
    },

    // Node 4: Encode caption and lyrics (ACE-Step 1.5 specific node)
    // NOTE: Parameters are in widgets_values, not inputs!
    "4": {
      inputs: {
        clip: ["1", 1], // CLIP output from checkpoint
        seed: input.seed,
        duration: duration_seconds,
      },
      class_type: "TextEncodeAceStepAudio1.5",
      _meta: {
        title: "Encode Meditation Prompt (ACE-Step 1.5)",
      },
      // Widgets values define the actual prompt structure:
      // [caption, lyrics, seed, seed_mode, lyrics_sample_length, bpm, time_signature, language, key]
      widgets_values: [
        caption,           // Music description
        lyrics,            // Lyric structure with [inst] tags
        input.seed,        // Seed for reproducibility
        "fixed",           // seed_mode
        190,               // lyrics_sample_length (default from ACE-Step)
        bpm,               // BPM calculated from mood/stress
        "4",               // time_signature (4/4 time)
        "en",              // language
        "C major"          // key (neutral key for meditation)
      ],
    },

    // Node 5: Zero out conditioning (ACE-Step pattern)
    "5": {
      inputs: {
        conditioning: ["4", 0],
      },
      class_type: "ConditioningZeroOut",
      _meta: {
        title: "Zero Out Conditioning",
      },
    },

    // Node 6: KSampler - generate audio
    "6": {
      inputs: {
        seed: input.seed,
        steps: input.steps,
        cfg: input.cfg_scale,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: ["2", 0], // MODEL from ModelSamplingAuraFlow
        positive: ["4", 0], // Conditioning from TextEncodeAceStepAudio1.5
        negative: ["5", 0], // Zeroed conditioning
        latent_image: ["3", 0], // Empty latent audio
      },
      class_type: "KSampler",
      _meta: {
        title: "KSampler (Audio Generation)",
      },
    },

    // Node 7: VAE Decode - convert latent to audio
    "7": {
      inputs: {
        samples: ["6", 0], // Latent output from KSampler
        vae: ["1", 2], // VAE output from checkpoint
      },
      class_type: "VAEDecodeAudio",
      _meta: {
        title: "VAE Decode Audio",
      },
    },

    // Node 8: Save audio to MP3
    "8": {
      inputs: {
        filename_prefix: `meditation_${input.mood}_stress${input.stress_level}`,
        audio: ["7", 0], // Decoded audio
      },
      class_type: "SaveAudioMP3",
      _meta: {
        title: "Save Meditation Music (MP3)",
      },
    },
  };
}

const workflow: Workflow = {
  RequestSchema,
  generateWorkflow,
  summary: "ACE-Step 1.5 Meditation Music Generation (Instrumental)",
  description: "Generate instrumental meditation music based on mood and stress level using ACE-Step 1.5 Turbo. Music is generated with appropriate tempo (40-100 BPM), instrumentation, and structure based on user's emotional state. All music is instrumental (no vocals) with smooth transitions. Supports moods: calm, anxious, stressed, tired, energized. Duration: 5-60 minutes. Workflow structure verified against official ComfyUI templates.",
};

export default workflow;
