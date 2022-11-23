import { GlobalStateRepository } from '../baseRepository';
import { QueryParameter } from './queryParameter';

export interface QueryParameterRepository {
  addParameter(parameter: QueryParameter): void;
  getParameters(): QueryParameter[];
  clear(): void;
}

export class WorkspaceStateQueryParameterRepository
  extends GlobalStateRepository
  implements QueryParameterRepository
{
  private PARAMETER_KEY = 'queryParameters';
  private MAX_PARAMETERS = 20;

  addParameter(parameter: QueryParameter): void {
    const parameters = this.getParameters();
    parameters.unshift(parameter);

    if (parameters.length > this.MAX_PARAMETERS) {
      parameters.pop();
    }

    this.set(this.PARAMETER_KEY, parameters);
  }

  getParameters(): QueryParameter[] {
    return this.get<QueryParameter[]>(this.PARAMETER_KEY) || [];
  }

  clear(): void {
    this.delete(this.PARAMETER_KEY);
  }
}
