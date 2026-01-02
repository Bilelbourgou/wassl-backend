import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WASSL API Documentation',
            version: '1.0.0',
            description: 'API documentation for WASSL e-commerce platform backend',
            contact: {
                name: 'WASSL Support',
                email: 'support@wassl.tn',
            },
        },
        servers: [
            {
                url: `http://localhost:${env.port}`,
                description: 'Development server',
            },
            {
                url: 'https://api.wassl.tn',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/**/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
