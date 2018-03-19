import * as functions from "firebase-functions";
import * as Expo from "expo-server-sdk";
import FirebaseClient from "../services/firebase";
import ExpoClient from "../services/expo";

const db = FirebaseClient.firestore();

export const addNotificationToken = functions.https.onRequest(
  async (req, res) => {
    try {
      // parse out data
      const data = req.body;

      // save to db
      const doc = await db.collection('devices').add({
        token: data.token,
        user: data.user
      });

      // return id snapshot
      res.json(doc);
    } catch (error) {
      console.error(error);
      res.json(error);
    }
  }
);

export const sendNotification = functions.https.onRequest(async (req, res) => {
  try {
    // fetch devices
    const devices = await db.collection('devices').get();

    // map tokens to messages
    const messages = [];
    devices.forEach(device => {
      const data = device.data();
      // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
      const token = data.token.value;

      // Check that all your push tokens appear to be valid Expo push tokens
      if (!Expo.isExpoPushToken(token)) {
        console.error(`Push token ${token} is not a valid Expo push token`);
        return false;
      }

      // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
      messages.push({
        to: token,
        sound: "default",
        body: "This is a test notification",
        data: { withSome: "data" }
      });
      return false;
    });

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    const chunks = ExpoClient.chunkPushNotifications(messages);

    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    const receipts = [];
    for (const chunk of chunks) {
      try {
        const receipt = await ExpoClient.sendPushNotificationsAsync(chunk);
        console.log(receipt);
      } catch (error) {
        console.error(error);
      }
    }
    res.json(receipts);
  } catch (error) {
    console.error(error);
    res.json(error);
  }
});
