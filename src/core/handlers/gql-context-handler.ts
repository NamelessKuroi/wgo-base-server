import {
  GetCypherKey,
  GetEmailAppAddressKey,
  GetExpiresInKey,
  GetHostBaseKey,
  GetPrivateKey,
  GetPublicKey,
} from "wgo-settings";
import { PostgresDataSource } from "../../database/data-source";
import { EventEmitter } from "events";

import {
  IContextBase,
  translations,
  SUPERADMIN,
  IAuthModelArg,
} from "@wisegar-org/wgo-base-models";
import { listenersEvents } from "../../settings";
import { UserRolesModel } from "../../authentication";
import { LanguageModel } from "../../language";
import { GetWebRootKey, IContextOptions } from "..";

export const getContext = () => {
  return <IContextBase>{
    dataSource: PostgresDataSource,
    web_root: GetWebRootKey(),
    emiter: new EventEmitter(),
    listenersEvents: listenersEvents,
    cypherKey: GetCypherKey(),
  };
};

export const ctx = <IContextBase>{
  dataSource: PostgresDataSource,
  web_root: GetWebRootKey(),
  emiter: new EventEmitter(),
  listenersEvents: listenersEvents,
  cypherKey: GetCypherKey(),
};

export const authArg = {
  privateKey: GetPrivateKey(),
  publicKey: GetPublicKey(),
  hostBase: GetHostBaseKey(),
  ctx,
  tokenExpiresIn: GetExpiresInKey(),
  tokenRegisterExpiresIn: "24h",
  emailOptions: { from: GetEmailAppAddressKey() } as any,
  transportEmailOptions: {},
};

export const getAuthArguments = (): IAuthModelArg => {
  return <IAuthModelArg>{
    privateKey: GetPrivateKey(),
    publicKey: GetPublicKey(),
    hostBase: GetHostBaseKey(),
    ctx,
    tokenExpiresIn: GetExpiresInKey(),
    tokenRegisterExpiresIn: "24h",
    emailOptions: { from: GetEmailAppAddressKey() } as any,
    transportEmailOptions: {},
  };
};

export const GqlContextHandler = async (options: IContextOptions) => {
  const args = getAuthArguments();
  const authModel = new UserRolesModel(args);
  const context = getContext();
  const langModel = new LanguageModel(context);

  if (!options) {
    throw new Error(translations.INVALID_PARAMS);
  }
  const { tokenPayload, requestHeaders } = options;

  const ctxApp = {
    ...ctx,
    language: parseInt(requestHeaders.language) || 0,
  };

  if (!tokenPayload) return ctxApp;

  const user = await authModel.getUser(parseInt(tokenPayload.userId));

  if (user) {
    ctxApp.user = {
      ...user,
      isSuperAdmin: user.roles.indexOf(SUPERADMIN) !== -1,
    };
  }

  try {
    const langId = parseInt(options.requestHeaders.language || "0");

    let language = langId
      ? await langModel.getLanguage({ id: langId })
      : await langModel.getDefaultLanguage();
    ctxApp.language = language ? language.id : 0;
  } catch {
    ctxApp.language = 0;
  }
  // TODO: Add context definition here
  return ctxApp as any;
};
