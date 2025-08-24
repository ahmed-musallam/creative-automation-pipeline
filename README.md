# Creative Automation Pipeline CLI

This CLI is a proof-of-concept for Task 2 of the FDE Take-Home Exercise. It automates the generation of creative assets for social ad campaigns using Adobe Firefly Services.

## Prerequisites

- Node.js (>=22)
- npm (>=10)
- Adobe Firefly API Credentials

## Setup

1.  **Install Dependencies:**
    Navigate to this directory and run:

    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    You need to provide your Adobe Firefly API credentials. Create a file named `.env` in this directory (`packages/creative-cli/`) and add the following content:

    ```
    # Adobe Firefly API Credentials
    CLIENT_ID="YOUR_CLIENT_ID"
    CLIENT_SECRET="YOUR_CLIENT_SECRET"
    ```

    Replace `"YOUR_CLIENT_ID"` and `"YOUR_CLIENT_SECRET"` with your actual credentials. You can get them from the [Adobe Developer Console](https://developer.adobe.com/console).

## Building the CLI

To compile the TypeScript code into JavaScript, run:

```bash
npm run build
```

This will create a `dist` directory with the compiled code.

## Usage

The CLI provides a `generate` command that takes a path to a campaign brief file and generates creative assets.

### Command

```bash
node dist/index.js generate <path-to-campaign-brief> [options]
```

### Arguments

- `<path-to-campaign-brief>`: (Required) The path to your campaign brief JSON file. A sample `campaign.json` is provided in the root of the project.

### Options

- `-i, --input <dir>`: Path to an input assets directory. If an asset for a specific product and aspect ratio exists here, it will be used instead of generating a new one. (Default: `inputs`)
- `-o, --output <dir>`: Path to the directory where the generated assets will be saved. (Default: `outputs`)

### Example

To run the CLI with the sample campaign brief:

```bash
node dist/index.js generate ../../campaign.json
```

### Output Structure

The generated assets will be organized in the specified output directory as follows:

```
outputs/
├── [Product-Name-1]/
│   ├── 1:1/
│   │   └── [seed].jpg
│   ├── 9:16/
│   │   └── [seed].jpg
│   └── 16:9/
│       └── [seed].jpg
└── [Product-Name-2]/
    ├── 1:1/
    │   └── [seed].jpg
    ├── 9:16/
    │   └── [seed].jpg
    └── 16:9/
        └── [seed].jpg
```
