import * as Promise from "bluebird";
import * as mongodb from "mongodb";
import { Proxy, ViaSchema, Cursor } from "via-core";
import { ReadOptions, UpdateOptions, UpdateOneOptions } from "via-core";
export declare class MongoProxy implements Proxy {
    format: string;
    target: string;
    dbPromise: Promise.Thenable<mongodb.Db>;
    db: mongodb.Db;
    collectionName: string;
    constructor(db: mongodb.Db | Promise.Thenable<mongodb.Db>, collectionName: string);
    build(schema: ViaSchema): Promise<any>;
    create(data: Object): Promise<Object>;
    read(query: Object, options?: ReadOptions): Promise<Cursor>;
    readById(id: string, options?: ReadOptions): Promise<Object>;
    update(filter: Object, updateDoc: Object, options?: UpdateOptions): Promise<any>;
    updateById(id: string, rev: string, updateDoc: Object, options?: UpdateOneOptions): Promise<any>;
    delete(): Promise<any>;
    getDatabase(): Promise<mongodb.Db>;
    getCollection(): Promise<mongodb.Collection>;
}
export declare function asObjectID(id: string | mongodb.ObjectID): mongodb.ObjectID;
