import { z } from "zod";
// This gets evaluated in the context of src/workflows, so imports must be relative to that directory
import { ComfyPrompt, Workflow } from "../types";
import config from "../config";

const RequestSchema = z.object({
  image: z
    .string()
    .describe("Input image as URL or base64 encoded string"),
  prompt: z
    .string()
    .describe("The editing instruction prompt"),
  negative_prompt: z
    .string()
    .optional()
    .default("")
    .describe("The negative prompt to exclude elements"),
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
    .default(4)
    .describe("Number of sampling steps"),
  cfg: z
    .number()
    .min(0)
    .max(20)
    .optional()
    .default(1)
    .describe("Classifier-free guidance scale"),
  sampler_name: config.samplers
    .optional()
    .default("res_2s")
    .describe("Name of the sampler to use"),
  scheduler: config.schedulers
    .optional()
    .default("bong_tangent")
    .describe("Type of scheduler to use"),
  denoise: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(1)
    .describe("Denoising strength"),
  upscale_factor: z
    .number()
    .min(0.5)
    .max(4)
    .optional()
    .default(1.25)
    .describe("Image upscale factor before processing"),
  shift: z
    .number()
    .min(0)
    .max(10)
    .optional()
    .default(3.1)
    .describe("ModelSamplingAuraFlow shift parameter"),
  normalization_level: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(1)
    .describe("CFG normalization level"),
  sharpening_factor: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.2)
    .describe("Laplacian sharpening factor"),
  film_grain: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.1)
    .describe("Film grain intensity"),
  strength: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .default(1.0)
    .describe("CFGNorm and FastLaplacianSharpen strength"),
  upscale_method: z
    .string()
    .optional()
    .default("nearest-exact")
    .describe("Image upscaling method"),
  saturation_mix: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.5)
    .describe("Film grain saturation mix"),
  grain_intensity: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.1)
    .describe("Film grain intensity parameter"),
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
  lora_name: z
    .string()
    .optional()
    .describe("Optional LoRA model name"),
  lora_strength: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .default(1)
    .describe("LoRA model strength"),
});

type InputType = z.infer<typeof RequestSchema>;

function generateWorkflow(input: InputType): ComfyPrompt {
  const workflow: ComfyPrompt = {
    "3": {
      inputs: {
        seed: input.seed,
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: input.lora_name ? ["72", 0] : ["75", 0],
        positive: ["76", 0],
        negative: ["77", 0],
        latent_image: ["88", 0],
      },
      class_type: "KSampler",
      _meta: {
        title: "KSampler",
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
    "75": {
      inputs: {
        normalization_level: input.normalization_level,
        strength: input.strength,
        model: ["66", 0],
      },
      class_type: "CFGNorm",
      _meta: {
        title: "CFG Normalization",
      },
    },
    "76": {
      inputs: {
        text: input.prompt,
        clip: ["38", 0],
      },
      class_type: "TextEncodeQwenImageEdit",
      _meta: {
        title: "Text Encode Qwen Image Edit (Positive)",
      },
    },
    "77": {
      inputs: {
        text: input.negative_prompt,
        clip: ["38", 0],
      },
      class_type: "TextEncodeQwenImageEdit",
      _meta: {
        title: "Text Encode Qwen Image Edit (Negative)",
      },
    },
    "78": {
      inputs: {
        image: input.image,
        upload: "image",
      },
      class_type: "LoadImage",
      _meta: {
        title: "Load Image",
      },
    },
    "86": {
      inputs: {
        upscale_factor: input.upscale_factor,
        upscale_method: input.upscale_method,
        megapixels: 2,
        image: ["78", 0],
      },
      class_type: "ImageScaleToTotalPixels",
      _meta: {
        title: "Image Scale to Total Pixels",
      },
    },
    "88": {
      inputs: {
        pixels: ["86", 0],
        vae: ["39", 0],
      },
      class_type: "VAEEncode",
      _meta: {
        title: "VAE Encode",
      },
    },
    "101": {
      inputs: {
        factor: input.sharpening_factor,
        strength: input.strength,
        images: ["8", 0],
      },
      class_type: "FastLaplacianSharpen",
      _meta: {
        title: "Fast Laplacian Sharpen",
      },
    },
    "102": {
      inputs: {
        amount: input.film_grain,
        grain_intensity: input.grain_intensity,
        saturation_mix: input.saturation_mix,
        size: 1.5,
        saturation: 1,
        tonality: 1,
        sigma: 1,
        adaptive: "log",
        seed: input.seed,
        images: ["101", 0],
      },
      class_type: "FastFilmGrain",
      _meta: {
        title: "Fast Film Grain",
      },
    },
    "104": {
      inputs: {
        filename_prefix: "ComfyUI",
        images: ["102", 0],
      },
      class_type: "SaveImage",
      _meta: {
        title: "Save Image",
      },
    },
  };

  // Add LoRA loader if specified
  if (input.lora_name) {
    workflow["72"] = {
      inputs: {
        lora_name: input.lora_name,
        strength_model: input.lora_strength,
        model: ["75", 0],
      },
      class_type: "LoraLoaderModelOnly",
      _meta: {
        title: "Load LoRA (Model Only)",
      },
    };
  }

  return workflow;
}

const workflow: Workflow = {
  RequestSchema,
  generateWorkflow,
  summary: "Qwen Image Edit",
  description: "Edit images using Qwen Image model with advanced post-processing including sharpening and film grain",
};

export default workflow;