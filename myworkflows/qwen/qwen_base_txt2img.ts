import { z } from "zod";
// This gets evaluated in the context of src/workflows, so imports must be relative to that directory
import { ComfyPrompt, Workflow } from "../types";
import config from "../config";

const RequestSchema = z.object({
  prompt: z.string().describe("The positive prompt for image generation"),
  negative_prompt: z
    .string()
    .optional()
    .default("")
    .describe("The negative prompt to exclude elements"),
  width: z
    .number()
    .int()
    .min(256)
    .max(2048)
    .optional()
    .default(1328)
    .describe("Width of the generated image"),
  height: z
    .number()
    .int()
    .min(256)
    .max(2048)
    .optional()
    .default(1328)
    .describe("Height of the generated image"),
  seed: z
    .number()
    .int()
    .optional()
    .default(() => Math.floor(Math.random() * 1000000000000000))
    .describe("Seed for random number generation"),
  steps: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe("Number of sampling steps"),
  cfg: z
    .number()
    .min(0)
    .max(20)
    .optional()
    .default(4.5)
    .describe("Classifier-free guidance scale"),
  sampler_name: config.samplers
    .optional()
    .default("euler")
    .describe("Name of the sampler to use"),
  scheduler: config.schedulers
    .optional()
    .default("simple")
    .describe("Type of scheduler to use"),
  denoise: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(1)
    .describe("Denoising strength"),
  shift: z
    .number()
    .min(0)
    .max(10)
    .optional()
    .default(3.1)
    .describe("ModelSamplingAuraFlow shift parameter"),
  unet_name: z
    .string()
    .optional()
    .default("qwen_image_fp8_e4m3fn.safetensors")
    .describe("UNET model name"),
  clip_name: z
    .string()
    .optional()
    .default("qwen_2.5_vl_7b_fp8_scaled.safetensors")
    .describe("CLIP model name"),
  vae_name: z
    .string()
    .optional()
    .default("qwen_image_vae.safetensors")
    .describe("VAE model name"),
});

type InputType = z.infer<typeof RequestSchema>;

function generateWorkflow(input: InputType): ComfyPrompt {
  return {
    "3": {
      inputs: {
        seed: input.seed,
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: ["66", 0],
        positive: ["6", 0],
        negative: ["7", 0],
        latent_image: ["58", 0],
      },
      class_type: "KSampler",
      _meta: {
        title: "KSampler",
      },
    },
    "6": {
      inputs: {
        text: input.prompt,
        clip: ["38", 0],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP Text Encode (Positive Prompt)",
      },
    },
    "7": {
      inputs: {
        text: input.negative_prompt,
        clip: ["38", 0],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP Text Encode (Negative Prompt)",
      },
    },
    "8": {
      inputs: {
        samples: ["3", 0],
        vae: ["39", 0],
      },
      class_type: "VAEDecode",
      _meta: {
        title: "VAE Decode",
      },
    },
    "37": {
      inputs: {
        unet_name: input.unet_name,
        weight_dtype: "default",
      },
      class_type: "UNETLoader",
      _meta: {
        title: "Load Diffusion Model",
      },
    },
    "38": {
      inputs: {
        clip_name: input.clip_name,
        type: "qwen_image",
        device: "default",
      },
      class_type: "CLIPLoader",
      _meta: {
        title: "Load CLIP",
      },
    },
    "39": {
      inputs: {
        vae_name: input.vae_name,
      },
      class_type: "VAELoader",
      _meta: {
        title: "Load VAE",
      },
    },
    "58": {
      inputs: {
        width: input.width,
        height: input.height,
        batch_size: 1,
      },
      class_type: "EmptySD3LatentImage",
      _meta: {
        title: "EmptySD3LatentImage",
      },
    },
    "60": {
      inputs: {
        filename_prefix: "ComfyUI",
        images: ["8", 0],
      },
      class_type: "SaveImage",
      _meta: {
        title: "Save Image",
      },
    },
    "66": {
      inputs: {
        shift: input.shift,
        model: ["37", 0],
      },
      class_type: "ModelSamplingAuraFlow",
      _meta: {
        title: "ModelSamplingAuraFlow",
      },
    },
  };
}

const workflow: Workflow = {
  RequestSchema,
  generateWorkflow,
  summary: "Qwen Image Text to Image",
  description: "Generate images using Qwen Image model with AuraFlow sampling",
};

export default workflow;