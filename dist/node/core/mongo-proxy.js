"use strict";
var Promise = require("bluebird");
var mongodb = require("mongodb");
var TARGET = "mongo";
var FORMAT = "bson";
function stringifyId(doc) {
    if (!doc._id) {
        throw new Error("Result does not expose _id");
    }
    doc._id = doc._id.toHexString();
    return doc;
}
var MongoProxy = (function () {
    function MongoProxy(db, collectionName) {
        this.format = FORMAT;
        this.target = TARGET;
        this.dbPromise = null;
        this.db = null;
        if (db instanceof mongodb.Db) {
            this.db = db;
        }
        else {
            this.dbPromise = db;
        }
        this.collectionName = collectionName;
    }
    MongoProxy.prototype.build = function (schema) {
        return Promise.resolve(null);
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
            return stringifyId(doc);
        });
    };
    MongoProxy.prototype.read = function (query, options) {
        return this.getCollection()
            .then(function (coll) {
            var cursor = coll.find(query);
            cursor.map(stringifyId);
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
    MongoProxy.prototype.update = function (filter, updateDoc, options) {
        return Promise
            .join(this.getCollection(), updateDoc, function (coll, update) {
            return coll.updateMany(filter, update, options);
        })
            .then(function (wor) {
            return { updatedCount: wor.modifiedCount };
        });
    };
    MongoProxy.prototype.updateById = function (id, rev, updateDoc, options) {
        return Promise
            .join(this.getCollection(), updateDoc, function (coll, update) {
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
    MongoProxy.prototype.getDatabase = function () {
        var _this = this;
        if (this.dbPromise === null) {
            return Promise.resolve(this.db);
        }
        return Promise
            .resolve(this.dbPromise)
            .tap(function (db) {
            _this.dbPromise = null;
            _this.db = db;
        });
    };
    MongoProxy.prototype.getCollection = function () {
        var _this = this;
        return this.getDatabase().then(function (db) { return db.collection(_this.collectionName); });
    };
    return MongoProxy;
}());
exports.MongoProxy = MongoProxy;
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
