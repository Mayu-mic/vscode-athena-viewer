import { ExtensionContext } from 'vscode';
import {
  MementoStateAccessor,
  StateAccessor,
} from '../../infrastracture/stateAccessor';
import { QueryParameter } from './queryParameter';

export interface QueryParameterRepository {
  addParameter(parameter: QueryParameter): void;
  getParameters(): QueryParameter[];
  clear(): void;
}

export class WorkspaceStateQueryParameterRepository
  implements QueryParameterRepository
{
  private PARAMETER_KEY = 'queryParameters';
  private MAX_PARAMETERS = 20;

  constructor(private accessor: StateAccessor<QueryParameter[]>) {}

  addParameter(parameter: QueryParameter): void {
    if (parameter.items.length === 0) {
      throw new Error("Can't add empty parameter");
    }

    const parameters = this.getParameters();
    parameters.unshift(parameter);

    if (parameters.length > this.MAX_PARAMETERS) {
      parameters.pop();
    }

    this.accessor.set(this.PARAMETER_KEY, parameters);
  }

  getParameters(): QueryParameter[] {
    return this.accessor.get(this.PARAMETER_KEY) || [];
  }

  clear(): void {
    this.accessor.delete(this.PARAMETER_KEY);
  }

  static createDefault(
    ctx: ExtensionContext
  ): WorkspaceStateQueryParameterRepository {
    const accessor = new MementoStateAccessor<QueryParameter[]>(ctx);
    return new WorkspaceStateQueryParameterRepository(accessor);
  }
}
