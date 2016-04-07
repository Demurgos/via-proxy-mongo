import * as Promise from "bluebird";
import * as _ from "lodash";

import * as mongodb from "mongodb";
import {Proxy, ViaSchema, Cursor} from "via-core";
import {ReadOptions, UpdateOptions, UpdateOneOptions} from "via-core";

const TARGET: string = "mongo";
const FORMAT: string = "bson";

interface QueryCreate {}
interface QueryRead {}
interface bsonData {
  [key: string]: any;
}

interface ViaMinModel {
  _id: any;
  _rev: any;
  _created: any;
  _updated: any;
}

function stringifyId<T extends ViaMinModel>(doc: T): T {
  if (!doc._id) {
    throw new Error("Result does not expose _id");
  }
  doc._id = (<mongodb.ObjectID> doc._id).toHexString();
  return doc;
}

export class MongoProxy implements Proxy {
	format: string = FORMAT;
  target: string = TARGET;

  db: mongodb.Db = null;
  collectionName: string;

  constructor (db: mongodb.Db, collectionName: string) {
    this.db = db;
    this.collectionName = collectionName;
  }

  build(schema: ViaSchema): Promise<void>{
    return Promise.resolve();
  }

  create (data: Object): Promise<Object> {
    let date = new Date();
    // data._id = new mongodb.ObjectID();
    (<ViaMinModel> data)._rev = "1";
    (<ViaMinModel> data)._created = date;
    (<ViaMinModel> data)._updated = date;

    return this.getCollection()
      .then<mongodb.InsertOneWriteOpResult> ((coll: mongodb.Collection) => {
        return coll.insertOne(data, {forceServerObjectId: false});
      })
      .then<Object> ((wor: mongodb.InsertOneWriteOpResult) => {
        if (!wor.insertedCount) {
          return Promise.reject(new Error("Unable to insert"));
        }
        let doc: ViaMinModel = wor.ops[0];
        return stringifyId(doc);
      });
  }

  read (query: Object, options?: ReadOptions): Promise<Cursor> {
		return this.getCollection()
			.then((coll: mongodb.Collection) => {
        let cursor: mongodb.Cursor = coll.find(query);
        cursor.map(stringifyId);
        return <any> cursor;
			});
  }

  readById (id: string, options?: ReadOptions): Promise<Object> {
		return this
      .read({_id: asObjectID(id)})
      .then((cursor: Cursor) => {
        return (<mongodb.Cursor> <any> cursor).limit(1).next();
      })
      .then((doc: Object) => {
        if (doc === null) {
          throw new Error("Not found");
        }
        return doc;
      });
  }

  update (filter: Document, diff: Object, options?: UpdateOptions): Promise<any> {
    return Promise
      .join(
        this.getCollection(),
        diffToMongoUpdate(diff),
        (coll: mongodb.Collection, update: Object) => {
          return coll.updateMany(filter, update, options);
        }
      )
      .then((wor: mongodb.UpdateWriteOpResult) => {
        return {updatedCount: wor.modifiedCount};
      });
  }

  updateById (id: string, rev: string, diff: Object, options?: UpdateOneOptions): Promise<any> {
    return Promise
      .join(
        this.getCollection(),
        diffToMongoUpdate(diff),
        (coll: mongodb.Collection, update: Object) => {
          return coll.updateOne({_id: asObjectID(id), _rev: rev}, update, options);
        }
      )
      .then((wor: mongodb.UpdateWriteOpResult) => {
        if (!wor.matchedCount) {
          return Promise.reject(new Error("No match"));
        }
        if (!wor.modifiedCount) {
          return Promise.reject(new Error("No updates"));
        }
        return {updatedCount: wor.modifiedCount};
      });
  }

  delete (): Promise<any> {
    return Promise.resolve();
  }

  getCollection(): Promise<mongodb.Collection> {
    return Promise.resolve(this.db.collection(this.collectionName));
  }
}

export function diffToMongoUpdate (diff: Object): Promise<Object> {
  return Promise.resolve({"$set": diff});
}

export function asObjectID(id: string | mongodb.ObjectID): mongodb.ObjectID {
  if (id instanceof mongodb.ObjectID) {
    return <mongodb.ObjectID> id;
  }
  if (!mongodb.ObjectID.isValid(<string> id)) {
    throw new Error("Invalid id");
  }
  return new mongodb.ObjectID(<string> id);
}
