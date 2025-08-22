# ComfyUI Workflow Migration Report

## Executive Summary
Successfully analyzed and converted ComfyUI JSON workflows from `/backend/remote_servers/claude-qwen/workflow_templates` to TypeScript API managers in `/backend/comfyui-api`. The migration identified 11 unique workflows with various custom node dependencies and model requirements.

## Workflows Processed

### Successfully Converted (3 workflows)
1. **qwen_base_txt2img** - Qwen Image text-to-image generation
2. **qwen_img_edit** - Qwen Image editing with post-processing
3. **flux_depth** - Flux depth-based image generation

### Pending Conversion (8 workflows)
Due to complexity and custom node requirements:
- `Qwen-potrait.json` - Portrait generation with CLIP vision
- `Qwen Image + WAN 2.2json.json` - Advanced upscaling with face detail
- `image_qwen_image.json` - Qwen image with LoRA support
- `image_qwen_image_distill.json` - Distilled Qwen model workflow
- `InstructPromptWIP2.json` - Interactive prompt workflow with speech
- `WAN-VACE-LoraStack.json` - Video processing with depth maps
- `Make Depth Maps.json` - Depth map generation from video

## Custom Nodes Required

### Critical Dependencies (Most Used)
1. **ComfyUI-QwenImage** - For Qwen-specific text encoding
2. **ComfyUI-CFGNorm** - CFG normalization
3. **ComfyUI-Image-Filters** - Sharpening and film grain effects
4. **ComfyUI-GGUF** - GGUF model loading support
5. **rgthree-comfy** - UI enhancements and utilities

### Video Processing Nodes
- **ComfyUI-VideoHelperSuite** - Video loading and combining
- **ComfyUI-DepthAnythingV2** - Depth map generation
- **ComfyUI-WanVaceNodes** - Video generation

### Advanced Features
- **ComfyUI-Impact-Pack** - Face detailing and execution control
- **ComfyUI-UltimateSDUpscale** - Advanced upscaling
- **ComfyUI-Joy-Caption** - Image captioning
- **ComfyUI-OpenAI** - ChatGPT integration
- **ComfyUI-SpeechRecognition** - Voice input

## Model Dependencies

### Qwen Image Models
- **UNET**: `qwen_image_fp8_e4m3fn.safetensors`
- **CLIP**: `qwen_2.5_vl_7b_fp8_scaled.safetensors`
- **VAE**: `qwen_image_vae.safetensors`
- **Source**: https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI

### Flux Models
- **UNET**: `flux1-dev.safetensors`
- **CLIP**: `clip_l.safetensors`, `t5xxl_fp8_e4m3fn.safetensors`
- **VAE**: `ae.safetensors`
- **Source**: https://huggingface.co/black-forest-labs/FLUX.1-dev

## Installation Instructions

### 1. Install Custom Nodes
```bash
cd /path/to/ComfyUI/custom_nodes

# Essential nodes for converted workflows
git clone https://github.com/Comfy-Org/ComfyUI-QwenImage
git clone https://github.com/comfyanonymous/ComfyUI-CFGNorm
git clone https://github.com/spacepxl/ComfyUI-Image-Filters

# Additional nodes for pending workflows
git clone https://github.com/rgthree/rgthree-comfy
git clone https://github.com/ltdrdata/ComfyUI-Impact-Pack
git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite
git clone https://github.com/cubiq/ComfyUI_essentials
```

### 2. Download Models
```bash
# Qwen models
wget -P models/unet/ https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/qwen_image_fp8_e4m3fn.safetensors
wget -P models/clip/ https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/qwen_2.5_vl_7b_fp8_scaled.safetensors
wget -P models/vae/ https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/qwen_image_vae.safetensors
```

## API Usage Examples

### Text to Image (Qwen)
```bash
curl -X POST http://localhost:3000/workflows/qwen/qwen_base_txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "prompt": "A beautiful landscape",
      "width": 1328,
      "height": 1328
    }
  }'
```

### Image Editing (Qwen)
```bash
curl -X POST http://localhost:3000/workflows/qwen/qwen_img_edit \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "image": "base64_or_url",
      "prompt": "Make it studio quality",
      "sharpening_factor": 0.3
    }
  }'
```

### Depth-Based Generation (Flux)
```bash
curl -X POST http://localhost:3000/workflows/flux/flux_depth \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "image": "base64_or_url",
      "prompt": "cyberpunk style",
      "guidance": 30
    }
  }'
```

## Duplicates Found
None - All workflows provide unique functionality not present in existing example workflows.

## Recommendations

### Immediate Actions
1. Install required custom nodes for converted workflows
2. Download Qwen and Flux models
3. Test converted workflows with sample inputs

### Future Improvements
1. Convert remaining 8 workflows based on priority
2. Implement batch processing for video workflows
3. Add webhook support for long-running workflows
4. Create unified model management system

## Technical Notes

### Workflow Naming Convention
- `qwen_*` - Qwen model based workflows
- `flux_*` - Flux model based workflows
- `*_txt2img` - Text to image generation
- `*_img_edit` - Image editing/enhancement

### Parameter Standardization
All converted workflows follow consistent parameter naming:
- `prompt` - Primary text input
- `negative_prompt` - Negative text conditioning
- `seed` - Random seed
- `steps` - Sampling steps
- `cfg` - CFG scale
- `width`/`height` - Output dimensions

### TypeScript Structure
Each workflow exports:
- `RequestSchema` - Zod schema for validation
- `generateWorkflow` - Function to build ComfyUI prompt
- `summary` - Short description
- `description` - Detailed explanation

## Status Summary

✅ **Completed:**
- Analyzed 11 JSON workflows
- Identified all custom nodes and dependencies
- Converted 3 core workflows to TypeScript
- Created comprehensive documentation
- Verified TypeScript compilation
- Built successfully with npm

⏳ **Pending:**
- Convert remaining 8 complex workflows
- Integration testing with actual ComfyUI instance
- Performance optimization for video workflows

## File Locations

### Converted Workflows
- `/backend/comfyui-api/src/workflows/qwen/qwen_base_txt2img.ts`
- `/backend/comfyui-api/src/workflows/qwen/qwen_img_edit.ts`
- `/backend/comfyui-api/src/workflows/flux/flux_depth.ts`

### Documentation
- `/backend/comfyui-api/docs/qwen-workflows.md`
- `/backend/comfyui-api/docs/flux-depth-workflow.md`
- `/backend/comfyui-api/docs/workflow-migration-report.md`

### Source Workflows
- `/backend/remote_servers/claude-qwen/workflow_templates/*.json`
- `/backend/remote_servers/claude-qwen/workflow_templates/Slice Workflows/*.json`

## Contact & Support
For questions about specific workflows or custom node requirements, refer to the individual workflow documentation files or the ComfyUI community resources.