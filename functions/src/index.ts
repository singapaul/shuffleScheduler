/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {Firestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const postDailyShuffle = onSchedule("0 0 * * *", async () => {
  logger.info("Saving a new daily shuffle", {structuredData: true});
  const db = new Firestore();
  const date = new Date();

  const querySnapshot = await db.collection("dailyShuffle").get();
  const totalDocuments = querySnapshot.size;

  // Calculate the entry number as one more than the total count
  const entryNumber = totalDocuments + 1;


  const liteArray = [];
  for (let i = 0; i <= 23; i++) {
    liteArray.push(i);
  }
  const classicArray = [];
  for (let i = 0; i <= 51; i++) {
    classicArray.push(i);
  }
  const liteShuffle = shuffleArray(liteArray);
  const classicShuffle = shuffleArray(classicArray);
  const liteShuffleJSON = JSON.parse(JSON.stringify(liteShuffle));
  const classicShuffleJSON = JSON.parse(JSON.stringify(classicShuffle));

  await db.collection("dailyShuffle").doc(date.toISOString()).set({
    timestamp: date.toLocaleString(),
    entryNumber: entryNumber,
    lite: liteShuffleJSON,
    classic: classicShuffleJSON,
  });
});


/**
 * Shuffles the elements of an array randomly.
 * @param {number[]} array - The array to shuffle.
 * @return {number[]} - The shuffled array.
 */
function shuffleArray(array: number[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

type DailyShuffleResponse = {
  classic: number[],
  lite: number[],
  entryNumber: number,
  timestamp: Date,
}

export const getDailyShuffle = onRequest({cors: false},
  async (request, response) => {
    logger.info("Request for todays Daily Shuffle", {structuredData: true});
    const db = new Firestore();
    const querySnapshot = await db.collection("dailyShuffle").
      orderBy("timestamp", "desc").limit(1).get();

    const liteArray = [];
    for (let i = 0; i <= 23; i++) {
      liteArray.push(i);
    }
    const classicArray = [];
    for (let i = 0; i <= 51; i++) {
      classicArray.push(i);
    }


    let resObj: DailyShuffleResponse = {
      classic: classicArray,
      lite: liteArray,
      entryNumber: 1,
      timestamp: new Date(),
    };
    if (!querySnapshot.empty) {
      resObj = querySnapshot.docs[0].data() as DailyShuffleResponse;
    } else {
      resObj;
    }

    const {timestamp, entryNumber, lite, classic} = resObj;

    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET");
    response.set("Access-Control-Allow-Headers", "Content-Type");
    response.set("Access-Control-Max-Age", "3600");

    response.status(200).json({
      timestamp, entryNumber, lite, classic,
    });
  });
