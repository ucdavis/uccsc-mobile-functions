import * as functions from "firebase-functions";
import fetch from "node-fetch";
import * as TurndownService from "turndown";
import { addMinutes, addHours, addDays, format, parse as parseDate } from "date-fns";
// import FirebaseClient from "../services/firebase";
import { parse as parseApi } from '../utils/jsonapi';
import { mapImageFromJsonApi } from '../models/image';
import { mapUserFromJsonApi } from '../models/user';
import { mapVenueFromJsonApi } from '../models/venue';

// const db = FirebaseClient.firestore();
const turndownService = new TurndownService();

export const getAllArticles = functions.https.onRequest(async (req, res) => {
    try {
      // included fields
      const fields = [
        // 'type',
        // 'revision_uid',
        // 'uid',
        'field_sf_article_category',
        'field_sf_article_type',
        'field_sf_person_reference',
        'field_sf_primary_image',
        'field_sf_related_photo_gallery',
        'field_sf_tags',
      ].join(',');

      // url
      const url = `https://uccsc.ucdavis.edu/jsonapi/node/sf_article?include=${fields}`;

      // fetch events
      const response = await fetch(url)

      // de-normalize jsonapi
      const result = parseApi(await response.text());

      // format
      const articles = result.data.map(d => {

        // remove html tags
        const body = turndownService.turndown(d.body ? d.body.value : '');

        const organizer = !d.field_sf_person_reference ? [] : d.field_sf_person_reference.map(mapUserFromJsonApi);

        const article = {
          type: 'article',
          title: d.title,
          body: body,
          image: mapImageFromJsonApi(d.field_event_image),
          articleType: d.field_sf_article_type ? d.field_sf_article_type.name : '',
          category: d.field_sf_article_category ? d.field_sf_article_category.name : '',
          organizer: organizer,
        };

        return article;
      });

      // TODO
      // // upload/update data
      // const tasks = sessions.map(s => {
      //   const sRef = db.collection('sessions').doc(s.uuid);
      //   return sRef.set(s);
      // });
      // await tasks;

      res.json(articles);
    } catch (error) {
      console.error(error);
      res.json(error);
    }
  });