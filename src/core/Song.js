import MIDIFile from 'midifile';
import Track from './Track.js';
import Note from './Note.js';
import log from 'loglevel';
import Chord from './Chord.js';
import Utils from './Utils.js';
import HeldNotes from './HeldNotes.js';


export default class Song {

    constructor() {
        /* Format 0, 1, or 2 MIDI file? */
        this.midiFormat = 0;
        this.ticksPerBeat = 0;
        this.text = [];
        this.tracks = [];
        this.copyrightNotices = [];
        this.tempoChanges = [];
        this.timeSignatureChanges = [];
    }

    getTrack(index) {
        this.tracks[index];
    }

    addTrack(track) {
        this.tracks.push(track);
    }

    addText(text) {
        this.text.push(text);
    }

    addCopyrightNotice(text) {
        this.copyrightNotices.push(text);
    }

    addTempoChange(tempo) {
        this.tempoChanges.push(tempo);
    }

    addTimeSignatureChange(timeSignature) {
        this.timeSignatureChanges.push(timeSignature);
    }

    get tracksCount() {
        return this.tracks.length - 1;
    }

    /**
    Creates a Song from a fetch() binary Blob.
    */
    static fromMidiFile(fileBlob) {
        function hexStringToAsciiString(hexString) {
            let asciiString = '';
            for (let char of hexString)
                asciiString += String.fromCharCode(char, 16);
            return asciiString;
        }

        function readMidiHeader() {
            function readMidiFormat(song, midiFile) {
                song.midiFormat = midiFile.header.getFormat();
                // TODO: Allow other format MIDI files
                if (song.midiFormat !== 1) {
                    throw new Error('Only format 1 MIDI files are supported. Please input a MIDI file with format 1.');
                }
            }

            function readTimeDivision(song, midiFile) {
                // Metrical or timecode time division?
                if (midiFile.header.getTimeDivision() === 2) {
                    song.ticksPerBeat = midiFile.header.getTicksPerBeat();
                } else {
                    throw new Error('This MIDI file uses timecode time division. Parsing this file is not supported yet. Please input a MIDI file using metrical time division.');
                }
                if (midiFile.header.getTracksCount() === 1) {
                    throw new Error("This format 1 MIDI file has only one track (the special first track used for global info). It doesn't have any note data.")
                }
            }

            readMidiFormat(song, midiFile);
            readTimeDivision(song, midiFile);
        }

        function structureEvent(rawEvent) {
            let event = {};
            if (rawEvent.hasOwnProperty('delta')) {
                event.delta = rawEvent.delta;
            }
            if (rawEvent.hasOwnProperty('channel')) {
                event.channel = rawEvent.channel;
            }
            if (rawEvent.subtype) {
                event.type = Midi.EVENT_MAP[rawEvent.subtype];
            }
            if ((event.type === 'Track Name' ||
                    event.type === 'Text' ||
                    event.type === 'Copyright Notice') &&
                rawEvent.data) {
                // Convert hex-encoded text into ASCII text
                event.data = hexStringToAsciiString(rawEvent.data);
            } else if (event.type === 'Set Tempo') {
                event.tempo = rawEvent.tempo;
                event.tempoBpm = rawEvent.tempoBPM;
            } else if (event.type === 'Time Signature') {
                event.timeSignatureNumerator = rawEvent.param1;
                // Time signature denominators are stored as powers of two
                event.timeSignatureDenominator = Math.pow(2, rawEvent.param2);
                event.clocksBetweenMetroClick = rawEvent.param3;
                event.num32NotesInQuarterNote = rawEvent.param4;
            } else if (event.type === 'Program Change') {
                event.channel = rawEvent.channel;
                event.program = rawEvent.param1;
            } else if (event.type === 'Controller') {
                event.controller = rawEvent.param1;
                event.value = rawEvent.param2;
            } else if (event.type === 'Note On' ||
                event.type === 'Note Off') {
                event.note = rawEvent.param1;
                event.velocity = rawEvent.param2;
            } else if (event.type === 'End of Track') {
                // Do nothing
            } else {
                // Unrecognized event, copy all the original parameters
                log.warn('Unrecognized MIDI file event when processing:', event);
                event = Object.assign({}, rawEvent, event);
            }
            return event;
        }

        function readMidiTrackEvents(track, events) {
            let time = 0;
            let heldNotes = new HeldNotes();
            for (let rawEvent of events) {
                let event = structureEvent(rawEvent);

                if (event.delta) {
                    time += event.delta;
                }
                if (event.type === 'Track Name') {
                    track.name = event.data;
                }
                else if (event.type === 'Text') {
                    track.song.addText(event.data);
                }
                else if (event.type === 'Copyright Notice') {
                    track.song.addCopyrightNotice(event.data);
                }
                else if (event.type === 'Set Tempo') {
                    track.song.addTempoChange(new Tempo(trackTime, event.tempo, event.tempoBpm));
                }
                else if (event.type === 'Time Signature') {
                    track.song.addTimeSignatureChange(new TimeSignature(event.timeSignatureNumerator, event.timeSignatureDenominator));
                }
                else if (event.type === 'Controller') {
                    track.addControllerEvent(event.controller, time, event.value)
                }
                else if (event.type === 'Note On') {
                    if (!event.note)
                        continue;
                    let number = event.note;
                    let name = Utils.noteNumberToName(number);
                    let octave = Utils.noteNumberToOctave(number);
                    let velocity = event.velocity;
                    let note = new Note(name, number, octave, time, null, velocity);
                    track.addNoteEvent(note);
                    heldNotes.noteOn(number, track.notesCount - 1);
                }
                else if (event.typoe === 'Note Off') {
                    if (!event.note)
                        continue;
                    let number = event.note;
                    let noteIndex = heldNotes.noteOff(number);
                    if (noteIndex === null)
                        continue;
                    let note = track.objects[noteIndex];
                    note.duration = time - note.time;
                }
            }
        }

        function removeNotesMissingDurations(song) {
            let totalNotesDeleted = 0;
            for (let track of song.tracks) {
                for (let i = track.notesCount - 1; i > 0; i--) {
                    let note = track.notes[i];
                    if (!note.duration) {
                        // Remove the note if zero duration
                        track.notes.splice(i, 1);
                        totalNotesDeleted++;
                    }
                }
            }
            if (totalNotesDeleted > 0) {
                log.warn(`Deleted ${totalNotesDeleted} notes with zero duration.`);
            }
        }

        function removeTracksMissingNotes(song) {
            for (let i = song.tracksCount - 1; i > 0; i--) {
                if (song.getTrack(i).notesCount <= 0) {
                    song.tracks.splice(i, 1);
                    log.warn(`Deleted track ${i} with zero notes.`);
                }
            }
        }

        return new Promise((resolve, reject) => {
                let song = new Song();
                let reader = new FileReader();
                reader.readAsArrayBuffer(fileBlob);
                reader.onabort = e => reject(e);
                reader.onerror = e => reject(e);
                reader.onload = e => resolve({
                    song: song,
                    fileBuffer: e.target.result
                });
            })
            .then({
                song,
                fileBuffer
            } => {
                let midiFile = new MIDIFile(fileBuffer);

                // Read MIDI header information
                readMidiHeader(song, midiFile);

                // Add as many tracks as those exist in the MIDI file
                for (let i = 0; i < midiFile.header.getTracksCount(); i++) {
                    let track = new Track(song);
                    let events = midiFile.getTrackEvents(i);
                    readMidiTrackEvents(track, events);
                    song.addTrack(track);
                }

                // Track zero is a special header track for format 1 MIDI files
                if (song.getTrack(0).name) {
                    song.name = song.getTrack(0).name;
                }

                // Remove notes without durations
                removeNotesMissingDurations(song);
                // Remove tracks without notes
                removeTracksMissingNotes(song);
            })
            .catch(e => {
                log.error('Failed to read file:', e);
            });
    }
}
