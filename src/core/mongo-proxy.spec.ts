import * as Promise from "bluebird";
import * as mongodb from "mongodb";
import {MongoProxy} from "./mongo-proxy";
import {assert} from "chai";
import {Cursor} from "via-core";

const COLLECTION_NAME: string = "test";

describe("MongoProxy", function(){

  let db: mongodb.Db = null;

  before("Connect to database and clear data", function() {
    let mongoUrl = "mongodb://localhost:27017/via-proxy-mongo";
    return mongodb.MongoClient
      .connect(mongoUrl)
      .then((result: mongodb.Db) => {
        db = result;
        return db.collection(COLLECTION_NAME);
      })
      .then((collection: mongodb.Collection) => {
        return collection.drop();
      })
      .catch((error: Error) => {
        if (error instanceof mongodb.MongoError && error.message === "ns not found") {
          // collection does not exists
          return;
        }
        return Promise.reject(error);
      });
  });

  it("#create", function() {
    let proxy: MongoProxy = new MongoProxy(db, COLLECTION_NAME);
    let doc: Object = {greeting: "Hello world!"};

    return proxy
      .create(doc)
      .then((stored: any) => {
        assert.property(stored, "_id");
        assert.isString(stored._id);
        assert.property(stored, "_rev");
        assert.property(stored, "greeting");
        assert.strictEqual(stored.greeting, "Hello world!");
        return Promise.resolve(db.collection(COLLECTION_NAME))
          .then((collection: mongodb.Collection) => {
            return collection.find({_id: new mongodb.ObjectID(stored._id)}).toArray();
          })
          .then((result: any[]) => {
            assert.isArray(result);
            assert.strictEqual(result.length, 1);
          });
      });
  });

  it("#read", function() {
    let proxy: MongoProxy = new MongoProxy(db, COLLECTION_NAME);
    let doc = {
      language: "js",
      creator: "Brendan Eich"
    };

    return proxy
      .create(doc)
      .then((stored: any) => {
        let _id = stored._id;

        return proxy
          .read({language: "js"})
          .then((readResult: Cursor) => {
            return readResult.toArray();
          })
          .then((readResult: any[]) => {
            assert.isArray(readResult);
            assert.strictEqual(readResult.length, 1);
            let resultDoc = readResult[0];
            assert.property(resultDoc, "_id");
            assert.isString(resultDoc._id);
            assert.strictEqual(resultDoc._id, _id);
            assert.property(resultDoc, "_rev");
            assert.property(resultDoc, "language");
            assert.strictEqual(resultDoc.language, doc.language);
            assert.property(resultDoc, "creator");
            assert.strictEqual(resultDoc.creator, doc.creator);
          });
      });
  });

  it("#update", function() {
    let proxy: MongoProxy = new MongoProxy(db, COLLECTION_NAME);
    let doc = {
      name: "Pluto",
      type: "planet"
    };

    return proxy
      .create(doc)
      .then((stored: any) => {
        let _id = stored._id;

        return proxy
          .update(
            {
              name: "Pluto"
            },
            {
              $set: {
                type: "dwarf-planet" // :'(
              }
            }
          )
          .then((updateResult: any) => {
            assert.property(updateResult, "updatedCount");
            assert.strictEqual(updateResult.updatedCount, 1);
          })
      });
  });

  after("Close connection", function(){
    return db.close();
  });

});
