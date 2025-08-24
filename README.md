# Creative Automation Pipeline CLI

A CLI tool that automates the generation of creative assets for marketing campaigns using Adobe Firefly Services and Azure OpenAI. This tool generates product images in multiple aspect ratios for social media and advertising campaigns.

## Prerequisites

- **Node.js** (>=22.0.0)
- **npm** (>=10.0.0)
- **Adobe Firefly API Credentials**
  - will be provided to reviewers directly via Email.
  - Get them from [Adobe Developer Console](https://developer.adobe.com/console)
- **Azure OpenAI API Access** - Set up through [Azure Portal](https://portal.azure.com)
  - will be provided to reviewers directly via Email. (throw away keys, protected against overuse)
  - can be obtained via Azure AI Foundry: https://ai.azure.com/

## Installation

### Option 1: Development Setup

1. **Clone the Repository:**

   ```bash
   git clone <repository-url>
   cd creative-automation-pipeline
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment Variables**
   refer to `Environment Configuration` section below
   or simply create a `.env` file in this directory and paste the variables provide via email.

4. **Run directly with TSX:**

   help command:

   ```bash
   npx tsx --env-file=.env index.ts generate -h
   ```

   generate command with exisitng campaign and inputs (in `inputs` folder):

   ```bash
   npx tsx --env-file=.env index.ts generate campaign.yaml -o outputs
   ```

   feel free to adjust the campaign.yaml and input your own assets, be sure to reference them properly

### Option 2: Global Installation (Not Recommended at this time)

> this package does not implement safe handling of credentials.

Once published to npm, you can install globally:

```bash
npm install -g creative-cli
```

## Environment Configuration

> these will be provided to reviewers directly by email

Create a `.env` file in the project root with the following required variables:

```env
# Adobe Firefly API Credentials
FFS_CLIENT_ID="your_adobe_client_id"
FFS_CLIENT_SECRET="your_adobe_client_secret"

# Azure OpenAI Configuration
AZURE_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_API_KEY="your_azure_api_key"
AZURE_API_VERSION="2024-02-15-preview"
AZURE_MODEL_NAME="gpt-4"
AZURE_DEPLOYMENT="your-deployment-name"

# Optional: Logging
LOG_LEVEL="info"
```

### Getting API Credentials

#### Adobe Firefly API

1. Visit [Adobe Developer Console](https://developer.adobe.com/console)
2. Create a new project or select existing one
3. Add Firefly API to your project
4. Generate Client ID and Client Secret
5. Copy the credentials to your `.env` file

#### Azure OpenAI

1. Go to [Azure Portal](https://portal.azure.com)
2. Create an Azure OpenAI resource
3. Deploy a GPT-4 model
4. Get the endpoint URL, API key, and deployment name
5. Add them to your `.env` file

## Usage

### Command Structure

```bash
npx tsx --env-file=.env index.ts generate <campaign-brief-yaml> [options]
```

### Arguments

- `<campaign-brief-yaml>`: Path to your campaign brief YAML file (required)

### Options

- `-i, --input <dir>`: Input assets directory (default: "inputs")
- `-o, --output <dir>`: Output directory for generated assets (default: "outputs")
- `-r, --aspect-ratios <ratios>`: Comma-separated aspect ratios (default: "1:1,16:9")
- `-l, --log-level <level>`: Log level: error, warning, info, debug (default: "info")

### Supported Aspect Ratios

- `1:1` - Square (Instagram posts)
- `16:9` - Landscape (YouTube thumbnails, Facebook ads)
- `9:16` - Portrait (Instagram stories, TikTok)
- `4:3` - Traditional (Facebook posts)
- `3:4` - Portrait (Pinterest)
- `7:4` - Wide landscape
- `9:7` - Slightly wide
- `7:9` - Slightly tall

### Examples

#### Basic Usage (Global Installation)

```bash
npx tsx --env-file=.env index.ts generate campaign.yaml
```

#### With Custom Options

```bash
npx tsx --env-file=.env index.ts generate campaign.yaml \
  --output ./generated-assets \
  --aspect-ratios "1:1,16:9,9:16" \
  --log-level debug
```

## Campaign Brief Format

Create a YAML file describing your campaign:

```yaml
name: "Eco-Friendly-Campaign"
products:
  - name: "Eco-Friendly Energy Drink Can"
    description: "A vibrant, modern energy drink can with bold graphics, dynamic colors, and a sleek, eco-friendly design that conveys energy and refreshment."
    cutoutImage: "inputs/energy-drink-can.png"
  - name: "Eco-Friendly Orange Soda Can"
    description: "A healthy soda can with a fresh, clean look, highlighting natural ingredients and eco-friendly, recycled packaging."
    cutoutImage: "inputs/orange-soda-can.png"
targetRegion: "es-MX"
targetAudience: "Eco-conscious millennials"
campaignMessage: "Summer launch for Eco-Friendly Energy Drink and Orange Soda. Bright outdoor picnic vibe, highlight 'eco-friendly' and 'natural ingredients' badges. 1 hero can (energy drink), 2 supporting cans (orange soda). Include sliced orange, lemon, and mint props."
```

## Output Structure

Generated assets are organized by campaign, region, product, and aspect ratio:

```
outputs/
└── Summer Campaign 2024/
    └── en-US/
        ├── Eco-Friendly Water Bottle/
        │   ├── 1:1/
        │   │   └── 12345-Summer Campaign 2024-US-Eco-Friendly Water Bottle-1:1.jpg
        │   ├── 16:9/
        │   │   └── 67890-Summer Campaign 2024-US-Eco-Friendly Water Bottle-16:9.jpg
        │   └── 9:16/
        │       └── 54321-Summer Campaign 2024-US-Eco-Friendly Water Bottle-9:16.jpg
        └── Solar-Powered Phone Charger/
            ├── 1:1/
            ├── 16:9/
            └── 9:16/
```

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm start` - Run the compiled CLI
- `npm run generate` - Quick test, runs in tsx with sample campaign

### Project Structure

```
index.ts                            # CLI application
src/
├── app.ts                          # Main application logic
├── util/
│   ├── azure-client.ts            # Azure OpenAI integration
│   ├── extended-firefly-client.ts # Adobe Firefly API wrapper
│   ├── campaign-brief-parser.ts   # YAML parsing and validation
│   ├── aspect-ratio-util.ts       # Aspect ratio utilities
│   └── logger.ts                  # Logging configuration
└── ffs-openapi-specs/             # OpenAPI specifications

```

## Troubleshooting

### Debug Mode

Run with debug logging to see detailed information:

```bash
npx tsx --env-file=.env index.ts generate campaign.yaml --log-level debug
```
