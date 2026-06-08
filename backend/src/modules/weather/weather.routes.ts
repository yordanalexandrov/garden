import type { FastifyPluginCallback } from "fastify";

import type { AppConfig } from "../../config/config.js";
import type { DbClient } from "../../db/transaction.js";
import { createWeatherAdapter } from "../../integrations/weather/weather-adapter.factory.js";
import type { WeatherPort } from "../../integrations/weather/weather.port.js";
import { successEnvelope } from "../../shared/api/envelope.js";
import { validateRequest } from "../../shared/validation/request-validation.js";
import { hasAuthDecorator, requireActor } from "../auth/request-actor.js";
import { toRainConfirmationDto, toWeatherForecastDto } from "./weather.dto.js";
import { KyselyWeatherRepository } from "./weather.repository.js";
import { WeatherService } from "./weather.service.js";
import { confirmRainBodySchema, weatherEventParamsSchema, weatherPlaceParamsSchema } from "./weather.validation.js";

export type WeatherRouteOptions = {
  db?: DbClient;
  config?: AppConfig;
  weather?: WeatherPort;
};

export const registerPlaceWeatherRoutes: FastifyPluginCallback<WeatherRouteOptions> = (app, options, done) => {
  const weatherService = createWeatherService(options);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.get("/forecast", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params } = validateRequest(request, { params: weatherPlaceParamsSchema });
    const result = await requireWeatherService(weatherService).getForecastForPlace(actor, params.placeId);

    return successEnvelope(toWeatherForecastDto(result));
  });

  done();
};

export const registerWeatherRoutes: FastifyPluginCallback<WeatherRouteOptions> = (app, options, done) => {
  const weatherService = createWeatherService(options);
  const protectedRoute = hasAuthDecorator(app) ? { preHandler: app.authenticate } : {};

  app.post("/events/:weatherEventId/confirm-rain", protectedRoute, async (request) => {
    const actor = requireActor(request);
    const { params, body } = validateRequest(request, { params: weatherEventParamsSchema, body: confirmRainBodySchema });
    const result = await requireWeatherService(weatherService).confirmRain(actor, params.weatherEventId, body.response);

    return successEnvelope(toRainConfirmationDto(result));
  });

  done();
};

function createWeatherService(options: WeatherRouteOptions): WeatherService | undefined {
  if (options.db === undefined) {
    return undefined;
  }

  const config = options.config;
  const weatherPort = options.weather ?? (config === undefined ? undefined : createWeatherAdapter(config));

  if (weatherPort === undefined) {
    return undefined;
  }

  return new WeatherService(new KyselyWeatherRepository(options.db), weatherPort);
}

function requireWeatherService(service: WeatherService | undefined): WeatherService {
  if (service === undefined) {
    throw new Error("Weather routes require a database client and weather port");
  }

  return service;
}
