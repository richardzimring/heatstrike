/**
 * OpenAPI Spec Generator
 *
 * This script generates the OpenAPI specification from all route definitions.
 * Run with: npm run generate:openapi
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { app } from '../src/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate the OpenAPI document
const doc = app.getOpenAPIDocument({
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Options Heatmap API',
    description:
      'API for fetching stock options chain data for heatmap visualization',
  },
  servers: [
    {
      url: 'https://vk3egx5xz0.execute-api.us-east-2.amazonaws.com',
      description: 'Production',
    },
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
});

// Write the spec to the openapi.json file
const outputPath = path.join(__dirname, '..', 'openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2));

console.log(`OpenAPI spec generated successfully at ${outputPath}`);
console.log(`Total paths: ${Object.keys(doc.paths ?? {}).length}`);
console.log(
  `Total schemas: ${Object.keys(doc.components?.schemas ?? {}).length}`,
);
