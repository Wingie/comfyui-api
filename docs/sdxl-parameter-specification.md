# SDXL Face Detail + Upscaler - Parameter Specification

## Exposed User Parameters

### Core Generation Parameters
```typescript
{
  // Basic generation
  prompt: string,                           // Main generation prompt
  negative_prompt?: string,                 // Default: "cartoon, illustration, anime, painting, CGI, 3D render, low quality, watermark, logo, label"
  
  // Image dimensions
  width?: number,                           // Default: 768 (SDXL base resolution)
  height?: number,                          // Default: 1152 (portrait aspect ratio)
  
  // Sampling parameters  
  steps?: number,                           // Default: 32 (quality vs speed balance)
  cfg?: number,                             // Default: 4 (SDXL optimized)
  seed?: number,                            // Default: random
  sampler_name?: string,                    // Default: "dpmpp_2m_sde" 
  scheduler?: string,                       // Default: "karras"
}
```

### Model Configuration
```typescript
{
  // Core models
  checkpoint_name?: string,                 // Default: "huslyorealismxl_v10.safetensors"
  vae_name?: string,                        // Default: "sdxl_vae.safetensors"
  
  // LoRA configuration
  lora1_name?: string,                      // Default: "Touch_of_Realism_SDXL_V2.safetensors" 
  lora1_strength?: number,                  // Default: 1.0
  lora2_name?: string,                      // Default: "Woman877.v2.safetensors"
  lora2_strength?: number,                  // Default: 0.7
  lora3_name?: string,                      // Default: "None" (disabled)
  lora3_strength?: number,                  // Default: 1.0
}
```

### Face Enhancement Parameters  
```typescript
{
  // Face detailing controls
  face_enhancement_enabled?: boolean,       // Default: true
  face_resolution?: number,                 // Default: 768 (face crop resolution)
  face_detection_confidence?: number,       // Default: 0.5 (bbox threshold)
  
  // Eye enhancement controls  
  eye_enhancement_enabled?: boolean,        // Default: true
  eye_resolution?: number,                  // Default: 1024 (eye crop resolution)
  eye_detection_model?: string,             // Default: "bbox/PitEyeDetailer-v2-seg.pt"
  
  // Advanced face settings
  face_crop_padding?: number,               // Default: 32 (crop factor)
  face_drop_size?: number,                  // Default: 10 (minimum face size)
}
```

### Upscaling & Post-Processing
```typescript
{
  // Upscaling controls
  upscale_enabled?: boolean,                // Default: true
  upscale_model?: string,                   // Default: "4x_foolhardy_Remacri.pth"
  upscale_factor?: number,                  // Default: 0.65 (effective 2.6x scaling)
  
  // Post-processing effects
  film_grain_enabled?: boolean,             // Default: false
  film_grain_type?: string,                 // Default: "Fine Simple"
  film_grain_intensity?: number,            // Default: 0.1
  
  digital_effects_enabled?: boolean,        // Default: false  
  digital_effects_style?: string,           // Default: "Early 2000s Digital"
  digital_effects_intensity?: number,       // Default: 0.2
}
```

## Hard-coded Internal Parameters

### Model Paths (not user-configurable)
- Face detection model: `"bbox/face_yolov8m.pt"`
- SAM model: `"sam_vit_b_01ec64.pth"`
- CLIP layer setting: `-2` (optimized for SDXL)

### Processing Settings (optimized defaults)
- Batch size: `1` (single image generation)
- VAE encoding/decoding settings
- Image scaling methods: `"lanczos"`
- Save image prefix: `"ComfyUI_SDXL_FaceDetail"`

### Node Connection Logic
- FaceDetailer cascade (face → eyes)
- Upscaling pipeline integration
- VAE encode/decode chain
- LoRA loading order and model connections

## Parameter Validation Rules

### Dimensions
- Width/Height: Must be multiples of 64 (SDXL requirement)
- Minimum: 512x512, Maximum: 2048x2048
- Recommended: 768x1152 (portrait), 1024x768 (landscape)

### Sampling
- Steps: 1-100 (recommended 20-50 for quality)
- CFG: 1-20 (recommended 3-8 for SDXL)
- Seed: 0 to Number.MAX_SAFE_INTEGER

### Enhancement Settings  
- Resolution values: 256-2048 (multiples of 64)
- Strength values: 0.0-2.0 (most effective 0.1-1.5)
- Detection confidence: 0.1-1.0

### Model Names
- Must exist in respective model directories
- Checkpoint: `.safetensors` or `.ckpt` files in checkpoints/
- LoRA: `.safetensors` files in loras/
- Upscale: `.pth` files in upscale_models/

## Default Workflow Behavior

### Quality Mode (Default)
- All enhancements enabled
- Balanced processing settings
- ~90 seconds processing time

### Fast Mode (Optional preset)
- Face enhancement only (no eye detailing)
- No upscaling or post-processing  
- ~30 seconds processing time

### Maximum Quality Mode (Optional preset)
- All features enabled
- Higher resolution settings
- Extended sampling steps
- ~3 minutes processing time

## Output Specifications

### Primary Output
```typescript
{
  final_image: string,                      // Base64 encoded final result
  metadata: {
    processing_time_seconds: number,
    final_resolution: { width: number, height: number },
    models_used: string[],
    settings_applied: object
  }
}
```

### Optional Intermediate Outputs (Debug Mode)
```typescript
{
  base_generation?: string,                 // Before face enhancement
  face_enhanced?: string,                   // After face processing
  upscaled?: string,                        // After upscaling
  post_processed?: string                   // After filters
}
```