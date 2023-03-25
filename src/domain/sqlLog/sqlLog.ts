export interface SQLLog {
  id: string;
  statement: string;
  loggedDate: Date;
}

export interface SQLLogJson {
  id: string;
  statement: string;
  loggedDate: number;
}
