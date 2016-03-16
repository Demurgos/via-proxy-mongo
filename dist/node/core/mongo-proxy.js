"use strict";
var Promise = require('bluebird');
var mongodb = require("mongodb");
var TARGET = "mongo";
var FORMAT = "bson";
var MongoProxy = (function () {
    function MongoProxy(db, collectionName) {
        this.format = FORMAT;
        this.target = TARGET;
        this.db = null;
        this.db = db;
        this.collectionName = collectionName;
    }
    MongoProxy.prototype.build = function (schema) {
        return Promise.resolve();
    };
    MongoProxy.prototype.create = function (data) {
        var date = new Date();
        // data._id = new mongodb.ObjectID();
        data._rev = "1";
        data._created = date;
        data._updated = date;
        return this.getCollection()
            .then(function (coll) {
            return coll.insertOne(data, { forceServerObjectId: false });
        })
            .then(function (wor) {
            if (!wor.insertedCount) {
                return Promise.reject(new Error("Unable to insert"));
            }
            var doc = wor.ops[0];
            if (!doc._id) {
                return Promise.reject(new Error("Result does not expose _id"));
            }
            return doc;
        });
    };
    MongoProxy.prototype.read = function (query, options) {
        return this.getCollection()
            .then(function (coll) {
            var cursor = coll.find(query);
            return cursor;
        });
    };
    MongoProxy.prototype.readById = function (id, options) {
        return this
            .read({ _id: asObjectID(id) })
            .then(function (cursor) {
            return cursor.limit(1).next();
        })
            .then(function (doc) {
            if (doc === null) {
                throw new Error("Not found");
            }
            return doc;
        });
    };
    MongoProxy.prototype.update = function (filter, update, options) {
        return this.getCollection()
            .then(function (coll) {
            return coll.updateMany(filter, update, options);
        })
            .then(function (wor) {
            return { updatedCount: wor.modifiedCount };
        });
    };
    MongoProxy.prototype.updateById = function (id, rev, update, options) {
        return this.getCollection()
            .then(function (coll) {
            return coll.updateOne({ _id: asObjectID(id), _rev: rev }, update, options);
        })
            .then(function (wor) {
            if (!wor.matchedCount) {
                return Promise.reject(new Error("No match"));
            }
            if (!wor.modifiedCount) {
                return Promise.reject(new Error("No updates"));
            }
            return { updatedCount: wor.modifiedCount };
        });
    };
    MongoProxy.prototype.delete = function () {
        return Promise.resolve();
    };
    MongoProxy.prototype.getCollection = function () {
        return Promise.resolve(this.db.collection(this.collectionName));
    };
    return MongoProxy;
}());
exports.MongoProxy = MongoProxy;
function viaToMongoUpdate(viaUpdate) {
    return Promise.resolve({ "$set": viaUpdate });
}
exports.viaToMongoUpdate = viaToMongoUpdate;
function asObjectID(id) {
    if (id instanceof mongodb.ObjectID) {
        return id;
    }
    if (!mongodb.ObjectID.isValid(id)) {
        throw new Error("Invalid id");
    }
    return new mongodb.ObjectID(id);
}
exports.asObjectID = asObjectID;
