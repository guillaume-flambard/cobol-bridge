import express from 'express';
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import routes from './routes.js';

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "COBOL Bridge API",
      version: "1.0.0",
      description: "API pour exposer des données COBOL",
    },
  },
  apis: ["./routes.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
const app = express();
const port = 3000;

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(express.json());

app.use('/', routes);

app.listen(port, () => {
  console.log(`🚀 COBOL Bridge API running at http://localhost:${port}`);
});