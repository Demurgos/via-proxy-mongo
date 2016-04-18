import * as Promise from "bluebird";
import * as _ from "lodash";

import * as mongodb from "mongodb";
import {schema, proxy, utils} from "via-core";

const TARGET: string = "mongo";
const FORMAT: string = "bson";

interface QueryCreate {}
interface QueryRead {}
type bsonData = utils.Document;

// TODO: define in via-core
interface ViaMinModel {
  _id: string;
  _name: string;
  _rev: string;
  _created: Date;
  _updated: Date;
}

interface DbViaMinModel {
  _id: mongodb.ObjectID;
  _name: string;
  _rev: string;
  _created: Date;
  _updated: Date;
}

function stringifyId<T extends DbViaMinModel>(doc: T): ViaMinModel {
  if (!doc._id) {
    throw new Error("Result does not expose _id");
  }
  let res: ViaMinModel = <any> doc;
  res._id = doc._id.toHexString();
  return res;
}

export class MongoProxy implements proxy.Proxy {
	format: string = FORMAT;
  target: string = TARGET;

  dbPromise: Promise.Thenable<mongodb.Db> = null;
  db: mongodb.Db = null;
  collectionName: string;

  constructor (db: mongodb.Db | Promise.Thenable<mongodb.Db>, collectionName: string) {
    if (db instanceof mongodb.Db) {
      this.db = db;
    } else {
      this.dbPromise = <Promise<mongodb.Db>> db;
    }
    this.collectionName = collectionName;
  }

  build(schema: schema.ViaModelSchema): Promise<any>{
    return Promise.resolve(null);
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
        let doc: DbViaMinModel = wor.ops[0];
        return stringifyId(doc);
      });
  }

  read (query: Object, options?: proxy.ReadOptions): Promise<proxy.Cursor> {
		return this.getCollection()
			.then((coll: mongodb.Collection) => {
        let cursor: mongodb.Cursor = coll.find(query);
        cursor.map(stringifyId);
        return <any> cursor;
			});
  }

  readById (id: string, options?: proxy.ReadOptions): Promise<Object> {
		return this
      .read({_id: asObjectID(id)})
      .then((cursor: proxy.Cursor) => {
        return (<mongodb.Cursor> <any> cursor).limit(1).next();
      })
      .then((doc: Object) => {
        if (doc === null) {
          throw new Error("Not found");
        }
        return doc;
      });
  }

  update (filter: Object, updateDoc: Object, options?: proxy.UpdateOptions): Promise<any> {
    return Promise
      .join(
        this.getCollection(),
        updateDoc,
        (coll: mongodb.Collection, update: Object) => {
          return coll.updateMany(filter, update, options);
        }
      )
      .then((wor: mongodb.UpdateWriteOpResult) => {
        return {updatedCount: wor.modifiedCount};
      });
  }

  updateById (id: string, rev: string, updateDoc: Object, options?: proxy.UpdateOneOptions): Promise<any> {
    return Promise
      .join(
        this.getCollection(),
        updateDoc,
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

  getDatabase(): Promise<mongodb.Db> {
    if (this.dbPromise === null) {
      return Promise.resolve(this.db);
    }

    return Promise
      .resolve(this.dbPromise)
      .tap((db: mongodb.Db) => {
        this.dbPromise = null;
        this.db = db;
      });
  }

  getCollection(): Promise<mongodb.Collection> {
    return this.getDatabase().then(db => db.collection(this.collectionName));
  }
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
