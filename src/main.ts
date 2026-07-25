import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security Middlewares
  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({ origin: true });

  // Swagger OpenAPI Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription(
      'Enterprise E-Commerce REST API with Auth, Products, Cart, Coupons, Wishlist, Orders & Paymob integration.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Token',
        in: 'header',
      },
      'token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const requestedPort = Number.parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  const fallbackPort = requestedPort === 3000 ? 3001 : requestedPort + 1;

  try {
    await app.listen(requestedPort, host);
    console.log(`🚀 Server running on port ${requestedPort}`);
    console.log(
      `📚 Swagger Documentation at http://localhost:${requestedPort}/api/docs`,
    );
  } catch (error: any) {
    if (error?.code === 'EADDRINUSE') {
      console.warn(
        `Port ${requestedPort} is busy, retrying on ${fallbackPort}`,
      );
      await app.listen(fallbackPort, host);
      console.log(`🚀 Server running on port ${fallbackPort}`);
      console.log(
        `📚 Swagger Documentation at http://localhost:${fallbackPort}/api/docs`,
      );
    } else {
      throw error;
    }
  }
}
bootstrap().catch((err) => {
  console.error(err);
});
