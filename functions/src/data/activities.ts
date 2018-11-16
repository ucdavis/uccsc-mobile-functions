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

export const getAllActivities = functions.https.onRequest(async (req, res) => {
    try {
      // included fields
      const fields = [
        // 'type',
        // 'revision_uid',
        // 'uid',
        'field_event_image',
        'field_event_sponsors',
        'field_event_type',
        'field_event_venue',
        'field_uccsc_event_organizer',
      ].join(',');

      // url
      let url = `https://uccsc.ucdavis.edu/jsonapi/node/event?include=${fields}&limit=500`;
      let data = [];

      while (true) {
        // fetch sessions
        const response = await fetch(url)

        // de-normalize jsonapi
        const result = parseApi(await response.text());
        data = [...data, ...result.data];
        if (!result.links.next) {
          break;
        }

        // set next url and go
        url = result.links.next;
      }

      // format
      const events = data.map(d => {

        // remove html tags
        const description = turndownService.turndown(d.field_event_description ? d.field_event_description.value : '');
        const rsvp = turndownService.turndown(d.field_more_info_rsvp ? d.field_more_info_rsvp.value : '');
    
        const sponsors = !d.field_event_sponsors ? [] : d.field_event_sponsors.map(s => s.title);

        const organizer = !d.field_uccsc_event_organizer ? [] : d.field_uccsc_event_organizer.map(mapUserFromJsonApi);

        const event = {
          type: 'event',
          title: d.title,
          description: description,
          image: mapImageFromJsonApi(d.field_event_image),
          time: parseDate(d.field_event_date_and_time.value + 'Z'),
          end: parseDate(d.field_event_date_and_time.end_value + 'Z'),
          rsvp: rsvp,
          eventType: d.field_event_type ? d.field_event_type.name : '',
          sponsors: sponsors,
          organizer: organizer,
          venue: mapVenueFromJsonApi(d.field_event_venue),
        };

        return event;
      });

      // TODO
      // // upload/update data
      // const tasks = sessions.map(s => {
      //   const sRef = db.collection('sessions').doc(s.uuid);
      //   return sRef.set(s);
      // });
      // await tasks;

      res.json(events);
    } catch (error) {
      console.error(error);
      res.json(error);
    }
  });