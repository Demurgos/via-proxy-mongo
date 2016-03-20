import * as mongodb from "mongodb";
import {MongoProxy} from "./mongo-proxy";
import {assert} from "chai";

describe("MongoProxy", function(){

  let db: mongodb.Db = null;

  before("Connect to database and clear data", function(){
    let mongoUrl = "mongodb://localhost:27017/via-proxy-mongo";
    return mongodb.MongoClient
      .connect(mongoUrl)
      .then((result: mongodb.Db) => {
        db = result;
      });
  });

  it("#create", function() {
    let proxy: MongoProxy = new MongoProxy(db, "test");
    let doc: Object = {greeting: "Hello world!"};

    return proxy
      .create(doc)
      .then((stored: any) => {
        assert.property(stored, "_id");
        assert.property(stored, "_rev");
        assert.property(stored, "greeting");
        assert.strictEqual(stored.greeting, "Hello world!");
      });
  });

});
