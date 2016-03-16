import * as Promise from 'bluebird';

export interface Query {
  [objectPath: string]: any;
}

export interface ModelToken {
  _id: string;
  _name: string;
}

export interface Cursor {
  toArray(): Promise<any[]>;
}

export interface Proxy {
  format: string;
  // exists(id: string): Promise<boolean>;
  create(data: any): Promise<any>;
  read(id: string, rev: string, data: any): Promise<any>;
  readById(id: string, rev: string, data: any): Promise<any>;
  update(id: string, rev: string, data: any): Promise<any>;
  updateById(id: string, rev: string, data: any): Promise<any>;
  find(data: any): Promise<any>;
}

export interface Dictionary<T> {
  [key: string]: T;
}

export interface ReadOptions {
  fields?: Dictionary<string>,
  skip?: number,
  limit?: number,
  sort?: string[],
  timeout?: number
}

export interface UpdateOptions {
  timeout?: number
}

export interface UpdateOneOptions {
  timeout?: number
}

export interface UpdateResult {
  updateCount: number;
}

export {DocumentType as ViaSchema} from "via-type";
