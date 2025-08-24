# SDXL Authentic Portraits Workflow

## Overview
Advanced SDXL workflow with multi-stage processing for creating photorealistic portraits. Uses a three-stage approach: Base generation → Hires refinement → Face detailing with YOLOv11 detection.

## Key Features

### Multi-Stage Processing
1. **Base Generation**: Initial SDXL image generation with configurable dimensions and sampling parameters
2. **Hires Refinement**: Upscaling and quality enhancement using efficient sampling
3. **Face Detailing**: Advanced face detection using YOLOv11 with SAM segmentation for precise face enhancement

### Model Support
- **Checkpoint**: Default uses HuslyoRealismXL.safetensors (configurable)
- **VAE**: SDXL VAE support for optimal decoding
- **Face Detection**: YOLOv11 (bbox/yolov11l-face.pt) - newer and more accurate than YOLOv8
- **SAM**: Segment Anything Model for precise masking (sam_vit_l_0b3195.pth)
- **Upscaler**: 4x-UltraSharp.pth for hires refinement

## Parameters

### Basic Generation
- `prompt`: Positive prompt for image generation
- `negative_prompt`: Elements to exclude (default includes common quality issues)
- `width`, `height`: Image dimensions (512-2048, must be multiple of 64)
- `seed`: Random seed for reproducibility
- `steps`: Number of sampling steps (1-100, default 8)
- `cfg_scale`: Classifier-free guidance scale (1-20, default 1.5)
- `sampler_name`: Sampling algorithm (default: dpmpp_sde)
- `scheduler`: Scheduling type (default: karras)

### Model Configuration
- `checkpoint_name`: SDXL checkpoint model
- `vae_name`: VAE model for decoding

### Hires Settings
- `hires_enabled`: Enable hires refinement stage (default: true)
- `hires_upscale_method`: Upscaling algorithm (default: nearest-exact)
- `hires_scale_percent`: Upscale percentage (default: 50%)
- `hires_denoise`: Denoising strength for refinement (0-1, default 0.3)
- `hires_steps`: Sampling steps for hires (default: 8)

### Face Enhancement
- `face_enhancement_enabled`: Enable face detailing (default: true)
- `face_resolution`: Resolution for face processing (default: 1024)
- `face_detection_confidence`: Detection threshold (0.1-1.0, default 0.5)
- `face_denoise`: Denoising strength for faces (0-1, default 0.3)
- `face_steps`: Sampling steps for face enhancement (default: 8)
- `face_dilation`: Bbox dilation for better coverage (default: 10)
- `face_crop_factor`: Crop factor around detected face (default: 1.5)

### Advanced Options
- `sam_threshold`: SAM segmentation threshold (0-1, default 0.93)
- `sam_dilation`: SAM mask dilation (default: 0)
- `feather`: Edge feathering for smooth blending (default: 20)
- `noise_mask`: Apply noise only to masked area (default: true)

## Workflow Advantages

### Superior Face Detection
- **YOLOv11 vs YOLOv8**: More recent model with improved accuracy
- **Better edge cases**: Handles partial faces and profiles better
- **Higher precision**: Reduces false positives and missed detections

### Quality Improvements
- **Multi-stage approach**: Each stage focuses on specific enhancements
- **Efficient sampling**: Uses KSampler (Efficient) for optimized processing
- **Smart masking**: SAM provides precise segmentation for targeted improvements
- **Seamless blending**: Advanced feathering and noise masking for natural results

## Differences from sdxl_face_detail_upscaler

| Feature | sdxl_authentic_portraits | sdxl_face_detail_upscaler |
|---------|--------------------------|---------------------------|
| Detection Model | YOLOv11 (newer) | YOLOv8 |
| Processing Stages | 3 (Base→Hires→Face) | 2 (Base→Face/Eye) |
| Hires Stage | Dedicated refinement | Combined with upscaling |
| Eye Enhancement | Optional via face stage | Separate eye detection |
| LoRA Support | Via checkpoint loader | Multiple LoRA stack |
| Film Grain | Not included | Post-processing option |
| Digital Effects | Not included | Post-processing option |

## Use Cases
- **Portrait Photography**: Professional headshots and portraits
- **Character Art**: Detailed character renders with realistic faces
- **Fashion Photography**: High-quality fashion shots with face focus
- **Digital Humans**: Creating realistic digital human faces

## Performance Notes
- The three-stage approach increases processing time but significantly improves quality
- YOLOv11 detection is more compute-intensive but provides better accuracy
- Hires stage can be disabled for faster processing when not needed
- Face enhancement can be toggled based on image content

## Recommended Settings

### High Quality Portrait
```javascript
{
  prompt: "professional portrait photography...",
  width: 832,
  height: 1216,
  steps: 8,
  cfg_scale: 1.5,
  hires_enabled: true,
  hires_scale_percent: 50,
  face_enhancement_enabled: true,
  face_resolution: 1024,
  face_denoise: 0.3
}
```

### Fast Preview
```javascript
{
  prompt: "portrait...",
  width: 768,
  height: 1024,
  steps: 6,
  hires_enabled: false,
  face_enhancement_enabled: true,
  face_resolution: 768,
  face_denoise: 0.2
}
```