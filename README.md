
# Caricature Studio

AI-powered caricature generation using Cloudflare Workers and FLUX.1 image generation.

## Cloudflare Workers AI - Free Tier Limits

This project uses **Cloudflare Workers AI** with the **flux-1-schnell** model for image generation. Here's what you need to know about free tier usage:

### Daily Free Allocation

- **10,000 neurons per day** (free, resets daily at 00:00 UTC)
- **No cost** within this limit
- No credit card required

### Model Comparison (1024×1024 resolution)

| Model | Steps | Neurons/Image | Images/Day (Free) | Cost/100 Images |
|-------|-------|---------------|-------------------|-----------------|
| **FLUX-1 Schnell** | 4 | 57.6 | 173 | $0.063 |
| **FLUX-1 Schnell** | 2 | 38.4 | 260 | $0.042 |
| **FLUX-1 Schnell** | 1 | 28.8 | 347 | $0.032 |
| **FLUX-2 Dev** | 4 | 900 | 11 | $0.99 |
| **FLUX-2 Dev** | 1 | 225 | 44 | $0.25 |
| **Phoenix 1.0** | 25 | 2,370 | 4 | $2.61 |
| **Phoenix 1.0** | 10 | 1,130 | 8 | $1.24 |
| **SDXL Lightning** | 4 | Free | ∞ | Free |
| **SDXL Base** | 4 | Free | ∞ | Free |

### Detailed Cost Breakdown

#### FLUX-1 Schnell
- **Tile cost**: 1024×1024 = 4 tiles × 4.80 neurons = 19.2 neurons
- **Step cost**: X steps × 9.60 neurons = (X × 9.60) neurons
- **Total**: 19.2 + (X × 9.60) neurons

#### FLUX-2 Dev
- **Input tiles**: 4 tiles × 18.75 neurons/step = 75 neurons/step
- **Output tiles**: 4 tiles × 37.50 neurons/step = 150 neurons/step
- **Total**: 225 × X neurons (where X = steps)
- *Note: More expensive but higher quality; best for critical outputs*

#### Phoenix 1.0
- **Tile cost**: 1024×1024 = 4 tiles × 530 neurons = 2,120 neurons
- **Step cost**: X steps × 10 neurons = (X × 10) neurons
- **Total**: 2,120 + (X × 10) neurons
- *Note: Most expensive but unique artistic style; 25 steps recommended*

#### SDXL Lightning & SDXL Base
- **Cost**: Free (beta models, no neuron limit)
- **Quality**: Excellent for fast iteration and testing
- **Best for**: Development and high-volume generation

### Rate Limits

Text-to-image requests have a **720 requests/minute** limit across all models:
- ~43,200 requests/day maximum
- You'll hit the neuron limit long before hitting rate limits (except with SDXL beta models)

### Optimization Options

If you want even more throughput:

**Reduce steps** (faster generation):
- 2 steps: ~38.4 neurons/image → 260 images/day
- 1 step: ~28.8 neurons/image → 347 images/day

**Reduce resolution** (smaller images):
- 768×768: ~40 neurons/image → 250 images/day
- 512×512: ~28.8 neurons/image → 347 images/day

**Use beta models** (free & unlimited):
- `stable-diffusion-xl-lightning` or `stable-diffusion-xl-base-1.0`
- Don't count toward the 10,000 daily neuron limit
- Completely free for beta period

### Beyond Free Tier

If you exceed 10,000 neurons/day, you'll need to upgrade to the **Workers Paid plan**:
- Charged at **$0.011 per 1,000 neurons** for usage above daily allocation
- You still get 10,000 free neurons/day



## Setup

### Prerequisites

- Cloudflare account with Workers enabled
- Node.js 16+
- Wrangler CLI

### Environment Variables

Create `.env.local` in the `ui/` directory:

```
VITE_WORKER_URL=https://your-worker.your-username.workers.dev
VITE_API_KEY=your-api-key-optional
```

### Deployment

1. **Worker deployment**:
   ```bash
   cd worker
   wrangler deploy
   ```

2. **UI development**:
   ```bash
   cd ui
   npm install
   npm run dev
   ```

3. **UI production build**:
   ```bash
   cd ui
   npm run build
   npm run preview
   ```

## References

- [Cloudflare Workers AI Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Cloudflare Workers AI Limits](https://developers.cloudflare.com/workers-ai/platform/limits/)
- [FLUX.1 Model Documentation](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/)
