# Qwen Image Workflows Documentation

## Overview
These workflows utilize the Qwen Image models for advanced image generation and editing capabilities. The Qwen Image models are specialized for high-quality image synthesis with text understanding.

## Workflows

### 1. qwen_base_txt2img
**Location**: `/src/workflows/qwen/qwen_base_txt2img.ts`

**Description**: Generate images using Qwen Image model with AuraFlow sampling. This is the base text-to-image generation workflow for Qwen models.

**Parameters**:
- `prompt` (string, required): The positive prompt for image generation
- `negative_prompt` (string, optional): The negative prompt to exclude elements
- `width` (number, optional, default: 1328): Width of the generated image (256-2048)
- `height` (number, optional, default: 1328): Height of the generated image (256-2048)
- `seed` (number, optional): Seed for random number generation
- `steps` (number, optional, default: 20): Number of sampling steps (1-100)
- `cfg` (number, optional, default: 4.5): Classifier-free guidance scale (0-20)
- `sampler_name` (string, optional, default: "euler"): Name of the sampler to use
- `scheduler` (string, optional, default: "simple"): Type of scheduler to use
- `denoise` (number, optional, default: 1): Denoising strength (0-1)
- `shift` (number, optional, default: 3.1): ModelSamplingAuraFlow shift parameter (0-10)
- `unet_name` (string, optional): UNET model name
- `clip_name` (string, optional): CLIP model name
- `vae_name` (string, optional): VAE model name

**Required Models**:
- UNET: `qwen_image_fp8_e4m3fn.safetensors`
- CLIP: `qwen_2.5_vl_7b_fp8_scaled.safetensors`
- VAE: `qwen_image_vae.safetensors`

**Custom Nodes**: None (uses standard ComfyUI nodes)

### 2. qwen_img_edit
**Location**: `/src/workflows/qwen/qwen_img_edit.ts`

**Description**: Edit images using Qwen Image model with advanced post-processing including sharpening and film grain. This workflow supports image-to-image editing with text instructions.

**Parameters**:
- `image` (string, required): Input image as URL or base64 encoded string
- `prompt` (string, required): The editing instruction prompt
- `negative_prompt` (string, optional): The negative prompt to exclude elements
- `seed` (number, optional): Seed for random number generation
- `steps` (number, optional, default: 4): Number of sampling steps (1-100)
- `cfg` (number, optional, default: 1): Classifier-free guidance scale (0-20)
- `sampler_name` (string, optional): Name of the sampler to use
- `scheduler` (string, optional) Type of scheduler to use
- `denoise` (number, optional, default: 1): Denoising strength (0-1)
- `upscale_factor` (number, optional, default: 1.25): Image upscale factor before processing (0.5-4)
- `shift` (number, optional, default: 3.1): ModelSamplingAuraFlow shift parameter (0-10)
- `normalization_level` (number, optional, default: 1): CFG normalization level (0-1)
- `sharpening_factor` (number, optional, default: 0.2): Laplacian sharpening factor (0-1)
- `film_grain` (number, optional, default: 0.1): Film grain intensity (0-1)
- `unet_name` (string, optional): UNET model name
- `clip_name` (string, optional): CLIP model name
- `vae_name` (string, optional): VAE model name
- `lora_name` (string, optional): Optional LoRA model name
- `lora_strength` (number, optional, default: 1): LoRA model strength (0-2)

**Required Models**:
- UNET: `qwen_image_fp8_e4m3fn.safetensors`
- CLIP: `qwen_2.5_vl_7b_fp8_scaled.safetensors`
- VAE: `qwen_image_vae.safetensors`

**Custom Nodes Required**:
- `TextEncodeQwenImageEdit`: Special text encoder for Qwen image editing
- `CFGNorm`: CFG normalization node
- `FastLaplacianSharpen`: Fast Laplacian sharpening filter
- `FastFilmGrain`: Film grain effect node
- `ImageScaleToTotalPixels`: Image scaling node

## Model Download Links

### Qwen Image Models
The Qwen Image models can be downloaded from HuggingFace:
- **Repository**: https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI

### Required Files:
1. **UNET Model**: 
   - `qwen_image_fp8_e4m3fn.safetensors`
   - Place in: `models/unet/`

2. **CLIP Model**:
   - `qwen_2.5_vl_7b_fp8_scaled.safetensors`
   - Place in: `models/clip/`

3. **VAE Model**:
   - `qwen_image_vae.safetensors`
   - Place in: `models/vae/`

## Custom Node Installation

### Required Custom Nodes for qwen_img_edit:

1. **ComfyUI-QwenImage** (for TextEncodeQwenImageEdit):
   ```bash
   cd custom_nodes
   git clone https://github.com/Comfy-Org/ComfyUI-QwenImage
   ```

2. **ComfyUI-CFGNorm**:
   ```bash
   cd custom_nodes
   git clone https://github.com/comfyanonymous/ComfyUI-CFGNorm
   ```

3. **ComfyUI-Image-Filters** (for FastLaplacianSharpen and FastFilmGrain):
   ```bash
   cd custom_nodes
   git clone https://github.com/spacepxl/ComfyUI-Image-Filters
   ```

## Usage Examples

### Text to Image Generation
```typescript
const response = await fetch('http://localhost:3000/workflows/qwen/qwen_base_txt2img', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: {
      prompt: "A beautiful landscape with mountains and a lake at sunset",
      width: 1328,
      height: 1328,
      steps: 20
    }
  })
});
```

### Image Editing
```typescript
const response = await fetch('http://localhost:3000/workflows/qwen/qwen_img_edit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: {
      image: "base64_encoded_image_string_here",
      prompt: "Make this studio-quality with better lighting",
      sharpening_factor: 0.3,
      film_grain: 0.05
    }
  })
});
```

## Performance Notes
- The Qwen Image models are optimized with FP8 quantization for faster inference
- Default resolution is 1328x1328 for optimal quality
- The image editing workflow includes post-processing effects that can be adjusted or disabled by setting their factors to 0

## Troubleshooting
1. If models are not loading, ensure they are placed in the correct directories
2. For custom nodes, make sure to install their Python dependencies
3. The TextEncodeQwenImageEdit node requires the Qwen Image CLIP model to be properly configured