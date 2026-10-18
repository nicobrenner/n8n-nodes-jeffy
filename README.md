# n8n-nodes-jeffy

n8n community node for [Jeffy](https://jeffyclassify.com) — fast text classification powered by frozen embeddings + logistic regression

Classify text in your n8n workflows using 15+ pretrained classifiers (banking intents, sentiment, news topics, emotions, and more) or connect to your own Jeffy server with custom tasks

## Installation

In your n8n instance:

1. Go to **Settings → Community Nodes**
2. Enter `n8n-nodes-jeffy`
3. Click Install

Or install manually:

```bash
npm install n8n-nodes-jeffy
```

## Operations

| Operation | Description |
|---|---|
| **Classify** | Classify a single text input using any pretrained task |
| **Batch Classify** | Classify multiple texts in one request |
| **List Capabilities** | List all available classification tasks on the server |
| **Health Check** | Check if the Jeffy server is running |

## Setup

1. Add a Jeffy node to your workflow
2. Create credentials with your Jeffy server URL (defaults to the public playground at `playground.jeffyclassify.com`)
3. Pick a task from the dynamic dropdown — it fetches available classifiers from your server
4. Pass in text and get back a label + confidence score

## Example: Customer support routing

Connect a webhook or email trigger → Jeffy (task: `banking77`) → route to different teams based on the classification label

**Input:** "I need to cancel my credit card"
**Output:**
```json
{
  "label": "cancel_transfer",
  "confidence": 0.94,
  "latency_ms": 12.3
}
```

## Available pretrained tasks

The public playground includes classifiers for:

- **banking77** — 77 banking intent classes
- **sst2** — binary sentiment (positive/negative)
- **ag_news** — news topic classification (4 classes)
- **emotion** — emotion detection (6 classes)
- **sms_spam** — spam detection (2 classes)
- **clinc_oos** — intent with out-of-scope detection (151 classes)
- **inbox_router** — email routing (work/family/promo/notification)
- And more — use List Capabilities to see all available tasks

## Self-hosting

Jeffy runs anywhere with Python and a CPU — no GPU needed

```bash
pip install jeffy-classifier
jeffy-serve
```

Then point the n8n credential Base URL to your server

## Links

- [Jeffy](https://jeffyclassify.com)
- [Playground](https://playground.jeffyclassify.com)
- [GitHub](https://github.com/nicobrenner/jeffy)

## License

MIT
