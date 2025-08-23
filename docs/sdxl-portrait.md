# SDXL Face Detail + Upscaler Workflow

## Overview
This workflow implements a high-quality SDXL-based image generation pipeline with advanced face detailing, upscaling, and post-processing effects. It's designed for photorealistic portrait and character generation with professional-grade enhancement.

## Workflow Pipeline

### Stage 1: Base Image Generation
- **CheckpointLoader**: Loads SDXL checkpoint (`huslyorealismxl_v10.safetensors`)
- **LoRA Stack**: Applies multiple LoRA models for style enhancement
- **KSampler**: Generates base image at specified resolution
- **VAE Decode**: Converts latent to initial image

### Stage 2: Face Enhancement
- **FaceDetailer (Main)**: Detects and enhances faces using YOLOv8 face detection
  - Uses dedicated face enhancement model
  - Applies face-specific prompts
  - Configurable padding and enhancement strength
- **FaceDetailer (Eyes)**: Secondary pass for eye detail enhancement
  - Specialized eye detection and enhancement
  - Separate prompting for eye details

### Stage 3: Upscaling & Post-Processing
- **ESRGAN Upscaler**: 4x upscaling using `4x_foolhardy_Remacri.pth`
- **Post-Processing Filters**:
  - Film grain effect for analog photography aesthetic
  - Digital effects for modern enhancement
  - Color and contrast adjustments

### Stage 4: Output
- Multiple save points for different stages
- Preview nodes for workflow debugging
- Final high-resolution output with all enhancements applied

## Key Parameters to Expose

### Generation Parameters
- `prompt`: Main generation prompt
- `negative_prompt`: Elements to exclude
- `width`, `height`: Base generation dimensions (recommend 1024x1536)
- `steps`: Sampling steps (20-50 recommended)
- `cfg`: Guidance scale (4-8 recommended)
- `seed`: Reproducibility control

### Face Enhancement Parameters
- `face_prompt`: Specific prompt for face detailing
- `face_negative_prompt`: Face-specific negative prompt  
- `face_detection_confidence`: YOLOv8 detection threshold
- `face_enhancement_strength`: How much to enhance detected faces
- `eye_enhancement_enabled`: Toggle eye-specific enhancement

### Post-Processing Parameters
- `upscale_enabled`: Toggle 4x upscaling
- `film_grain_strength`: Analog film aesthetic intensity
- `digital_effects_enabled`: Modern post-processing effects
- `color_enhancement`: Color saturation and contrast adjustments

## Model Requirements

### Essential Models
- **Checkpoint**: `huslyorealismxl_v10.safetensors` (~6.5GB SDXL model)
- **VAE**: SDXL VAE for proper encoding/decoding
- **CLIP**: SDXL CLIP models for text encoding
- **LoRA Models**: Various style and enhancement LoRAs
- **Face Models**: YOLOv8 face detection + face enhancement models
- **Upscaler**: `4x_foolhardy_Remacri.pth` ESRGAN model (~67MB)

### Storage Requirements
- Total model storage: ~15-20GB
- Temporary processing space: ~5GB per generation
- Output images: Variable based on resolution and quantity

## Performance Considerations

### GPU Memory Requirements
- Minimum: 12GB VRAM (basic operation)
- Recommended: 16GB+ VRAM (full pipeline with upscaling)
- **Memory optimization**: Can disable upscaling or face detailing for lower VRAM

### Processing Time Estimates (RTX 4090)
- Base generation: 15-30 seconds
- Face detailing: +20-40 seconds  
- 4x upscaling: +30-60 seconds
- Total pipeline: 1-2 minutes per image

## Input/Output Specification

### Inputs
```typescript
{
  prompt: string,
  negative_prompt?: string,
  width?: number (default: 1024),
  height?: number (default: 1536), 
  steps?: number (default: 30),
  cfg?: number (default: 6),
  seed?: number (random),
  face_enhancement_enabled?: boolean (default: true),
  upscale_enabled?: boolean (default: true),
  // ... additional parameters
}
```

### Outputs
```typescript
{
  final_image: string (base64 or URL),
  intermediate_stages?: {
    base_generation: string,
    face_enhanced: string,
    upscaled: string
  },
  metadata: {
    processing_time: number,
    models_used: string[],
    parameters_applied: object
  }
}
```

## Use Cases
- **Portrait Photography**: Professional headshots with face enhancement
- **Character Art**: Game/animation characters with detailed features  
- **Fashion Photography**: Full-body shots with face detail preservation
- **Social Media Content**: High-quality profile images and content
- **Print Media**: High-resolution images suitable for printing

## Quality Settings Presets

### Draft Mode (Fast)
- Base generation only, no face detailing or upscaling
- 15-20 steps, basic sampling
- ~15 seconds processing time

### Standard Mode (Balanced) 
- Face enhancement enabled, optional upscaling
- 25-30 steps, quality sampling
- ~45-90 seconds processing time

### Professional Mode (Maximum Quality)
- Full pipeline with all enhancements
- 40+ steps, premium sampling, 4x upscaling
- 2-3 minutes processing time

## Technical Notes
- Uses SDXL architecture (not SD 1.5)
- Requires ComfyUI with FaceDetailer custom nodes
- YOLOv8 models needed for face detection
- ESRGAN models required for upscaling
- Supports batch processing with memory management