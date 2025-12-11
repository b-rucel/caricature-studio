
# Caricature Studio

AI-powered caricature generation using Cloudflare Workers and FLUX.1 image generation.

## Cloudflare Workers AI - Free Tier Limits

This project uses **Cloudflare Workers AI** with the **flux-1-schnell** model for image generation. Here's what you need to know about free tier usage:

### Daily Limits

- **10,000 neurons per day** (free, resets daily at 00:00 UTC)
- **No cost** within this limit
- No credit card required

### Image Generation Capacity

With your current configuration (1024×1024 resolution, 4 steps):

| Metric | Value |
|--------|-------|
| **Neurons per image** | ~57.6 neurons |
| **Maximum images/day** | ~173 images |
| **Your target** | 30 images/day |
| **Available headroom** | 5.8× your needs |

**✓ You can easily handle 30+ images per day on free tier**

### Cost Breakdown

- **Resolution**: 1024×1024 = 4 tiles × 4.80 neurons = 19.2 neurons
- **Steps**: 4 steps × 9.60 neurons = 38.4 neurons
- **Total per image**: 57.6 neurons

### Rate Limits

Text-to-image requests have a **720 requests/minute** limit:
- ~43,200 requests/day maximum
- You'll hit the neuron limit long before hitting rate limits

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
