import { z } from "zod";
import { ComfyPrompt, Workflow } from "../types";
import config from "../config";

const RequestSchema = z.object({
  // Basic generation
  prompt: z.string().describe("The positive prompt for image generation"),
  negative_prompt: z
    .string()
    .optional()
    .default("cartoon, illustration, anime, painting, CGI, 3D render, low quality, watermark, logo, label")
    .describe("The negative prompt to exclude elements"),
  
  // Image dimensions
  width: z
    .number()
    .int()
    .min(512)
    .max(2048)
    .multipleOf(64)
    .optional()
    .default(768)
    .describe("Width of the generated image (must be multiple of 64)"),
  height: z
    .number()
    .int()
    .min(512)
    .max(2048)
    .multipleOf(64)
    .optional()
    .default(1152)
    .describe("Height of the generated image (must be multiple of 64)"),
  
  // Sampling parameters
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
    .default(32)
    .describe("Number of sampling steps"),
  cfg: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(4)
    .describe("Classifier-free guidance scale (recommended 3-8 for SDXL)"),
  sampler_name: config.samplers
    .optional()
    .default("dpmpp_2m_sde")
    .describe("Name of the sampler to use"),
  scheduler: config.schedulers
    .optional()
    .default("karras")
    .describe("Type of scheduler to use"),
  
  // Model configuration
  checkpoint_name: z
    .string()
    .optional()
    .default("huslyorealismxl_v10.safetensors")
    .describe("SDXL checkpoint model name (.safetensors). Default: HuslyoRealismXL. Compatible: Juggernaut-XL, RealVisXL, etc."),
  vae_name: z
    .string()
    .optional()
    .default("sdxl_vae.safetensors")
    .describe("VAE model name for SDXL. Use sdxl_vae.safetensors for best results"),
  
  // LoRA configuration (optimized for HuslyoRealismXL)
  lora1_name: z
    .string()
    .optional()
    .default("Touch-of-Realism-SDXL-V2.safetensors")
    .describe("First LoRA model name (.safetensors). Default: Touch of Realism SDXL V2 for photorealistic enhancement. Set empty to disable"),
  lora1_strength: z
    .number()
    .min(0.1)
    .max(1.5)
    .optional()
    .default(1.0)
    .describe("First LoRA strength (typical range: 0.3-1.0)"),
  lora2_name: z
    .string()
    .optional()
    .default("")
    .describe("Second LoRA model name (.safetensors). Optional: woman037 character LoRA (use 'woman037' trigger word). Set empty to disable"),
  lora2_strength: z
    .number()
    .min(0.1)
    .max(1.5)
    .optional()
    .default(0.7)
    .describe("Second LoRA strength (typical range: 0.3-1.0)"),
  lora3_name: z
    .string()
    .optional()
    .default("")
    .describe("Third SDXL-compatible LoRA model name (.safetensors). Leave empty to disable"),
  lora3_strength: z
    .number()
    .min(0.1)
    .max(1.5)
    .optional()
    .default(1.0)
    .describe("Third LoRA strength (typical range: 0.3-1.0). Only used if lora3_name is provided"),
  
  // Face enhancement parameters
  face_enhancement_enabled: z
    .boolean()
    .optional()
    .default(true)
    .describe("Enable face enhancement processing"),
  face_resolution: z
    .number()
    .int()
    .min(256)
    .max(2048)
    .multipleOf(64)
    .optional()
    .default(768)
    .describe("Resolution for face crop processing"),
  face_detection_confidence: z
    .number()
    .min(0.1)
    .max(1.0)
    .optional()
    .default(0.5)
    .describe("Face detection confidence threshold"),
  face_denoise: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.5)
    .describe("Denoising strength for face enhancement"),
  
  // Eye enhancement controls
  eye_enhancement_enabled: z
    .boolean()
    .optional()
    .default(true)
    .describe("Enable eye enhancement processing"),
  eye_resolution: z
    .number()
    .int()
    .min(256)
    .max(2048)
    .multipleOf(64)
    .optional()
    .default(1024)
    .describe("Resolution for eye crop processing"),
  eye_denoise: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.5)
    .describe("Denoising strength for eye enhancement"),
  
  // Upscaling controls
  upscale_enabled: z
    .boolean()
    .optional()
    .default(true)
    .describe("Enable image upscaling"),
  upscale_model: z
    .string()
    .optional()
    .default("4x_foolhardy_Remacri.pth")
    .describe("Upscale model name"),
  upscale_factor: z
    .number()
    .min(0.1)
    .max(1.0)
    .optional()
    .default(0.65)
    .describe("Upscale factor (0.65 = 2.6x effective scaling)"),
  
  // Post-processing effects
  film_grain_enabled: z
    .boolean()
    .optional()
    .default(false)
    .describe("Enable film grain effect"),
  film_grain_type: z
    .string()
    .optional()
    .default("Fine Simple")
    .describe("Film grain type"),
  film_grain_intensity: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.1)
    .describe("Film grain intensity"),
  
  digital_effects_enabled: z
    .boolean()
    .optional()
    .default(false)
    .describe("Enable digital look effects"),
  digital_effects_style: z
    .string()
    .optional()
    .default("Early 2000s Digital")
    .describe("Digital effects style"),
  digital_effects_intensity: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.2)
    .describe("Digital effects intensity"),
});

type InputType = z.infer<typeof RequestSchema>;

function generateWorkflow(input: InputType): ComfyPrompt {
  const workflow: ComfyPrompt = {
    // CheckpointLoaderSimple
    "1": {
      inputs: {
        ckpt_name: input.checkpoint_name,
      },
      class_type: "CheckpointLoaderSimple",
      _meta: {
        title: "Load Checkpoint",
      },
    },
    
    // CLIPSetLastLayer
    "2": {
      inputs: {
        clip: ["1", 1],
        stop_at_clip_layer: -2,
      },
      class_type: "CLIPSetLastLayer",
      _meta: {
        title: "CLIP Set Last Layer",
      },
    },
    
    // Positive prompt
    "3": {
      inputs: {
        text: input.prompt,
        clip: ["21", 1],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP Text Encode (Positive Prompt)",
      },
    },
    
    // Negative prompt
    "4": {
      inputs: {
        text: input.negative_prompt,
        clip: ["2", 0],
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP Text Encode (Negative Prompt)",
      },
    },
    
    // EmptyLatentImage
    "6": {
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
    
    // VAEDecode
    "7": {
      inputs: {
        samples: ["10", 3],
        vae: ["9", 0],
      },
      class_type: "VAEDecode",
      _meta: {
        title: "VAE Decode",
      },
    },
    
    // SaveImage
    "8": {
      inputs: {
        filename_prefix: "ComfyUI_SDXL_FaceDetail",
        images: input.film_grain_enabled ? ["43", 0] : (input.digital_effects_enabled ? ["44", 0] : (input.upscale_enabled ? ["36", 0] : (input.eye_enhancement_enabled ? ["25", 0] : (input.face_enhancement_enabled ? ["22", 0] : ["7", 0])))),
      },
      class_type: "SaveImage",
      _meta: {
        title: "Save Image",
      },
    },
    
    // VAELoader
    "9": {
      inputs: {
        vae_name: input.vae_name,
      },
      class_type: "VAELoader",
      _meta: {
        title: "Load VAE",
      },
    },
    
    // KSampler (Efficient)
    "10": {
      inputs: {
        seed: input.seed,
        seed_mode: "fixed",
        steps: input.steps,
        cfg: input.cfg,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: 1,
        preview_method: "auto",
        vae_decode: "true",
        model: ["21", 0],
        positive: ["3", 0],
        negative: ["4", 0],
        latent_image: ["6", 0],
        optional_vae: ["9", 0],
      },
      class_type: "KSampler (Efficient)",
      _meta: {
        title: "KSampler (Efficient)",
      },
    },
    
    // Lora Loader Stack (rgthree) - only use if LoRAs are specified
    "21": {
      inputs: {
        lora_01: input.lora1_name && input.lora1_name !== "" ? input.lora1_name : "None",
        strength_01: input.lora1_name && input.lora1_name !== "" ? input.lora1_strength : 1,
        lora_02: input.lora2_name && input.lora2_name !== "" ? input.lora2_name : "None",
        strength_02: input.lora2_name && input.lora2_name !== "" ? input.lora2_strength : 1,
        lora_03: input.lora3_name && input.lora3_name !== "" ? input.lora3_name : "None",
        strength_03: input.lora3_name && input.lora3_name !== "" ? input.lora3_strength : 1,
        lora_04: "None",
        strength_04: 1,
        model: ["1", 0],
        clip: ["2", 0],
      },
      class_type: "Lora Loader Stack (rgthree)",
      _meta: {
        title: "Lora Loader Stack",
      },
    },
  };

  // Add face enhancement if enabled
  if (input.face_enhancement_enabled) {
    // Face detector
    workflow["23"] = {
      inputs: {
        model_name: "bbox/face_yolov8m.pt",
      },
      class_type: "UltralyticsDetectorProvider",
      _meta: {
        title: "Face Detector Provider",
      },
    };
    
    // FaceDetailer for face
    workflow["22"] = {
      inputs: {
        guide_size: input.face_resolution,
        guide_size_for: true,
        max_size: 1024,
        seed: input.seed,
        steps: 20,
        cfg: input.cfg,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: input.face_denoise,
        feather: 5,
        noise_mask: true,
        force_inpaint: true,
        bbox_threshold: input.face_detection_confidence,
        bbox_dilation: 10,
        bbox_crop_factor: 3,
        sam_detection_hint: "center-1",
        sam_dilation: 0,
        sam_threshold: 0.93,
        sam_bbox_expansion: 0,
        sam_mask_hint_threshold: 0.7,
        sam_mask_hint_use_negative: "False",
        drop_size: 10,
        wildcard: "",
        cycle: 1,
        inpaint_model: false,
        noise_mask_feather: 20,
        separate_clip_skip: false,
        two_pass_refined_mask: false,
        image: ["7", 0],
        model: ["10", 0],
        clip: ["21", 1],
        vae: ["10", 4],
        positive: ["10", 1],
        negative: ["10", 2],
        bbox_detector: ["23", 0],
      },
      class_type: "FaceDetailer",
      _meta: {
        title: "Face Detailer",
      },
    };
  }

  // Add eye enhancement if enabled
  if (input.eye_enhancement_enabled && input.face_enhancement_enabled) {
    // Eye detector
    workflow["26"] = {
      inputs: {
        model_name: "bbox/PitEyeDetailer-v2-seg.pt",
      },
      class_type: "UltralyticsDetectorProvider",
      _meta: {
        title: "Eye Detector Provider",
      },
    };
    
    // SAM loader for eye detection
    workflow["27"] = {
      inputs: {
        model_name: "sam_vit_b_01ec64.pth",
        device_mode: "AUTO",
      },
      class_type: "SAMLoader",
      _meta: {
        title: "SAM Loader",
      },
    };
    
    // FaceDetailer for eyes
    workflow["25"] = {
      inputs: {
        guide_size: input.eye_resolution,
        guide_size_for: true,
        max_size: 1024,
        seed: input.seed,
        steps: 20,
        cfg: input.cfg,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: input.eye_denoise,
        feather: 5,
        noise_mask: true,
        force_inpaint: true,
        bbox_threshold: 0.5,
        bbox_dilation: 10,
        bbox_crop_factor: 3,
        sam_detection_hint: "center-1",
        sam_dilation: 0,
        sam_threshold: 0.93,
        sam_bbox_expansion: 0,
        sam_mask_hint_threshold: 0.7,
        sam_mask_hint_use_negative: "False",
        drop_size: 10,
        wildcard: "",
        cycle: 1,
        inpaint_model: false,
        noise_mask_feather: 20,
        separate_clip_skip: false,
        two_pass_refined_mask: false,
        image: ["22", 0],
        model: ["10", 0],
        clip: ["21", 1],
        vae: ["10", 4],
        positive: ["10", 1],
        negative: ["10", 2],
        bbox_detector: ["26", 0],
        sam_model_opt: ["27", 0],
        segm_detector_opt: ["26", 1],
      },
      class_type: "FaceDetailer",
      _meta: {
        title: "Eye Detailer",
      },
    };
  }

  // Determine the image source for post-processing
  let postProcessSource: [string, number] = ["7", 0];
  if (input.eye_enhancement_enabled && input.face_enhancement_enabled) {
    postProcessSource = ["25", 0];
  } else if (input.face_enhancement_enabled) {
    postProcessSource = ["22", 0];
  }

  // Add digital effects if enabled
  if (input.digital_effects_enabled) {
    workflow["44"] = {
      inputs: {
        filter_type: input.digital_effects_style,
        intensity: input.digital_effects_intensity,
        seed: input.seed,
        image: postProcessSource,
      },
      class_type: "LowQualityDigitalLook",
      _meta: {
        title: "Digital Effects",
      },
    };
    postProcessSource = ["44", 0];
  }

  // Add film grain if enabled
  if (input.film_grain_enabled) {
    workflow["43"] = {
      inputs: {
        enable: true,
        grain_type: input.film_grain_type,
        red: input.film_grain_intensity,
        green: input.film_grain_intensity,
        blue: input.film_grain_intensity,
        luminance: input.film_grain_intensity,
        contrast: 0.7,
        highlights: 0,
        saturation: 1,
        density: 1,
        seed: input.seed,
        image: postProcessSource,
      },
      class_type: "ProPostFilmGrain",
      _meta: {
        title: "Film Grain",
      },
    };
    postProcessSource = ["43", 0];
  }

  // Add upscaling if enabled
  if (input.upscale_enabled) {
    // UpscaleModelLoader
    workflow["33"] = {
      inputs: {
        model_name: input.upscale_model,
      },
      class_type: "UpscaleModelLoader",
      _meta: {
        title: "Load Upscale Model",
      },
    };
    
    // ImageUpscaleWithModel
    workflow["34"] = {
      inputs: {
        upscale_model: ["33", 0],
        image: postProcessSource,
      },
      class_type: "ImageUpscaleWithModel",
      _meta: {
        title: "Upscale Image",
      },
    };
    
    // ImageScaleBy
    workflow["36"] = {
      inputs: {
        upscale_method: "lanczos",
        scale_by: input.upscale_factor,
        image: ["34", 0],
      },
      class_type: "ImageScaleBy",
      _meta: {
        title: "Scale Image",
      },
    };
  }

  return workflow;
}

const workflow: Workflow = {
  RequestSchema,
  generateWorkflow,
  summary: "SDXL Face Detail + Upscaler (HuslyoRealismXL)",
  description: "Advanced SDXL photorealistic workflow with HuslyoRealismXL checkpoint, face/eye enhancement, Touch of Realism LoRA, optional character LoRAs, upscaling, and post-processing effects. Supports woman037 character LoRA with trigger word.",
};

export default workflow;