import express from 'express';
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import routes from './routes.js';
import authRoutes from './routes/auth.js';

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "COBOL Bridge API",
      version: "1.0.0",
      description: "API pour exposer des données COBOL",
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ["./routes.js", "./routes/auth.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
const app = express();
const port = 3000;

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use(express.json());

// Routes d'authentification
app.use('/auth', authRoutes);

// Routes protégées
app.use('/', routes);

app.listen(port, () => {
  console.log(`🚀 COBOL Bridge API running at http://localhost:${port}`);
  console.log(`📚 Documentation Swagger disponible sur http://localhost:${port}/api-docs`);
});