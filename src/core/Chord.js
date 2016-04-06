export default class Chord {
    constructor() {
        this.notes = [];
    }

    add(note) {
        this.notes.push(note);
    }

    /**
        Specifies the number of milliseconds during which notes played are considered part of the same chord.
    */
    static get GROUP_INTERVAL() {
        return 35;
    }
}
