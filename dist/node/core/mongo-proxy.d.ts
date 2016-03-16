import * as Promise from 'bluebird';
import * as mongodb from "mongodb";
import { Proxy, ViaSchema, Cursor } from "via-core";
import { ReadOptions, UpdateOptions, UpdateOneOptions } from "via-core";
export declare class MongoProxy implements Proxy {
    format: string;
    target: string;
    db: mongodb.Db;
    collectionName: string;
    constructor(db: mongodb.Db, collectionName: string);
    build(schema: ViaSchema): Promise<void>;
    create(data: Object): Promise<Object>;
    read(query: Object, options?: ReadOptions): Promise<Cursor>;
    readById(id: string, options?: ReadOptions): Promise<Object>;
    update(filter: Document, update: Object, options?: UpdateOptions): Promise<any>;
    updateById(id: string, rev: string, update: Object, options?: UpdateOneOptions): Promise<any>;
    delete(): Promise<any>;
    getCollection(): Promise<mongodb.Collection>;
}
export declare function viaToMongoUpdate(viaUpdate: Object): Promise<Object>;
export declare function asObjectID(id: string | mongodb.ObjectID): mongodb.ObjectID;
