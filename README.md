# Creative Automation Pipeline CLI

A CLI tool that automates the generation of creative assets for marketing campaigns using Adobe Firefly Services and Azure OpenAI. This tool generates product images in multiple aspect ratios for social media and advertising campaigns.

> As you review this submission, please remember, **This is POC**: the POC purpose is to evaluate technical skill and ability to work with different GenAI APIs. It is not intended to be production ready software. To implement all items from the exercise is to implement a GenStudio/Firefly competitor.

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

   clone the repo via your favorite cloning method, command below uses HTTPS.

   ```bash
   git clone https://github.com/ahmed-musallam/creative-automation-pipeline.git
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

   generate command with existing campaign and inputs (in `inputs` folder):

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

- `1:1` - Square
- `16:9` - Landscape
- `9:16` - Portrait
- `4:3` - Traditional
- `3:4` - Portrait
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

## Key Assumptions & Design Limitations

> Also see [CHALLENGES.md](./CHALLENGES.md)

### Assumptions

This tool was built with the following assumptions:

1. **This is POC**: the POC purpose is to evaluate technical skill and ability to work with different GenAI APIs. It is not intended to be production ready software. To implement all items from the exercise is to implement a GenStudio/Firefly competitor.
1. **Product Images**: All products have cutout images (PNG files with transparent backgrounds) available locally.
1. **Images are centered** All product images are centered in the final output behind a background generated via Firefly Object Composition API.
1. **Campaign Structure**: Campaign briefs follow the predefined YAML schema format. Schema validation is implemented via [arktype](https://arktype.io/) and helpful messages will be printed when schema is invalid.

### Current Limitations

#### Performance & Scalability

- **Sequential Processing**: Generations are intentionally sequential and not batched to avoid API rate limits for POC purposes. In reality, we'd have to investigate API limits and implement a proper parallelism strategy.
- **No Caching**: Same prompts will regenerate images every time (no deduplication)
- **No Parallel Processing**: Cannot generate multiple aspect ratios simultaneously

#### Error Handling & Recovery

- **Limited Retry Logic**: Failed generations don't automatically retry
- **Partial Failure**: If one product/ratio fails, others will continue
- **No Rollback**: No mechanism to undo partial generations

#### Feature Limitations

- **Aspect Ratios**: Limited to Adobe Firefly supported ratios (approximated if needed)
- **Image Formats**: Output is JPEG only; no format options
- **Preview Mode**: No dry-run or preview capability before full generation
- **Template Support**: No campaign templates
- **Localization**: Limited to `targetRegion` field; no advanced localization features

#### Configuration & Validation

- **Rate Limiting**: Simple delays only; no sophisticated rate limit handling
- **API Quotas**: No quota monitoring or usage tracking

#### Monitoring & Observability

- **Progress Tracking**: Basic console output only
- **Analytics**: No generation metrics or performance tracking
- **Error Logging**: Limited error context and debugging information
- **Audit Trail**: No record of generation history or changes

### Recommendations for Production Use

If adapting this tool for production environments, consider:

1. **Add Batch Processing**: Implement concurrent generation with proper rate limiting
2. **Implement Caching**: Cache generated images based on prompt/product combinations
3. **Enhanced Error Handling**: Add retry logic, circuit breakers, and graceful degradation
4. **Configuration Management**: Implement robust config validation and management
5. **Monitoring**: Add comprehensive logging, metrics, and health checks
6. **Security**: Implement secure credential management and API key rotation
7. **Testing**: Add comprehensive unit and integration tests
8. **Documentation**: Expand API documentation and troubleshooting guides

## Troubleshooting

### Debug Mode

Run with debug logging to see detailed information:

```bash
npx tsx --env-file=.env index.ts generate campaign.yaml --log-level debug
```
