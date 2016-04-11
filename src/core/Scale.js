import Utils from './Utils.js';


export default class Scale {
    constructor() {
        this.notes = [];
    }

    add(note) {
        this.notes.push(note);
    }

    get measure() {
        return Utils.avg(this.notes[0].measure, this.notes[this.length].measure);
    }

    get length() {
        return this.notes.length;
    }
}
