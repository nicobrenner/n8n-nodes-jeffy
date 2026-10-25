# n8n-nodes-jeffy

n8n community node for [Jeffy](https://jeffyclassify.com): fast text classification powered by frozen embeddings + logistic regression

Classify text in your n8n workflows using 70+ pretrained classifiers (support tickets, banking intents, sentiment, news topics, emotions, and more) or connect to your own Jeffy server with custom tasks

![Workflow demo: Webhook → Jeffy → Switch routing](https://raw.githubusercontent.com/nicobrenner/n8n-nodes-jeffy/main/workflow_demo.gif)

## Installation

### Self-hosted n8n

1. Go to **Settings → Community Nodes**
2. Enter `n8n-nodes-jeffy`
3. Click Install

Or install manually:

```bash
npm install n8n-nodes-jeffy
```

### n8n Cloud

n8n Cloud only allows installing *verified* community nodes, so this node cannot be installed there yet. Use an **HTTP Request** node pointed at Jeffy instead, which works identically:

- Method: `POST`
- URL: `https://playground.jeffyclassify.com/v1/predict` (or your own server)
- Body (JSON): `{ "text": "{{ $json.message }}", "task": "banking77" }`

The response has `label`, `confidence`, `margin` and `probabilities`, so you can branch on it with a Switch or IF node exactly as with the node. See [examples/cloud-http-router.json](examples/cloud-http-router.json) for an importable workflow with confidence-tier routing (auto-route, suggest-and-confirm, manual review) plus out-of-scope handling.

Run `GET /v1/capabilities` against whichever server you point at to see which tasks it has loaded. The public playground carries the core set; `support_ticket` and other newer tasks need a self-hosted server on jeffy-classify 0.1.0a16 or later.

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
3. Pick a task from the dynamic dropdown, it fetches available classifiers from your server
4. Pass in text and get back a label + confidence score

## Authentication

The Jeffy node uses a single **Jeffy API** credential with one field, the base URL of your Jeffy server. It defaults to `https://playground.jeffyclassify.com`, a free public instance that needs no API key or signup.

Jeffy itself requires no authentication, so there is no token to manage. If you self-host behind a reverse proxy that adds auth, point the credential at that proxy.

## Example: Customer support routing

Connect a webhook or email trigger → Jeffy (task: `banking77`) → route to different teams based on the classification label

**Input:** "I was charged twice for my last transaction"

**Output:**
```json
{
  "label": "transaction_charged_twice",
  "confidence": 0.9963,
  "margin": 0.995,
  "out_of_scope": false
}
```

Use `confidence` and `margin` (the gap between the top two classes) to decide when to auto-route and when to send something for human review. Not every message scores this high: ambiguous ones land between 0.3 and 0.6, which is the signal to escalate rather than auto-route.

## Example workflows

Two importable workflows are in [`examples/`](examples/). They are the same workflow twice, differing only in how they call Jeffy:

| File | Needs | Works on |
|---|---|---|
| [`customer-support-router.json`](examples/customer-support-router.json) | this community node | self-hosted n8n |
| [`cloud-http-router.json`](examples/cloud-http-router.json) | nothing, plain HTTP Request nodes | n8n Cloud and self-hosted |

Both start from a Manual Trigger with sample messages, so you can import and run them straight away with no credentials beyond the server URL. Both route on confidence rather than on label alone, into four branches:

| Tier | Condition | Example message | Result |
|---|---|---|---|
| Auto-route | confidence ≥ 0.8 and margin ≥ 0.15 | "I was charged twice for my last transaction" | `transaction_charged_twice` 0.9963 |
| Suggest and confirm | confidence ≥ 0.5 | "it is broken again" | `card_not_working` 0.6721 |
| Manual review | below 0.5, still in scope | "What currencies does the app support?" | `supported_cards_and_currencies` 0.4055, margin 0.0969 |
| Out of scope | below the request threshold | "I would like to apply for a job at your company" | `out_of_scope`, closest intent `country_support` |

Those numbers come from running both workflows against the public playground, and the two produce identical routing, so you can prototype on Cloud with HTTP Request and switch to the node later without touching the logic downstream.

One gotcha if you adapt them: keep the request `threshold` *below* your suggest-and-confirm cutoff. Set them equal and the server marks everything under the cutoff `out_of_scope`, which makes the manual-review branch unreachable.

## Available pretrained tasks

The public playground includes classifiers for:

- **banking77**: 77 banking intent classes
- **sst2**: binary sentiment (positive/negative)
- **ag_news**: news topic classification (4 classes)
- **emotion**: emotion detection (6 classes)
- **sms_spam**: spam detection (2 classes)
- **clinc_oos**: intent with out-of-scope detection (151 classes)
- **inbox_router**: email routing (work/family/promo/notification)
- And more, use List Capabilities to see all available tasks

## Self-hosting

Jeffy runs anywhere with Python and a CPU, no GPU needed

```bash
pip install jeffy-classify
jeffy-serve
```

Then point the n8n credential Base URL to your server

## Links

- [Jeffy](https://jeffyclassify.com)
- [Playground](https://playground.jeffyclassify.com)
- [GitHub](https://github.com/nicobrenner/jeffy)

## License

MIT
