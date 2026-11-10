import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "Secure ecommerce REST API",
    },
    servers: [
      {
        url: `${process.env.APP_URL|| "http://localhost:5500"}/api/v1`,
        development: "Development server",
      },
    ],
    tags: [
      { name: "Health", description: "Service status" },
      {
        name: "Authentication",
        description:
          "Registration, login, tokens, email verification and password reset",
      },
      { name: "Users", description: "Own profile and admin user management" },
      { name: "Categories", description: "Product categories" },
      { name: "Products", description: "Product catalogue" },
      { name: "Reviews", description: "Product reviews" },
      { name: "Cart", description: "Shopping cart" },
      { name: "Orders", description: "Customer orders" },
      { name: "Admin Orders", description: "Order management for admins" },
      { name: "Payments", description: "Fapshi payments and refunds" },
    ],
    paths: {
      "/health": {
        get: {
          summary: "Check that the API and database are up",
          description: "Lives at the server root, not under /api/v1.",
          tags: ["Health"],
          servers: [{ url: "/" }],
          responses: { 200: { description: "Service status" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation Failed" },
            errors: {
              type: "array",
              items: {
                oneOf: [
                  { type: "string", example: "INVALID_CREDENTIALS" },
                  {
                    type: "object",
                    properties: {
                      field: { type: "string", example: "email" },
                      message: {
                        type: "string",
                        example: "Invalid email address",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        ShippingAddress: {
          type: "object",
          required: ["street", "city", "country"],
          properties: {
            street: { type: "string", maxLength: 200, example: "Rue Foch" },
            city: { type: "string", maxLength: 100, example: "Yaounde" },
            country: { type: "string", maxLength: 100, example: "Cameroon" },
            postalCode: { type: "string", maxLength: 20, example: "00237" },
          },
        },
        OrderStatus: {
          type: "string",
          enum: ["created", "pending", "successful", "failed", "expired", "refunded"],
        },
      },
      parameters: {
        IdPath: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string", example: "665f1c2e9b1d8a0012a4b3c4" },
          description: "MongoDB ObjectId (24 hex characters)",
        },
        Page: {
          in: "query",
          name: "page",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        Limit: {
          in: "query",
          name: "limit",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
        },
      },
      responses: {
        ValidationError: {
          description: "Validation failed (400)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        Unauthorized: {
          description: "Missing, invalid or expired access token (401)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        Forbidden: {
          description: "Authenticated but not allowed, e.g. admin only (403)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        NotFound: {
          description: "Resource not found (404)",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
}
