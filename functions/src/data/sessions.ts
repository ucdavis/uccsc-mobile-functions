import * as functions from "firebase-functions";
import fetch from "node-fetch";
import * as TurndownService from "turndown";
import { addMinutes, addHours, addDays, format, parse as parseDate } from "date-fns";
// import FirebaseClient from "../services/firebase";
import { parse as parseApi } from '../utils/jsonapi';
import { mapLevelFromJsonApi } from '../models/level';
import { mapTrackFromJsonApi } from '../models/track';
import { mapUserFromJsonApi } from '../models/user';
import { mapVenueFromJsonApi } from '../models/venue';

// const db = FirebaseClient.firestore();
const turndownService = new TurndownService();

export const getAllSessions = functions.https.onRequest(async (req, res) => {
    try {
      // included fields
      const fields = [
        // 'type',
        // 'revision_uid',
        // 'uid',
        'field_event_sponsors',
        'field_event_venue',
        'field_session_files',
        'field_session_length',
        'field_session_skill_level',
        'field_session_speakers',
        'field_session_speakers.field_uccsc_user_photo',
        'field_session_track',
        'field_session_type'
      ].join(',');

      // url
      let url = `https://uccsc.ucdavis.edu/jsonapi/node/session?include=${fields}&limit=500`;
      let data = [];

      while (true) {
        // fetch sessions
        const response = await fetch(url);

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
      const sessions = data.map(d => {
        const speakers = d.field_session_speakers ? d.field_session_speakers.map(mapUserFromJsonApi) : [];
    
        // remove html tags
        const description = turndownService.turndown(d.field_session_description.value);
        const knowledge = turndownService.turndown(d.field_session_previous_knowledge ? d.field_session_previous_knowledge.value : '');
        const software = turndownService.turndown(d.field_session_software ? d.field_session_software.value : '');

        const session = {
          type: 'talk',
          speaker: speakers.map(s => s.name).join(', '),
          title: d.title.trim(),
          description: description,
          knowledge: knowledge,
          software: software,
          track: mapTrackFromJsonApi(d.field_session_track[0]),
          level: mapLevelFromJsonApi(d.field_session_skill_level),
          speakers: speakers,
          time: parseDate(d.field_event_date_and_time.value + 'Z'),
          end: parseDate(d.field_event_date_and_time.end_value + 'Z'),
          duration: d.field_session_length.name,
          venue: mapVenueFromJsonApi(d.field_event_venue),
        };
    
        return session;
      });

      // TODO
      // // upload/update data
      // const tasks = sessions.map(s => {
      //   const sRef = db.collection('sessions').doc(s.uuid);
      //   return sRef.set(s);
      // });
      // await tasks;

      // cache data for 5 min
      res.set('Cache-Control', 'public, max-age=300, s-maxage=300');

      res.json(sessions);
    } catch (error) {
      console.error(error);
      res.json(error);
    }
  });