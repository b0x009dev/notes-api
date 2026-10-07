import { readFileSync } from 'node:fs';
import process from 'node:process';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse, stringify } from 'yaml';
import notesRouter from './routes/notes.routes.js';

const openapiSource = readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf8');
const openapiDocument = parse(openapiSource);
const openapiServerUrl = process.env.OPENAPI_SERVER_URL;

// Публичный адрес API может включать префикс reverse proxy, например /notes.
if (openapiServerUrl) {
  openapiDocument.servers = [{ url: openapiServerUrl }];
}

const openapiYaml = openapiServerUrl ? stringify(openapiDocument) : openapiSource;

const app = express();

app.use(cors());
app.use(express.json());
app.get('/openapi.yaml', (_req, res) => {
  res.type('application/yaml').send(openapiYaml);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
app.use('/api/v1/notes', notesRouter);
// Ошибка от express.json() превращается в 400, остальные непойманные ошибки скрываются за 500.
app.use((error, _req, res, _next) => {
  if (error.status === 400) {
    return res.status(400).json({ message: 'Invalid JSON' });
  }

  return res.status(500).json({ message: 'Internal Server Error' });
});

export default app;
