import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { env } from "./env";

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Nurse Care Pro (NCPnext) API",
            version: "1.0.0",
            description: "API documentation for the NCPnext backend service.",
            contact: {
                name: "API Support",
            },
        },
        servers: [
            {
                url: env.BACKEND_URL || `http://localhost:${env.PORT}`,
                description: env.isProduction ? "Production server" : "Local server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.controller.ts", "./src/shared/*.ts"], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
    // Swagger Page
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    // Docs in JSON format
    app.get("/api-docs.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(swaggerSpec);
    });
}
