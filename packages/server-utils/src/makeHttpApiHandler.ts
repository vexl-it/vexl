import {
  type HttpApi,
  type HttpApiEndpoint,
  type HttpApiGroup,
} from 'effect/unstable/httpapi'

type Handler<Endpoint extends HttpApiEndpoint.Constraint, R> = (
  request: Omit<
    Parameters<HttpApiEndpoint.Handler<Endpoint, never, R>>[0],
    'endpoint' | 'group'
  >
) => ReturnType<HttpApiEndpoint.Handler<Endpoint, never, R>>

export const makeHttpApiHandler = <
  ApiId extends string,
  Groups extends HttpApiGroup.Constraint,
  const Group extends HttpApiGroup.Identifier<Groups>,
  const Endpoint extends HttpApiGroup.EndpointsWithIdentifier<
    Groups,
    Group
  >['identifier'],
  R,
>(
  _api: HttpApi.HttpApi<ApiId, Groups>,
  _group: Group,
  _endpoint: Endpoint,
  handler: Handler<
    HttpApiEndpoint.WithIdentifier<
      HttpApiGroup.EndpointsWithIdentifier<Groups, Group>,
      Endpoint
    >,
    R
  >
): Handler<
  HttpApiEndpoint.WithIdentifier<
    HttpApiGroup.EndpointsWithIdentifier<Groups, Group>,
    Endpoint
  >,
  R
> => handler
