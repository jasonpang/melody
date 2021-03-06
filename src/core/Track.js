import ControllerEvent from './ControllerEvent';


export default class Track {
    constructor(song) {
        this.song = song;
        this.name = '';
        this.notes = [];
        this.controllers = {
            // Which controller (e.g. 64 for sustain pedal)
            // 64: [{ at: value }]
        };
    }

    addControllerEvent(controller, time, value) {
        if (!this.controllers[controller]) {
            this.controllers[controller] = [];
        }
        this.controllers[controller].push(new ControllerEvent(time, value));
    }

    addNoteEvent(notes) {
        this.notes.push(notes);
    }

    get notesCount() {
        return this.notes.length;
    }

    getNote(index) {
        return this.notes[index];
    }
}
