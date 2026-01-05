import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { LOGGER } from 'services/loggers';
import { requestContainsParam, requestQueryContainsParam } from 'services/misc';

export enum EParamType {
  query = 'query',
  request = 'request',
}

export abstract class ParameterValidator {
  protected readonly _paramName: string;
  protected readonly _required: boolean;
  protected readonly _type: EParamType;
  protected readonly _paramContainsMap = new Map<EParamType, (req: Request, paramName: string) => boolean>([
    [EParamType.query, requestQueryContainsParam],
    [EParamType.request, requestContainsParam],
  ]);
  protected readonly _paramRetrieveMap = new Map<EParamType, (req: Request) => string>([
    [EParamType.query, (req: Request) => ((req.query[this._paramName] as string) ?? '').toString()],
    [EParamType.request, (req: Request) => (req.params[this._paramName] ?? '').toString()],
  ]);

  constructor(paramName: string, type: EParamType, required = false) {
    this._paramName = paramName;
    this._required = required;
    this._type = type;
  }

  protected getParameter = (req: Request): string | undefined => {
    const paramFunc = this._paramRetrieveMap.get(this._type);
    if (paramFunc) return paramFunc(req);
  };

  public validate = (req: Request, res: Response, next: NextFunction): void => {
    LOGGER.info(`Validate parameter ${this._paramName}`);
    const func = this._paramContainsMap.get(this._type);
    if (func) {
      const exists = func(req, this._paramName);
      if (!exists && !this._required) {
        LOGGER.info(`Non required ${this._type} parameter ${this._paramName} not existing in request - continuing`);
        return next();
      } else if (!exists && this._required) {
        LOGGER.error(`Required ${this._type} parameter ${this._paramName} not existing in request - raising error`);
        return next(new ApiError(`${this._type} parameter ${this._paramName} is required!`, undefined, 400));
      }
      return this.validateParameter(req, res, next);
    }
  };

  protected abstract validateParameter(req: Request, res: Response, next: NextFunction): void;
}
