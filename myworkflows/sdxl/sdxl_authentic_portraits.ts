import { z } from "zod";
import { ComfyPrompt, Workflow } from "../types";
import config from "../config";

const RequestSchema = z.object({
  // Basic generation
  prompt: z.string().describe("The positive prompt for image generation"),
  negative_prompt: z
    .string()
    .optional()
    .default("bad proportions, low resolution, bad, ugly, bad hands, bad teeth, terrible, painting, 3d, render, comic, anime, manga, unrealistic, flat, watermark, signature, worst quality, low quality, freckles, moled, spot on face")
    .describe("The negative prompt to exclude elements"),
  
  // Image dimensions
  width: z
    .number()
    .int()
    .min(512)
    .max(2048)
    .multipleOf(64)
    .optional()
    .default(832)
    .describe("Width of the generated image (must be multiple of 64)"),
  height: z
    .number()
    .int()
    .min(512)
    .max(2048)
    .multipleOf(64)
    .optional()
    .default(1216)
    .describe("Height of the generated image (must be multiple of 64)"),
  
  // Sampling parameters for base generation
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
    .default(8)
    .describe("Number of sampling steps for base generation"),
  cfg_scale: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(1.5)
    .describe("Classifier-free guidance scale"),
  sampler_name: config.samplers
    .optional()
    .default("dpmpp_sde")
    .describe("Name of the sampler to use"),
  scheduler: config.schedulers
    .optional()
    .default("karras")
    .describe("Type of scheduler to use"),
  
  // Model configuration
  checkpoint_name: z
    .string()
    .optional()
    .default("HuslyoRealismXL.safetensors")
    .describe("SDXL checkpoint model name. Compatible with any SDXL model"),
  vae_name: z
    .string()
    .optional()
    .default("sdxl_vae.safetensors")
    .describe("VAE model name for SDXL"),
  
  // Hires refinement settings
  hires_enabled: z
    .boolean()
    .optional()
    .default(true)
    .describe("Enable hires refinement stage"),
  hires_upscale_model: z
    .string()
    .optional()
    .default("4x-UltraSharp.pth")
    .describe("Upscale model for hires stage"),
  hires_upscale_method: z
    .string()
    .optional()
    .default("nearest-exact")
    .describe("Upscaling interpolation method"),
  hires_scale_percent: z
    .number()
    .min(10)
    .max(200)
    .optional()
    .default(50)
    .describe("Hires upscale percentage"),
  hires_denoise: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.3)
    .describe("Denoising strength for hires refinement"),
  hires_steps: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(8)
    .describe("Number of sampling steps for hires"),
  hires_cfg: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(1.5)
    .describe("CFG scale for hires sampling"),
  
  // Face enhancement parameters
  face_enhancement_enabled: z
    .boolean()
    .optional()
    .default(true)
    .describe("Enable face enhancement processing"),
  face_detection_model: z
    .string()
    .optional()
    .default("bbox/yolov11l-face.pt")
    .describe("Face detection model (YOLOv11 for better accuracy)"),
  face_sam_model: z
    .string()
    .optional()
    .default("sam_vit_l_0b3195.pth")
    .describe("SAM model for face segmentation"),
  face_resolution: z
    .number()
    .int()
    .min(256)
    .max(2048)
    .multipleOf(64)
    .optional()
    .default(1024)
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
    .default(0.3)
    .describe("Denoising strength for face enhancement"),
  face_steps: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(8)
    .describe("Number of sampling steps for face enhancement"),
  face_cfg: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .default(1.5)
    .describe("CFG scale for face enhancement"),
  face_dilation: z
    .number()
    .int()
    .min(0)
    .max(50)
    .optional()
    .default(10)
    .describe("Bbox dilation for better face coverage"),
  face_crop_factor: z
    .number()
    .min(1)
    .max(5)
    .optional()
    .default(1.5)
    .describe("Crop factor around detected face"),
  
  // Advanced SAM settings
  sam_threshold: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .default(0.93)
    .describe("SAM segmentation threshold"),
  sam_dilation: z
    .number()
    .int()
    .min(0)
    .max(50)
    .optional()
    .default(0)
    .describe("SAM mask dilation"),
  
  // Inpainting settings
  feather: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .default(20)
    .describe("Edge feathering for smooth blending"),
  noise_mask: z
    .boolean()
    .optional()
    .default(true)
    .describe("Apply noise only to masked area"),
  force_inpaint: z
    .boolean()
    .optional()
    .default(true)
    .describe("Force inpainting mode"),
});

type InputType = z.infer<typeof RequestSchema>;

function generateWorkflow(input: InputType): ComfyPrompt {
  const workflow: ComfyPrompt = {
    // CheckpointLoaderSimple - loads model, clip, and vae
    "10": {
      inputs: {
        ckpt_name: input.checkpoint_name,
      },
      class_type: "CheckpointLoaderSimple",
      _meta: {
        title: "Load Checkpoint",
      },
    },
    
    // Positive prompt
    "19": {
      inputs: {
        text: input.prompt,
        clip: ["10", 1], // Direct connection to checkpoint's CLIP output
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP Text Encode (Positive Prompt)",
      },
    },
    
    // Negative prompt
    "14": {
      inputs: {
        text: input.negative_prompt,
        clip: ["10", 1], // Direct connection to checkpoint's CLIP output
      },
      class_type: "CLIPTextEncode",
      _meta: {
        title: "CLIP Text Encode (Negative Prompt)",
      },
    },
    
    // SDXL Empty Latent Image
    "17": {
      inputs: {
        dimensions: `${input.width} x ${input.height}`, // Format: "width x height"
        clip_width: input.width,
        clip_height: input.height,
        batch_size: 1,
      },
      class_type: "SDXL Empty Latent Image (rgthree)",
      _meta: {
        title: "SDXL Empty Latent Image",
      },
    },
    
    // KSampler for base generation
    "20": {
      inputs: {
        seed: input.seed,
        seed_mode: "fixed",
        steps: input.steps,
        cfg: input.cfg_scale,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: 1,
        model: ["10", 0], // Direct connection to checkpoint's MODEL output
        positive: ["19", 0],
        negative: ["14", 0],
        latent_image: ["17", 0],
      },
      class_type: "KSampler",
      _meta: {
        title: "KSampler (Base)",
      },
    },
    
    // VAEDecode for base image
    "3": {
      inputs: {
        samples: ["20", 0],
        vae: input.vae_name ? ["9", 0] : ["10", 2], // Use custom VAE or checkpoint VAE
      },
      class_type: "VAEDecode",
      _meta: {
        title: "VAE Decode (Base)",
      },
    },
  };

  // Add custom VAE loader if specified
  if (input.vae_name && input.vae_name !== "") {
    workflow["9"] = {
      inputs: {
        vae_name: input.vae_name,
      },
      class_type: "VAELoader",
      _meta: {
        title: "Load VAE",
      },
    };
  }

  // Determine the image source for next stage
  let imageSource: [string, number] = ["3", 0];
  
  // Add hires refinement if enabled
  if (input.hires_enabled) {
    // Easy hiresFix node
    workflow["11"] = {
      inputs: {
        upscale_model: input.hires_upscale_model,
        rescale_after_model: true,
        rescale_method: input.hires_upscale_method,
        rescale: "by percentage",
        percent: input.hires_scale_percent,
        width: 1024,
        height: 1024,
        longer_side: 1024,
        crop: "disabled",
        image_output: "Preview",
        save_prefix: "ComfyUI",
        link_id: 0,
        image: imageSource,
        vae: input.vae_name ? ["9", 0] : ["10", 2],
      },
      class_type: "easy hiresFix",
      _meta: {
        title: "Hires Fix",
      },
    };
    
    // KSampler (Efficient) for hires refinement
    workflow["13"] = {
      inputs: {
        seed: input.seed,
        seed_mode: "fixed",
        steps: input.hires_steps,
        cfg: input.hires_cfg,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: input.hires_denoise,
        preview_method: "auto",
        vae_decode: "true",
        model: ["10", 0], // Direct connection to model
        positive: ["19", 0], // Direct connection to positive prompt
        negative: ["14", 0], // Direct connection to negative prompt
        latent_image: ["11", 2], // From hiresFix latent output
        optional_vae: input.vae_name ? ["9", 0] : ["10", 2],
      },
      class_type: "KSampler (Efficient)",
      _meta: {
        title: "KSampler (Hires)",
      },
    };
    
    imageSource = ["13", 5]; // Use the IMAGE output from KSampler (Efficient)
  }
  
  // Add face enhancement if enabled
  if (input.face_enhancement_enabled) {
    // SAM Loader
    workflow["6"] = {
      inputs: {
        model_name: input.face_sam_model,
        device_mode: "AUTO",
      },
      class_type: "SAMLoader",
      _meta: {
        title: "SAM Loader",
      },
    };
    
    // Ultralytics Detector Provider (YOLOv11)
    workflow["5"] = {
      inputs: {
        model_name: input.face_detection_model,
      },
      class_type: "UltralyticsDetectorProvider",
      _meta: {
        title: "Face Detector Provider (YOLOv11)",
      },
    };
    
    // ToDetailerPipe - prepare the detailer pipeline
    workflow["4"] = {
      inputs: {
        model: input.hires_enabled ? ["13", 0] : ["10", 0], // Model from hires or base
        clip: ["10", 1], // Direct connection to CLIP
        vae: input.vae_name ? ["9", 0] : ["10", 2], // VAE connection
        positive: ["19", 0], // Positive conditioning
        negative: ["14", 0], // Negative conditioning
        bbox_detector: ["5", 0],
        sam_model_opt: ["6", 0],
        segm_detector_opt: ["5", 1], // Optional segmentation detector
        wildcard: "",
        Select_to_add_LoRA: "Select the LoRA to add to the text",
        Select_to_add_Wildcard: "Select the Wildcard to add to the text",
      },
      class_type: "ToDetailerPipe",
      _meta: {
        title: "To Detailer Pipe",
      },
    };
    
    // FaceDetailerPipe - main face enhancement
    workflow["15"] = {
      inputs: {
        guide_size: input.face_resolution,
        guide_size_for: true,
        max_size: 1024,
        seed: input.seed,
        seed_mode: "randomize",
        steps: input.face_steps,
        cfg: input.face_cfg,
        sampler_name: input.sampler_name,
        scheduler: input.scheduler,
        denoise: input.face_denoise,
        feather: input.feather,
        noise_mask: input.noise_mask,
        force_inpaint: input.force_inpaint,
        bbox_threshold: input.face_detection_confidence,
        bbox_dilation: input.face_dilation,
        bbox_crop_factor: input.face_crop_factor,
        sam_detection_hint: "center-1",
        sam_dilation: input.sam_dilation,
        sam_threshold: input.sam_threshold,
        sam_bbox_expansion: 0,
        sam_mask_hint_threshold: 0.7,
        sam_mask_hint_use_negative: "False",
        drop_size: 10,
        refiner_ratio: 0.2,
        cycle: 1,
        inpaint_model: false,
        noise_mask_feather: 20,
        image: imageSource,
        detailer_pipe: ["4", 0],
      },
      class_type: "FaceDetailerPipe",
      _meta: {
        title: "Face Detailer",
      },
    };
    
    imageSource = ["15", 0]; // Use face-enhanced image
  }
  
  // SaveImage node
  workflow["8"] = {
    inputs: {
      filename_prefix: "SDXL_Authentic",
      images: imageSource,
    },
    class_type: "SaveImage",
    _meta: {
      title: "Save Image",
    },
  };
  
  return workflow;
}

const workflow: Workflow = {
  RequestSchema,
  generateWorkflow,
  summary: "SDXL Authentic Portraits (YOLOv11)",
  description: "Advanced SDXL workflow with three-stage processing: Base generation → Hires refinement → Face detailing using YOLOv11 detection. Produces highly realistic portraits with superior face accuracy compared to YOLOv8-based workflows.",
};

export default workflow;