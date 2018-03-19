import * as functions from "firebase-functions";
import fetch from "node-fetch";
import * as TurndownService from "turndown";
import FirebaseClient from "../services/firebase";
// import { Session } from "../models/session";
import { parse } from '../utils/jsonapi'

const db = FirebaseClient.firestore();
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
      const url = `https://test-uccsc.pantheonsite.io/jsonapi/node/session?include=${fields}`;

      // fetch sessions
      const response = await fetch(url)

      const result = parse(await response.text());
  
      const sessions = result.data.map(d => {
        const speakers = d.field_session_speakers.map(s => {
          return {
            name: s.name,
            bio: s.field_uccsc_bio,
            company: s.field_uccsc_institution_company,
            photo: s.field_uccsc_user_photo,
          };
        });
    
        const description = turndownService.turndown(d.field_session_description.value);
    
        const session = {
          type: 'talk',
          speaker: speakers[0].name,
          title: d.title,
          description: description,
          speakers: speakers,
          time: '7/10/2017 8:45 AM',
          duration: d.field_session_length.name,
        };
    
        return session;
      });

      // // upload/update data
      // const tasks = sessions.map(s => {
      //   const sRef = db.collection('sessions').doc(s.uuid);
      //   return sRef.set(s);
      // });
      // await tasks;

      res.json(sessions);
    } catch (error) {
      console.error(error);
      res.json(error);
    }
  });