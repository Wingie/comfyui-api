# Zen Meditation Music Workflows

ACE-Step 1.5 workflows for generating meditation and relaxation music.

## Workflows

### music-for-mood

**Endpoint:** `POST /workflows/zen/music-for-mood`

Generates meditation music based on emotional state and stress level.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mood` | enum | required | Meditation intention: `calm`, `anxious`, `stressed`, `tired`, `energized` |
| `stress_level` | int (1-10) | required | User stress level, affects intensity |
| `duration` | int (5-60) | required | Music duration in minutes |
| `style` | enum | `ambient` | Music style: `ambient`, `nature`, `binaural`, `silence` |
| `tempo` | enum | `slow` | Music pace: `slow`, `medium`, `upbeat` |
| `seed` | int | random | Random seed for reproducibility |
| `steps` | int (1-50) | 20 | Sampling steps (higher = better quality) |
| `cfg_scale` | float (1-20) | 7.0 | Prompt adherence strength |
| `sampler_name` | string | `euler` | Sampler algorithm |
| `scheduler` | string | `normal` | Sampling scheduler |
| `denoise` | float (0.1-1.0) | 1.0 | Denoising strength |

**Example Request:**

```bash
curl -X POST http://localhost:3000/workflows/zen/music-for-mood \
  -H "Content-Type: application/json" \
  -d '{
    "mood": "calm",
    "stress_level": 5,
    "duration": 10,
    "style": "ambient",
    "tempo": "slow"
  }'
```

**Example Response:**

```json
{
  "status": "success",
  "outputs": {
    "audio": ["/opt/ComfyUI/output/meditation_calm_5_00001.mp3"]
  },
  "metadata": {
    "duration": 600,
    "mood": "calm",
    "style": "ambient"
  }
}
```

## Model Requirements

### ACE-Step 1.5 Turbo (All-in-One)

**File:** `ace_step_1.5_turbo_aio.safetensors`
**Size:** ~3.5GB
**Download:** [Hugging Face - ACE-Step 1.5](https://huggingface.co/Comfy-Org/ACE-Step_ComfyUI_repackaged)
**Location:** `ComfyUI/models/checkpoints/`

**Installation:**

```bash
cd /opt/ComfyUI/models/checkpoints
wget https://huggingface.co/Comfy-Org/ACE-Step_ComfyUI_repackaged/resolve/main/ace_step_1.5_turbo_aio.safetensors
```

## ComfyUI Native Support

ACE-Step 1.5 uses **native ComfyUI nodes only** - no custom nodes required:

- `CheckpointLoaderSimple` - Load ACE-Step model
- `EmptyAceStepLatentAudio` - Create latent audio tensor
- `CLIPTextEncode` - Encode text prompts
- `KSampler` - Generate audio from latent
- `VAEDecode` - Decode latent to audio
- `SaveAudio` - Save audio file

## Meditation Use Cases

### Calm / Relaxation
```json
{"mood": "calm", "stress_level": 3, "style": "ambient", "tempo": "slow"}
```
**Output:** Peaceful ambient soundscape, gentle textures, deep relaxation

### Anxiety Relief
```json
{"mood": "anxious", "stress_level": 8, "style": "binaural", "tempo": "slow"}
```
**Output:** Binaural beats for anxiety, grounding frequencies, theta waves

### Stress Relief
```json
{"mood": "stressed", "stress_level": 9, "style": "nature", "tempo": "medium"}
```
**Output:** Nature sounds, forest ambiance, tension release

### Sleep / Bedtime
```json
{"mood": "tired", "stress_level": 6, "style": "silence", "tempo": "slow"}
```
**Output:** Minimal music, sparse notes, sleep-inducing frequencies

### Focus / Energy
```json
{"mood": "energized", "stress_level": 4, "style": "ambient", "tempo": "upbeat"}
```
**Output:** Uplifting ambient, energizing rhythm, focus enhancement

## Performance

**ACE-Step 1.5 Generation Times:**

- RTX 5090: ~1 second for 4-minute song
- RTX 4090: ~2 seconds for 4-minute song
- RTX 3090: ~10 seconds for 4-minute song
- CPU (AMD Ryzen): ~2 minutes for 4-minute song

**Quality Metrics:**

- Musical Coherence: 4.72/5.0
- Prompt Adherence: 4.65/5.0
- Overall Quality: Exceeds most commercial alternatives

## Integration with FlowState

This workflow is called by Django Celery task `generate_meditation_music_test`:

```python
from agentosaurus.tasks import generate_meditation_music_test

result = generate_meditation_music_test.delay(
    mood='calm',
    stress_level=5,
    duration=10,
    style='ambient',
    tempo='slow'
)

audio_url = result.get(timeout=300)['audio_url']
```

## Future Workflows (Roadmap)

### P1 - Music Enhancement
- `music-cover.ts` - Generate cover versions of meditation music
- `music-edit.ts` - Edit and remix existing meditation tracks

### P2 - Voice Integration
- `voice-to-music.ts` - Generate music from voice prompts
- `music-with-lyrics.ts` - Add guided meditation narration

## References

- [ACE-Step 1.5 ComfyUI Guide](https://docs.comfy.org/tutorials/audio/ace-step/ace-step-v1-5)
- [ACE-Step GitHub Repository](https://github.com/ace-step/ACE-Step-1.5)
- [ComfyUI Wiki - ACE-Step Tutorial](https://comfyui-wiki.com/en/tutorial/advanced/audio/ace-step/ace-step-v1)
- [ACE-Step Hugging Face](https://huggingface.co/Comfy-Org/ACE-Step_ComfyUI_repackaged)

## License

ACE-Step 1.5 model is open-source under Apache 2.0 License.
