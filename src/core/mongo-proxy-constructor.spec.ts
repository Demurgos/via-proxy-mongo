import * as Promise from "bluebird";
import * as mongodb from "mongodb";
import {MongoProxy} from "./mongo-proxy";
import {assert} from "chai";
import {Cursor} from "via-core";

const MONGO_URL: string = "mongodb://localhost:27017/via-proxy-mongo";
const COLLECTION_NAME: string = "test";

describe("MongoProxy:constructor", function(){

  function testProxy (proxy: MongoProxy): Promise<any> {
    // get the collection a few times to be sure that it does not break after the first use
    return Promise.resolve(null)
      .then(() => proxy.getCollection())
      .then(() => proxy.getCollection())
      .then(() => proxy.getCollection())
      .finally(() => proxy.getDatabase().call("close"))
      .thenReturn(null);
  }

  it("#open db then instanciate", function() {
    return mongodb.MongoClient
      .connect(MONGO_URL)
      .then((db: mongodb.Db) => {
        let proxy: MongoProxy = new MongoProxy(db, COLLECTION_NAME);

        return testProxy(proxy);
      })
  });

  it("#instanciate with db promise", function() {
      let proxy: MongoProxy = new MongoProxy(mongodb.MongoClient.connect(MONGO_URL), COLLECTION_NAME);
      return testProxy(proxy);
  });
});
