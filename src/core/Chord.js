export default class Chord {
    constructor() {
        this.notes = [];
    }

    add(note) {
        this.notes.push(note);
    }

    sort() {
        // Sort from lowest key to highest key
        this.notes = this.notes.sort((a, b) => a.number - b.number);
    }

    get measure() {
        return this.notes[0].measure;
    }

    get length() {
        return this.notes.length;
    }

    /**
        Specifies the number of milliseconds during which notes played are considered part of the same chord.
    */
    static get GROUP_INTERVAL() {
        return 35;
    }
}
