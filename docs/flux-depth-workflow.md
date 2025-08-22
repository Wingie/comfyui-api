# Flux Depth Workflow Documentation

## Overview
This workflow uses the Flux model with depth-based conditioning to generate images. It leverages InstructPix2Pix conditioning to maintain structural consistency with an input image while applying text-based transformations.

## Workflow Details

### flux_depth
**Location**: `/src/workflows/flux/flux_depth.ts`

**Description**: Generate images using Flux with depth-based conditioning from an input image. This workflow is ideal for maintaining the structure and depth information of a reference image while applying stylistic changes through text prompts.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `image` | string | Yes | - | Input image for depth-based generation (URL or base64) |
| `prompt` | string | Yes | - | The positive prompt for image generation |
| `guidance` | number | No | 30 | Flux guidance strength (0-100) |
| `seed` | number | No | Random | Seed for random number generation |
| `steps` | number | No | 20 | Number of sampling steps (1-100) |
| `cfg` | number | No | 1 | Classifier-free guidance scale (0-20) |
| `sampler_name` | string | No | "euler" | Name of the sampler to use |
| `scheduler` | string | No | "simple" | Type of scheduler to use |
| `denoise` | number | No | 1 | Denoising strength (0-1) |
| `width` | number | No | 1024 | Width of generated image (256-2048) |
| `height` | number | No | 1024 | Height of generated image (256-2048) |
| `unet_name` | string | No | "flux1-dev.safetensors" | UNET model name |
| `clip_name1` | string | No | "clip_l.safetensors" | First CLIP model name |
| `clip_name2` | string | No | "t5xxl_fp8_e4m3fn.safetensors" | Second CLIP model name |
| `vae_name` | string | No | "ae.safetensors" | VAE model name |
| `lora_name` | string | No | - | Optional LoRA model name |
| `lora_strength` | number | No | 1 | LoRA model strength (0-2) |

## Required Models

### Base Models
1. **UNET Model**: `flux1-dev.safetensors`
   - Download from: https://huggingface.co/black-forest-labs/FLUX.1-dev
   - Place in: `models/unet/`

2. **CLIP Models**:
   - `clip_l.safetensors`: CLIP-L model
   - `t5xxl_fp8_e4m3fn.safetensors`: T5-XXL model (FP8 quantized)
   - Place in: `models/clip/`

3. **VAE Model**: `ae.safetensors`
   - Flux autoencoder model
   - Place in: `models/vae/`

## Custom Nodes Required

### Core Custom Nodes

1. **DualCLIPLoader**: Loads both CLIP models for Flux
   - Built into ComfyUI for Flux support

2. **ModelSamplingFlux**: Flux-specific model sampling
   - Built into ComfyUI for Flux support

3. **FluxGuidance**: Applies guidance conditioning for Flux
   - Built into ComfyUI for Flux support

4. **InstructPixToPixConditioning**: Provides depth-based conditioning
   ```bash
   cd custom_nodes
   git clone https://github.com/comfyanonymous/ComfyUI_InstantID
   ```

## Usage Example

```typescript
// Example: Transform an image while preserving its structure
const response = await fetch('http://localhost:3000/workflows/flux/flux_depth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: {
      image: "base64_encoded_image_or_url",
      prompt: "a cyberpunk cityscape at night with neon lights",
      guidance: 30,
      steps: 20,
      width: 1024,
      height: 1024
    }
  })
});

const result = await response.json();
```

## Use Cases

1. **Style Transfer**: Maintain the composition of an image while changing its style
2. **Scene Transformation**: Convert day scenes to night, summer to winter, etc.
3. **Artistic Interpretation**: Transform photos into paintings while preserving structure
4. **Architectural Visualization**: Apply different materials or lighting to existing structures

## Advanced Features

### LoRA Support
The workflow supports LoRA models for fine-tuned control:
```typescript
{
  input: {
    image: "input_image",
    prompt: "your prompt",
    lora_name: "your_lora_model.safetensors",
    lora_strength: 0.8
  }
}
```

### Guidance Control
The `guidance` parameter controls how strongly Flux follows the prompt:
- Lower values (0-10): More freedom in interpretation
- Medium values (10-30): Balanced control
- Higher values (30-100): Stricter adherence to prompt

## Performance Optimization

1. **Model Quantization**: The T5-XXL model uses FP8 quantization for reduced memory usage
2. **Resolution**: Default 1024x1024 provides good balance of quality and speed
3. **Steps**: 20 steps is usually sufficient; increase for higher quality

## Troubleshooting

### Common Issues

1. **Out of Memory Errors**:
   - Reduce image resolution
   - Use quantized models
   - Decrease batch size to 1

2. **Poor Structure Preservation**:
   - Adjust the guidance parameter
   - Ensure input image has clear depth information
   - Try different denoise values (0.7-0.9)

3. **Model Loading Errors**:
   - Verify all model files are in correct directories
   - Check file permissions
   - Ensure models are fully downloaded

## Model Sources

### Official Flux Models
- Repository: https://huggingface.co/black-forest-labs/FLUX.1-dev
- License: FLUX.1 [dev] Non-Commercial License

### Alternative Sources
- Quantized models: https://huggingface.co/city96
- Community LoRAs: https://civitai.com/models?query=flux

## Notes

- This workflow excels at maintaining spatial relationships from the input image
- The InstructPix2Pix conditioning helps preserve depth and structure
- For pure text-to-image generation without depth conditioning, use the standard Flux workflow instead