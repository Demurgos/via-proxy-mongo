import * as mongodb from "mongodb";
import {MongoProxy} from "./mongo-proxy";
import {assert} from "chai";

const COLLECTION_NAME: string = "test";

describe("MongoProxy", function(){

  let db: mongodb.Db = null;

  before("Connect to database and clear data", function(){
    let mongoUrl = "mongodb://localhost:27017/via-proxy-mongo";
    return mongodb.MongoClient
      .connect(mongoUrl)
      .then((result: mongodb.Db) => {
        db = result;
        return db.collection(COLLECTION_NAME)
      })
      .then((collection: mongodb.Collection) => {
        return collection.drop();
      })
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
      })
  });

  after("Close connection", function(){
    return db.close();
  });

});
