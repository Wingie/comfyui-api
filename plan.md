# ComfyUI-API GPU Orchestration & Workflow Management Plan

## Build & Release System

**Build Process:**
1. `npm run build-binary` → TypeScript compilation + binary packaging
2. Uses `@yao-pkg/pkg` to create standalone Linux x64 binary 
3. `build-and-release` script creates GitHub releases with binaries

**Binary Output:** Self-contained `comfyui-api` executable (no Node.js needed on GPU server)

## Workflow Creation & Management

### How Workflows Work:
1. **JSON Workflow** (ComfyUI export) → **`generate-workflow`** script → **TypeScript Workflow** 
2. TypeScript workflows use **Zod validation** for type-safe API parameters
3. **Dynamic loading**: `/src/workflows/index.ts` auto-discovers `.ts` files at runtime
4. **API Endpoints**: Each workflow becomes a REST endpoint with auto-generated docs

### Workflow Development Process:
1. **Manual ComfyUI Development**: Create workflows directly in ComfyUI web interface on GPU instance
2. **Export JSON**: Save/download workflow JSON from ComfyUI interface  
3. **Generate TypeScript**: `./generate-workflow workflow.json output.ts` (modified to use OpenRouter)
4. **Deploy**: Copy `.ts` file to `/example-workflows/` and rebuild binary

### Modified generate-workflow Script:
- **Change API endpoint**: Claude API → OpenRouter API  
- **Use existing token**: Reuse OpenRouter setup from llm_enhancer.py
- **Same prompt**: Keep existing `claude-endpoint-creation-prompt.md`

### Example Workflow Structure:
```typescript
const workflow: Workflow = {
  RequestSchema: z.object({...}),     // Zod validation
  generateWorkflow: (input) => {...}, // JSON generation function
  summary: "Text to Image",           // API docs
  description: "Generate image..."     // API docs
};
```

## PyInfra Conversion Plan

### Target: `/Users/wingston/code/FlowState/backend/comfyui-api/`

**New Files:**
```
deploy/
├── plan.md                 # This document
├── lambda_deploy.py        # Convert lambda_qwen_docker.sh (initial setup only)
├── datacrunch_deploy.py    # Convert datacrunch_docker.sh (initial setup only)
├── common.py              # ALL maintenance commands (provider-agnostic)
├── inventory.py           # IP + provider management
└── pyproject.toml         # PyInfra dependencies
```

### Conversion Strategy:
1. **Direct 1:1 Translation**: Keep all bash logic in pyinfra operations dont make new fallbacks or creative adjustments here, the script files work! so we dont want to break ops (small differences also in datacrunch and lambda but lot of things common)
2. **Remote Execution**: `pyinfra <IP> deploy/lambda_deploy.py`: nice
3. **Binary Deployment**: Upload pre-built `comfyui-api` binary to GPU servers: also a way to update build existing seervers? via - 
4. **Workflow Sync**: Deploy new workflows to running GPU instances

### Workflow Deployment Process:
1. **ComfyUI Development**: Design workflows in ComfyUI web interface on GPU (i will download to workflow_tempplate folder )
2. **Export & Convert**: Download JSON → OpenRouter generate-workflow → TypeScript
3. **Build Binary**: `npm run build-binary` (includes all workflows)
4. **Deploy**: `pyinfra <GPU_IP> deploy/update_workflows.py`
5. **Auto-reload**: ComfyUI-API restarts with new workflows

## 3-Tier Maintenance System

### All Maintenance Commands in common.py

**Tier 1: ComfyUI-API Binary Management**
```bash
# Update TypeScript workflows and ComfyUI-API wrapper (provider-agnostic)
pyinfra <GPU_IP> deploy/common.py --update-binary
pyinfra <GPU_IP> deploy/common.py --restart-api-only
pyinfra <GPU_IP> deploy/common.py --verify-endpoints
```

**Tier 2: ComfyUI Core Management**  
```bash
# ComfyUI itself, custom nodes, ComfyUI-Manager operations (provider-agnostic)
pyinfra <GPU_IP> deploy/common.py --install-nodes workflow.json
pyinfra <GPU_IP> deploy/common.py --update-comfyui-core
pyinfra <GPU_IP> deploy/common.py --restart-comfyui
pyinfra <GPU_IP> deploy/common.py --list-installed-nodes
```

**Tier 3: Model Management**
```bash
# Model downloads, organization, storage management (provider-agnostic)
pyinfra <GPU_IP> deploy/common.py --download-models workflow.json
pyinfra <GPU_IP> deploy/common.py --organize-models
pyinfra <GPU_IP> deploy/common.py --cleanup-models
pyinfra <GPU_IP> deploy/common.py --storage-report
```

**Provider-Specific Commands Only For Initial Setup**:
```bash
# Initial deployment only (provider-specific differences)
pyinfra <IP> deploy/lambda_deploy.py     # Lambda Labs: /home/ubuntu, no block volumes
pyinfra <IP> deploy/datacrunch_deploy.py # DataCrunch: /home/user, block volume mounting
```

## Complete Command Reference

### Tier 1: ComfyUI-API Binary Management

**`pyinfra <IP> deploy/common.py --deploy-all`**
- updates ComfyUI and pulls all custom nodes 
- updates workflows for comyui-api

**`pyinfra <IP> deploy/common.py --restart`**
- restart all services

### Tier 2: ComfyUI Core Management

**`pyinfra <IP> deploy/common.py --install-missing`**
- Parse all workflow in worflows folder JSON to extract required custom nodes and models
- Docker exec into ComfyUI container
- Call ComfyUI-Manager API: `POST /manager/install_missing`
- Git clone missing node repositories to `/custom_nodes/`
- Run `pip install -r requirements.txt` for each new node
- Restart ComfyUI container to load new nodes

**`pyinfra <IP> deploy/common.py --update <arg>`**
- Git pull latest <arg>> updates inside container
- Update ComfyUI-Manager to latest version
- Backup existing installation before update
- Restart ComfyUI container with updated core

**`pyinfra <IP> deploy/common.py --restart <arg>`**
- Stop <arg> gracefully
- Restart container with same volumes/configs
- Wait for <arg>> to be available at `http://<IP>:<ehrrverr>`
- Verify API endpoints respond correctly


### Tier 3: Model Management

**`pyinfra <IP> deploy/common.py --download-models`**
- Parse all workflow JSONs to extract model requirements
- generate URLS with tokens locally then initate download remotely
- Download missing models from HuggingFace/CivitAI
- Place models in correct subdirectories:
  - Checkpoints → `/models/checkpoints/`
  - LoRAs → `/models/loras/`
  - VAEs → `/models/vae/`
  - ControlNets → `/models/controlnet/`

### Initial Deployment Commands

**`pyinfra <IP> deploy/lambda_deploy.py`**
- Install Docker + nvidia-container-toolkit
- Setup `/home/ubuntu/ComfyUI/` directory structure
- Download and setup ComfyUI base installation
- Create start-qwen script for Lambda Labs environment
- Deploy ComfyUI-API binary and start services

**`pyinfra <IP> deploy/datacrunch_deploy.py`**
- Install Docker + nvidia-container-toolkit
- Mount and format block volume storage
- Setup `/home/user/ComfyUI/` directory on block volume
- Download and setup ComfyUI base installation
- Create start-qwen script for DataCrunch environment
- Deploy ComfyUI-API binary and start services

### Utility Commands

**`pyinfra <IP> deploy/common.py --status`**
- Show status of all Docker containers
- Report API endpoint availability
- Display disk usage and system resources
- List running processes and memory usage

**`pyinfra <IP> deploy/common.py --logs`**
- Tail ComfyUI container logs
- Show ComfyUI-API service logs
- Display recent error messages
- Export logs for debugging

### Docker Integration Points
**All maintenance operations work with running Docker containers**:
- **ComfyUI Container**: `/models/` and `/custom_nodes/` volumes mounted
- **ComfyUI-API Container**: Binary updates via volume mount
- **start-qwen Command**: Maintains container orchestration
- **Persistent Storage**: Models and nodes survive container restarts

## CORRECTED IMPLEMENTATION PLAN - CRITICAL UPDATES

### Current Status ✅
- **3 workflows converted**: `qwen_base_txt2img`, `qwen_img_edit`, `flux_depth` in `/src/workflows/`
- **Build system working**: `npm run build-binary` creates standalone executable 
- **Auto-discovery**: Workflows auto-loaded by `/src/workflows/index.ts`
- **MISSING**: Binary deployment to GPU instances!

### CRITICAL FIX: Binary Deployment Missing from Original Plan

**Problem Identified**: 
- Bash scripts deploy ComfyUI containers but NOT the ComfyUI-API wrapper binary
- Our converted workflows exist in the binary but never reach the GPU instances
- No REST API endpoints exposed for our workflows

**Solution**: Enhanced PyInfra deployment with binary management

### Implementation Steps - CORRECTED PRIORITY

#### Phase 1: Complete Binary Deployment Pipeline (IMMEDIATE)

**Step 1: Build Binary with Workflows**
```bash
cd /Users/wingston/code/FlowState/backend/comfyui-api
npm run build-binary  # Creates bin/comfyui-api with our 3 workflows
```

**Step 2: Enhanced Common Operations (common.py)**
```python
@deploy.pyinfra 
def update_binary():
    # Upload binary with embedded workflows
    files.put(
        src="./bin/comfyui-api",
        dest="/home/user/comfyui-api", 
        mode="755"
    )
    
    # Restart API service
    systemd.service(
        name="comfyui-api-wrapper",
        running=True,
        restarted=True
    )

def verify_workflows():
    # Test all workflow endpoints
    server.shell(command="curl -f http://localhost:3000/qwen/qwen_base_txt2img")
    server.shell(command="curl -f http://localhost:3000/qwen/qwen_img_edit") 
    server.shell(command="curl -f http://localhost:3000/flux/flux_depth")
```

**Step 3: Update Docker Compositions**
Both `lambda_deploy.py` and `datacrunch_deploy.py` need:
```yaml
services:
  comfyui:
    image: ghcr.io/saladtechnologies/comfyui-api:latest
    ports: ["8188:8188"]
    # ... existing config
    
  comfyui-api-wrapper:  # NEW SERVICE
    build:
      context: .
      dockerfile: Dockerfile.binary
    volumes:
      - "./comfyui-api:/usr/local/bin/comfyui-api:ro"
    ports: ["3000:3000"]
    command: ["/usr/local/bin/comfyui-api", "--comfyui-url", "http://comfyui:8188"]
    depends_on: [comfyui]
```

#### Phase 2: Test Complete Pipeline (HIGH PRIORITY)

**End-to-End Workflow Test**:
1. **Local**: `npm run build-binary` 
2. **Deploy**: `pyinfra <GPU_IP> deploy/lambda_deploy.py`
3. **Update**: `pyinfra <GPU_IP> deploy/common.py --update-binary`
4. **Test**: `curl -X POST http://<GPU_IP>:3000/qwen/qwen_base_txt2img -d '{"prompt":"test"}'`

**Expected Results**:
- ComfyUI Web UI: `http://<GPU_IP>:8188` 
- **OUR WORKFLOWS**: `http://<GPU_IP>:3000/qwen/qwen_base_txt2img`
- API Documentation: `http://<GPU_IP>:3000/docs`
- Health Check: `http://<GPU_IP>:3000/health`

#### Phase 3: Dependency Integration (MEDIUM)

**Automatic Dependency Installation**:
```python
def install_workflow_dependencies():
    # Parse workflow metadata for required custom nodes
    required_nodes = extract_custom_nodes_from_workflows()
    
    # Install via ComfyUI-Manager API
    for node in required_nodes:
        server.shell(command=f'docker exec comfyui python -m manager install {node}')
    
    # Download required models
    download_qwen_models()  # From existing bash scripts
```

### Updated Command Reference

**Primary Commands (CORRECTED)**:
```bash
# Build locally with workflows
npm run build-binary

# Initial deployment (includes binary)
pyinfra <IP> deploy/lambda_deploy.py

# Update workflows (rebuild + redeploy binary)
pyinfra <IP> deploy/common.py --update-binary

# Install dependencies for workflows  
pyinfra <IP> deploy/common.py --install-missing

# Test all workflow endpoints
pyinfra <IP> deploy/common.py --verify-endpoints

# Full status report
pyinfra <IP> deploy/common.py --status
```

**Success Criteria (UPDATED)**:
- ✅ Binary builds with 3 workflows 
- 🔄 Binary deployed to GPU instances
- 🔄 REST APIs work: `/qwen/qwen_base_txt2img`, `/qwen/qwen_img_edit`, `/flux/flux_depth`
- 🔄 Dependencies auto-install (ComfyUI-QwenImage, etc.)
- 🔄 Models download and organize correctly
- 🔄 End-to-end: Local build → GPU deployment → Working API

**Priority Tasks - CORRECTED:**
1. ✅ Workflow conversion complete (3 workflows) 
2. 🔄 Add binary deployment to PyInfra scripts
3. 🔄 Convert bash scripts with binary deployment support
4. 🔄 Test workflows on GPU instances via REST API
5. 🔄 Implement dependency auto-installation

## Workflow Dependency Management

### Problem: Missing Dependencies on Remote GPU Instances
Many ComfyUI workflows require: [see here and extract dependencies and models to start with](../remote_servers/claude-qwen/workflow_templates)
- **Custom nodes** (extensions) not in base ComfyUI installation
- **Models** (checkpoints, LoRAs, VAEs) not available by default
- **Python packages** required by custom nodes
- Video workflow - https://github.com/MeiGen-AI/InfiniteTalk/tree/comfyui
- plugins are usually git repos to clone to custom_nodes on the remote
- 
### Solution: Automated Dependency Resolution

#### 1. ComfyUI-Manager Integration
**Primary Tool**: ComfyUI-Manager provides automated missing dependency detection
- **API Endpoint**: `/manager/install_missing` - analyzes workflow and installs missing nodes
- **Workflow Analysis**: Scans workflow JSON for unknown `class_type` entries
- **Auto-Installation**: Downloads and installs custom nodes with their requirements.txt
- **Docker Compatibility**: Works in container environments with proper Python environment

#### 2. Dependency Detection Pipeline
```python
# Workflow dependency extraction
def extract_dependencies(workflow_json):
    required_nodes = set()
    required_models = set()
    
    for node_id, node in workflow_json.items():
        # Extract custom node class types
        class_type = node.get('class_type')
        if class_type not in BUILTIN_NODES:
            required_nodes.add(class_type)
            
        # Extract model references
        inputs = node.get('inputs', {})
        for key, value in inputs.items():
            if key.endswith('_name') or key == 'ckpt_name':
                required_models.add(value)
```

#### 3. Automated Installation Strategies

**A. Pre-Deployment Installation (Recommended)**
```python
# In pyinfra deployment scripts
def install_workflow_dependencies(workflow_files):
    for workflow_file in workflow_files:
        # 1. Upload workflow to GPU instance
        # 2. Call ComfyUI-Manager API to analyze dependencies
        # 3. Install missing nodes automatically
        # 4. Download required models from HuggingFace/CivitAI
```

**B. Runtime Installation (Fallback)**
- API wrapper detects missing nodes during workflow execution
- Triggers automatic installation via ComfyUI-Manager
- Retries workflow execution after dependency installation

#### 4. Docker Integration Strategy

**Build-Time Dependencies** (for known workflows):
```dockerfile
# Install common custom nodes during image build
RUN git clone https://github.com/ltdrdata/ComfyUI-Manager.git custom_nodes/ComfyUI-Manager
RUN cd custom_nodes/ComfyUI-Manager && pip install -r requirements.txt

# Install workflow-specific nodes
COPY workflows/ /tmp/workflows/
RUN python scripts/install_workflow_deps.py /tmp/workflows/
```

**Runtime Dependencies** (for new workflows):
- ComfyUI-Manager handles missing node installation
- Persistent volumes preserve installed dependencies
- Model downloads cached in mounted volumes

#### 5. Model Management
**Model Sources & Auto-Download**:
- **HuggingFace**: Direct download via `huggingface_hub`
- **CivitAI**: API-based model discovery and download
- **Custom URLs**: Direct HTTP download with validation

**Model Storage Strategy**:
```bash
# Persistent volume structure on GPU instances
/models/
├── checkpoints/     # Main models
├── loras/          # LoRA weights  
├── vae/            # VAE models
├── upscale_models/ # Super-resolution
└── custom/         # Workflow-specific models
```

#### 6. PyInfra Implementation

**Enhanced Deployment Scripts**:
```python
# deploy/dependency_manager.py
def ensure_workflow_dependencies(workflow_json):
    # 1. Extract required nodes and models
    deps = extract_workflow_dependencies(workflow_json)
    
    # 2. Install missing custom nodes
    install_missing_nodes(deps['nodes'])
    
    # 3. Download required models
    download_missing_models(deps['models'])
    
    # 4. Verify installation success
    validate_workflow_dependencies(workflow_json)
```

**Deployment Process Update**:
1. **Upload Workflows**: Deploy TypeScript workflows to GPU instance
2. **Analyze Dependencies**: Extract required nodes/models from workflow JSON
3. **Install Dependencies**: Use ComfyUI-Manager + model downloaders
4. **Validate Setup**: Test workflow execution before marking deployment complete
5. **Cache Dependencies**: Preserve installed components for future deployments

#### 7. Dependency Metadata

**Enhanced Workflow Files**:
```typescript
// Enhanced workflow with dependency metadata
const workflow: Workflow = {
  RequestSchema,
  generateWorkflow,
  metadata: {
    requiredNodes: ['ComfyUI-AnimateDiff-Evolved', 'ComfyUI-VideoHelperSuite'],
    requiredModels: ['sd_xl_base_1.0.safetensors', 'animatediff_sd15_v2.safetensors'],
    modelSources: {
      'sd_xl_base_1.0.safetensors': 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0',
      'animatediff_sd15_v2.safetensors': 'https://civitai.com/models/108836'
    }
  }
};
```

**Result**: Same working setup as bash scripts + easy workflow deployment + remote management + OpenRouter integration + **automated dependency resolution**