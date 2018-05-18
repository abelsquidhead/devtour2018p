import { Request, Response } from "express";
import { MongoClient } from "mongodb";
import { dbCollection, dbName, dbPass, dbUrl, dbUser } from "../utils/config";
import logger from "../utils/logger";

const PAGE_SIZE = 25;

export default function feedApi(req: Request, res: Response) {
  let client: MongoClient;
  const page = +req.query.page || 0;

  MongoClient.connect(dbUrl, {
    auth: {
      user: dbUser,
      password: dbPass
    }
  })
    .then(resClient => {
      client = resClient;
      const db = client.db(dbName);
      const query: any = {};

      if (req.params.username) {
        query.username = req.params.username.toLowerCase();
      }

      const cursor = db
        .collection(dbCollection)
        .find(query)
        .skip(PAGE_SIZE * page)
        .limit(25);
      return Promise.all([cursor.toArray(), cursor.count()]);
    })
    .then(([pics, totalResults]) => {
      res
        .json({
          pics: pics.map(
            ({
              _id,
              photoUrl,
              userId,
              comments,
              upVotes,
              downVotes,
              tags,
              displayName,
              votes,
              caption
            }) => ({
              photoUrl,
              userId,
              comments,
              upVotes,
              downVotes,
              caption,
              tags,
              displayName,
              votes,
              timestamp: _id.getTimestamp()
            })
          ),
          page,
          pageSize: PAGE_SIZE,
          totalResults,
          timeOfRequest: new Date().toISOString()
        })
        .end();
      client.close();
    })
    .catch(logger.error);
}
