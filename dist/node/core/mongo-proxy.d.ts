import * as Promise from "bluebird";
import * as mongodb from "mongodb";
import { schema, proxy } from "via-core";
export declare class MongoProxy implements proxy.Proxy {
    format: string;
    target: string;
    dbPromise: Promise.Thenable<mongodb.Db>;
    db: mongodb.Db;
    collectionName: string;
    constructor(db: mongodb.Db | Promise.Thenable<mongodb.Db>, collectionName: string);
    build(schema: schema.ViaModelSchema): Promise<any>;
    create(data: Object): Promise<Object>;
    read(query: Object, options?: proxy.ReadOptions): Promise<proxy.Cursor>;
    readById(id: string, options?: proxy.ReadOptions): Promise<Object>;
    update(filter: Object, updateDoc: Object, options?: proxy.UpdateOptions): Promise<any>;
    updateById(id: string, rev: string, updateDoc: Object, options?: proxy.UpdateOneOptions): Promise<any>;
    delete(): Promise<any>;
    getDatabase(): Promise<mongodb.Db>;
    getCollection(): Promise<mongodb.Collection>;
}
export declare function asObjectID(id: string | mongodb.ObjectID): mongodb.ObjectID;
