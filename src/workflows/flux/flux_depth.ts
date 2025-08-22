import { z } from "zod";
import { ComfyPrompt, Workflow } from "../../types";
import config from "../../config";

const RequestSchema = z.object({
  image: z
    .string()
    .describe("Input image for depth-based generation as URL or base64 encoded string"),
  prompt: z
    .string()
    .describe("The positive prompt for image generation"),
  guidance: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .default(30)
    .describe("Flux guidance strength"),
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
    .default(1)
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
  width: z
    .number()
    .int()
    .min(256)
    .max(2048)
    .optional()
    .default(1024)
    .describe("Width of the generated image"),
  height: z
    .number()
    .int()
    .min(256)
    .max(2048)
    .optional()
    .default(1024)
    .describe("Height of the generated image"),
  unet_name: z
    .string()
    .optional()
    .default("flux1-dev.safetensors")
    .describe("UNET model name"),
  clip_name1: z
    .string()
    .optional()
    .default("clip_l.safetensors")
    .describe("First CLIP model name"),
  clip_name2: z
    .string()
    .optional()
    .default("t5xxl_fp8_e4m3fn.safetensors")
    .describe("Second CLIP model name"),
  vae_name: z
    .string()
    .optional()
    .default("ae.safetensors")
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
    "6": {
      inputs: {
        text: input.prompt,
        clip: ["11", 0],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP Text Encode (Positive Prompt)",
      },
    },
    "8": {
      inputs: {
        samples: ["13", 0],
        vae: ["10", 0],
      },
      class_type: "VAEDecode",
      _meta: {
        title: "VAE Decode",
      },
    },
    "10": {
      inputs: {
        vae_name: input.vae_name,
      },
      class_type: "VAELoader",
      _meta: {
        title: "Load VAE",
      },
    },
    "11": {
      inputs: {
        clip_name1: input.clip_name1,
        clip_name2: input.clip_name2,
        type: "flux",
      },
      class_type: "DualCLIPLoader",
      _meta: {
        title: "DualCLIPLoader",
      },
    },
    "12": {
      inputs: {
        unet_name: input.unet_name,
        weight_dtype: "default",
      },
      class_type: "UNETLoader",
      _meta: {
        title: "Load Diffusion Model",
      },
    },
    "13": {
      inputs: {
        seed: input.seed,
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: input.denoise,
        model: input.lora_name ? ["26", 0] : ["25", 0],
        positive: ["73", 0],
        negative: ["73", 1],
        latent_image: ["73", 2],
      },
      class_type: "KSampler",
      _meta: {
        title: "KSampler",
      },
    },
    "17": {
      inputs: {
        width: input.width,
        height: input.height,
        batch_size: 1,
      },
      class_type: "EmptyLatentImage",
      _meta: {
        title: "Empty Latent Image",
      },
    },
    "22": {
      inputs: {
        filename_prefix: "ComfyUI",
        images: ["8", 0],
      },
      class_type: "SaveImage",
      _meta: {
        title: "Save Image",
      },
    },
    "25": {
      inputs: {
        max_shift: 1.15,
        base_shift: 0.5,
        width: input.width,
        height: input.height,
        model: ["12", 0],
      },
      class_type: "ModelSamplingFlux",
      _meta: {
        title: "ModelSamplingFlux",
      },
    },
    "27": {
      inputs: {
        conditioning: input.guidance,
        model: input.lora_name ? ["26", 0] : ["25", 0],
      },
      class_type: "FluxGuidance",
      _meta: {
        title: "FluxGuidance",
      },
    },
    "72": {
      inputs: {
        image: input.image,
        upload: "image",
      },
      class_type: "LoadImage",
      _meta: {
        title: "Load Image",
      },
    },
    "73": {
      inputs: {
        positive: ["6", 0],
        negative: ["6", 0],
        vae: ["10", 0],
        pixels: ["72", 0],
      },
      class_type: "InstructPixToPixConditioning",
      _meta: {
        title: "InstructPix2Pix Conditioning",
      },
    },
  };

  // Add LoRA loader if specified
  if (input.lora_name) {
    workflow["26"] = {
      inputs: {
        lora_name: input.lora_name,
        strength_model: input.lora_strength,
        strength_clip: input.lora_strength,
        model: ["27", 0],
        clip: ["11", 0],
      },
      class_type: "LoraLoader",
      _meta: {
        title: "Load LoRA",
      },
    };
  }

  return workflow;
}

const workflow: Workflow = {
  RequestSchema,
  generateWorkflow,
  summary: "Flux Depth-Based Generation",
  description: "Generate images using Flux with depth-based conditioning from an input image",
};

export default workflow;