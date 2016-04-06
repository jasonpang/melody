import log from 'loglevel';


export default class HeldNotes {
    constructor() {
        this.notes = {};
    }

    noteOn(noteNumber, store) {
        let existingValue = this.notes[noteNumber];
        if (existingValue) {
            log.warn('Overwriting previous note state with new note state without calling noteOff().');
        }
        this.notes[noteNumber] = store;
    }

    noteOff(noteNumber) {
        let existingValue = this.notes[noteNumber];
        if (!existingValue) {
            log.warn('Ending note off but note on was never called.');
        }
        this.notes[noteNumber] = null;
        return existingValue;
    }
}
